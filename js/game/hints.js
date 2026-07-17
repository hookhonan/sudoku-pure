export class Hints {
    constructor() {
        this.remaining = 3;
        this.maxPerDay = 3;
        this.lastRefillDate = '';
    }

    use() {
        if (this.remaining <= 0) return false;
        this.remaining--;
        this._save();
        return true;
    }

    refill() {
        const today = new Date().toDateString();
        if (this.lastRefillDate !== today) {
            this.remaining = this.maxPerDay;
            this.lastRefillDate = today;
            this._save();
        }
    }

    getRemaining() {
        this.refill();
        return this.remaining;
    }

    canUse() {
        return this.getRemaining() > 0;
    }

    _save() {
        try {
            localStorage.setItem('sudoku_hints', JSON.stringify({
                remaining: this.remaining,
                lastRefillDate: this.lastRefillDate,
            }));
        } catch (e) {}
    }

    load() {
        try {
            const data = JSON.parse(localStorage.getItem('sudoku_hints'));
            if (data) {
                this.remaining = data.remaining ?? 3;
                this.lastRefillDate = data.lastRefillDate || '';
                this.refill();
            }
        } catch (e) {}
    }
}
