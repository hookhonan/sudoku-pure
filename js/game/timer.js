export class Timer {
    constructor() {
        this.elapsed = 0;
        this.interval = null;
        this.running = false;
        this.listeners = [];
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.interval = setInterval(() => {
            this.elapsed++;
            this._notify();
        }, 1000);
    }

    pause() {
        if (!this.running) return;
        this.running = false;
        clearInterval(this.interval);
        this.interval = null;
    }

    reset() {
        this.pause();
        this.elapsed = 0;
        this._notify();
    }

    getTime() {
        return this.elapsed;
    }

    getFormatted() {
        const m = Math.floor(this.elapsed / 60);
        const s = this.elapsed % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    isRunning() {
        return this.running;
    }

    onChange(fn) {
        this.listeners.push(fn);
    }

    _notify() {
        for (const fn of this.listeners) {
            fn(this.getFormatted(), this.elapsed);
        }
    }
}
