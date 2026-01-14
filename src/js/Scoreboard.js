export class Scoreboard {
    constructor() {
        this.storageKey = 'typing_turtle_scores';
        this.scores = this.loadScores();
    }

    loadScores() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Failed to load scores", e);
            return [];
        }
    }

    saveScore(name, score) {
        const newEntry = { name, score, date: new Date().toISOString() };
        this.scores.push(newEntry);

        // Sort descending
        this.scores.sort((a, b) => b.score - a.score);

        // Keep top 10
        this.scores = this.scores.slice(0, 10);

        localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
    }

    getTopScores() {
        return this.scores;
    }

    isHighScore(score) {
        if (score <= 0) return false; // meaningful score required
        if (this.scores.length < 10) return true;
        return score > this.scores[this.scores.length - 1].score;
    }
}
