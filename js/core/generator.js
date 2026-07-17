import { Solver } from './solver.js';
import { Validator } from './validator.js';

export class Generator {
    static DIFFICULTY = {
        easy:   { label: '简单', labelEn: 'Easy',   givenMin: 41, givenMax: 45 },
        medium: { label: '中等', labelEn: 'Medium', givenMin: 36, givenMax: 40 },
        hard:   { label: '困难', labelEn: 'Hard',   givenMin: 31, givenMax: 35 },
        expert: { label: '专家', labelEn: 'Expert', givenMin: 25, givenMax: 30 },
    };

    static generate(difficulty = 'medium') {
        const config = this.DIFFICULTY[difficulty];
        const targetGiven = this._randomInt(config.givenMin, config.givenMax);

        const solution = this._generateFullSolution();
        const puzzle = this._createPuzzle(solution, 81 - targetGiven);

        return { puzzle, solution, difficulty };
    }

    static _generateFullSolution() {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        this._fillDiagonal(grid);
        return Solver.solve(grid);
    }

    static _fillDiagonal(grid) {
        for (let box = 0; box < 9; box += 4) {
            const nums = this._shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const br = Math.floor(box / 3) * 3;
            const bc = (box % 3) * 3;
            let idx = 0;
            for (let r = br; r < br + 3; r++) {
                for (let c = bc; c < bc + 3; c++) {
                    grid[r][c] = nums[idx++];
                }
            }
        }
    }

    static _createPuzzle(solution, holes) {
        const puzzle = solution.map(row => [...row]);
        const positions = this._shuffle(
            Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
        );

        let removed = 0;
        for (const [r, c] of positions) {
            if (removed >= holes) break;
            const backup = puzzle[r][c];
            puzzle[r][c] = 0;

            if (Solver.hasUniqueSolution(puzzle)) {
                removed++;
            } else {
                puzzle[r][c] = backup;
            }
        }
        return puzzle;
    }

    static _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    static _randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
