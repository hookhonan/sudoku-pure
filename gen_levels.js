// Offline level pack generator: 99 levels x 6 difficulties.
// Extracts Validator/Solver/SeededRNG/Generator from index.html so the
// built-in puzzles use the exact same engine as the game.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function section(startMarker, endMarker) {
    const a = html.indexOf(startMarker);
    const b = html.indexOf(endMarker);
    if (a < 0 || b < 0 || b <= a) throw new Error('section not found: ' + startMarker);
    return html.slice(a, b);
}

const src = [
    section('// === js/core/validator.js ===', '// === js/core/solver.js ==='),
    section('// === js/core/solver.js ===', '// === seeded RNG ==='),
    section('// === seeded RNG ===', '// === js/core/generator.js ==='),
    section('// === js/core/generator.js ===', 'const LEVEL_PUZZLES = {'),
].join('\n');

const { Generator, SeededRNG, Solver, Validator } = eval(src + '\n({ Generator, SeededRNG, Solver, Validator });');

// --- singles-only solver (naked + hidden singles) for difficulty grading ---
function singlesSolve(grid) {
    const g = grid.map(r => [...r]);
    const cand = (r, c) => Validator.getCandidates(g, r, c);
    let progress = true;
    while (progress) {
        progress = false;
        // naked singles
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
            if (g[r][c] === 0) {
                const cs = cand(r, c);
                if (cs.length === 0) return false;      // contradiction
                if (cs.length === 1) { g[r][c] = cs[0]; progress = true; }
            }
        }
        // hidden singles per unit
        for (let n = 1; n <= 9; n++) {
            for (let unit = 0; unit < 27; unit++) {
                const cells = unitCells(unit);
                let spots = [];
                let placed = false;
                for (const [r, c] of cells) {
                    if (g[r][c] === n) { placed = true; break; }
                    if (g[r][c] === 0 && cand(r, c).includes(n)) spots.push([r, c]);
                }
                if (placed) continue;
                if (spots.length === 0) return false;   // contradiction
                if (spots.length === 1) { g[spots[0][0]][spots[0][1]] = n; progress = true; }
            }
        }
    }
    return g.every(row => row.every(v => v !== 0));
}

function unitCells(u) {
    const cells = [];
    if (u < 9) { for (let c = 0; c < 9; c++) cells.push([u, c]); }
    else if (u < 18) { const cc = u - 9; for (let r = 0; r < 9; r++) cells.push([r, cc]); }
    else {
        const b = u - 18, br = Math.floor(b / 3) * 3, bc = (b % 3) * 3;
        for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) cells.push([r, c]);
    }
    return cells;
}

// --- quality rules per difficulty ---
// needSingles: puzzle must be solvable by singles alone (player-friendly)
// forbidSingles: puzzle must NOT be solvable by singles alone (needs advanced techniques)
const RULES = {
    easy:    { needSingles: true },
    medium:  { needSingles: true },
    hard:    {},
    expert:  { forbidSingles: true },
    master:  { forbidSingles: true },
    extreme: { forbidSingles: true },
};

const ORDER = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];
const LEVELS = 99;
const MAX_TRIES = 400;

function gridToStr(g) { return g.map(r => r.join('')).join(''); }

function genOne(diff, level) {
    const rule = RULES[diff];
    const cfg = Generator.DIFFICULTY[diff];
    const progress = Math.min((level - 1) / 98, 1);
    const targetGiven = Math.round(cfg.givenMax - progress * (cfg.givenMax - cfg.givenMin));
    for (let t = 0; t < MAX_TRIES; t++) {
        const rng = new SeededRNG(`levelpack_${diff}_${level}_${t}`);
        const solution = Generator._generateSeededSolution(rng);
        const puzzle = Generator._createSeededPuzzle(solution, 81 - targetGiven, rng);
        if (rule.needSingles && !singlesSolve(puzzle)) continue;
        if (rule.forbidSingles && singlesSolve(puzzle)) continue;
        return [gridToStr(puzzle), gridToStr(solution)];
    }
    throw new Error(`failed: ${diff} L${level}`);
}

const pack = {};
const t0 = Date.now();
for (const diff of ORDER) {
    pack[diff] = [];
    const td = Date.now();
    for (let l = 1; l <= LEVELS; l++) {
        pack[diff].push(genOne(diff, l));
        if (l % 10 === 0) console.log(`${diff} ${l}/${LEVELS} (${((Date.now() - td) / 1000).toFixed(1)}s)`);
    }
}
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// sanity: verify every puzzle has unique solution matching stored solution
for (const diff of ORDER) {
    for (const [p, s] of pack[diff]) {
        const grid = p.split('').map(ch => parseInt(ch, 10));
        const g9 = [];
        for (let r = 0; r < 9; r++) g9.push(grid.slice(r * 9, r * 9 + 9));
        if (!Solver.hasUniqueSolution(g9)) throw new Error('not unique: ' + diff);
        const solved = Solver.solve(g9.map(r => [...r]));
        if (gridToStr(solved) !== s) throw new Error('solution mismatch: ' + diff);
    }
}
console.log('all puzzles verified unique + solution matches');

let out = 'const LEVEL_PACK = {\n';
for (const diff of ORDER) {
    out += `    ${diff}: [\n`;
    for (const [p, s] of pack[diff]) out += `        ['${p}','${s}'],\n`;
    out += '    ],\n';
}
out += '};\n';
fs.writeFileSync(path.join(__dirname, 'level_pack.js'), out, 'utf8');
console.log('level_pack.js written:', (out.length / 1024).toFixed(1) + 'KB');
