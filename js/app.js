import { Generator } from './core/generator.js';
import { Board } from './game/board.js';
import { History, ActionType } from './game/history.js';
import { Timer } from './game/timer.js';
import { Hints } from './game/hints.js';
import { Renderer } from './ui/renderer.js';
import { SoundManager } from './ui/sound.js';
import { Animations } from './ui/animations.js';
import { Dialogs } from './ui/dialogs.js';
import { InputHandler } from './ui/input.js';
import { Storage } from './data/storage.js';
import { Stats } from './data/stats.js';
import { t, setLang } from './data/i18n.js';

export class SudokuGame {
    constructor() {
        this.board = new Board();
        this.history = new History();
        this.timer = new Timer();
        this.hints = new Hints();
        this.sound = new SoundManager();
        this.stats = new Stats();

        this.renderer = new Renderer(document.getElementById('board-canvas'));
        this.dialogs = new Dialogs();
        this.input = new InputHandler(this);

        this.difficulty = 'medium';
        this.noteMode = false;
        this.selectedRow = null;
        this.selectedCol = null;
        this.gameStarted = false;
        this.paused = false;
        this.completed = false;
        this.hintCell = null;
        this.sameNumHighlight = null;

        this._init();
    }

    async _init() {
        this.stats.load();
        this.hints.load();
        this._loadTheme();
        this._initLang();

        this.sound.loadAll();

        this.timer.onChange((timeStr) => {
            document.getElementById('timer-display').textContent = timeStr;
        });

        // Resize canvas first before anything renders
        this._resize();
        window.addEventListener('resize', () => {
            this._resize();
        });

        // Try to restore saved game
        const saved = Storage.loadGame();
        if (saved && saved.gameStarted) {
            document.getElementById('btn-continue').style.display = 'block';
        }

        // Always show start screen first
        this._showStartScreen();
    }

    _showStartScreen() {
        document.getElementById('toolbar-top').style.display = 'none';
        document.getElementById('toolbar-actions').style.display = 'none';
        document.getElementById('numpad').style.display = 'none';
        document.getElementById('board-container').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
    }

