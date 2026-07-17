export class Validator {
    static getBoxIndex(row, col) {
        return Math.floor(row / 3) * 3 + Math.floor(col / 3);
    }

    static isValidPlacement(grid, row, col, num) {
        for (let c = 0; c < 9; c++) {
            if (grid[row][c] === num && c !== col) return false;
        }
        for (let r = 0; r < 9; r++) {
            if (grid[r][col] === num && r !== row) return false;
        }
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
                if (grid[r][c] === num && (r !== row || c !== col)) return false;
            }
        }
        return true;
    }

    static findConflicts(grid) {
        const conflicts = new Set();
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) continue;
                if (!this.isValidPlacement(grid, r, c, grid[r][c])) {
                    conflicts.add(`${r},${c}`);
                }
            }
        }
        return conflicts;
    }

    static isComplete(grid) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) return false;
            }
        }
        const conflicts = this.findConflicts(grid);
        return conflicts.size === 0;
    }

    static getCandidates(grid, row, col) {
        if (grid[row][col] !== 0) return [];
        const used = new Set();
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] !== 0) used.add(grid[row][i]);
            if (grid[i][col] !== 0) used.add(grid[i][col]);
        }
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
                if (grid[r][c] !== 0) used.add(grid[r][c]);
            }
        }
        const candidates = [];
        for (let n = 1; n <= 9; n++) {
            if (!used.has(n)) candidates.push(n);
        }
        return candidates;
    }

    static getRelatedCells(row, col) {
        const cells = new Set();
        for (let i = 0; i < 9; i++) {
            cells.add(`${row},${i}`);
            cells.add(`${i},${col}`);
        }
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
                cells.add(`${r},${c}`);
            }
        }
        cells.delete(`${row},${col}`);
        return cells;
    }
}
