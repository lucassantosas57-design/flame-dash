/**
 * Antigravity Engine Core
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
                img.onload = () => {
                    this.assets[name] = img;
                    resolve();
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
        if (type === 1) { // Ground
            ctx.drawImage(assets.tiles, 0, 0, 32, 32, x, y, size, size);
        } else if (type === 2) { // ? Block
            ctx.drawImage(assets.tiles, 32, 0, 32, 32, x, y, size, size);
        } else if (type === 3) { // Finish Flag
            ctx.fillStyle = '#ff4d00';
            ctx.beginPath();
            ctx.moveTo(x + size / 2, y);
            ctx.lineTo(x + size, y + size / 4);
            ctx.lineTo(x + size / 2, y + size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + size / 2 - 2, y, 4, size);
        }
    }
}
