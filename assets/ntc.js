const WIN = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

let state;

function init() {
    const mode = document.querySelector('.mode-toggle .active')?.dataset.mode || 'pvp';
    state = {
        cells: Array(9).fill(null).map(() => Array(9).fill(null)),
        winners: Array(9).fill(null),
        player: 'X',
        active: null,
        over: false,
        result: null,
        moves: 0,
        mode: mode,
        thinking: false
    };
    render();
}

function checkWin(arr) {
    for (const p of WIN) {
        const [a, b, c] = p;
        if (arr[a] && arr[a] === arr[b] && arr[a] === arr[c]) return arr[a];
    }
    return null;
}

function isFull(arr) {
    return arr.every(c => c !== null);
}

function play(bi, ci) {
    if (state.over || state.thinking) return;
    if (state.winners[bi]) return;
    if (state.cells[bi][ci] !== null) return;
    if (state.active !== null && state.active !== bi) return;

    state.cells[bi][ci] = state.player;
    state.moves++;

    const miniWin = checkWin(state.cells[bi]);
    if (miniWin) {
        state.winners[bi] = miniWin;
    } else if (isFull(state.cells[bi])) {
        state.winners[bi] = 'draw';
    }

    if (state.winners[bi] === 'X' || state.winners[bi] === 'O') {
        const macroWin = checkWin(state.winners);
        if (macroWin) {
            state.over = true;
            state.result = macroWin;
            render();
            return;
        }
    }

    if (state.moves >= 81 || state.winners.every(w => w !== null)) {
        state.over = true;
        state.result = 'draw';
        render();
        return;
    }

    const next = ci;
    if (state.winners[next]) {
        state.active = null;
    } else {
        state.active = next;
    }

    state.player = state.player === 'X' ? 'O' : 'X';
    render();
    triggerAI();
}

function triggerAI() {
    if (state.over || state.player !== 'O' || state.mode !== 'pvai') return;
    state.thinking = true;
    setTimeout(() => { aiMove(); state.thinking = false; }, 300);
}

function aiMove() {
    if (state.over || state.player !== 'O') return;
    state.thinking = false;
    const bi = state.active !== null ? state.active : bestBoard();
    const ci = bestCell(bi);
    if (ci !== -1) play(bi, ci);
}

function bestBoard() {
    let bestScore = -Infinity, picks = [];
    for (let b = 0; b < 9; b++) {
        if (state.winners[b]) continue;
        const s = scoreBoard(b);
        if (s > bestScore) { bestScore = s; picks = [b]; }
        else if (s === bestScore) picks.push(b);
    }
    return picks.length ? picks[Math.floor(Math.random() * picks.length)] : 4;
}

function scoreBoard(b) {
    const saved = state.winners[b];
    let score = 50;

    state.winners[b] = 'O';
    if (checkWin(state.winners) === 'O') { state.winners[b] = saved; return 10000; }
    const oForks = countThreats('O');
    state.winners[b] = saved;

    state.winners[b] = 'X';
    const blocksWin = checkWin(state.winners) === 'X' ? 5000 : 0;
    const xForks = countThreats('X');
    state.winners[b] = saved;

    score += blocksWin;
    score += oForks * 300;
    if (xForks > 1) score -= 200;

    if (b === 4) score += 10;
    else if (b % 2 === 0) score += 5;

    score += boardStrength(b, 'O') * 2;
    score -= boardStrength(b, 'X');

    return score;
}

function countThreats(player) {
    let count = 0;
    for (const p of WIN) {
        let pCount = 0, eCount = 0;
        for (const idx of p) {
            if (state.winners[idx] === player) pCount++;
            else if (state.winners[idx] === null) eCount++;
        }
        if (pCount === 2 && eCount === 1) count++;
    }
    return count;
}

