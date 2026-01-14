export class EntityManager {
    constructor(game) {
        this.game = game;
        this.entities = [];
        this.spawnTimer = 0;

        // Logo A Palette colors
        //this.colors = ['#FFD700', '#FF4500', '#32CD32', '#00BFFF'];
        // Theme Colors
        this.colors = ['#00ffff', '#39ff14','#e569f5', '#69b8f5'];
    }

    update(dt) {
        // Spawning
        this.spawnTimer += dt;
        const spawnRate = this.game.levelManager.getSpawnInterval();
        if (this.spawnTimer > spawnRate) {
            this.spawnEntity();
            this.spawnTimer = 0;
        }

        // Updating
        const speed = this.game.levelManager.getSpeed();
        const groundY = this.game.renderer.canvas.height;

        // Use reverse loop for safe removal
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let ent = this.entities[i];
            ent.y += speed * dt;

            // Check ground collision
            if (ent.y >= groundY) {
                this.handleGroundHit(ent, i);
            }
        }
    }

    spawnEntity() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const char = chars[Math.floor(Math.random() * chars.length)];

        const width = this.game.renderer.canvas.width;
        // Random X between 50 and width-50
        const x = Math.random() * (width - 100) + 50;

        const safeTop = this.game.renderer.safeAreaTop + 35; // 35 is hudHeight
        const entity = {
            char: char,
            x: x,
            y: safeTop,
            size: 40,
            color: this.colors[Math.floor(Math.random() * this.colors.length)]
        };

        this.entities.push(entity);
        this.game.levelManager.recordSpawn();
    }

    handleGroundHit(entity, index) {
        this.entities.splice(index, 1);
        this.game.levelManager.recordMiss();
        this.game.takeDamage();
    }

    checkInput(char) {
        // Find lowest entity that matches char
        // "lowest" means highest Y value.

        let targetIndex = -1;
        let maxY = -Infinity;

        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].char === char) {
                if (this.entities[i].y > maxY) {
                    maxY = this.entities[i].y;
                    targetIndex = i;
                }
            }
        }

        if (targetIndex !== -1) {
            this.entities.splice(targetIndex, 1);
            this.game.levelManager.recordCatch();
            // Minimal score increment per letter
            this.game.score += 10 * this.game.level;
            return true;
        }
        return false;
    }

    clear() {
        this.entities = [];
        this.spawnTimer = 0;
    }
}
