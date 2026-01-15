import { InputManager } from './InputManager.js';
import { Renderer } from './Renderer.js';
import { EntityManager } from './EntityManager.js';
import { LevelManager } from './LevelManager.js';
import { Scoreboard } from './Scoreboard.js';
import { AudioManager } from './AudioManager.js';
import { Config } from './Config.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager(this);

        // State
        this.state = 'MENU'; // MENU, PLAYING, LEVEL_SUMMARY, GAMEOVER
        this.lastTime = 0;

        // Game Data
        this.score = 0;
        this.hearts = 3;
        this.level = 1;

        // Managers
        this.entityManager = new EntityManager(this);
        this.levelManager = new LevelManager(this);
        this.scoreboard = new Scoreboard();
        this.audioManager = new AudioManager();
        this.playerName = "";

        // Settings
        this.difficulty = 'MEDIUM'; // EASY, MEDIUM, HARD
        this.hintEnabled = false; // Only allowed in EASY
        this.availableLayouts = ['QWERTY', 'AZERTY', 'QWERTZ', 'DVORAK'];
        this.layoutIndex = 0;

        this.difficultySettings = {
            'EASY': { speed: 100, multiplier: 1.1 },
            'MEDIUM': { speed: 250, multiplier: 1.2 },
            'HARD': { speed: 400, multiplier: 1.4 }
        };

        // Falling animation state
        this.fallingTimer = 0;
        this.turtleY = 120; // Start below the new thinner HUD banner

        // Start Menu
        this.state = 'MENU';
        this.lastInputDebug = "Waiting for input...";
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        try {
            const dt = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            this.update(dt);
            this.draw(dt);

            requestAnimationFrame(this.loop.bind(this));
        } catch (e) {
            console.error("Game Loop Error:", e);
            if (this.renderer && this.renderer.ctx) {
                this.renderer.ctx.fillStyle = 'red';
                this.renderer.ctx.font = '30px monospace';
                this.renderer.ctx.fillText('RUNTIME ERROR: ' + e.message, 50, 100);
            }
        }
    }

    update(dt) {
        this.renderer.update(dt);

        if (this.state === 'PLAYING') {
            this.levelManager.update(dt);
            this.entityManager.update(dt);

            // Wait for flash animation to finish before death transition
            if (this.hearts <= 0 && !this.renderer.isFlashing) {
                this.startFalling();
            }
        } else if (this.state === 'FALLING') {
            // Animate turtle falling
            this.turtleY += 500 * dt; // Fall speed
            if (this.turtleY > this.canvas.height) {
                this.checkGameOver();
            }
        }
    }

    draw(dt) {
        this.renderer.draw(this.state, dt); // Clear screen & background effects

        // 1. BACK LAYER: Entities and Turtle
        if (this.state !== 'MENU') {
            if (this.state === 'FALLING') {
                this.renderer.drawFallingTurtle(this.turtleY);
            } else {
                this.renderer.drawTurtle(dt, this.state, false);
            }
        }

        if (this.state === 'PLAYING' || this.state === 'FALLING') {
            this.renderer.drawEntities(this.entityManager.entities);
        }

        // 2. MIDDLE LAYER: Landscape (Drawn OVER entities/falling turtle)
        if (this.state !== 'MENU' && this.state !== 'SETTINGS') {
            this.renderer.drawLandscape(this.level);
        }

        // 3. TOP LAYER: HUD and Overlays
        if (this.state === 'PLAYING' || this.state === 'FALLING') {
            this.renderer.drawHUD(this.score, this.hearts, this.level);
        }

        if (this.state === 'GAMEOVER') {
            this.renderer.drawGameOver(this.score, this.scoreboard.getTopScores());
        } else if (this.state === 'LEVEL_SUMMARY') {
            this.renderer.drawLevelSummary(this.lastLevelStats, this.level);
        } else if (this.state === 'ENTER_NAME') {
            this.renderer.drawEnterName(this.score, this.playerName);
        } else if (this.state === 'SETTINGS') {
            this.renderer.drawSettings(this.difficulty, this.audioManager.musicEnabled, this.inputManager.currentLayout);
        }
        // Hint Overlay (Easy Mode Only)
        if (this.state === 'PLAYING' && this.difficulty === 'EASY' && this.hintEnabled) {
            this.renderer.drawHint(this.inputManager.currentLayout);
        }

        // GLOBAL DEBUG OVERLAY (Always on top)
        if (Config.DEBUG) {
            this.renderer.drawDebug(this.state, this.lastInputDebug);
        }
    }

    handleInput(char) {
        // Start music on first interaction if needed
        this.audioManager.playMusic();

        // Global Hint Toggle (H key) in Easy Mode
        if (this.difficulty === 'EASY' && (char === 'h' || char === 'H')) {
            this.hintEnabled = !this.hintEnabled;
            return; // Don't process as game input
        }

        // TRACE
        this.lastInputDebug += ` | GAME RECV: [${char}]`;

        // ESC to Menu (Universal during gameplay or sub-menus)
        if (char === 'ESCAPE') {
            this.resetGame();
            return;
        }

        if (this.state === 'MENU') {
            if (char === 's' || char === 'S') {
                this.state = 'SETTINGS';
            } else if (char === ' ' || char === 'ENTER') {
                this.lastInputDebug += ` -> MATCHED!`;
                console.log("Starting Game..."); // Debug
                try {
                    this.startGame();
                    this.lastInputDebug += " -> START CALLED";
                } catch (e) {
                    console.error("Start Failed:", e);
                    this.lastInputDebug += ` -> ERROR: ${e.message}`;
                }
            }
        } else if (this.state === 'SETTINGS') {
            if (char === ' ') {
                this.state = 'MENU';
            } else if (char === '1') {
                this.setDifficulty('EASY');
            } else if (char === '2') {
                this.setDifficulty('MEDIUM');
            } else if (char === '3') {
                this.setDifficulty('HARD');
            } else if (char === 'm' || char === 'M') {
                this.audioManager.toggleMute();
            }
        } else if (this.state === 'GAMEOVER') {
            if (char === ' ') { // Space to restart
                this.resetGame();
            }
        } else if (this.state === 'PLAYING') {
            if (this.entityManager.checkInput(char)) {
                this.audioManager.playSFX('laser');
            }
        } else if (this.state === 'LEVEL_SUMMARY') {
            if (char === ' ') {
                this.startNextLevel();
            }
        } else if (this.state === 'ENTER_NAME') {
            if (char === 'ENTER') {
                this.submitScore();
            } else if (char === 'BACKSPACE') {
                this.playerName = this.playerName.slice(0, -1);
            } else if (char.length === 1 && /[A-Z0-9 ]/i.test(char)) {
                if (this.playerName.length < 10) {
                    this.playerName += char;
                }
            }
        }
    }

    startGame() {
        this.resetGameData();
        // Apply difficulty settings
        const settings = this.difficultySettings[this.difficulty];
        this.levelManager.setDifficulty(settings.speed, settings.multiplier);

        this.state = 'PLAYING';
        this.levelManager.startLevel(1);
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    cycleLayout() {
        this.layoutIndex = (this.layoutIndex + 1) % this.availableLayouts.length;
        this.inputManager.setLayout(this.availableLayouts[this.layoutIndex]);
    }

    takeDamage() {
        this.audioManager.playSFX('thump');
        this.hearts--;
        this.renderer.triggerDamageFlash();
        if (this.hearts <= 0) {
            this.audioManager.playSFX('lose');
            // Transition to falling is handled in update() after flash completes
        }
    }

    startFalling() {
        this.state = 'FALLING';
        this.turtleY = 120; // Reset to safe position below HUD
    }

    checkGameOver() {
        if (this.scoreboard.isHighScore(this.score)) {
            this.state = 'ENTER_NAME';
            this.playerName = "";
        } else {
            this.gameOver();
        }
    }

    submitScore() {
        if (this.playerName.trim() === "") this.playerName = "ANONYMOUS";
        this.scoreboard.saveScore(this.playerName, this.score);
        this.gameOver();
    }

    gameOver() {
        this.state = 'GAMEOVER';
    }

    completeLevel(stats) {
        this.audioManager.playSFX('win');
        this.state = 'LEVEL_SUMMARY';
        this.lastLevelStats = stats;
    }

    startNextLevel() {
        this.state = 'PLAYING';
        this.levelManager.startLevel(this.level + 1);
        this.entityManager.clear();
    }

    resetGame() {
        this.state = 'MENU';
        this.resetGameData();
    }

    resetGameData() {
        this.score = 0;
        this.hearts = 3;
        this.level = 1;
        this.entityManager.clear();
        this.levelManager.reset();
    }
}
