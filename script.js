// --- TAILWIND CONFIGURATION ---
tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    500: '#6366f1', // Indigo
                    600: '#4f46e5',
                    900: '#312e81',
                }
            },
            boxShadow: {
                'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
                'inner-light': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
            }
        }
    }
};

// --- SUDOKU LOGIC ---
const GRID_SIZE = 9;
const BLANK = 0;

const isValidMove = (board, row, col, num) => {
    for (let i = 0; i < GRID_SIZE; i++) {
        if (board[row][i] === num && i !== col) return false;
        if (board[i][col] === num && i !== row) return false;
    }
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num && (i + startRow !== row || j + startCol !== col)) return false;
        }
    }
    return true;
};

const solveSudoku = (board, randomize = false) => {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (board[row][col] === BLANK) {
                let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                if (randomize) nums.sort(() => Math.random() - 0.5);
                for (let num of nums) {
                    if (isValidMove(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board, randomize)) return true;
                        board[row][col] = BLANK;
                    }
                }
                return false;
            }
        }
    }
    return true;
};

const countSolutions = (board, limit = 2) => {
    let count = 0;
    const solve = (b) => {
        if (count >= limit) return;
        let row = -1, col = -1, isEmpty = false;
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (b[i][j] === BLANK) {
                    row = i; col = j;
                    isEmpty = true;
                    break;
                }
            }
            if (isEmpty) break;
        }
        if (!isEmpty) { count++; return; }
        for (let num = 1; num <= 9; num++) {
            if (isValidMove(b, row, col, num)) {
                b[row][col] = num;
                solve(b);
                b[row][col] = BLANK;
            }
        }
    };
    solve(board.map(r => [...r]));
    return count;
};

const generatePuzzle = (difficulty) => {
    const board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(BLANK));
    for (let i = 0; i < GRID_SIZE; i += 3) {
        let num;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                do { num = Math.floor(Math.random() * 9) + 1; } while (!isSafeInBox(board, i, i, num));
                board[i + r][i + c] = num;
            }
        }
    }
    solveSudoku(board, true);
    const solution = board.map(r => [...r]);
    
    // Difficulty = holes to remove
    let attempts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 40 : 52;
    
    while (attempts > 0) {
        let row = Math.floor(Math.random() * GRID_SIZE);
        let col = Math.floor(Math.random() * GRID_SIZE);
        while (board[row][col] === BLANK) {
            row = Math.floor(Math.random() * GRID_SIZE);
            col = Math.floor(Math.random() * GRID_SIZE);
        }
        const backup = board[row][col];
        board[row][col] = BLANK;
        const solutions = countSolutions(board);
        if (solutions !== 1) board[row][col] = backup;
        else attempts--;
    }
    return { initial: board, solution };
};

const isSafeInBox = (board, rowStart, colStart, num) => {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[rowStart + i][colStart + j] === num) return false;
        }
    }
    return true;
};

// --- STATE & PERSISTENCE ---
const state = {
    grid: [],
    initialGrid: [],
    solution: [],
    notes: [],
    history: [],
    selectedCell: null,
    status: 'menu', 
    difficulty: 'Easy',
    isNoteMode: false,
    timer: 0,
    errorCells: new Set(),
    bestTimes: { Easy: null, Medium: null, Hard: null }
};

let timerInterval = null;

const loadGame = () => {
    const savedTimes = localStorage.getItem('sudoku-best-times');
    if (savedTimes) state.bestTimes = JSON.parse(savedTimes);

    const savedGame = localStorage.getItem('sudoku-game-state');
    if (savedGame) {
        try {
            const parsed = JSON.parse(savedGame);
            if (parsed.status === 'playing' || parsed.status === 'paused') {
                state.grid = parsed.grid;
                state.initialGrid = parsed.initialGrid;
                state.solution = parsed.solution;
                state.notes = parsed.notes.map(r => r.map(n => new Set(n)));
                state.timer = parsed.timer;
                state.difficulty = parsed.difficulty;
                state.status = 'paused';
                render();
            }
        } catch (e) { console.error("Load failed", e); }
    }
};

