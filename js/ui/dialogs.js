export class Dialogs {
    constructor() {
        this.overlay = document.getElementById('dialog-overlay');
    }

    show(id) {
        document.querySelectorAll('.dialog').forEach(d => d.classList.remove('active'));
        const dialog = document.getElementById(id);
        if (dialog) dialog.classList.add('active');
        this.overlay.classList.add('active');
    }

    hide() {
        this.overlay.classList.remove('active');
        document.querySelectorAll('.dialog').forEach(d => d.classList.remove('active'));
    }

    showVictory(timeStr, difficulty, isNewBest) {
        document.getElementById('victory-time').textContent = timeStr;
        document.getElementById('victory-difficulty').textContent = difficulty;
        document.getElementById('victory-best').style.display = isNewBest ? 'block' : 'none';
        this.show('dialog-victory');
    }

    showPause() {
        this.show('dialog-pause');
    }

    showSettings() {
        this.show('dialog-settings');
    }

    showConfirm(title, message, onConfirm) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        const btn = document.getElementById('confirm-ok');
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            this.hide();
            onConfirm();
        });
        this.show('dialog-confirm');
    }
}
