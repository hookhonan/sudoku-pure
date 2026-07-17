export class Stats {
    constructor() {
        this.data = {
            totalGames: 0,
            totalWins: 0,
            currentStreak: 0,
            bestStreak: 0,
            bestTimes: {},    // { difficulty: seconds }
            avgTimes: {},     // { difficulty: { total: seconds, count: N } }
            byDifficulty: {}, // { difficulty: { played: N, won: N } }
        };
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('sudoku_stats'));
            if (saved) {
                this.data = { ...this.data, ...saved };
            }
        } catch (e) {}
    }

    save() {
        try {
            localStorage.setItem('sudoku_stats', JSON.stringify(this.data));
        } catch (e) {}
    }

    recordGame(difficulty, won, timeSeconds) {
        const d = this.data;
        d.totalGames++;

        if (!d.byDifficulty[difficulty]) {
            d.byDifficulty[difficulty] = { played: 0, won: 0 };
        }
        d.byDifficulty[difficulty].played++;

        if (won) {
            d.totalWins++;
            d.currentStreak++;
            d.bestStreak = Math.max(d.bestStreak, d.currentStreak);
            d.byDifficulty[difficulty].won++;

            // Best time
            if (!d.bestTimes[difficulty] || timeSeconds < d.bestTimes[difficulty]) {
                d.bestTimes[difficulty] = timeSeconds;
            }

            // Average time
            if (!d.avgTimes[difficulty]) {
                d.avgTimes[difficulty] = { total: 0, count: 0 };
            }
            d.avgTimes[difficulty].total += timeSeconds;
            d.avgTimes[difficulty].count++;
        } else {
            d.currentStreak = 0;
        }
        this.save();
    }

    getSummary() {
        return { ...this.data };
    }

    isNewBest(difficulty, timeSeconds) {
        const best = this.data.bestTimes[difficulty];
        return !best || timeSeconds < best;
    }
}
