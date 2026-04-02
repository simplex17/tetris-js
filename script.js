const TETROMINOES = {
    I: [[1, 1, 1]],
    O: [
        [1, 1],
        [1, 1],
    ],
    T: [
        [1, 1, 1],
        [0, 1, 0],
    ],
    J: [
        [0, 1],
        [0, 1],
        [1, 1],
    ],
    L: [
        [1, 0],
        [1, 0],
        [1, 1],
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
    ],
};
const TETROMINOES_KEYS = Object.keys(TETROMINOES);
const getRandomKey = function () {
    return TETROMINOES_KEYS.at(
        Math.floor(Math.random() * TETROMINOES_KEYS.length)
    );
};

class Game {
    constructor() {
        this.rows = 20;
        this.cols = 10;

        this.matrix = Array.from({ length: this.rows }).map((row) =>
            Array.from({ length: this.cols }).fill(0)
        );
        this.currentPiece = null;

        this.isGameOver = false;
        this.isPaused = false;

        this.DROP_INTERVAL = 1000;
        this.lastRender = performance.now();
        this.dropAccumulator = 0;

        this.initializePlayField();
        this.spawnPiece();
        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop();
        this.setListeners();
    }

    initializePlayField() {
        this.container = document.querySelector(".container");
        this.cells = [];

        const playField = document.createElement("div");
        playField.classList.add("playField");

        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                playField.appendChild(cell);
                row.push(cell);
            }
            this.cells.push(row);
        }

        this.container.appendChild(playField);
    }

    spawnPiece() {
        const shape = TETROMINOES[getRandomKey()];

        const newPiece = {
            shape,
            x: Math.floor((this.cols - shape[0].length) / 2),
            y: 0,
        };

        if (this.checkCollision(newPiece)) {
            this.isGameOver = true;
            setTimeout(() => alert("Game Over"), 0);
            return;
        }

        this.currentPiece = newPiece;
    }

    setListeners() {
        addEventListener("keydown", (event) => {
            if (this.isGameOver) return;
            switch (event.key) {
                case "ArrowUp": {
                    const rotatedPiece = this.rotatePiece();
                    if (!this.checkCollision(rotatedPiece))
                        this.currentPiece = rotatedPiece;
                    break;
                }

                case "ArrowLeft": {
                    this.movePieceLeft();
                    break;
                }

                case "ArrowDown": {
                    this.movePieceDown();
                    break;
                }

                case "ArrowRight": {
                    this.movePieceRight();
                    break;
                }
            }
        });

        addEventListener("visibilitychange", () => {
            if (document.hidden) {
                this.isPaused = true;
            } else {
                this.isPaused = false;
                this.lastRender = performance.now();
            }
        });
    }

    gameLoop(time = 0) {
        if (this.isGameOver) return;

        if (this.isPaused) {
            requestAnimationFrame(this.gameLoop);
            return;
        }

        const deltaTime = time - this.lastRender;
        this.lastRender = time;

        this.dropAccumulator += deltaTime;

        while (this.dropAccumulator > this.DROP_INTERVAL) {
            this.movePieceDown();
            this.dropAccumulator -= this.DROP_INTERVAL;
        }

        this.renderBoard();

        requestAnimationFrame(this.gameLoop);
    }

    movePieceDown() {
        if (!this.checkCollision(this.currentPiece, 0, 1))
            this.currentPiece.y++;
        else this.updateBoard();
    }

    movePieceLeft() {
        if (!this.checkCollision(this.currentPiece, -1, 0))
            this.currentPiece.x--;
    }

    movePieceRight() {
        if (!this.checkCollision(this.currentPiece, 1, 0))
            this.currentPiece.x++;
    }

    rotatePiece() {
        const shapeAfterRotate = this.currentPiece.shape[0].map((val, index) =>
            this.currentPiece.shape.map((row) => row[index]).reverse()
        );

        return {
            shape: shapeAfterRotate,
            x: this.currentPiece.x,
            y: this.currentPiece.y,
        };
    }

    updateBoard() {
        if (!this.currentPiece) return;

        const { shape, x, y } = this.currentPiece;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                const newX = x + c;
                const newY = y + r;

                if (shape[r][c]) this.matrix[newY][newX] = shape[r][c];
            }
        }

        this.currentPiece = null;
        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let i = this.matrix.length - 1;
        while (i >= 0) {
            if (!this.matrix[i].includes(0)) {
                this.matrix.splice(i, 1);
                this.matrix.unshift(Array(this.cols).fill(0));
                continue;
            }
            i--;
        }
    }

    checkCollision(piece, offsetX = 0, offsetY = 0) {
        const { shape, x, y } = piece;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const newX = x + c + offsetX;
                    const newY = y + r + offsetY;
                    if (
                        newY < 0 ||
                        newY >= this.rows ||
                        newX < 0 ||
                        newX >= this.cols ||
                        this.matrix[newY][newX]
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    renderBoard() {
        for (let r = 0; r < this.cells.length; r++) {
            for (let c = 0; c < this.cells[r].length; c++) {
                this.cells[r][c].classList.remove("filled");
            }
        }

        for (let r = 0; r < this.matrix.length; r++) {
            for (let c = 0; c < this.matrix[r].length; c++) {
                this.matrix[r][c] && this.cells[r][c].classList.add("filled");
            }
        }

        if (!this.currentPiece) return;

        const { shape, x, y } = this.currentPiece;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const newX = x + c;
                    const newY = y + r;

                    if (this.cells[newY] && this.cells[newY][newX]) {
                        this.cells[newY][newX].classList.add("filled");
                    }
                }
            }
        }
    }
}

const game = new Game();
