/**
 * Flame Dash: Game Logic.
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
            const tileValue = level.map[centerY] && level.map[centerY][rightX];
            if (tileValue && tileValue !== 0 && tileValue !== 3) {
                this.x = rightX * level.tileWidth - this.width;
            }
        } else if (this.vx < 0) {
            const tileValue = level.map[centerY] && level.map[centerY][leftX];
            if (tileValue && tileValue !== 0 && tileValue !== 3) {
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

        // Add a nice glow effect based on state
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.isFire ? '#ff4d00' : '#00f2ff';

        // Draw a base color circle/rect so they aren't invisible
        ctx.fillStyle = this.isFire ? 'rgba(255, 77, 0, 0.3)' : 'rgba(0, 242, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x - camera.x + this.width / 2, this.y - camera.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw sprite
        if (assets.hero) {
            // Keep margins since the source image is already nicely centered padding 10-20% usually. Let's just frame it full
            ctx.drawImage(assets.hero, 0, 0, assets.hero.width, assets.hero.height, this.x - camera.x - 10, this.y - camera.y - 10, this.width + 20, this.height + 20);
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
            // Harvesting the first frame from the 4x4 slime sheet (160x160 for a 640x640 image)
            ctx.drawImage(assets.enemy, 0, 0, 160, 160, this.x - camera.x - 5, this.y - camera.y - 5, this.width + 10, this.height + 10);
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
            ctx.drawImage(assets.fireball, 0, 0, assets.fireball.width, assets.fireball.height, this.x - camera.x - 5, this.y - camera.y - 5, this.width + 10, this.height + 10);
        } else {
            ctx.fillStyle = '#ff9e00';
            ctx.beginPath();
            ctx.arc(this.x - camera.x + 10, this.y - camera.y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * Generates a random level map and enemy positions.
 * Difficulty scales with levelNum (more gaps, more enemies).
 */
function generateLevel(levelNum) {
    const COLS = 50;
    const r = (fill = 0) => Array(COLS).fill(fill);

    // 14 rows: 0-2 sky, 3 powerups, 4 empty, 5 mid-platforms, 6 empty,
    // 7 low-platforms+flag, 8-9 ground, 10-13 below
    const map = [
        r(), r(), r(),   // rows 0-2: sky
        r(),             // row 3: powerup blocks
        r(),             // row 4: empty
        r(),             // row 5: mid-air platforms
        r(),             // row 6: empty
        r(),             // row 7: low platforms + flag
        r(1), r(1),      // rows 8-9: ground (solid)
        r(), r(), r(), r() // rows 10-13: void
    ];

    // === Gaps in ground (rows 8 and 9) ===
    const numGaps = Math.min(1 + Math.floor(levelNum / 2), 3);
    const gapWidth = levelNum >= 4 ? 4 : 3;
    const SAFE_START = 7;
    const SAFE_END = 5;
    const gaps = [];
    for (let g = 0; g < numGaps; g++) {
        let attempts = 0;
        while (attempts < 30) {
            const gStart = SAFE_START + Math.floor(Math.random() * (COLS - SAFE_START - SAFE_END - gapWidth));
            const tooClose = gaps.some(pos => Math.abs(pos - gStart) < 9);
            if (!tooClose) {
                gaps.push(gStart);
                for (let rr = 8; rr <= 9; rr++)
                    for (let c = gStart; c < gStart + gapWidth; c++)
                        map[rr][c] = 0;
                break;
            }
            attempts++;
        }
    }

    // === Random low platforms (row 7) ===
    const numLowPlats = 1 + Math.floor(Math.random() * 2);
    for (let p = 0; p < numLowPlats; p++) {
        const col = 6 + Math.floor(Math.random() * (COLS - 16));
        if (map[8][col] === 1) {
            for (let c = col; c < col + 2 && c < COLS - 2; c++) map[7][c] = 1;
        }
    }

    // === Mid-air platforms (row 5) ===
    const numHighPlats = 2 + Math.floor(Math.random() * 2);
    for (let p = 0; p < numHighPlats; p++) {
        const col = 5 + Math.floor(Math.random() * (COLS - 12));
        for (let c = col; c < col + 3 && c < COLS - 2; c++) map[5][c] = 1;
    }

    // === Powerup blocks (row 3) - max 3, always above solid ground ===
    let placed = 0, pAttempts = 0;
    while (placed < 3 && pAttempts < 60) {
        const col = 3 + Math.floor(Math.random() * (COLS - 6));
        if (map[8][col] === 1 && map[3][col] === 0) {
            map[3][col] = 2;
            placed++;
        }
        pAttempts++;
    }

    // === Flag at the end (row 7, col 48) -- always on solid ground ===
    map[7][48] = 3;
    for (let c = 46; c <= 49; c++) { map[8][c] = 1; map[9][c] = 1; }

    // === Enemies on solid ground ===
    const numEnemies = Math.min(2 + levelNum, 6);
    const enemyPositions = [];
    let eAttempts = 0;
    while (enemyPositions.length < numEnemies && eAttempts < 100) {
        const col = 8 + Math.floor(Math.random() * (COLS - 16));
        if (map[8][col] === 1 && map[8][col + 1] === 1) {
            const x = col * 40;
            const y = 7 * 40;
            const tooClose = enemyPositions.some(e => Math.abs(e.x - x) < 200);
            if (!tooClose) enemyPositions.push({ x, y });
        }
        eAttempts++;
    }

    return { map, enemyPositions };
}

class GameScene {
    constructor(engine, levelNum = 1, inheritedLives = 3, inheritedScore = 0) {
        this.engine = engine;
        this.levelNum = levelNum;

        const { map, enemyPositions } = generateLevel(levelNum);
        this.level = new Level(40, 40, map);

        this.player = new Player(100, 100);
        this.player.lives = inheritedLives;

        this.enemies = enemyPositions.map(pos => new Enemy(pos.x, pos.y));
        this.fireballs = [];
        this.score = inheritedScore;
        this.isGameOver = false;
        this.isTransitioning = false;

        // Sync HUD
        document.getElementById('lives').innerText = inheritedLives;
        document.getElementById('score').innerText = inheritedScore.toString().padStart(6, '0');
        const lvlEl = document.getElementById('level');
        if (lvlEl) lvlEl.innerText = levelNum;

        window.currentGame = this;
    }

    update(dt, input) {
        if (this.isGameOver || this.isTransitioning) return;

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

        // Win Condition - Flag is at x: 48 * 40(1920), y: 7 * 40(280)
        // Creating a dummy entity to represent the flag bounds for easy AABB testing
        const flagHitbox = new Entity(48 * this.level.tileWidth + 10, 7 * this.level.tileHeight, 20, this.level.tileHeight);

        if (this.player.checkCollision(flagHitbox)) {
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
        document.getElementById('restart-btn').style.display = '';
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('overlay-title').innerText = 'GAME OVER';
        document.getElementById('overlay-msg').innerText = 'The flames consumed you...';
    }

    victory() {
        if (this.isGameOver || this.isTransitioning) return;
        this.isTransitioning = true;
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('overlay-title').innerText = '🔥 FASE CONCLUÍDA!';
        document.getElementById('overlay-msg').innerText = `Você passou de fase! Preparando fase ${this.levelNum + 1}...`;
        document.getElementById('restart-btn').style.display = 'none';

        setTimeout(() => {
            document.getElementById('overlay').classList.add('hidden');
            document.getElementById('restart-btn').style.display = '';
            this.engine.currentScene = new GameScene(
                this.engine,
                this.levelNum + 1,
                this.player.lives,
                this.score
            );
        }, 2500);
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
