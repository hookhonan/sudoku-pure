export class Storage {
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {}
    }

    static load(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            return defaultValue;
        }
    }

    static saveGame(state) {
        this.save('sudoku_game', state);
    }

    static loadGame() {
        return this.load('sudoku_game', null);
    }

    static clearGame() {
        try {
            localStorage.removeItem('sudoku_game');
        } catch (e) {}
    }
}
