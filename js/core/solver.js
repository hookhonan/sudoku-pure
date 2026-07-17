import { Validator } from './validator.js';

export class Solver {
    static solve(grid) {
        const copy = grid.map(row => [...row]);
        if (this._solve(copy)) return copy;
        return null;
    }

    static _solve(grid) {
        const empty = this._findBestEmpty(grid);
        if (!empty) return true;

        const [row, col] = empty;
        const candidates = Validator.getCandidates(grid, row, col);

        for (const num of candidates) {
            grid[row][col] = num;
            if (this._solve(grid)) return true;
            grid[row][col] = 0;
        }
        return false;
    }

    static _findBestEmpty(grid) {
        let best = null;
        let bestCount = 10;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    const count = Validator.getCandidates(grid, r, c).length;
                    if (count < bestCount) {
                        bestCount = count;
                        best = [r, c];
                        if (count === 0) return best;
                        if (count === 1) return best;
                    }
                }
            }
        }
        return best;
    }

    static hasUniqueSolution(grid) {
        const copy = grid.map(row => [...row]);
        let count = 0;

        const _count = (g) => {
            if (count > 1) return;
            const empty = this._findBestEmpty(g);
            if (!empty) {
                count++;
                return;
            }
            const [row, col] = empty;
            const candidates = Validator.getCandidates(g, row, col);
            for (const num of candidates) {
                g[row][col] = num;
                _count(g);
                g[row][col] = 0;
                if (count > 1) return;
            }
        };

        _count(copy);
        return count === 1;
    }

    static countSolutions(grid, limit = 2) {
        const copy = grid.map(row => [...row]);
        let count = 0;

        const _count = (g) => {
            if (count >= limit) return;
            const empty = this._findBestEmpty(g);
            if (!empty) {
                count++;
                return;
            }
            const [row, col] = empty;
            const candidates = Validator.getCandidates(g, row, col);
            for (const num of candidates) {
                g[row][col] = num;
                _count(g);
                g[row][col] = 0;
                if (count >= limit) return;
            }
        };

        _count(copy);
        return count;
    }
}
