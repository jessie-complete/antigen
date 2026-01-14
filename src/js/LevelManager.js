export class LevelManager {
    constructor(game) {
        this.game = game;
        this.level = 1;
        this.levelDuration = 20; // seconds
        this.currentTime = 0;

        this.baseSpeed = 250; // pixels per second
        this.speedMultiplier = 1.25; // 25% increase

        this.baseSpawnRate = 2.0; // seconds between spawns
        this.spawnRateMultiplier = 0.9; // decreases by 10% each level? or just keep same?
        // "next level increases the speed of the falling letters by 20%"
        // Doesn't say spawn rate changes, but usually it should or it gets boring.
        // Let's just speed up letters for now as requested.

        // Stats for summary
        this.stats = {
            caught: 0,
            spawned: 0,
            missed: 0
        };
    }

    setDifficulty(speed, speedMultiplier) {
        this.baseSpeed = speed;
        this.speedMultiplier = speedMultiplier;
    }

    reset() {
        this.level = 1;
        this.currentTime = 0;
        this.resetStats();
    }

    startLevel(level) {
        this.level = level;
        this.currentTime = 0;
        this.resetStats();
        this.game.level = level;
        console.log(`Starting Level ${level}`);
    }

    resetStats() {
        this.stats = { caught: 0, spawned: 0, missed: 0 };
    }

    update(dt) {
        this.currentTime += dt;
        if (this.currentTime >= this.levelDuration) {
            this.game.completeLevel(this.stats);
        }
    }

    getSpeed() {
        // Level 1: 100
        // Level 2: 120
        // Level 3: 144
        return this.baseSpeed * Math.pow(this.speedMultiplier, this.level - 1);
    }

    getSpawnInterval() {
        // Make it slightly faster as levels go up to match speed
        // Or keep constant. Let's acturally reduce interval slightly to make it denser.
        return Math.max(0.5, 2.0 - (this.level * 0.1));
    }

    recordSpawn() {
        this.stats.spawned++;
    }

    recordCatch() {
        this.stats.caught++;
    }

    recordMiss() {
        this.stats.missed++;
    }
}
