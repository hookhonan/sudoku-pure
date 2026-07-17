export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.boardSize = 0;
    }

    resize(containerWidth, containerHeight) {
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(containerWidth, containerHeight - 20);
        this.boardSize = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.cellSize = size / 9;
    }

    draw(board, state) {
        const ctx = this.ctx;
        const cs = this.cellSize;
        const size = cs * 9;

        // Fill background
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-board').trim() || '#ffffff';
        ctx.fillRect(0, 0, size, size);

        this._drawHighlights(ctx, board, state);
        this._drawGrid(ctx);
        this._drawNumbers(ctx, board, state);
        this._drawNotes(ctx, board, state);
        this._drawSelection(ctx, state);
    }

    _drawHighlights(ctx, board, state) {
        const cs = this.cellSize;
        const { selectedRow, selectedCol } = state;

        // Related cells highlight (same row/col/box)
        if (selectedRow !== null && selectedCol !== null) {
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--highlight-related').trim() || '#e6f0fa';
            const related = board.getRowColBoxCells(selectedRow, selectedCol);
            for (const { r, c } of related) {
                ctx.fillRect(c * cs, r * cs, cs, cs);
            }
            // Selected cell brighter
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--highlight-selected').trim() || '#bbdefb';
            ctx.fillRect(selectedCol * cs, selectedRow * cs, cs, cs);
        }

        // Same number highlight
        if (state.sameNumHighlight !== null && state.sameNumHighlight !== 0) {
            const cells = board.findSameNumbers(state.sameNumHighlight);
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--highlight-same-num').trim() || '#dcedc8';
            for (const { r, c } of cells) {
                ctx.fillRect(c * cs, r * cs, cs, cs);
            }
        }

        // Conflicts
        const conflicts = board.getConflicts();
        for (const key of conflicts) {
            const [r, c] = key.split(',').map(Number);
            ctx.fillStyle = 'rgba(255, 205, 210, 0.6)';
            ctx.fillRect(c * cs, r * cs, cs, cs);
        }
    }

    _drawGrid(ctx) {
        const cs = this.cellSize;
        const size = cs * 9;

        // Thin lines
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--grid-line').trim() || '#bdbdbd';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 9; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cs, 0);
            ctx.lineTo(i * cs, size);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cs);
            ctx.lineTo(size, i * cs);
            ctx.stroke();
        }

        // Thick lines for 3x3 boxes
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--grid-thick').trim() || '#616161';
        ctx.lineWidth = 2.5;
        for (let i = 0; i <= 9; i += 3) {
            ctx.beginPath();
            ctx.moveTo(i * cs, 0);
            ctx.lineTo(i * cs, size);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cs);
            ctx.lineTo(size, i * cs);
            ctx.stroke();
        }
    }

    _drawNumbers(ctx, board, state) {
        const cs = this.cellSize;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = board.getCell(r, c);
                if (val === 0) continue;

                const isGiven = board.isGiven(r, c);
                const isCorrect = board.isCorrect(r, c);
                const isConflict = !isCorrect;
                const isHint = state.hintCell && state.hintCell.r === r && state.hintCell.c === c;

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (isGiven) {
                    ctx.fillStyle = getComputedStyle(document.documentElement)
                        .getPropertyValue('--num-given').trim() || '#1a1a2e';
                    ctx.font = `bold ${cs * 0.5}px "Segoe UI", system-ui, sans-serif`;
                } else if (isHint) {
                    ctx.fillStyle = getComputedStyle(document.documentElement)
                        .getPropertyValue('--num-hint').trim() || '#1565c0';
                    ctx.font = `${cs * 0.48}px "Segoe UI", system-ui, sans-serif`;
                } else if (isConflict) {
                    ctx.fillStyle = getComputedStyle(document.documentElement)
                        .getPropertyValue('--num-error').trim() || '#d32f2f';
                    ctx.font = `${cs * 0.48}px "Segoe UI", system-ui, sans-serif`;
                } else {
                    ctx.fillStyle = getComputedStyle(document.documentElement)
                        .getPropertyValue('--num-user').trim() || '#1565c0';
                    ctx.font = `${cs * 0.48}px "Segoe UI", system-ui, sans-serif`;
                }

                ctx.fillText(val.toString(), c * cs + cs / 2, r * cs + cs / 2);
            }
        }
    }

    _drawNotes(ctx, board, state) {
        const cs = this.cellSize;
        const noteFontSize = cs * 0.18;

        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--num-note').trim() || '#757575';
        ctx.font = `${noteFontSize}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board.getCell(r, c) !== 0) continue;
                const notes = board.getNotes(r, c);
                if (notes.size === 0) continue;

                const third = cs / 3;
                for (const num of notes) {
                    const nr = Math.floor((num - 1) / 3);
                    const nc = (num - 1) % 3;
                    const x = c * cs + nc * third + third / 2;
                    const y = r * cs + nr * third + third / 2;
                    ctx.fillText(num.toString(), x, y);
                }
            }
        }
    }

    _drawSelection(ctx, state) {
        if (state.selectedRow === null || state.selectedCol === null) return;
        const cs = this.cellSize;
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--selection-border').trim() || '#1976d2';
        ctx.lineWidth = 2.5;
        const x = state.selectedCol * cs + 1;
        const y = state.selectedRow * cs + 1;
        ctx.strokeRect(x, y, cs - 2, cs - 2);
    }

    getCellFromPoint(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.boardSize / rect.width;
        const scaleY = this.boardSize / rect.height;
        const cx = (x - rect.left) * scaleX;
        const cy = (y - rect.top) * scaleY;
        const col = Math.floor(cx / this.cellSize);
        const row = Math.floor(cy / this.cellSize);
        if (row >= 0 && row < 9 && col >= 0 && col < 9) {
            return { row, col };
        }
        return null;
    }
}
