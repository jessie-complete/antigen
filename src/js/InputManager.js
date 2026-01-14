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

        // Mobile support
        this.mobileInput = document.getElementById('mobile-input');
        if (this.mobileInput) {
            this.mobileInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val.length > 0) {
                    const char = val[val.length - 1];
                    this.game.handleInput(this.getCharFromKey(char));
                    e.target.value = ''; // Clear for next char
                }
            });
            // Handle backspace on mobile which might not trigger keydown reliably
            this.mobileInput.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    this.game.handleInput('BACKSPACE');
                }
            });
            // Focus on any tap
            window.addEventListener('touchstart', () => this.mobileInput.focus());
            window.addEventListener('click', () => this.mobileInput.focus());
        }
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