function boardStrength(b, player) {
    const board = state.cells[b];
    let score = 0;
    for (const p of WIN) {
        let pCount = 0, blocked = false;
        for (const idx of p) {
            if (board[idx] === player) pCount++;
            else if (board[idx] !== null) blocked = true;
        }
        if (!blocked) {
            if (pCount === 2) score += 10;
            else if (pCount === 1) score += 2;
        }
    }
    return score;
}

function bestCell(boardIndex) {
    const board = state.cells[boardIndex];
    let bestScore = -Infinity, bestIdx = -1;
    for (let i = 0; i < 9; i++) {
        if (board[i] !== null) continue;
        board[i] = 'O';
        const s = miniMax(board, 'X', -Infinity, Infinity);
        board[i] = null;
        const bonus = sendPenalty(i);
        const total = s * 100 + bonus;
        if (total > bestScore) { bestScore = total; bestIdx = i; }
    }
    return bestIdx !== -1 ? bestIdx : board.indexOf(null);
}

function sendPenalty(cellIndex) {
    const target = cellIndex;
    if (state.winners[target]) return -50;
    let p = 0;
    p -= boardStrength(target, 'X') * 3;
    p += boardStrength(target, 'O') * 2;
    if (target === 4) p -= 5;
    return p;
}

function miniMax(board, player, alpha, beta) {
    const w = checkWin(board);
    if (w === 'O') return 10;
    if (w === 'X') return -10;
    if (board.every(c => c !== null)) return 0;

    if (player === 'O') {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] !== null) continue;
            board[i] = 'O';
            const s = miniMax(board, 'X', alpha, beta);
            board[i] = null;
            best = Math.max(best, s);
            alpha = Math.max(alpha, s);
            if (beta <= alpha) break;
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] !== null) continue;
            board[i] = 'X';
            const s = miniMax(board, 'O', alpha, beta);
            board[i] = null;
            best = Math.min(best, s);
            beta = Math.min(beta, s);
            if (beta <= alpha) break;
        }
        return best;
    }
}

function render() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    board.className = 'board' + (state.over ? ' disabled' : '');

    for (let bi = 0; bi < 9; bi++) {
        const mini = document.createElement('div');
        mini.className = 'mini';
        if (state.active === bi && !state.over) mini.classList.add('active');
        if (state.winners[bi] === 'X') { mini.classList.add('won-x');
            mini.dataset.mark = 'X'; }
        if (state.winners[bi] === 'O') { mini.classList.add('won-o');
            mini.dataset.mark = 'O'; }
        if (state.winners[bi] === 'draw') mini.classList.add('draw');

        for (let ci = 0; ci < 9; ci++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const val = state.cells[bi][ci];
            if (val) {
                cell.classList.add('set', val.toLowerCase());
                cell.dataset.mark = val;
            }
            cell.addEventListener('click', () => play(bi, ci));
            mini.appendChild(cell);
        }
        board.appendChild(mini);
    }

    const el = document.getElementById('status');
    if (state.over) {
        if (state.result === 'draw') {
            el.innerHTML = `<span class="accent">Draw</span><span class="mute">the board is full</span>`;
        } else {
            el.innerHTML =
                `<span class="accent">${state.result}</span> wins<span class="mute">three in a row on the macro board</span>`;
        }
        document.getElementById('winText').textContent = state.result === 'draw' ? 'It\'s a draw' :
            `${state.result} takes it`;
        document.getElementById('winOverlay').classList.add('show');
    } else {
        document.getElementById('winOverlay').classList.remove('show');
        const hint = state.active === null ?
            'choose any free board' :
            `play in board ${state.active + 1}`;
        el.innerHTML =
            `<span class="accent">${state.player}</span>'s turn<span class="mute">${hint}</span>`;
    }
}

document.querySelectorAll('.mode-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        init();
    });
});

document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('winOverlay').classList.remove('show');
    init();
});

document.getElementById('againBtn').addEventListener('click', () => {
    document.getElementById('winOverlay').classList.remove('show');
    init();
});

init();
