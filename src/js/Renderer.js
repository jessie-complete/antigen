// Import image to ensure Vite handles it
import logoUrl from '../assets/logo.png';
import { Config } from './Config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
        this.flashAccumulator = 0;
        this.isFlashing = false;
        this.flashCount = 0;
        this.flashDuration = 0.1; // seconds per flash toggle

        // Mobile Safe Areas
        this.safeAreaTop = 0;
        this.safeAreaBottom = 0;
        this.safeAreaLeft = 0;
        this.safeAreaRight = 0;
        this.updateSafeAreas();
        window.addEventListener('resize', () => {
            this.resize();
            this.updateSafeAreas();
        });
        // Theme Colors
        this.colors = {
            yellow: '#f9f44f',
            aqua: '#00ffff',
            green: '#39ff14',
            red: '#ff0000',
            gold: '#FFD700'
        };

        // Assets
        this.turtleImage = new Image();
        this.turtleImage.src = logoUrl;
    }

    updateSafeAreas() {
        const div = document.createElement('div');
        div.style.paddingTop = 'env(safe-area-inset-top)';
        div.style.paddingBottom = 'env(safe-area-inset-bottom)';
        div.style.paddingLeft = 'env(safe-area-inset-left)';
        div.style.paddingRight = 'env(safe-area-inset-right)';
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        document.body.appendChild(div);

        const style = window.getComputedStyle(div);
        this.safeAreaTop = parseInt(style.paddingTop) || 0;
        this.safeAreaBottom = parseInt(style.paddingBottom) || 0;
        this.safeAreaLeft = parseInt(style.paddingLeft) || 0;
        this.safeAreaRight = parseInt(style.paddingRight) || 0;

        // Fallback Logic for Simulators/Browsers
        if (/iPhone|iPad/i.test(navigator.userAgent)) {
            const isLandscape = window.innerWidth > window.innerHeight;

            // If env variables failed to return values but we know we are on iOS
            if (this.safeAreaTop === 0 && this.safeAreaBottom === 0 && this.safeAreaLeft === 0 && this.safeAreaRight === 0) {
                if (isLandscape) {
                    this.safeAreaLeft = 47;
                    this.safeAreaRight = 47;
                    this.safeAreaBottom = 21;
                } else {
                    this.safeAreaTop = 47;
                    this.safeAreaBottom = 34;
                }
            }
        }

        document.body.removeChild(div);
    }

    getSafeCenter() {
        const safeWidth = this.canvas.width - this.safeAreaLeft - this.safeAreaRight;
        return this.safeAreaLeft + (safeWidth / 2);
    }

    resize() {
        // Make canvas fill the container (which fills screen)
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    triggerDamageFlash() {
        this.isFlashing = true;
        this.flashCount = 6; // 3 flashes = on/off/on/off/on/off
        this.flashAccumulator = 0;
    }

    update(dt, gameHeight) { // Added gameHeight for simple check if needed, but usually redundant
        // Flash update
        if (this.isFlashing && this.flashCount > 0) {
            this.flashAccumulator += dt;
            if (this.flashAccumulator >= this.flashDuration) {
                this.flashAccumulator -= this.flashDuration;
                this.flashCount--;
                if (this.flashCount <= 0) {
                    this.isFlashing = false;
                }
            }
        }
    }

    clear() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(state, dt) {
        this.lastState = state;
        this.clear();

        // Draw background grid or effects if needed

        // Dynamic Landscape (Bottom 10%) - Hide in Menu/Settings
        if (state !== 'MENU' && state !== 'SETTINGS') {
            this.drawLandscape(state === 'PLAYING' || state === 'LEVEL_SUMMARY' ? 1 : 0);
        }

        // Damage Flash Effect
        if (this.isFlashing && this.flashCount % 2 !== 0) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (state === 'MENU') {
            this.drawMenu();
        } else if (state === 'PLAYING') {
            // Entities drawn by Game loop calling drawEntities
        } else if (state === 'GAMEOVER') {
            // Overlay
        } else if (state === 'FALLING') {
            // Just landscape and turtle falling
        }
    }

    drawLandscape(level) {
        const height = this.canvas.height * 0.1;
        const y = this.canvas.height - height;

        // Landscape colors based on level
        //const colors = ['#228B22', '#F4A460', '#8B4513', '#556B2F', '#708090']; // Grass, Sand, Dirt, Olive, Slate
        const colors = [this.colors.green, this.colors.aqua, this.colors.yellow];
        const color = colors[(level - 1) % colors.length] || '#228B22';

        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, y, this.canvas.width, height);

        // Simple details (bumps)
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.lineTo(i, y);
            this.ctx.lineTo(i + 20, y - 10);
            this.ctx.lineTo(i + 40, y);
        }
        this.ctx.fill();

        // Landscape Text
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("TYPING TURTLE", this.getSafeCenter(), y + height / 2 + 10);
        this.ctx.textAlign = 'left'; // Reset
    }

    drawEntities(entities) {
        entities.forEach(entity => {
            // Determine color
            let color = entity.color;

            // If damaging logic requires distinct flash, handle here.
            if (this.isFlashing && this.flashCount % 2 !== 0) {
                color = '#ff0000'; // Flash red
            }

            this.ctx.font = `bold ${entity.size}px "VT323"`;
            this.ctx.fillStyle = color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(entity.char, entity.x, entity.y);
        });
    }

    drawHUD(score, hearts, level) {
        // In landscape, top safe area is 0, so we use a small floor (10px).
        // In portrait, this will use the actual notch height (e.g., 47px).
        const hudY = Math.max(this.safeAreaTop, 10);
        const hudHeight = 35;

        // Top Banner Background - Stretch from screen edge to screen edge
        this.ctx.fillStyle = this.colors.gold;
        this.ctx.fillRect(0, 0, this.canvas.width, hudY + hudHeight);

        const isPortrait = this.canvas.height > this.canvas.width;
        const hudFontSize = isPortrait ? 14 : 20;
        this.ctx.font = `${hudFontSize}px "Press Start 2P"`;
        this.ctx.fillStyle = '#000000';
        this.ctx.textBaseline = 'middle';

        // Layout - Respect left/right safe areas for the side notches
        const textY = hudY + (hudHeight / 2);
        const marginX = 20;
        const safeCenterX = this.getSafeCenter();

        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${score}`, marginX + this.safeAreaLeft, textY);

        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LVL: ${level}`, safeCenterX, textY);

        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = this.colors.red;
        // Hide some hearts if too many for mobile width
        const heartCount = hearts > 5 ? 5 : hearts;
        this.ctx.fillText(`❤`.repeat(heartCount), this.canvas.width - marginX - this.safeAreaRight, textY);

        // DEBUG STATE
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.font = '8px monospace';
        import('./Config.js').then(({ Config }) => {
            if (Config.DEBUG) {
                this.ctx.fillText(`STATE: ${this.lastState || 'Unknown'}`, safeCenterX, hudY + hudHeight - 2);
            }
        });

        // Reset
        this.ctx.textBaseline = 'alphabetic';
    }

    // Capture state for debug
    drawMenu() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const safeCenterX = this.getSafeCenter();
        const centerY = this.canvas.height / 2;

        // Adaptive Logo Size: Cap by width and available height
        const logoSize = Math.min(this.canvas.width * 0.7, this.canvas.height * 0.35, 300);

        // Big Logo
        if (this.turtleImage.complete && this.turtleImage.naturalWidth > 0) {
            const x = safeCenterX - logoSize / 2;
            const y = centerY - logoSize - 20; // Anchor above middle with small gap
            this.ctx.drawImage(this.turtleImage, x, y, logoSize, logoSize);
        }

        this.ctx.fillStyle = this.colors.green;
        const titleFontSize = Math.min(this.canvas.width / 10, 60);
        this.ctx.font = `${titleFontSize}px "Bungee Shade"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TYPING TURTLE', safeCenterX, centerY + 60);

        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillStyle = this.colors.aqua;
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.fillText('Tap to Start', safeCenterX, centerY + 140);
        }

        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText('Connect a physical keyboard', safeCenterX, this.canvas.height - 100 - this.safeAreaBottom);
        this.ctx.fillText('or tap to type', safeCenterX, this.canvas.height - 80 - this.safeAreaBottom);
    }

    drawEnterName(score, name) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const safeCenterX = this.getSafeCenter();
        const centerY = this.canvas.height / 2;
        const isPortrait = this.canvas.height > this.canvas.width;

        this.ctx.fillStyle = '#39ff14';
        const titleSize = isPortrait ? Math.min(this.canvas.width / 12, 40) : 50;
        this.ctx.font = `${titleSize}px "Bungee Shade"`;
        this.ctx.textAlign = 'center';

        const topOffset = Math.max(this.safeAreaTop + 40, centerY - 100);
        this.ctx.fillText('NEW HIGH SCORE!', safeCenterX, topOffset);

        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '40px "VT323"';
        this.ctx.fillText(`Score: ${score}`, safeCenterX, topOffset + 60);

        // Dynamic font scaling for name entry line
        const fullPrompt = `Enter Name: ${name}_`;
        const testPromptMax = `Enter Name: WWWWWWWWWW_`; // Max potential width with large characters
        const safeWidth = this.canvas.width - this.safeAreaLeft - this.safeAreaRight - 40;

        let fontSize = 40;
        this.ctx.font = `${fontSize}px "VT323"`;
        while (this.ctx.measureText(testPromptMax).width > safeWidth && fontSize > 16) {
            fontSize--;
            this.ctx.font = `${fontSize}px "VT323"`;
        }

        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillText(fullPrompt, safeCenterX, topOffset + 140);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px "VT323"';
        this.ctx.fillText('Press ENTER to Submit', safeCenterX, topOffset + 200);
    }

    drawSettings(difficulty, soundEnabled, layout) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const padding = 25;
        const safeCenterX = this.getSafeCenter();
        const top = this.safeAreaTop + padding;

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.colors.green;
        const titleSize = Math.min(this.canvas.width / 10, 50);
        this.ctx.font = `${titleSize}px "Bungee Shade"`;
        this.ctx.fillText('SETTINGS', safeCenterX, top + 50);

        // Responsive font for menu items
        const menuFontSize = Math.min(this.canvas.width / 20, 24);
        this.ctx.font = `${menuFontSize}px "Press Start 2P"`;

        const startY = top + 150;
        const gap = Math.min(this.canvas.height / 12, 70);

        // Difficulty Options
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `${menuFontSize * 0.8}px "Press Start 2P"`;
        this.ctx.fillText('CHOOSE DIFFICULTY:', safeCenterX, startY - 40);

        this.ctx.font = `${menuFontSize}px "Press Start 2P"`;
        const difficulties = ['EASY', 'MEDIUM', 'HARD'];
        difficulties.forEach((diff, idx) => {
            this.ctx.fillStyle = difficulty === diff ? this.colors.yellow : '#888';
            this.ctx.fillText(`${idx + 1}. ${diff}`, safeCenterX, startY + (idx * gap));
        });

        // Sound Toggle
        const soundY = startY + (difficulties.length * gap) + padding;
        this.ctx.fillStyle = soundEnabled ? this.colors.yellow : this.colors.red;
        this.ctx.fillText(`M. AUDIO: ${soundEnabled ? 'ON 🔊' : 'OFF 🔇'}`, safeCenterX, soundY);

        // Return Prompt
        this.ctx.fillStyle = this.colors.aqua;
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.fillText('Tap to Return', safeCenterX, this.canvas.height - 40 - this.safeAreaBottom);

        this.ctx.textAlign = 'start';
    }

    drawGameOver(score, maxScores) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const safeCenterX = this.getSafeCenter();
        const isPortrait = this.canvas.height > this.canvas.width;
        // Increase margin in portrait for the notch
        const top = this.safeAreaTop + (isPortrait ? 40 : 20);

        // Header - More compact and orientation-aware scaling
        this.ctx.fillStyle = this.colors.red;
        const titleSize = isPortrait ? Math.min(this.canvas.width / 12, 45) : Math.min(this.canvas.width / 10, 50);
        this.ctx.font = `${titleSize}px "Bungee Shade"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', safeCenterX, top + 40);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px "VT323"';
        this.ctx.fillText(`SCORE: ${score}`, safeCenterX, top + 75);

        // Draw Leaderboard Table
        if (maxScores && maxScores.length > 0) {
            this.ctx.fillStyle = this.colors.yellow;
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.fillText('TOP SCORES', safeCenterX, top + 115);

            const tableWidth = Math.min(this.canvas.width * 0.9 - (this.safeAreaLeft + this.safeAreaRight), 600);
            const halfTable = tableWidth / 2;
            const startY = top + 160;
            const rowHeight = Math.min(this.canvas.height / 25, 30);

            // Headers
            this.ctx.font = 'bold 16px "VT323"';
            this.ctx.fillStyle = '#00ffff';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('NAME', safeCenterX - halfTable, startY - 20);
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SCORE', safeCenterX, startY - 20);
            this.ctx.textAlign = 'right';
            this.ctx.fillText('DATE', safeCenterX + halfTable, startY - 20);

            // Divider
            this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            this.ctx.beginPath();
            this.ctx.moveTo(safeCenterX - halfTable, startY - 10);
            this.ctx.lineTo(safeCenterX + halfTable, startY - 10);
            this.ctx.stroke();

            this.ctx.font = '18px "VT323"';
            this.ctx.fillStyle = '#fff';
            maxScores.slice(0, 10).forEach((entry, idx) => {
                const y = startY + (idx * rowHeight);
                const dateObj = new Date(entry.date);
                const dateStr = dateObj.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });

                this.ctx.textAlign = 'left';
                let name = entry.name;
                if (name.length > 8 && tableWidth < 400) name = name.substring(0, 7) + "..";
                this.ctx.fillText(`${idx + 1}. ${name}`, safeCenterX - halfTable, y);

                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${entry.score}`, safeCenterX, y);

                this.ctx.textAlign = 'right';
                this.ctx.fillText(dateStr, safeCenterX + halfTable, y);
            });
            this.ctx.textAlign = 'center'; // Reset
        }

        // Action prompt
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillStyle = '#00ffff';
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.fillText('Tap to Restart', safeCenterX, this.canvas.height - 40 - this.safeAreaBottom);
        }
    }

    drawTurtle(dt, state, isFalling) {
        // Simple Turtle Visualization (Placeholder for Sprite)
        let x = 60;
        const hudY = this.safeAreaTop;
        const hudHeight = 35;
        let y = hudY + hudHeight + 45; // Dynamically positioned below the banner

        // If in settings or menu, we might want to hide it or position differently?
        // Game.js handles visibility checks.

        if (this.turtleImage.complete && this.turtleImage.naturalWidth > 0) {
            const size = 90;
            this.ctx.drawImage(this.turtleImage, x - size / 2, y - size / 2, size, size);
        } else {
            // Fallback
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawFallingTurtle(y) {
        if (this.turtleImage.complete) {
            this.ctx.save();
            this.ctx.translate(60, y);
            this.ctx.rotate(Date.now() / 100); // Spin
            this.ctx.drawImage(this.turtleImage, -60, -60, 120, 120);
            this.ctx.restore();
        }
    }

    drawLevelSummary(stats, level) {
        this.drawLandscape(level);

        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const safeCenterX = this.getSafeCenter();
        const centerY = this.canvas.height / 2;
        const isPortrait = this.canvas.height > this.canvas.width;

        // Draw Turtle
        this.drawTurtle(0, 'LEVEL_SUMMARY', false);

        this.ctx.fillStyle = '#FFD700';
        const titleSize = isPortrait ? Math.min(this.canvas.width / 12, 40) : 50;
        this.ctx.font = `${titleSize}px "Bungee Shade"`;
        this.ctx.textAlign = 'center';

        const topOffset = Math.max(this.safeAreaTop + 40, centerY - 100);
        this.ctx.fillText(`LEVEL ${level} COMPLETE`, safeCenterX, topOffset);

        this.ctx.fillStyle = '#fff';
        const bodyFontSize = isPortrait ? 14 : 18;
        this.ctx.font = `${bodyFontSize}px "Press Start 2P"`;

        const total = stats.caught + stats.missed;
        const accuracy = total > 0 ? Math.round((stats.caught / total) * 100) : 0;

        this.ctx.fillText(`Letters Caught: ${stats.caught}`, safeCenterX, topOffset + 80);
        this.ctx.fillText(`Missed: ${stats.missed}`, safeCenterX, topOffset + 120);
        this.ctx.fillText(`Accuracy: ${accuracy}%`, safeCenterX, topOffset + 160);

        this.ctx.fillStyle = '#00ffff';
        const promptFontSize = isPortrait ? 12 : 14;
        this.ctx.font = `${promptFontSize}px "Press Start 2P"`;
        this.ctx.fillText('Tap or SPACE for Next Level', safeCenterX, topOffset + 220);
    }

    drawDebug(state, input) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 100);

        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.font = '12px monospace';

        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText(`STATE: ${state}`, 10, 10);

        this.ctx.fillStyle = '#ffff00';
        const text = `LAST INPUT: ${input || 'None'}`;
        const maxWidth = this.canvas.width - 20;
        const words = text.split(' ');
        let line = '';
        let y = 30;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line, 10, y);
                line = words[n] + ' ';
                y += 15;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, 10, y);

        this.ctx.restore();
    }
}
