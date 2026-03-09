/**
 * Antigravity Engine Core.
 * Specialized for 2D Platformers
 */

class AntigravityEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.input = new InputHandler();
        this.camera = { x: 0, y: 0 };
        this.gravity = 0.8;
        this.friction = 0.8;

        this.lastTime = 0;
        this.assets = {};
        this.scenes = [];
        this.currentScene = null;
    }

    async loadAssets(assetManifest) {
        const promises = Object.entries(assetManifest).map(([name, url]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const newImg = new Image();
                    newImg.src = canvas.toDataURL(); // Use directly without pixel manipulation
                    newImg.onload = () => {
                        this.assets[name] = newImg;
                        resolve();
                    };
                };
            });
        });
        await Promise.all(promises);
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timeStamp) {
        const deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        if (this.currentScene) {
            this.currentScene.update(dt, this.input);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.currentScene) {
            this.currentScene.draw(this.ctx, this.camera);
        }
    }
}

class InputHandler {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    isPressed(code) {
        // Support both arrows and WASD
        if (code === 'ArrowLeft' || code === 'KeyA') return this.keys['ArrowLeft'] || this.keys['KeyA'];
        if (code === 'ArrowRight' || code === 'KeyD') return this.keys['ArrowRight'] || this.keys['KeyD'];
        if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') return this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space'];
        if (code === 'Shift' || code === 'KeyX') return this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyX'];
        return this.keys[code];
    }
}

class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.type = 'entity';
        this.toRemove = false;
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    checkCollision(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return (
            a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top
        );
    }
}

// Tilemap helper
class Level {
    constructor(tileWidth, tileHeight, map) {
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.map = map;
        this.width = map[0].length * tileWidth;
        this.height = map.length * tileHeight;
    }

    getTileAt(x, y) {
        const col = Math.floor(x / this.tileWidth);
        const row = Math.floor(y / this.tileHeight);
        if (row < 0 || row >= this.map.length || col < 0 || col >= this.map[0].length) {
            return null;
        }
        return this.map[row][col];
    }

    draw(ctx, camera, assets) {
        const startCol = Math.floor(camera.x / this.tileWidth);
        const endCol = startCol + Math.ceil(800 / this.tileWidth) + 1;

        for (let row = 0; row < this.map.length; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tile = this.getTileAt(col * this.tileWidth, row * this.tileHeight);
                if (tile && tile !== 0) {
                    // Simple tile rendering logic
                    // tile 1: ground, tile 2: question block, tile 3: finish
                    this.drawTile(ctx, tile, col * this.tileWidth - camera.x, row * this.tileHeight - camera.y, assets);
                }
            }
        }
    }

    drawTile(ctx, type, x, y, assets) {
        const size = this.tileWidth;
<<<<<<< HEAD
        // Tile size in source is 128x128. They seem centered in the 512x512 sheet.
        const offY = 192;
        if (type === 1) { // Ground (Grass)
            ctx.drawImage(assets.tiles, 0, offY, 128, 128, x, y, size, size);
        } else if (type === 2) { // ? Block
            ctx.drawImage(assets.tiles, 384, offY, 128, 128, x, y, size, size);
        } else if (type === 3) { // Finish Flag
            // Draw a more "premium" flag
=======
        const img = assets.tiles;

        // Base procedural rendering (always looks good)
        if (type === 1) { // Ground
            if (img) {
                let tw = img.width / 3;
                let th = img.height;
                ctx.drawImage(img, 0, 0, tw, th, x, y, size, size);
            } else {
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(x, y, size, size);
                ctx.strokeStyle = '#2a2a4a';
                ctx.strokeRect(x, y, size, size);
            }
        }
        else if (type === 2) { // Powerup Block
            // Premium Glowing Procedural Block
            ctx.save();
            ctx.fillStyle = '#ff9e00';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff4d00';
            ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 8, y + 8, size - 16, size - 16);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('?', x + size / 2, y + size / 2 + 7);
            ctx.restore();

            // Overlay texture if available
            if (img && img.width >= 64) {
                let tw = img.width / 3;
                ctx.globalAlpha = 0.5;
                ctx.drawImage(img, tw, 0, tw, img.height, x + 4, y + 4, size - 8, size - 8);
                ctx.globalAlpha = 1.0;
            }
        }
        else if (type === 3) { // Finish Flag
            // Force procedural flag to ensure it's ALWAYS visible
            ctx.save();
>>>>>>> eb8f636bd87fae22d2f310aef11021bd7e6de31f
            ctx.fillStyle = '#ff4d00';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0000';
            ctx.beginPath();
<<<<<<< HEAD
            ctx.moveTo(x + size * 0.4, y);
            ctx.lineTo(x + size, y + size * 0.25);
            ctx.lineTo(x + size * 0.4, y + size * 0.5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + size * 0.3, y, 6, size);

            // Add a little glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff4d00';
=======
            ctx.moveTo(x + size / 4, y);
            ctx.lineTo(x + size, y + size / 3);
            ctx.lineTo(x + size / 4, y + size / 1.5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.fillRect(x + size / 4 - 2, y, 4, size);
            ctx.restore();
>>>>>>> eb8f636bd87fae22d2f310aef11021bd7e6de31f
        }
    }
}
