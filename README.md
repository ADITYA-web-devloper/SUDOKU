Sudoku Zen 🧘

Sudoku Zen is a minimalist, distraction-free Sudoku web application designed for relaxation and mental sharpness. Built with a focus on clean UI and smooth interactions, it offers a modern puzzle experience optimized for both desktop and mobile devices.

✨ Features

3 Difficulty Levels: Choose from Easy, Medium, or Hard puzzles generated on the fly.

Smart Note Taking: Toggle "Note Mode" to jot down candidates in cells without committing.

Game Tools:

Undo: Revert moves endlessly (up to 50 steps).

Hint: Stuck? Reveal a correct number for a specific cell.

Check: Highlight incorrect cells to verify your progress.

Auto-Save: Your game state is saved automatically to local storage. Close the tab and resume exactly where you left off.

High Scores: Tracks and saves your best completion times for each difficulty.

Responsive Design: Fully fluid layout that adapts to mobile phones, tablets, and desktops using Tailwind CSS.

Keyboard Support: Full navigation and input support using arrow keys and number keys.

🛠️ Tech Stack

HTML5: Semantic structure.

CSS3: Custom styling + Tailwind CSS (via CDN) for utility-first styling.

JavaScript (ES6+): Vanilla JS for game logic, state management, and DOM rendering.

Icons: Lucide Icons for clean, lightweight SVG icons.

Fonts: Inter & Outfit (Google Fonts).

🚀 Getting Started

Since this is a static web application, no build process or package manager is required.

Clone the repository:

git clone [https://github.com/yourusername/sudoku-zen.git](https://github.com/yourusername/sudoku-zen.git)


Navigate to the folder:

cd sudoku-zen


Run the game:
Simply open index.html in your web browser.

📂 Project Structure

sudoku-zen/
├── index.html      # Main HTML structure and library imports
├── style.css       # Custom styles, animations, and Tailwind overrides
└── script.js       # Game logic, state management, and DOM rendering


🧠 Code Overview

Game Logic (script.js)

generatePuzzle(difficulty): Uses a recursive backtracking algorithm (solveSudoku) to generate a complete board, then selectively removes numbers based on the chosen difficulty level to create a unique puzzle.

State Management: The app uses a reactive-style state object to track the grid, solution, timer, notes, and history.

Persistence: localStorage is used to save the sudoku-game-state (current game) and sudoku-best-times (high scores).

Rendering

The application uses a Virtual DOM-free approach. The render() function rebuilds the necessary HTML strings based on the current state and injects them into the #app container. This ensures the app is lightweight and fast without needing framework dependencies like React or Vue.

🎮 Keyboard Controls

Arrow Keys: Move selection focus.

Numbers 1-9: Fill cell.

Backspace/Delete: Clear cell.

N: Toggle Note Mode.

Ctrl/Cmd + Z: Undo.

Escape: Pause Game.

📄 License

This project is open source and available under the MIT License.

Site designed by Adi.