const saveGame = () => {
    if (state.status === 'playing' || state.status === 'paused') {
        const stateToSave = {
            grid: state.grid,
            initialGrid: state.initialGrid,
            solution: state.solution,
            notes: state.notes.map(r => r.map(s => Array.from(s))),
            timer: state.timer,
            difficulty: state.difficulty,
            status: state.status
        };
        localStorage.setItem('sudoku-game-state', JSON.stringify(stateToSave));
    } else if (state.status === 'menu' || state.status === 'won') {
        localStorage.removeItem('sudoku-game-state');
    }
};

const saveBestTime = (time, diff) => {
    const currentBest = state.bestTimes[diff];
    if (currentBest === null || time < currentBest) {
        state.bestTimes[diff] = time;
        localStorage.setItem('sudoku-best-times', JSON.stringify(state.bestTimes));
    }
};

// --- GAME ACTIONS ---
const initGame = (diff = state.difficulty) => {
    state.difficulty = diff;
    state.status = 'loading';
    state.grid = Array.from({ length: 9 }, () => Array(9).fill(BLANK));
    state.initialGrid = Array.from({ length: 9 }, () => Array(9).fill(BLANK));
    state.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    state.errorCells = new Set();
    state.selectedCell = null;
    render();

    setTimeout(() => {
        const { initial, solution } = generatePuzzle(diff);
        state.initialGrid = JSON.parse(JSON.stringify(initial));
        state.grid = JSON.parse(JSON.stringify(initial));
        state.solution = solution;
        state.history = [];
        state.timer = 0;
        state.status = 'playing';
        startTimer();
        render();
    }, 100);
};

const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (state.status === 'playing') {
            state.timer++;
            updateTimerDisplay();
            saveGame();
        }
    }, 1000);
};

const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const addHistory = () => {
    state.history.push({
        grid: JSON.parse(JSON.stringify(state.grid)),
        notes: state.notes.map(r => r.map(s => new Set(s)))
    });
    if (state.history.length > 50) state.history.shift();
};

const handleUndo = () => {
    if (state.history.length === 0 || state.status !== 'playing') return;
    const prev = state.history.pop();
    state.grid = prev.grid;
    state.notes = prev.notes;
    state.errorCells = new Set();
    render();
    saveGame();
};

const handleInput = (num) => {
    if (state.status !== 'playing' || !state.selectedCell) return;
    const [r, c] = state.selectedCell;
    if (state.initialGrid[r][c] !== BLANK) return;

    addHistory();

    if (state.isNoteMode) {
        if (num === BLANK) state.notes[r][c].clear();
        else {
            if (state.notes[r][c].has(num)) state.notes[r][c].delete(num);
            else state.notes[r][c].add(num);
        }
    } else {
        if (state.grid[r][c] === num) state.grid[r][c] = BLANK;
        else {
            state.grid[r][c] = num;
            state.notes[r][c].clear();
            cleanNotes(r, c, num);
        }
        checkWinCondition();
    }
    render();
    saveGame();
};

const cleanNotes = (row, col, num) => {
    if (num === BLANK) return;
    for (let i = 0; i < 9; i++) {
        state.notes[row][i].delete(num);
        state.notes[i][col].delete(num);
    }
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            state.notes[startRow+i][startCol+j].delete(num);
        }
    }
};

const checkWinCondition = () => {
    const isFull = state.grid.every(row => row.every(cell => cell !== BLANK));
    if (isFull) {
        const isCorrect = JSON.stringify(state.grid) === JSON.stringify(state.solution);
        if (isCorrect) {
            state.status = 'won';
            saveBestTime(state.timer, state.difficulty);
            saveGame();
        }
    }
};

const handleHint = () => {
    if (state.status !== 'playing') return;
    addHistory();
    let tr, tc;
    if (state.selectedCell && state.grid[state.selectedCell[0]][state.selectedCell[1]] !== state.solution[state.selectedCell[0]][state.selectedCell[1]]) {
        [tr, tc] = state.selectedCell;
    } else {
        outer: for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if (state.grid[r][c] === BLANK || state.grid[r][c] !== state.solution[r][c]) {
                    tr = r; tc = c; break outer;
                }
            }
        }
    }
    if (tr !== undefined) {
        const correct = state.solution[tr][tc];
        state.grid[tr][tc] = correct;
        state.notes[tr][tc].clear();
        cleanNotes(tr, tc, correct);
        state.selectedCell = [tr, tc];
        checkWinCondition();
        render();
        saveGame();
    }
};

