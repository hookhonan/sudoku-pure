export class InputHandler {
    constructor(game) {
        this.game = game;
        this._setupStartScreen();
        this._setupCanvasInput();
        this._setupNumPad();
        this._setupToolbar();
        this._setupKeyboard();
    }

    _setupStartScreen() {
        // Difficulty buttons on start screen
        document.querySelectorAll('.start-diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.difficulty;
                this.game.startGame(diff);
            });
        });

        // Continue button
        document.getElementById('btn-continue')?.addEventListener('click', () => {
            this.game.continueGame();
        });
    }

    _setupCanvasInput() {
        const canvas = this.game.renderer.canvas;

        canvas.addEventListener('click', (e) => {
            const cell = this.game.renderer.getCellFromPoint(e.clientX, e.clientY);
            if (cell) {
                this.game.selectCell(cell.row, cell.col);
            }
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const cell = this.game.renderer.getCellFromPoint(touch.clientX, touch.clientY);
            if (cell) {
                this.game.selectCell(cell.row, cell.col);
            }
        });
    }

    _setupNumPad() {
        for (let i = 1; i <= 9; i++) {
            const btn = document.getElementById(`num-${i}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.game.inputNumber(i);
                });
            }
        }
    }

    _setupToolbar() {
        document.getElementById('btn-undo')?.addEventListener('click', () => this.game.undo());
        document.getElementById('btn-note')?.addEventListener('click', () => this.game.toggleNoteMode());
        document.getElementById('btn-erase')?.addEventListener('click', () => this.game.erase());
        document.getElementById('btn-hint')?.addEventListener('click', () => this.game.useHint());
        document.getElementById('btn-pause')?.addEventListener('click', () => this.game.pause());
        document.getElementById('btn-mute')?.addEventListener('click', () => this.game.toggleMute());

        document.getElementById('btn-new-game')?.addEventListener('click', () => {
            document.getElementById('dialog-difficulty').classList.add('active');
            document.getElementById('dialog-overlay').classList.add('active');
        });

        // Unified overlay click
        document.getElementById('dialog-overlay')?.addEventListener('click', (e) => {
            if (e.target !== e.currentTarget) return;
            const diffActive = document.getElementById('dialog-difficulty').classList.contains('active');
            const pauseActive = document.getElementById('dialog-pause').classList.contains('active');
            if (diffActive) {
                document.getElementById('dialog-difficulty').classList.remove('active');
                document.getElementById('dialog-overlay').classList.remove('active');
            } else if (pauseActive) {
                this.game.resume();
            } else {
                this.game.dialogs.hide();
            }
        });

        // Difficulty selection (in dialogs)
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.difficulty;
                this.game.dialogs.hide();
                this.game.startGame(diff);
            });
        });

        // Pause actions
        document.getElementById('btn-resume')?.addEventListener('click', () => this.game.resume());
        document.getElementById('btn-restart')?.addEventListener('click', () => {
            this.game.dialogs.hide();
            this.game.dialogs.showConfirm(
                '重新开始', '确定要重新开始当前难度吗？', () => {
                this.game.startGame(this.game.difficulty);
            });
        });
        document.getElementById('btn-new-from-pause')?.addEventListener('click', () => {
            this.game.dialogs.hide();
            document.getElementById('dialog-difficulty').classList.add('active');
            document.getElementById('dialog-overlay').classList.add('active');
        });

        // Settings
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            document.getElementById('setting-mute').checked = this.game.sound.isMuted();
            document.getElementById('setting-theme').value = document.documentElement.dataset.theme || 'light';
            this.game.dialogs.showSettings();
        });
        document.getElementById('btn-close-settings')?.addEventListener('click', () => this.game.dialogs.hide());
        document.getElementById('setting-mute')?.addEventListener('change', (e) => {
            if (e.target.checked !== this.game.sound.isMuted()) {
                this.game.toggleMute();
            }
        });
        document.getElementById('setting-theme')?.addEventListener('change', (e) => {
            document.documentElement.dataset.theme = e.target.value;
            try {
                localStorage.setItem('sudoku_theme', e.target.value);
            } catch (e) {}
        });

        // Confirm dialog
        document.getElementById('confirm-cancel')?.addEventListener('click', () => this.game.dialogs.hide());

        // Victory actions
        document.getElementById('btn-victory-new')?.addEventListener('click', () => {
            this.game.dialogs.hide();
            document.getElementById('dialog-difficulty').classList.add('active');
            document.getElementById('dialog-overlay').classList.add('active');
        });
        document.getElementById('btn-victory-replay')?.addEventListener('click', () => {
            this.game.dialogs.hide();
            this.game.startGame(this.game.difficulty);
        });
    }

    _setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (document.querySelector('.dialog.active')) return;
            if (!this.game.gameStarted) return;

            const key = e.key;
            if (key >= '1' && key <= '9') {
                e.preventDefault();
                if (e.ctrlKey || e.metaKey) {
                    this.game.toggleNoteAtSelected(parseInt(key));
                } else {
                    this.game.inputNumber(parseInt(key));
                }
            } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
                e.preventDefault();
                this.game.erase();
            } else if (key === 'n' || key === 'N') {
                e.preventDefault();
                this.game.toggleNoteMode();
            } else if ((key === 'z' || key === 'Z') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (e.shiftKey) {
                    this.game.redo();
                } else {
                    this.game.undo();
                }
            } else if ((key === 'y' || key === 'Y') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.game.redo();
            } else if (key.startsWith('Arrow')) {
                e.preventDefault();
                this.game.moveSelection(key);
            }
        });
    }
}
