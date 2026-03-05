/**
 * Flame Dash: Game Logic
 */

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 60);
        this.speed = 5;
        this.jumpForce = -15;
        this.isFire = false;
        this.facing = 1; // 1 for right, -1 for left
        this.canShoot = true;
        this.shootCooldown = 300;
        this.lives = 3;
    }

    update(dt, input, level) {
        // Horizontal Movement
        if (input.isPressed('ArrowRight')) {
            this.vx = this.speed;
            this.facing = 1;
        } else if (input.isPressed('ArrowLeft')) {
            this.vx = -this.speed;
            this.facing = -1;
        } else {
            this.vx = 0;
        }

        // Jump
        if (input.isPressed('ArrowUp') && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }
        // liha de chegada


        // Apply Gravity
        this.vy += 0.8; // Engine gravity

        // Physics movement & Collision
        this.applyPhysics(level);

        // Shoot Fireball
        if (this.isFire && input.isPressed('Shift') && this.canShoot) {
            this.shoot();
        }
    }

    applyPhysics(level) {
        // Simple AABB Collision with Level
        // Y - axis
        this.y += this.vy;
        this.grounded = false;

        // Detect floor/ceil
        const colStart = Math.floor(this.x / level.tileWidth);
        const colEnd = Math.floor((this.x + this.width) / level.tileWidth);

        let headY = Math.floor(this.y / level.tileHeight);
        let footY = Math.floor((this.y + this.height) / level.tileHeight);

        // Bottom collision
        if (this.vy > 0) {
            for (let c = colStart; c <= colEnd; c++) {
                if (level.map[footY] && level.map[footY][c] !== 0) {
                    this.y = footY * level.tileHeight - this.height;
                    this.vy = 0;
                    this.grounded = true;
                    break;
                }
            }
        }
        // Top collision
        else if (this.vy < 0) {
            for (let c = colStart; c <= colEnd; c++) {
                if (level.map[headY] && level.map[headY][c] !== 0) {
                    // Check if it's a ? block
                    if (level.map[headY][c] === 2) {
                        this.isFire = true;
                        level.map[headY][c] = 1; // Change to solid block
                    }
                    this.y = (headY + 1) * level.tileHeight;
                    this.vy = 0;
                    break;
                }
            }
        }

        // X - axis
        this.x += this.vx;
        let leftX = Math.floor(this.x / level.tileWidth);
        let rightX = Math.floor((this.x + this.width) / level.tileWidth);
        let centerY = Math.floor((this.y + this.height / 2) / level.tileHeight);

        if (this.vx > 0) {
            if (level.map[centerY] && level.map[centerY][rightX] !== 0) {
                this.x = rightX * level.tileWidth - this.width;
            }
        } else if (this.vx < 0) {
            if (level.map[centerY] && level.map[centerY][leftX] !== 0) {
                this.x = (leftX + 1) * level.tileWidth;
            }
        }

        // Screen boundaries and falling
        if (this.y > level.height) {
            this.die();
        }
    }

    shoot() {
        this.canShoot = false;
        const fb = new Fireball(this.x + (this.facing === 1 ? this.width : -20), this.y + 20, this.facing);
        window.currentGame.fireballs.push(fb);
        setTimeout(() => this.canShoot = true, this.shootCooldown);
    }

    die() {
        this.lives--;
        document.getElementById('lives').innerText = this.lives;
        if (this.lives <= 0) {
            window.currentGame.gameOver();
        } else {
            this.x = 100;
            this.y = 100;
            this.vx = 0;
            this.vy = 0;
        }
    }

    draw(ctx, camera, assets) {
        ctx.save();
        if (this.isFire) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff4d00';
        }

        // Draw sprite
        if (assets.hero) {
            // Draw the full hero image scaled to player size
            ctx.drawImage(assets.hero, this.x - camera.x, this.y - camera.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.isFire ? '#ff4d00' : '#00f2ff';
            ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
        }
        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.vx = -2;
        this.hp = 1;
    }

    update(level) {
        // Horizontal Movement
        this.x += this.vx;

        // Apply Gravity
        this.vy += 0.8;
        this.y += this.vy;
        this.grounded = false;

        // Vertical floor collision
        const colStart = Math.floor(this.x / level.tileWidth);
        const colEnd = Math.floor((this.x + this.width) / level.tileWidth);
        const footY = Math.floor((this.y + this.height) / level.tileHeight);

        if (this.vy >= 0) {
            for (let c = colStart; c <= colEnd; c++) {
                if (level.map[footY] && level.map[footY][c] !== 0) {
                    this.y = footY * level.tileHeight - this.height;
                    this.vy = 0;
                    this.grounded = true;
                    break;
                }
            }
        }

        // Wall detection
        const tileX = this.vx > 0 ? Math.floor((this.x + this.width) / level.tileWidth) : Math.floor(this.x / level.tileWidth);
        const tileY = Math.floor((this.y + this.height / 2) / level.tileHeight);

        if (level.map[tileY] && level.map[tileY][tileX] !== 0) {
            this.vx *= -1;
        }

        // Edge detection (don't fall off)
        if (this.grounded) {
            const edgeX = this.vx > 0 ? Math.floor((this.x + this.width) / level.tileWidth) : Math.floor(this.x / level.tileWidth);
            const edgeY = Math.floor((this.y + this.height + 2) / level.tileHeight);
            if (level.map[edgeY] && level.map[edgeY][edgeX] === 0) {
                this.vx *= -1;
            }
        }
    }

    draw(ctx, camera, assets) {
        if (assets.enemy) {
            ctx.drawImage(assets.enemy, this.x - camera.x, this.y - camera.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
        }
    }
}

