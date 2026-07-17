const CACHE = 'sudoku-pure-v1';
const ASSETS = [
    './',
    'index.html',
    'css/reset.css',
    'css/themes.css',
    'css/board.css',
    'js/app.js',
    'js/core/generator.js',
    'js/core/solver.js',
    'js/core/validator.js',
    'js/game/board.js',
    'js/game/history.js',
    'js/game/timer.js',
    'js/game/hints.js',
    'js/ui/renderer.js',
    'js/ui/input.js',
    'js/ui/animations.js',
    'js/ui/dialogs.js',
    'js/ui/sound.js',
    'js/data/storage.js',
    'js/data/stats.js',
    'js/data/i18n.js',
    'assets/sounds/btn_click.mp3',
    'assets/sounds/num_click.mp3',
    'assets/sounds/num_right.mp3',
    'assets/sounds/num_error.mp3',
    'assets/sounds/eraserecall.mp3',
    'assets/sounds/prop_note.mp3',
    'assets/sounds/prop_notice.mp3',
    'assets/sounds/grid_right.mp3',
    'assets/sounds/over_success.mp3',
    'assets/sounds/over_fail.mp3',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
