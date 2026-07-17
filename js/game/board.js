import { Validator } from '../core/validator.js';

export class Board {
    constructor() {
        this.grid = [];
        this.solution = [];
        this.given = [];
        this.notes = [];
        this.initialPuzzle = [];
        this.reset();
    }

    reset() {
        this.grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.solution = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.given = Array.from({ length: 9 }, () => Array(9).fill(false));
        this.notes = Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => new Set())
        );
        this.initialPuzzle = Array.from({ length: 9 }, () => Array(9).fill(0));
    }

    load(puzzle, solution) {
        this.reset();
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                this.grid[r][c] = puzzle[r][c];
                this.solution[r][c] = solution[r][c];
                this.initialPuzzle[r][c] = puzzle[r][c];
                if (puzzle[r][c] !== 0) {
                    this.given[r][c] = true;
                }
            }
        }
    }

    getCell(r, c) {
        return this.grid[r][c];
    }

    isGiven(r, c) {
        return this.given[r][c];
    }

    isEmpty(r, c) {
        return this.grid[r][c] === 0;
    }

    isCorrect(r, c) {
        if (this.grid[r][c] === 0) return true;
        return this.grid[r][c] === this.solution[r][c];
    }

    setCell(r, c, value) {
        if (this.given[r][c]) return false;
        this.grid[r][c] = value;
        if (value !== 0) {
            this.notes[r][c].clear();
        }
        return true;
    }

    toggleNote(r, c, num) {
        if (this.given[r][c] || this.grid[r][c] !== 0) return;
        if (this.notes[r][c].has(num)) {
            this.notes[r][c].delete(num);
        } else {
            this.notes[r][c].add(num);
        }
    }

    getNotes(r, c) {
        return this.notes[r][c];
    }

    clearCell(r, c) {
        if (this.given[r][c]) return;
        this.grid[r][c] = 0;
        this.notes[r][c].clear();
    }

    getConflicts() {
        return Validator.findConflicts(this.grid);
    }

    isComplete() {
        return Validator.isComplete(this.grid);
    }

    getHint(r, c) {
        return this.solution[r][c];
    }

    getRowColBoxCells(row, col) {
        const cells = Validator.getRelatedCells(row, col);
        const result = [];
        for (const cell of cells) {
            const [r, c] = cell.split(',').map(Number);
            result.push({ r, c });
        }
        return result;
    }

    findSameNumbers(num) {
        const cells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] === num && num !== 0) {
                    cells.push({ r, c });
                }
            }
        }
        return cells;
    }
}
