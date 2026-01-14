export class InputManager {
    constructor(game) {
        this.game = game;
        this.currentLayout = 'QWERTY'; // Default
        this.layouts = {
            'QWERTY': (key) => key.toUpperCase(),
            'AZERTY': (key) => {
                const map = { 'a': 'q', 'q': 'a', 'z': 'w', 'w': 'z', 'm': ',', ',': 'm' };
                return (map[key.toLowerCase()] || key).toUpperCase();
            },
            'QWERTZ': (key) => {
                const map = { 'z': 'y', 'y': 'z' };
                return (map[key.toLowerCase()] || key).toUpperCase();
            },
            'DVORAK': (key) => {
                // Simplified mapping for demo purposes
                return key.toUpperCase();
            }
        };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    setLayout(layoutName) {
        if (this.layouts[layoutName]) {
            this.currentLayout = layoutName;
        }
    }

    handleKeyDown(e) {
        // Prevent default for scrolling keys
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }

        // Get char
        const char = this.getCharFromKey(e.key);

        // DEBUG: Update Game State string
        this.game.lastInputDebug = `KEY: '${e.key}' CHAR: '[${char}]'`;

        if (char) {
            this.game.handleInput(char);
        }
    }

    getCharFromKey(key) {
        // Special keys whitelist
        if (key === 'Enter') return 'ENTER';
        if (key === 'Backspace') return 'BACKSPACE';
	if (key === 'Escape') return 'ESCAPE';
        if (key === ' ' || key === 'Spacebar' || key === 'Space') return ' ';

        // Ignore other non-character keys (Shift, Ctrl, F1, etc.)
        if (key.length > 1) return null;

        const mapper = this.layouts[this.currentLayout];
        return mapper ? mapper(key) : key.toUpperCase();
    }

    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
