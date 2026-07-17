export class Animations {
    static celebrate(canvas) {
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#845ef7', '#ff66c4'];
        const particles = [];
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: cx,
                y: cy,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 2,
                life: 1,
                decay: Math.random() * 0.02 + 0.01,
            });
        }

        // We use a temporary overlay canvas for confetti
        const overlay = document.createElement('canvas');
        overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;';
        overlay.width = rect.width;
        overlay.height = rect.height;
        canvas.parentElement.appendChild(overlay);
        const ctx = overlay.getContext('2d');

        let frame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            let alive = false;

            for (const p of particles) {
                if (p.life <= 0) continue;
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15; // gravity
                p.life -= p.decay;
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }

            if (alive && frame < 120) {
                frame++;
                requestAnimationFrame(animate);
            } else {
                overlay.remove();
            }
        };
        requestAnimationFrame(animate);
    }

    static flashCell(renderer, row, col, color = 'rgba(76,175,80,0.4)', duration = 300) {
        const ctx = renderer.ctx;
        const cs = renderer.cellSize;
        const start = performance.now();

        const anim = (now) => {
            const elapsed = now - start;
            const alpha = 1 - elapsed / duration;
            if (alpha <= 0) return;

            ctx.fillStyle = color.replace(/[\d.]+\)$/, alpha + ')');
            ctx.fillRect(col * cs, row * cs, cs, cs);
            requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
    }
}