const handleCheck = () => {
    state.errorCells = new Set();
    state.grid.forEach((row, r) => {
        row.forEach((val, c) => {
            if (val !== BLANK && val !== state.solution[r][c]) {
                state.errorCells.add(`${r}-${c}`);
            }
        });
    });
    render();
    setTimeout(() => { state.errorCells = new Set(); render(); }, 3000);
};

// --- DOM RENDERER ---
const app = document.getElementById('app');

const updateTimerDisplay = () => {
    const el = document.getElementById('timer-display');
    if (el) el.innerText = formatTime(state.timer);
};

const render = () => {
    app.innerHTML = ''; 

    // 1. MENU
    if (state.status === 'menu') {
        app.innerHTML = `
            <div class="w-full bg-white rounded-3xl shadow-soft overflow-hidden pop-in border border-white/50">
                <div class="bg-gradient-to-br from-brand-600 to-brand-900 p-10 text-center relative overflow-hidden">
                    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <h1 class="text-5xl font-display font-extrabold text-white mb-2 tracking-tight">SUDOKU</h1>
                    <p class="text-brand-100 font-sans tracking-wide text-sm opacity-90">Daily Zen Puzzle</p>
                </div>
                <div class="p-8 flex flex-col gap-4">
                    <h2 class="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Select Difficulty</h2>
                    ${['Easy', 'Medium', 'Hard'].map(d => `
                        <button onclick="initGame('${d}')" class="group w-full py-4 px-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 transition-colors duration-200 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-2 h-8 rounded-full ${d === 'Easy' ? 'bg-emerald-400' : d === 'Medium' ? 'bg-amber-400' : 'bg-rose-400'}"></div>
                                <span class="text-lg font-bold text-slate-700 group-hover:text-brand-600 font-display transition-colors">${d}</span>
                            </div>
                            <span class="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm group-hover:text-brand-500 transition-colors">Best: ${formatTime(state.bestTimes[d])}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // 2. GAME SCREEN
    
    // Header
    const header = `
        <div class="w-full mb-6 flex justify-between items-center">
            <button onclick="togglePause()" class="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:text-brand-600 hover:border-brand-200 hover:shadow-md transition-colors">
                <i data-lucide="pause" width="20"></i>
            </button>
            <div class="flex flex-col items-center">
                <span class="text-[10px] font-extrabold text-brand-500 uppercase tracking-[0.2em] bg-brand-50 px-2 py-0.5 rounded-full mb-1">${state.difficulty}</span>
                <div class="flex items-center gap-2 text-2xl font-display font-bold text-slate-800 tabular-nums">
                    <span id="timer-display">${formatTime(state.timer)}</span>
                </div>
            </div>
            <div class="w-12 h-12"></div> </div>
    `;

    // Grid & Overlays
    let gridHtml = `<div class="relative bg-white p-1.5 rounded-2xl shadow-2xl shadow-brand-900/10 mb-8 select-none w-full aspect-square">`;
    
    if (state.status === 'loading') {
        gridHtml += `<div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl"><div class="flex flex-col items-center gap-3"><div class="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div><span class="text-sm font-bold text-brand-600 animate-pulse">Generating...</span></div></div>`;
    } else if (state.status === 'paused') {
        gridHtml += `
            <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-30 flex flex-col items-center justify-center rounded-2xl p-6 text-center animate-fade-in">
                <h2 class="text-3xl font-display font-bold text-white mb-8">Paused</h2>
                <div class="flex flex-col gap-3 w-full max-w-[200px]">
                    <button onclick="togglePause()" class="flex items-center justify-center gap-3 w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-600/30 transition-colors"><i data-lucide="play" width="18"></i> Resume</button>
                    <button onclick="initGame()" class="flex items-center justify-center gap-3 w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"><i data-lucide="refresh-cw" width="18"></i> Restart</button>
                    <button onclick="quitToMenu()" class="flex items-center justify-center gap-3 w-full py-3.5 bg-transparent border-2 border-slate-600 hover:border-slate-500 text-slate-300 rounded-xl font-bold transition-colors"><i data-lucide="home" width="18"></i> Quit</button>
                </div>
            </div>
        `;
    } else if (state.status === 'confirm_giveup') {
        gridHtml += `
            <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-30 flex flex-col items-center justify-center rounded-2xl p-6 text-center animate-fade-in">
                <div class="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-4"><i data-lucide="alert-triangle" width="24"></i></div>
                <h2 class="text-2xl font-display font-bold text-white mb-2">Give Up?</h2>
                <p class="text-slate-400 text-sm mb-6 max-w-[200px]">This will reveal the solution and end the current game.</p>
                <div class="flex gap-3 w-full max-w-[240px]">
                    <button onclick="confirmGiveUp()" class="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-colors">Yes</button>
                    <button onclick="cancelGiveUp()" class="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors">No</button>
                </div>
            </div>
        `;
    }

    // Grid Cells
    gridHtml += `<div class="grid grid-cols-9 w-full h-full border-2 border-slate-700 rounded-lg overflow-hidden bg-slate-700 gap-[1px]">`;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = state.grid[r][c];
            const isSelected = state.selectedCell && state.selectedCell[0] === r && state.selectedCell[1] === c;
            const isInitial = state.initialGrid[r][c] !== BLANK;
            const isError = state.errorCells.has(`${r}-${c}`);
            const isRelated = state.selectedCell && (state.selectedCell[0] === r || state.selectedCell[1] === c);
            const selectedVal = state.selectedCell ? state.grid[state.selectedCell[0]][state.selectedCell[1]] : 0;
            const isSameNum = val !== 0 && val === selectedVal;

            let cellClasses = "flex items-center justify-center relative cursor-pointer transition-colors duration-75 ";
            
            let bg = 'bg-white';
            let fg = 'text-brand-600 font-semibold';

            if (isSelected) { bg = '!bg-brand-600'; fg = '!text-white'; }
            else if (isError) { bg = '!bg-rose-100'; fg = '!text-rose-600'; }
            else if (isSameNum) { bg = '!bg-brand-100'; fg = 'text-brand-800 font-bold'; }
            else if (isRelated) { bg = 'bg-slate-50'; }

            if (isInitial) fg = isSelected ? '!text-white font-bold' : 'text-slate-900 font-bold';

            let content = '';
            if (val !== 0) {
                content = `<span class="text-2xl sm:text-3xl leading-none ${fg} font-display">${val}</span>`;
            } else {
                content = `<div class="grid grid-cols-3 w-full h-full p-0.5 pointer-events-none opacity-80">`;
                for(let n=1; n<=9; n++) {
                    content += `<div class="flex items-center justify-center">${state.notes[r][c] && state.notes[r][c].has(n) ? `<span class="text-[8px] sm:text-[9px] font-bold text-slate-500 leading-none">${n}</span>` : ''}</div>`;
                }
                content += `</div>`;
            }
            
            gridHtml += `
                <div onclick="selectCell(${r}, ${c})" class="${cellClasses} ${bg} overflow-hidden" style="${(c+1)%3===0 && c!==8 ? 'margin-right:2px;' : ''} ${(r+1)%3===0 && r!==8 ? 'margin-bottom:2px;' : ''}">
                    ${content}
                </div>
            `;
        }
    }
    gridHtml += `</div></div>`;

    // Controls
    const controls = `
        <div class="w-full flex flex-col gap-6">
            
            <div class="flex justify-between items-center gap-3">
                <button onclick="handleUndo()" class="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl bg-white border border-slate-100 text-slate-500 shadow-sm hover:shadow-md hover:text-brand-600 hover:border-brand-200 transition-colors" ${state.history.length === 0 ? 'disabled' : ''}>
                    <i data-lucide="rotate-ccw" width="20"></i>
                    <span class="text-[10px] font-bold uppercase tracking-wider">Undo</span>
                </button>
                
                <button onclick="toggleNoteMode()" class="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-colors ${state.isNoteMode ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-white border-slate-100 text-slate-500 shadow-sm hover:text-brand-600'}">
                     <div class="relative">
                        <i data-lucide="pen-tool" width="20"></i>
                        ${state.isNoteMode ? '<span class="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse"></span>' : ''}
                     </div>
                     <span class="text-[10px] font-bold uppercase tracking-wider">${state.isNoteMode ? 'Notes On' : 'Notes'}</span>
                </button>
                
                <button onclick="handleHint()" class="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl bg-white border border-slate-100 text-slate-500 shadow-sm hover:shadow-md hover:text-amber-500 hover:border-amber-200 transition-colors">
                    <i data-lucide="lightbulb" width="20"></i>
                    <span class="text-[10px] font-bold uppercase tracking-wider">Hint</span>
                </button>

                 <button onclick="handleCheck()" class="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl bg-white border border-slate-100 text-slate-500 shadow-sm hover:shadow-md hover:text-rose-500 hover:border-rose-200 transition-colors">
                    <i data-lucide="check" width="20"></i>
                    <span class="text-[10px] font-bold uppercase tracking-wider">Check</span>
                </button>
            </div>

            <div class="grid grid-cols-9 gap-1.5 sm:gap-2">
                ${[1,2,3,4,5,6,7,8,9].map(n => `
                    <button onclick="handleInput(${n})" class="aspect-[4/5] sm:aspect-square flex items-center justify-center text-2xl font-display font-medium rounded-xl sm:rounded-2xl bg-white border-b-4 border-slate-200 text-brand-600 hover:border-brand-500 hover:bg-brand-50 transition-colors shadow-sm">
                        ${n}
                    </button>
                `).join('')}
            </div>

            <div class="flex justify-center mt-2">
                <button onclick="giveUp()" class="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors py-2 px-4 rounded-full hover:bg-rose-50">
                    Give Up
                </button>
            </div>
        </div>
    `;

    // Win Modal
    let winModal = '';
    if (state.status === 'won') {
        winModal = `
            <div class="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50 animate-fade-in backdrop-blur-md">
                <div class="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 w-full relative overflow-hidden pop-in">
                    <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20"></div>
                    <div class="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 relative z-10">
                        <i data-lucide="trophy" width="48"></i>
                    </div>
                    <h2 class="text-4xl font-display font-extrabold text-slate-800 mb-1">Solved!</h2>
                    <div class="flex items-center gap-2 mb-8">
                        <span class="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider">${state.difficulty}</span>
                        <span class="text-2xl font-display font-bold text-brand-600">${formatTime(state.timer)}</span>
                    </div>
                    <div class="flex flex-col gap-3 w-full">
                        <button onclick="initGame()" class="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/30">Play Again</button>
                        <button onclick="quitToMenu()" class="w-full bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all">Menu</button>
                    </div>
                </div>
            </div>
        `;
    }

    app.innerHTML = header + gridHtml + controls + winModal;
    lucide.createIcons();
};