class Fireball extends Entity {
    constructor(x, y, dir) {
        super(x, y, 20, 20);
        this.vx = dir * 8;
    }

    update() {
        this.x += this.vx;
        // Simple range limit or cleanup
        if (this.x < 0 || this.x > 5000) this.toRemove = true;
    }

    draw(ctx, camera, assets) {
        if (assets.fireball) {
            ctx.drawImage(assets.fireball, 0, 0, 100, 100, this.x - camera.x, this.y - camera.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#ff9e00';
            ctx.beginPath();
            ctx.arc(this.x - camera.x + 10, this.y - camera.y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class GameScene {
    constructor(engine) {
        this.engine = engine;
        // Map layout:
        // Row 8: Main ground
        // Row 7: Flag/Items on floor
        // Row 4/5: Floating platforms & Powerups
        this.level = new Level(40, 40, [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
            [1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ]);

        this.player = new Player(100, 100);
        this.enemies = [
            new Enemy(400, 280),
            new Enemy(800, 160),
            new Enemy(1400, 280),
            new Enemy(2200, 280),
        ];
        this.fireballs = [];
        this.score = 0;
        this.isGameOver = false;

        window.currentGame = this;
    }

    update(dt, input) {
        if (this.isGameOver) return;

        this.player.update(dt, input, this.level);

        // Update camera
        this.engine.camera.x = Math.max(0, Math.min(this.player.x - 400, this.level.width - 800));

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.level);

            // Player vs Enemy
            if (this.player.checkCollision(enemy)) {
                if (this.player.vy > 0 && this.player.y < enemy.y + (enemy.height / 2)) {
                    // Stomp!
                    enemy.toRemove = true;
                    this.player.vy = -12;
                    this.addScore(100);
                } else {
                    this.player.die();
                }
            }
        });

        // Update Fireballs
        this.fireballs.forEach(fb => {
            fb.update();
            // Fireball vs Enemy
            this.enemies.forEach(enemy => {
                if (fb.checkCollision(enemy)) {
                    fb.toRemove = true;
                    enemy.toRemove = true;
                    this.addScore(100);
                }
            });

            // Fireball vs Walls
            const tileX = Math.floor((fb.x + (fb.vx > 0 ? fb.width : 0)) / this.level.tileWidth);
            const tileY = Math.floor((fb.y + fb.height / 2) / this.level.tileHeight);
            if (this.level.getTileAt(fb.x + fb.vx, fb.y)) {
                fb.toRemove = true;
            }
        });

        // Clean up
        this.enemies = this.enemies.filter(e => !e.toRemove);
        this.fireballs = this.fireballs.filter(f => !f.toRemove);

        // Win Condition - More forgiving check
        const pBounds = this.player.getBounds();
        const pCenterX = (pBounds.left + pBounds.right) / 2;
        const pCenterY = (pBounds.top + pBounds.bottom) / 2;

        const tileX = Math.floor(pCenterX / this.level.tileWidth);
        const tileY = Math.floor(pCenterY / this.level.tileHeight);

        if (this.level.map[tileY] && this.level.map[tileY][tileX] === 3) {
            this.victory();
        }
    }

    addScore(pts) {
        this.score += pts;
        document.getElementById('score').innerText = this.score.toString().padStart(6, '0');
    }

    draw(ctx, camera) {
        this.drawBackground(ctx, camera);
        this.level.draw(ctx, camera, this.engine.assets);
        this.enemies.forEach(e => e.draw(ctx, camera, this.engine.assets));
        this.fireballs.forEach(f => f.draw(ctx, camera, this.engine.assets));
        this.player.draw(ctx, camera, this.engine.assets);
    }

    drawBackground(ctx, camera) {
        // Simple Parallax
        const p1 = -camera.x * 0.2;

        ctx.fillStyle = '#0d0d12';
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = '#1a1a2e';
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(p1 + (i * 400), 400, 200, 200);
        }
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('overlay-title').innerText = 'GAME OVER';
        document.getElementById('overlay-msg').innerText = 'The flames consumed you...';
    }

    victory() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('overlay-title').innerText = 'VICTORY!';
        document.getElementById('overlay-msg').innerText = `You mastered the flames! Final Score: ${this.score}`;
    }
}

// Initializer
const engine = new AntigravityEngine('gameCanvas');
const manifest = {
    hero: 'assets/hero.png',
    enemy: 'assets/enemy.png',
    tiles: 'assets/tiles.png',
    fireball: 'assets/fireball.png'
};

engine.loadAssets(manifest).then(() => {
    document.getElementById('start-btn').onclick = () => {
        document.getElementById('start-screen').classList.add('hidden');
        engine.currentScene = new GameScene(engine);
        engine.start();
    };

    document.getElementById('restart-btn').onclick = () => {
        document.getElementById('overlay').classList.add('hidden');
        engine.currentScene = new GameScene(engine);
    };
});
