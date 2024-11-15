const FRAMES_PER_MILLISECOND = 60 / 1000;
const MILLISECONDS_PER_FRAME = 1.0 / FRAMES_PER_MILLISECOND;

const SNAKE_GAME_STATE_ACTIVE    = 0x01;
const SNAKE_GAME_STATE_GAME_OVER = 0x02;

const SNAKE_UPDATE_RESULT_OK       = 0x00;
const SNAKE_UPDATE_RESULT_HIT_WALL = 0x01;
const SNAKE_UPDATE_RESULT_HIT_SELF = 0x02;

const SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY = [ 11, 4 ];
const LASTING_SPACES_UNTIL_GAMEOVER = 100;
const POPULATION_COUNT = 100000;

const TARGET_COLOUR = "#01796F";
const SNAKE_COLOUR = "#FEFCFF";
const GAME_BACKGROUND_COLOUR = "#2A2B2D";
const GAME_GRID_LINE_COLOUR = "#1F1F1F";
const GAME_TEXT_COLOUR = "#FFD700";
const SIMULATION_BACKGROUND_COLOUR = "#0F0F0F";

function sigmod(x) {
    return 1 / (1 + Math.exp(-x));
}

class Vector2 {
    static fromObject(v) { return new Vector2(v.x, v.y); }
    static fromArray(v)  { return new Vector2(v[0], v[1]); }