// --- GLOBAL ACTIONS ---
window.selectCell = (r, c) => { if (state.status === 'playing') { state.selectedCell = [r, c]; render(); } };
window.togglePause = () => { if(state.status==='playing') state.status='paused'; else if(state.status==='paused') state.status='playing'; saveGame(); render(); };
window.quitToMenu = () => { state.status = 'menu'; saveGame(); render(); };
window.toggleNoteMode = () => { state.isNoteMode = !state.isNoteMode; render(); };
window.giveUp = () => { if (state.status === 'playing') { state.status = 'confirm_giveup'; render(); } };
window.confirmGiveUp = () => { state.grid = JSON.parse(JSON.stringify(state.solution)); state.status = 'won'; render(); localStorage.removeItem('sudoku-game-state'); };
window.cancelGiveUp = () => { state.status = 'playing'; render(); };

window.initGame = initGame;
window.handleInput = handleInput;
window.handleUndo = handleUndo;
window.handleHint = handleHint;
window.handleCheck = handleCheck;

// Keyboard
document.addEventListener('keydown', (e) => {
    if (state.status !== 'playing') return;
    if (e.key === 'n' || e.key === 'N') toggleNoteMode();
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') handleUndo();
    if (e.key === 'Escape') togglePause();
    if (!state.selectedCell) return;
    const [r, c] = state.selectedCell;
    if (e.key >= '1' && e.key <= '9') handleInput(parseInt(e.key));
    if (e.key === 'Backspace' || e.key === 'Delete') handleInput(BLANK);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        let nr = r, nc = c;
        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
        if (e.key === 'ArrowDown') nr = Math.min(8, r + 1);
        if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
        if (e.key === 'ArrowRight') nc = Math.min(8, c + 1);
        state.selectedCell = [nr, nc];
        render();
    }
});

loadGame();
render();