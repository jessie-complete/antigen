export class AudioManager {
    constructor() {
        this.initialMusicEnabled = false;
        this.musicEnabled = true;
        this.bgm = new Audio();
        this.bgm.loop = true;
        this.bgm.volume = 0.5;

        // Using a placeholder reliable chiptune track or user provided
        // For this demo, I'll use a generic placeholder URL that usually works for demos, 
        // or we can instruct the user to drop a file in.
        // Let's use a reliable CCO asset URL if possible, or just setup the structure.
        // I'll set it to a commonly used free chiptune asset for demo purposes.
        // Caketown by Matthew Pablo (OpenGameArt)
        this.bgm.src = new URL('../assets/audio/music.mp3', import.meta.url).href;
        // Credit: Caketown (Matthew Pablo) - CC BY 3.0

        // SFX
        this.sfx = {
            laser: new Audio(new URL('../assets/audio/laser.wav', import.meta.url).href),
            thump: new Audio(new URL('../assets/audio/thump.mp3', import.meta.url).href),
            win: new Audio(new URL('../assets/audio/win.mp3', import.meta.url).href),
            lose: new Audio(new URL('../assets/audio/lose.wav', import.meta.url).href)
        };

        // Validate SFX loading (optional but good for debugging)
        Object.values(this.sfx).forEach(sound => {
            sound.volume = 0.6;
            sound.onerror = () => console.warn(`Failed to load SFX: ${sound.src}`);
        });
    } // End constructor

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.bgm.play().catch(e => console.log("Audio play failed (interaction needed):", e));
        } else {
            this.bgm.pause();
        }
        return this.musicEnabled;
    }

    toggleMute() {
        // Toggle both music and sfx capability
        this.toggleMusic();
        return this.musicEnabled;
    }

    playMusic() {
        if (!this.initialMusicEnabled) {
            this.initialMusicEnabled = true;
            this.bgm.play().catch(e => console.log("Audio play failed:", e));
        } else {
		if (this.musicEnabled) {
            	this.bgm.play().catch(e => console.log("Audio play failed:", e));
		}
	}
    }

    stopMusic() {
        this.bgm.pause();
        this.bgm.currentTime = 0;
        this.musicEnabled = false;
    }

    playSFX(name) {
        if (this.musicEnabled && this.sfx[name]) {
            // Clone to allow overlapping sounds
            const sound = this.sfx[name].cloneNode();
            sound.volume = 0.6;
            sound.play().catch(e => { });
        }
    }
}