    _hideStartScreen() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('board-container').style.display = 'flex';
        document.getElementById('toolbar-top').style.display = 'flex';
        document.getElementById('toolbar-actions').style.display = 'flex';
        document.getElementById('numpad').style.display = 'grid';
    }

    _initLang() {
        const lang = navigator.language.startsWith('zh') ? 'zh' : 'en';
        setLang(lang);
        try {
            const saved = localStorage.getItem('sudoku_lang');
            if (saved) setLang(saved);
        } catch (e) {}
    }

    _loadTheme() {
        try {
            const theme = localStorage.getItem('sudoku_theme') || 'light';
            document.documentElement.dataset.theme = theme;
        } catch (e) {}
    }

    continueGame() {
        const saved = Storage.loadGame();
        if (!saved || !saved.gameStarted) return;

        this._restoreGame(saved);
        this.gameStarted = true;
        this._hideStartScreen();
        this._updateDifficultyLabel();
        this._updateToolbarState();
        this._resize();
        this._render();
    }

    startGame(difficulty) {
        this.difficulty = difficulty;
        const { puzzle, solution } = Generator.generate(difficulty);

        this.board.reset();
        this.board.load(puzzle, solution);
        this.history.reset();
        this.timer.reset();
        this.timer.start();
        this.gameStarted = true;
        this.noteMode = false;
        this.paused = false;
        this.completed = false;
        this.hintCell = null;
        this.sameNumHighlight = null;
        this.selectCell(-1, -1);

        this._hideStartScreen();
        this._updateDifficultyLabel();
        this._updateToolbarState();
        this._resize();
        this._render();
        this._save();

        this.sound.play('chouka');
    }

    _restoreGame(saved) {
        this.difficulty = saved.difficulty;
        this.board.reset();
        this.board.load(saved.puzzle, saved.solution);

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                this.board.grid[r][c] = saved.grid[r][c];
                if (saved.notes[r][c]) {
                    this.board.notes[r][c] = new Set(saved.notes[r][c]);
                }
            }
        }

        this.timer.elapsed = saved.elapsed || 0;
        this.timer.start();
        this.noteMode = saved.noteMode || false;
        this.selectedRow = saved.selectedRow;
        this.selectedCol = saved.selectedCol;

        if (saved.historyStack) {
            this.history.stack = saved.historyStack;
            this.history.pointer = saved.historyPointer;
        }

        this._updateDifficultyLabel();
        this._updateToolbarState();
        this._resize();
    }

    selectCell(row, col) {
        if (this.paused || this.completed) return;

        this.hintCell = null;

        if (row === -1 || col === -1) {
            this.selectedRow = null;
            this.selectedCol = null;
            this.sameNumHighlight = null;
            this._render();
            return;
        }

        this.selectedRow = row;
        this.selectedCol = col;

        const val = this.board.getCell(row, col);
        this.sameNumHighlight = (val !== 0) ? val : null;

        this._render();
    }

    inputNumber(num) {
        if (this.paused || this.completed) return;
        if (this.selectedRow === null || this.selectedCol === null) return;

        const r = this.selectedRow;
        const c = this.selectedCol;

        if (this.noteMode) {
            this._toggleNote(r, c, num);
            return;
        }

        if (this.board.isGiven(r, c)) return;

        const oldVal = this.board.getCell(r, c);
        const oldNotes = new Set(this.board.getNotes(r, c));

        if (oldVal === num) return;

        this.board.setCell(r, c, num);
        this.sameNumHighlight = (num !== 0) ? num : null;

        this.history.push({
            type: oldVal === 0 && oldNotes.size === 0 ? ActionType.FILL :
                  num === 0 ? ActionType.ERASE : ActionType.FILL,
            row: r, col: c,
            oldValue: oldVal, newValue: num,
            oldNotes: [...oldNotes], newNotes: [],
        });

        this.sound.play('num_click');
        this.sound.vibrate(8);

        if (num !== 0 && !this.board.isCorrect(r, c)) {
            this.sound.play('num_error');
            this.sound.vibrate(30);
        } else if (num !== 0) {
            this.sound.play('num_right');
        }

        this._render();
        this._checkCompletion();
        this._save();
    }

    _toggleNote(r, c, num) {
        if (this.board.isGiven(r, c) || this.board.getCell(r, c) !== 0) return;

        const oldNotes = new Set(this.board.getNotes(r, c));
        this.board.toggleNote(r, c, num);
        const newNotes = new Set(this.board.getNotes(r, c));

        this.history.push({
            type: ActionType.NOTE_TOGGLE,
            row: r, col: c,
            oldValue: 0, newValue: 0,
            oldNotes: [...oldNotes], newNotes: [...newNotes],
        });

        this.sound.play('prop_note');
        this._render();
        this._save();
    }

    toggleNoteAtSelected(num) {
        if (this.selectedRow === null || this.selectedCol === null) return;
        this._toggleNote(this.selectedRow, this.selectedCol, num);
    }

    toggleNoteMode() {
        this.noteMode = !this.noteMode;
        this.sound.play('btn_click');
        this._updateToolbarState();
    }

    erase() {
        if (this.paused || this.completed) return;
        if (this.selectedRow === null || this.selectedCol === null) return;

        const r = this.selectedRow;
        const c = this.selectedCol;

        if (this.board.isGiven(r, c)) return;

        const oldVal = this.board.getCell(r, c);
        const oldNotes = new Set(this.board.getNotes(r, c));

        if (oldVal === 0 && oldNotes.size === 0) return;

        this.board.clearCell(r, c);
        this.sameNumHighlight = null;

        this.history.push({
            type: ActionType.ERASE,
            row: r, col: c,
            oldValue: oldVal, newValue: 0,
            oldNotes: [...oldNotes], newNotes: [],
        });

        this.sound.play('eraserecall');
        this._render();
        this._save();
    }

    undo() {
        if (this.paused || this.completed) return;

        const action = this.history.undo();
        if (!action) return;

        this._applyAction(action);
        this.sound.play('eraserecall');
        this._render();
        this._save();
    }

    redo() {
        if (this.paused || this.completed) return;

        const action = this.history.redo();
        if (!action) return;

        this._applyAction(action);
        this.sound.play('btn_click');
        this._render();
        this._save();
    }

    _applyAction(action) {
        const { row, col, direction } = action;
        if (direction === 'undo') {
            this.board.grid[row][col] = action.oldValue;
            this.board.notes[row][col] = new Set(action.oldNotes);
            this.selectCell(row, col);
        } else {
            this.board.grid[row][col] = action.newValue;
            this.board.notes[row][col] = new Set(action.newNotes);
            this.selectCell(row, col);
        }
    }

    useHint() {
        if (this.paused || this.completed) return;

        if (!this.hints.canUse()) {
            this.sound.play('num_error');
            this._shakeElement(document.getElementById('btn-hint'));
            return;
        }

        let r, c;
        if (this.selectedRow !== null && this.selectedCol !== null &&
            !this.board.isGiven(this.selectedRow, this.selectedCol) &&
            (this.board.isEmpty(this.selectedRow, this.selectedCol) ||
             !this.board.isCorrect(this.selectedRow, this.selectedCol))) {
            r = this.selectedRow;
            c = this.selectedCol;
        } else {
            const emptyCells = [];
            for (let rr = 0; rr < 9; rr++) {
                for (let cc = 0; cc < 9; cc++) {
                    if (!this.board.isGiven(rr, cc) &&
                        (this.board.isEmpty(rr, cc) || !this.board.isCorrect(rr, cc))) {
                        emptyCells.push({ r: rr, c: cc });
                    }
                }
            }
            if (emptyCells.length === 0) return;
            const pick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            r = pick.r;
            c = pick.c;
        }

        this.hints.use();

        const oldVal = this.board.getCell(r, c);
        const oldNotes = new Set(this.board.getNotes(r, c));
        const answer = this.board.getHint(r, c);

        this.board.setCell(r, c, answer);
        this.board.notes[r][c].clear();

        this.history.push({
            type: ActionType.HINT,
            row: r, col: c,
            oldValue: oldVal, newValue: answer,
            oldNotes: [...oldNotes], newNotes: [],
        });

        this.hintCell = { r, c };
        this.selectCell(r, c);
        this.sound.play('prop_notice');

        this._updateHintButton();
        this._render();
        this._checkCompletion();
        this._save();

        setTimeout(() => {
            this.hintCell = null;
            this._render();
        }, 1500);
    }

    moveSelection(dir) {
        if (this.paused || this.completed) return;
        let { selectedRow: r, selectedCol: c } = this;
        if (r === null) { r = 0; c = 0; }
        switch (dir) {
            case 'ArrowUp': r = Math.max(0, r - 1); break;
            case 'ArrowDown': r = Math.min(8, r + 1); break;
            case 'ArrowLeft': c = Math.max(0, c - 1); break;
            case 'ArrowRight': c = Math.min(8, c + 1); break;
        }
        this.selectCell(r, c);
    }

    pause() {
        if (this.completed || !this.gameStarted) return;
        this.paused = true;
        this.timer.pause();
        this.dialogs.showPause();
        this.sound.play('btn_click');
    }

    resume() {
        this.paused = false;
        this.timer.start();
        this.dialogs.hide();
    }

    toggleMute() {
        const muted = this.sound.toggle();
        document.getElementById('btn-mute').textContent = muted ? '🔇' : '🔊';
        const checkbox = document.getElementById('setting-mute');
        if (checkbox) checkbox.checked = muted;
    }

    _checkCompletion() {
        if (this.board.isComplete()) {
            this.completed = true;
            this.timer.pause();
            const timeSec = this.timer.getTime();
            const timeStr = this.timer.getFormatted();

            const diffLabel = Generator.DIFFICULTY[this.difficulty].label;
            const isNewBest = this.stats.isNewBest(this.difficulty, timeSec);

            this.stats.recordGame(this.difficulty, true, timeSec);

            setTimeout(() => {
                this.sound.play('over_success');
                this.dialogs.showVictory(timeStr, diffLabel, isNewBest);
                Animations.celebrate(this.renderer.canvas);
            }, 600);

            this._render();
            Storage.clearGame();
        }
    }

    _updateDifficultyLabel() {
        const label = Generator.DIFFICULTY[this.difficulty].label;
        document.getElementById('difficulty-label').textContent = label;
    }

    _updateToolbarState() {
        const noteBtn = document.getElementById('btn-note');
        if (this.noteMode) {
            noteBtn.classList.add('active');
        } else {
            noteBtn.classList.remove('active');
        }
        this._updateHintButton();

        const undoBtn = document.getElementById('btn-undo');
        if (this.history.canUndo()) {
            undoBtn.classList.remove('disabled');
        } else {
            undoBtn.classList.add('disabled');
        }
    }

    _updateHintButton() {
        const hintBtn = document.getElementById('btn-hint');
        const remaining = this.hints.getRemaining();
        const hintLabel = document.getElementById('hint-count');
        if (hintLabel) hintLabel.textContent = remaining;
        if (remaining <= 0) {
            hintBtn.classList.add('disabled');
        } else {
            hintBtn.classList.remove('disabled');
        }
    }

    _shakeElement(el) {
        if (!el) return;
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.4s ease';
    }

    _save() {
        if (this.completed || !this.gameStarted) return;
        Storage.saveGame({
            difficulty: this.difficulty,
            puzzle: this.board.initialPuzzle.map(row => [...row]),
            solution: this.board.solution.map(row => [...row]),
            grid: this.board.grid.map(row => [...row]),
            given: this.board.given.map(row => [...row]),
            notes: this.board.notes.map(row =>
                row.map(notes => [...notes])
            ),
            elapsed: this.timer.getTime(),
            noteMode: this.noteMode,
            selectedRow: this.selectedRow,
            selectedCol: this.selectedCol,
            historyStack: this.history.stack,
            historyPointer: this.history.pointer,
            gameStarted: true,
        });
    }

    _resize() {
        const container = document.getElementById('board-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const availHeight = window.innerHeight;
        // Estimate non-board space: toolbar (~48px) + actions (~52px) + numpad (~58px) + padding
        const nonBoardHeight = 180;
        const availBoardHeight = Math.max(availHeight - nonBoardHeight, 200);
        const size = Math.min(rect.width - 16, availBoardHeight);
        this.renderer.resize(size, size);
        if (this.gameStarted) {
            this._render();
        }
    }

    _render() {
        if (!this.gameStarted) return;
        const state = {
            selectedRow: this.selectedRow,
            selectedCol: this.selectedCol,
            sameNumHighlight: this.sameNumHighlight,
            hintCell: this.hintCell,
        };
        this.renderer.draw(this.board, state);
        this._updateToolbarState();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new SudokuGame();
});
