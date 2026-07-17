export class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.loaded = false;
    }

    async loadAll() {
        const names = [
            'btn_click', 'num_click', 'num_right', 'num_error',
            'eraserecall', 'prop_note', 'prop_notice',
            'grid_right', 'over_success', 'over_fail',
            'chouka', 'chufa', 'hangxing'
        ];

        const promises = names.map(name => {
            return new Promise((resolve) => {
                const audio = new Audio(`assets/sounds/${name}.mp3`);
                audio.preload = 'auto';
                audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                audio.addEventListener('error', () => resolve(), { once: true });
                audio.load();
                this.sounds[name] = audio;
            });
        });

        await Promise.all(promises);
        this.loaded = true;
    }

    play(name) {
        if (!this.muted && this.sounds[name]) {
            const audio = this.sounds[name];
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    }

    vibrate(duration = 10) {
        if (!this.muted && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    toggle() {
        this.muted = !this.muted;
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }
}