    constructor (x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    *[Symbol.iterator]() { yield this.x; yield this.y; }
    clone()              { return new Vector2(this.x, this.y); }
    set(x, y)            { this.x = x; this.y = y; return this; }
    copy(other)          { this.x = other.x; this.y = other.y; return this; }
    toObject()           { return { x: this.x, y: this.y }; }
    toArray()            { return [this.x, this.y]; }

    equals(other)        { return this.x == other.x && this.y == other.y; }

    magnitudeSquared() { return this.x * this.x + this.y * this.y; }
    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    dot(other) { return this.x * other.x + this.y * other.y; }
    cross() { return this.x * this.y - this.y * this.x; }
    neg() { this.x = -this.x; this.y = -this.y; return this; }

    addScalar(scalar) { this.x += scalar; this.y += scalar; return this; }
    subScalar(scalar) { this.x -= scalar; this.y -= scalar; return this; }
    mulScalar(scalar) { this.x *= scalar; this.y *= scalar; return this; }
    divScalar(scalar) { this.x /= scalar; this.y /= scalar; return this; }
    addVectors(v0, v1) { this.x = v0.x + v1.x; this.y = v0.y + v1.y; return this; }
    subVectors(v0, v1) { this.x = v0.x - v1.x; this.y = v0.y - v1.y; return this; }
    mulVectors(v0, v1) { this.x = v0.x * v1.x; this.y = v0.y * v1.y; return this; }
    divVectors(v0, v1) { this.x = v0.x / v1.x; this.y = v0.y / v1.y; return this; }
    add(other) { this.x += other.x; this.y += other.y; return this; }
    sub(other) { this.x -= other.x; this.y -= other.y; return this; }
    mul(other) { this.x *= other.x; this.y *= other.y; return this; }
    div(other) { this.x /= other.x; this.y /= other.y; return this; }

    addScaledVector(other, scalar) { this.x += scalar * other.x; this.y += scalar * other.y; return this; }
    subScaledVector(other, scalar) { this.x -= scalar * other.x; this.y -= scalar * other.y; return this; }

    distance(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    normalize() {
        const length_squared = this.x * this.x + this.y * this.y;
        
        if (length_squared === 0) {
            return this.set(0, 0);
        }
        
        return this.mulScalar(1 / Math.sqrt(length_squared));
    }
}

class Rectangle {
    constructor (x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

class Target {
    constructor (position = new Vector2(0, 0)) {
        this.position = position;
    }

    relocate(snake, width, height) {
        this.position.set(Math.floor(width  * Math.random()),
                          Math.floor(height * Math.random()));

        while (snake.hasIntersection(this.position.x, this.position.y, 0)) {
            this.position.set(Math.floor(width  * Math.random()),
                              Math.floor(height * Math.random()));
        }
    }

    render(context, gameBounds, cellSize, targetRadius) {
        const targetPositionX = gameBounds.x + this.position.x * cellSize + cellSize / 2;
        const targetPositionY = gameBounds.y + this.position.y * cellSize + cellSize / 2;

        context.fillStyle = TARGET_COLOUR;
        context.beginPath();
        context.ellipse(targetPositionX, targetPositionY, targetRadius, targetRadius, 0, 0, 2 * Math.PI, false);
        context.closePath();
        context.fill();
    }
}


class Snake {
    constructor (startX = 0, startY = 0) {
        this.body = [ new Vector2(startX, startY) ];
        this.velocity = new Vector2(1, 0);
        this.length = 1;

        this.spacesMovedSinceLastTarget = 0;
        this.spacesMoved = 0;
    }

    get position() {
        return this.body[0];
    }

    setDirection(direction) {
        if (direction.dot(this.velocity) >= 0) {
            this.velocity.copy(direction);
        }
    }

    reset(startX, startY) {
        if (this.body.length > 1) {
            this.body.splice(1, this.body.length - 1);
        }

        this.length = 1;
        this.spacesMoved = 0;
        this.spacesMovedSinceLastTarget = 0;
        this.body[0].set(startX, startY);
    }

    collect() {
        this.spacesMovedSinceLastTarget = 0;
        this.length++;
    }

    hasIntersection(x, y, startIndex = 1) {
        for (let idx = startIndex; idx < this.body.length; ++idx) {
            if (this.body[idx].x == x && this.body[idx].y == y) {
                return true;
            }
        }

        return false;
    }

    distanceToBody(positionX, positionY, directionX, directionY, wallDistance) {
        for (let idx = 0; idx < wallDistance; ++idx) {
            if (this.hasIntersection(positionX, positionY)) {
                return idx;
            }

            positionX += directionX;
            positionY += directionY;
        }

        return wallDistance;
    }

    update(snakeGame) {
        const nextPositionX = this.body[0].x + this.velocity.x;
        const nextPositionY = this.body[0].y + this.velocity.y;

        if (snakeGame.outsideBounds(nextPositionX, nextPositionY)) {
            return SNAKE_UPDATE_RESULT_HIT_WALL;
        }

        if (this.hasIntersection(nextPositionX, nextPositionY)) {
            return SNAKE_UPDATE_RESULT_HIT_SELF;
        }

        if (this.body.length < this.length) {
            this.body.push(this.body[this.body.length - 1].clone());
        }

        for (let idx = this.body.length - 1; idx > 0; --idx) {
            this.body[idx].copy(this.body[idx - 1]);
        }

        this.spacesMovedSinceLastTarget += 1;
        this.spacesMoved += 1;

        this.body[0].set(nextPositionX, nextPositionY);
        return SNAKE_UPDATE_RESULT_OK;
    }

    render(context, gameBounds, cellSize, snakeRadius) {
        const halfCellSize = cellSize / 2;

        if (this.body.length == 1) {
            const x = gameBounds.x + this.body[0].x * cellSize + halfCellSize;
            const y = gameBounds.y + this.body[0].y * cellSize + halfCellSize;

            context.fillStyle = SNAKE_COLOUR;
            context.beginPath();
            context.ellipse(x, y, snakeRadius, snakeRadius, 0, 0, 2 * Math.PI, false);
            context.fill();
            return;
        }

        context.strokeStyle = SNAKE_COLOUR;
        context.lineWidth = 2 * snakeRadius;
        context.lineCap = "round";
        context.beginPath();
        for (let idx = 0; idx < this.body.length; ++idx) {
            const position     = this.body[idx    ];
            const prevPosition = this.body[idx - 1] || position;
            const nextPosition = this.body[idx + 1] || position;

            const dotProduct = (prevPosition.x - position.x) * (nextPosition.x - position.x)
            +                  (prevPosition.y - position.y) * (nextPosition.y - position.y);

            const x0 = gameBounds.x + 0.5 * (prevPosition.x + position.x) * cellSize + halfCellSize;
            const y0 = gameBounds.y + 0.5 * (prevPosition.y + position.y) * cellSize + halfCellSize;

            const x1 = gameBounds.x + position.x * cellSize + halfCellSize;
            const y1 = gameBounds.y + position.y * cellSize + halfCellSize;

            const x2 = gameBounds.x + 0.5 * (nextPosition.x + position.x) * cellSize + halfCellSize;
            const y2 = gameBounds.y + 0.5 * (nextPosition.y + position.y) * cellSize + halfCellSize;

            if (dotProduct == 0 && !prevPosition.equals(position) && !nextPosition.equals(position)) {
                context.moveTo(x0, y0);
                context.arcTo(x1, y1, x2, y2, snakeRadius);
            }
            else {
                context.moveTo(x0, y0);
                context.lineTo(x2, y2);
            }
        }

        context.stroke();
    }
}

class NeuralNetControlledSnake extends Snake {
    constructor (startX, startY, neuralNetwork) {
        super(startX, startY);
        this.neuralNetwork = neuralNetwork;
    }

    update(game) {
        const foodDx = game.target.position.x - this.position.x;
        const foodDy = game.target.position.y - this.position.y;

        const wallDistanceLeft  = this.position.x;
        const wallDistanceRight = game.cols - this.position.x;
        const wallDistanceUp    = this.position.y;
        const wallDistanceDown  = game.rows - this.position.y;

        const selfDistanceLeft  = this.distanceToBody(this.position.x, this.position.y, -1, 0, wallDistanceLeft);
        const selfDistanceRight = this.distanceToBody(this.position.x, this.position.y,  1, 0, wallDistanceRight);
        const selfDistanceUp    = this.distanceToBody(this.position.x, this.position.y,  0,-1, wallDistanceUp);
        const selfDistanceDown  = this.distanceToBody(this.position.x, this.position.y,  0, 1, wallDistanceDown);

        this.neuralNetwork.setInputValueAt(0, foodDx);
        this.neuralNetwork.setInputValueAt(1, foodDy);
        this.neuralNetwork.setInputValueAt(2, wallDistanceLeft);
        this.neuralNetwork.setInputValueAt(3, wallDistanceRight);
        this.neuralNetwork.setInputValueAt(4, wallDistanceUp);
        this.neuralNetwork.setInputValueAt(5, wallDistanceDown);
        this.neuralNetwork.setInputValueAt(6, selfDistanceLeft);
        this.neuralNetwork.setInputValueAt(7, selfDistanceRight);
        this.neuralNetwork.setInputValueAt(8, selfDistanceUp);
        this.neuralNetwork.setInputValueAt(9, selfDistanceDown);

        this.neuralNetwork.setInputValueAt(10, 1);

        this.neuralNetwork.process();

        const turnRightProbability = this.neuralNetwork.getOutputValueAt(0);
        const turnLeftProbability  = this.neuralNetwork.getOutputValueAt(1);
        const turnUpProbability    = this.neuralNetwork.getOutputValueAt(2);
        const turnDownProbability  = this.neuralNetwork.getOutputValueAt(3);
        const highestProbability   = Math.max(
            turnRightProbability,
            turnLeftProbability,
            turnUpProbability,
            turnDownProbability
        );

        if      (highestProbability == turnRightProbability) this.setDirection(VELOCITY_RIGHT);
        else if (highestProbability == turnLeftProbability)  this.setDirection(VELOCITY_LEFT);
        else if (highestProbability == turnUpProbability)    this.setDirection(VELOCITY_UP);
        else if (highestProbability == turnDownProbability)  this.setDirection(VELOCITY_DOWN);

        return super.update(game);
    }
}

class SnakeGame {
    constructor (cols = 0, rows = 0, snake) {
        this.cols     = cols;
        this.rows     = rows;
        this.snake    = snake;
        this.state    = SNAKE_GAME_STATE_ACTIVE;
        this.target   = new Target();
        this.cellSize = new Vector2();
        this.score    = 0;

        this.target.relocate(this.snake, this.cols, this.rows);
        this.snake.reset(Math.floor(this.cols / 2), Math.floor(this.rows / 2));
    }

    outsideBounds(x, y) {
        return x < 0 || y < 0 || x >= this.cols || y >= this.rows;
    }

    isActive() {
        return this.state == SNAKE_GAME_STATE_ACTIVE;
    }

    getFitness() {
        return 2 * this.snake.spacesMoved - this.snake.spacesMovedSinceLastTarget + 200 * this.score;
    }

    endGame() {
        this.state = SNAKE_GAME_STATE_GAME_OVER;
    }

    reset() {
        this.state = SNAKE_GAME_STATE_ACTIVE;
        this.score = 0;

        this.target.relocate(this.snake, this.cols, this.rows);
        this.snake.reset(Math.floor(this.cols / 2), Math.floor(this.rows / 2));
    }

    update() {
        switch (this.state) {
        case SNAKE_GAME_STATE_GAME_OVER:
            break;
        case SNAKE_GAME_STATE_ACTIVE:
            const result = this.snake.update(this);
            
            if (this.snake.position.equals(this.target.position)) {
                this.score += 1;
                this.snake.collect();
                this.target.relocate(this.snake, this.cols, this.rows);
            }

            if (result != SNAKE_UPDATE_RESULT_OK) {
                this.endGame();
                break;
            }

            break;
        }
    }

    render(context, gameBounds, gridLineWidth = 1) {
        const cellSize = gameBounds.width / this.cols;
        const snakeRadius = cellSize * 0.40;
        const excess = Math.max(gameBounds.height - gameBounds.width, 0); 

        context.fillStyle = GAME_BACKGROUND_COLOUR;
        context.fillRect(gameBounds.x, gameBounds.y, gameBounds.width, gameBounds.height);

        context.strokeStyle = GAME_GRID_LINE_COLOUR;
        context.lineWidth = gridLineWidth;

        context.beginPath();
        for (let idx = 1; idx < this.cols; ++idx) {
            context.moveTo(gameBounds.x + idx * cellSize, gameBounds.y);
            context.lineTo(gameBounds.x + idx * cellSize, gameBounds.y + gameBounds.width);
        }

        for (let idx = 1; idx <= this.rows; ++idx) {
            context.moveTo(gameBounds.x,                    gameBounds.y + idx * cellSize);
            context.lineTo(gameBounds.x + gameBounds.width, gameBounds.y + idx * cellSize);
        }

        context.stroke();

        context.font = `${excess}px Consolas`;
        context.textAlign = "start";
        context.fillStyle = GAME_TEXT_COLOUR;
        context.fillText(`Score: ${this.score}`, gameBounds.x, gameBounds.y + gameBounds.height, gameBounds.width);

        this.target.render(context, gameBounds, cellSize, snakeRadius);
        this.snake.render(context, gameBounds, cellSize, snakeRadius);

        if (this.state == SNAKE_GAME_STATE_GAME_OVER) {
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(gameBounds.x, gameBounds.y, gameBounds.width, gameBounds.height);

            context.font = `${Math.floor(0.1 * gameBounds.width)}px Consolas`;
            context.fillStyle = GAME_TEXT_COLOUR;
            context.textAlign = "center";
            context.fillText("Game Over!", gameBounds.x + gameBounds.width / 2, gameBounds.y + gameBounds.height / 2);
        }
    }
}

class Simulation {
    constructor (context) {
        this.canvas = context.canvas;
        this.context = context;
        this.innovationCounter = new InnovationCounter();
        this.requestId = null;
        
        const baseGeneome = this.innovationCounter.createBaseGenome(sigmod, SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY).randomizeWeights();

        this.genomes = [];
        this.snakeGames = [];
        for (let idx = 0; idx < POPULATION_COUNT; ++idx) {
            const genome = this.innovationCounter.mutateGenome(baseGeneome);
            const snake = new NeuralNetControlledSnake(0, 0, genome.toNeuralNetwork());
            const snakeGame = new SnakeGame(20, 20, snake);
            this.genomes.push(genome);
            this.snakeGames.push(snakeGame);
        }

        window.addEventListener("resize", this.resizeCanvas.bind(this), false);
        
        this.resizeCanvas();
        this.tick();
    }

    getRectangleViews() {
        const rectangleViews = [];
        rectangleViews.push(new Rectangle(0, 0, this.canvas.height / 1.1, this.canvas.height));

        const remainingWidth = this.canvas.width - rectangleViews[0].width;

        if (remainingWidth < 200) {
            return rectangleViews;
        }

        const gameWindowWidth  = remainingWidth / 12;
        const gameWindowHeight = gameWindowWidth * 1.1;

        const windowColumns    = Math.floor(remainingWidth     / gameWindowWidth);
        const windowRows       = Math.floor(this.canvas.height / gameWindowHeight);

        for (let idx0 = 0, x = rectangleViews[0].width; idx0 < windowColumns; ++idx0, x += gameWindowWidth) {
            for (let idx1 = 0, y = 0; idx1 < windowRows; ++idx1, y += gameWindowHeight) {
                rectangleViews.push(new Rectangle(x, y, gameWindowWidth, gameWindowHeight));
            }
        }

        return rectangleViews;
    }

    startGeneration() {
        for (let idx = 0; idx < this.genomes.length; ++idx) {
            this.snakeGames[idx].reset();
            // this.snakeGames[idx].snake
        }
    }

    tick() {
        this.update();
        this.render();

        this.requestId = window.setTimeout(this.tick.bind(this), MILLISECONDS_PER_FRAME);
    }

    update() {
        let shouldRestart = false;
        for (let idx = 0; idx < this.snakeGames.length; ++idx) {
            this.snakeGames[idx].update();

            if (this.snakeGames[idx].snake.spacesMovedSinceLastTarget > LASTING_SPACES_UNTIL_GAMEOVER) {
                this.snakeGames[idx].endGame();
            }

            if (this.snakeGames[idx].isActive()) {
                shouldRestart = true;
            }
        }

        if (!shouldRestart) {
            this.startGeneration();
        }

        this.snakeGames.sort((snakeGame0, snakeGame1) => {
            // if (snakeGame0.isActive() != snakeGame1.isActive()) {
            //     return snakeGame0.isActive() ? -1 : 1;
            // }

            return snakeGame1.getFitness() - snakeGame0.getFitness();
        });
    }

    render() {
        this.context.fillStyle = SIMULATION_BACKGROUND_COLOUR;
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        for (let idx0 = 0; idx0 < this.rectangleViews.length && idx0 < this.snakeGames.length; ++idx0) {
            this.snakeGames[idx0].render(this.context, this.rectangleViews[idx0]);
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        this.canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        this.rectangleViews = this.getRectangleViews();
        this.render();
    }
}

let game;

async function main() {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    game = new Simulation(context);
}

window.addEventListener("load", main, false);

const VELOCITY_RIGHT = new Vector2( 1, 0);
const VELOCITY_LEFT  = new Vector2(-1, 0);
const VELOCITY_UP    = new Vector2( 0,-1);
const VELOCITY_DOWN  = new Vector2( 0, 1);
