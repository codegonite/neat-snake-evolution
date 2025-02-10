const FRAMES_PER_MILLISECOND = 100 / 1000
const MILLISECONDS_PER_FRAME = 1.0 / FRAMES_PER_MILLISECOND

const SNAKE_GAME_STATE_ACTIVE    = 0x01
const SNAKE_GAME_STATE_GAME_OVER = 0x02
const SNAKE_GAME_STATE_PAUSE     = 0x04

const SNAKE_UPDATE_RESULT_OK       = 0x00
const SNAKE_UPDATE_RESULT_HIT_WALL = 0x01
const SNAKE_UPDATE_RESULT_HIT_SELF = 0x02

const SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY = [ 13, 4 ]
const LASTING_SPACES_UNTIL_GAMEOVER = 100
const POPULATION_COUNT = 500

const TARGET_COLOUR = "#01796F"
const SNAKE_COLOUR = "#FEFCFF"
const GAME_BACKGROUND_COLOUR = "#2A2B2D"
const GAME_GRID_LINE_COLOUR = "#1F1F1F"
const GAME_TEXT_COLOUR = "#FFD700"
const SIMULATION_BACKGROUND_COLOUR = "#0F0F0F"

const KEYCODE_BACKQUOTE = 192
const KEYCODE_DIGIT1 = 49
const KEYCODE_DIGIT2 = 50
const KEYCODE_DIGIT3 = 51
const KEYCODE_DIGIT4 = 52
const KEYCODE_DIGIT5 = 53
const KEYCODE_DIGIT6 = 54
const KEYCODE_DIGIT7 = 55
const KEYCODE_DIGIT8 = 56
const KEYCODE_DIGIT9 = 57
const KEYCODE_DIGIT0 = 48
const KEYCODE_MINUS = 189
const KEYCODE_EQUAL = 187
const KEYCODE_BACKSPACE = 8
const KEYCODE_TAB = 9
const KEYCODE_KEY_Q = 81
const KEYCODE_KEY_W = 87
const KEYCODE_KEY_E = 69
const KEYCODE_KEY_R = 82
const KEYCODE_KEY_T = 84
const KEYCODE_KEY_Y = 89
const KEYCODE_KEY_U = 85
const KEYCODE_KEY_I = 73
const KEYCODE_KEY_O = 79
const KEYCODE_KEY_P = 80
const KEYCODE_BRACKET_LEFT = 219
const KEYCODE_BRACKET_RIGHT = 221
const KEYCODE_BACKSLASH = 220
const KEYCODE_CAPS_LOCK = 20
const KEYCODE_KEY_A = 65
const KEYCODE_KEY_S = 83
const KEYCODE_KEY_D = 68
const KEYCODE_KEY_F = 70
const KEYCODE_KEY_G = 71
const KEYCODE_KEY_H = 72
const KEYCODE_KEY_J = 74
const KEYCODE_KEY_K = 75
const KEYCODE_KEY_L = 76
const KEYCODE_SEMICOLON = 186
const KEYCODE_QUOTE = 222
const KEYCODE_ENTER = 13
const KEYCODE_SHIFT_LEFT = 16
const KEYCODE_KEY_Z = 90
const KEYCODE_KEY_X = 88
const KEYCODE_KEY_C = 67
const KEYCODE_KEY_V = 86
const KEYCODE_KEY_B = 66
const KEYCODE_KEY_N = 78
const KEYCODE_KEY_M = 77
const KEYCODE_COMMA = 188
const KEYCODE_PERIOD = 190
const KEYCODE_SLASH = 191
const KEYCODE_SHIFT_RIGHT = 16
const KEYCODE_ARROW_UP = 38
const KEYCODE_CONTROL_LEFT = 17
const KEYCODE_ALT_LEFT = 18
const KEYCODE_ARROW_LEFT = 37
const KEYCODE_ARROW_RIGHT = 39
const KEYCODE_ARROW_DOWN = 40

class Vector2 {
    static fromObject(v) { return new Vector2(v.x, v.y); }
    static fromArray(v)  { return new Vector2(v[0], v[1]); }

    constructor (x = 0, y = 0) {
        this.x = x
        this.y = y
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
        const dx = other.x - this.x
        const dy = other.y - this.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    normalize() {
        const length_squared = this.x * this.x + this.y * this.y
        
        if (length_squared === 0) {
            return this.set(0, 0)
        }
        
        return this.mulScalar(1 / Math.sqrt(length_squared))
    }
}

class Rectangle {
    constructor (x = 0, y = 0, width = 0, height = 0) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    set(x = 0, y = 0, width = 0, height = 0) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
}

class KeyboardInput {
    constructor (eventTarget) {
        this.keyMap = new Map()
        this.prevKeyMap = new Map()

        const onKeyDownEvent = event => {
            this.prevKeyMap.set(event.keyCode, this.keyMap.get(event.keyCode))
            this.keyMap.set(event.keyCode, true)
        }

        const onKeyUpEvent = event => {
            this.prevKeyMap.set(event.keyCode, this.keyMap.get(event.keyCode))
            this.keyMap.set(event.keyCode, false)
        }

        eventTarget.addEventListener("keydown", onKeyDownEvent, false)
        eventTarget.addEventListener("keyup", onKeyUpEvent, false)
    }

    isKeyDown(keyCode) {
        return this.keyMap.get(keyCode) == true
    }
    
    isKeyUp(keyCode) {
        return this.keyMap.get(keyCode) != true
    }
    
    isKeyHeld(keyCode) {
        return this.keyMap.get(keyCode)     == true
        &&     this.prevKeyMap.get(keyCode) == true
    }
}

class Target {
    constructor (x = 0, y = 0) {
        this.position = new Vector2(x, y)
    }

    relocate(snake, width, height) {
        this.position.set(Math.floor(width  * Math.random()),
                          Math.floor(height * Math.random()))

        while (snake.hasIntersection(this.position.x, this.position.y, 0)) {
            this.position.set(Math.floor(width  * Math.random()),
                              Math.floor(height * Math.random()))
        }
    }

    render(context, gameBounds, cellSize, targetRadius) {
        const targetPositionX = gameBounds.x + this.position.x * cellSize + cellSize / 2
        const targetPositionY = gameBounds.y + this.position.y * cellSize + cellSize / 2

        context.fillStyle = TARGET_COLOUR
        context.beginPath()
        context.ellipse(targetPositionX, targetPositionY, targetRadius, targetRadius, 0, 0, 2 * Math.PI, false)
        context.closePath()
        context.fill()
    }
}

class Snake {
    constructor (startX = 0, startY = 0) {
        this.body = [ new Vector2(startX, startY) ]
        this.velocity = new Vector2(1, 0)
        this.length = 1
    }

    get position() {
        return this.body[0]
    }

    collect() {
        this.length++
    }

    setDirection(direction) {
        if (direction.dot(this.velocity) >= 0) {
            this.velocity.copy(direction)
        }
    }

    reset(startX, startY) {
        this.length = 1
        this.body[0].set(startX, startY)
        if (this.body.length > 1) {
            this.body.splice(1, this.body.length - 1)
        }
    }

    hasIntersection(x, y, startIndex = 1) {
        for (let idx = startIndex; idx < this.body.length; ++idx) {
            if (this.body[idx].x == x && this.body[idx].y == y) {
                return true
            }
        }

        return false
    }

    distanceToBody(positionX, positionY, directionX, directionY, wallDistance) {
        for (let idx = 0; idx < wallDistance; ++idx) {
            if (this.hasIntersection(positionX, positionY)) {
                return idx
            }

            positionX += directionX
            positionY += directionY
        }

        return wallDistance
    }

    update(snakeGame) {
        const nextPositionX = this.body[0].x + this.velocity.x
        const nextPositionY = this.body[0].y + this.velocity.y

        if (snakeGame.outsideBounds(nextPositionX, nextPositionY)) {
            return SNAKE_UPDATE_RESULT_HIT_WALL
        }

        if (this.hasIntersection(nextPositionX, nextPositionY)) {
            return SNAKE_UPDATE_RESULT_HIT_SELF
        }

        if (this.body.length < this.length) {
            this.body.push(this.body[this.body.length - 1].clone())
        }

        for (let idx = this.body.length - 1; idx > 0; --idx) {
            this.body[idx].copy(this.body[idx - 1])
        }

        this.body[0].set(nextPositionX, nextPositionY)
        this.totalCellsMoved += 1

        return SNAKE_UPDATE_RESULT_OK
    }

    render(context, gameBounds, cellSize, snakeRadius) {
        const halfCellSize = cellSize / 2

        if (this.body.length == 1) {
            const x = gameBounds.x + this.body[0].x * cellSize + halfCellSize
            const y = gameBounds.y + this.body[0].y * cellSize + halfCellSize

            context.fillStyle = SNAKE_COLOUR
            context.beginPath()
            context.ellipse(x, y, snakeRadius, snakeRadius, 0, 0, 2 * Math.PI, false)
            context.fill()
            return
        }

        context.strokeStyle = SNAKE_COLOUR
        context.lineWidth = 2 * snakeRadius
        context.lineCap = "round"
        context.beginPath()
        for (let idx = 0; idx < this.body.length; ++idx) {
            const position     = this.body[idx    ]
            const prevPosition = this.body[idx - 1] || position
            const nextPosition = this.body[idx + 1] || position

            const dotProduct = (prevPosition.x - position.x) * (nextPosition.x - position.x)
            +                  (prevPosition.y - position.y) * (nextPosition.y - position.y)

            const x0 = gameBounds.x + 0.5 * (prevPosition.x + position.x) * cellSize + halfCellSize
            const y0 = gameBounds.y + 0.5 * (prevPosition.y + position.y) * cellSize + halfCellSize

            const x1 = gameBounds.x + position.x * cellSize + halfCellSize
            const y1 = gameBounds.y + position.y * cellSize + halfCellSize

            const x2 = gameBounds.x + 0.5 * (nextPosition.x + position.x) * cellSize + halfCellSize
            const y2 = gameBounds.y + 0.5 * (nextPosition.y + position.y) * cellSize + halfCellSize

            if (dotProduct == 0 && !prevPosition.equals(position) && !nextPosition.equals(position)) {
                context.moveTo(x0, y0)
                context.arcTo(x1, y1, x2, y2, snakeRadius)
            }
            else {
                context.moveTo(x0, y0)
                context.lineTo(x2, y2)
            }
        }

        context.stroke()
    }
}

class SnakeGame {
    constructor (cols, rows, genome) {
        this.cols                       = cols
        this.rows                       = rows
        this.snake                      = new Snake(0, 0)
        this.target                     = new Target(0, 0)
        this.state                      = SNAKE_GAME_STATE_ACTIVE
        this.genome                     = genome
        this.neuralNetwork              = genome.toNeuralNetwork()
        this.ticksSinceLastTarget       = 0
        this.durationInTicks            = 0
        this.score                      = 0

        this.reset()
    }

    setGenome(genome) {
        this.genome = genome
        this.neuralNetwork = genome.toNeuralNetwork()
    }

    getFitness() {
        return 1000 * this.score + 20 * this.durationInTicks - 25 * this.ticksSinceLastTarget
    }

    collect() {
        this.snake.collect()
        this.target.relocate(this.snake, this.cols, this.rows)
        this.ticksSinceLastTarget = 0
        this.score += 1
    }

    reset() {
        this.state = SNAKE_GAME_STATE_ACTIVE
        this.snake.reset(Math.floor(0.5 * this.cols), Math.floor(0.5 * this.rows))
        this.target.relocate(this.snake, this.cols, this.rows)

        this.ticksSinceLastTarget = 0
        this.durationInTicks = 0
        this.score = 0
    }

    outsideBounds(x, y) {
        return x < 0 || x >= this.cols
        ||     y < 0 || y >= this.rows
    }

    processNeuralNetwork() {
        const foodDx = this.target.position.x - this.snake.position.x
        const foodDy = this.target.position.y - this.snake.position.y

        const normalizeFactorCol = 1 / (this.cols - 1)
        const normalizeFactorRow = 1 / (this.rows - 1)

        const wallDistanceLeft  = this.snake.position.x
        const wallDistanceRight = this.cols - this.snake.position.x
        const wallDistanceUp    = this.snake.position.y
        const wallDistanceDown  = this.rows - this.snake.position.y

        const selfDistanceLeft  = this.snake.distanceToBody(this.snake.position.x, this.snake.position.y, -1, 0, wallDistanceLeft)
        const selfDistanceRight = this.snake.distanceToBody(this.snake.position.x, this.snake.position.y,  1, 0, wallDistanceRight)
        const selfDistanceUp    = this.snake.distanceToBody(this.snake.position.x, this.snake.position.y,  0,-1, wallDistanceUp)
        const selfDistanceDown  = this.snake.distanceToBody(this.snake.position.x, this.snake.position.y,  0, 1, wallDistanceDown)

        const [ probability0, probability1, probability2, probability3 ] = this.neuralNetwork.process(
            foodDx * normalizeFactorCol,
            foodDy * normalizeFactorRow,
            wallDistanceLeft * normalizeFactorCol,
            wallDistanceDown * normalizeFactorRow,
            wallDistanceRight * normalizeFactorCol,
            wallDistanceUp * normalizeFactorRow,
            selfDistanceLeft * normalizeFactorCol,
            selfDistanceDown * normalizeFactorRow,
            selfDistanceRight * normalizeFactorCol,
            selfDistanceUp * normalizeFactorRow,
            this.snake.velocity.x,
            this.snake.velocity.y,
            1
        )

        const highestProbability = Math.max(probability0, probability1, probability2, probability3)

        if      (highestProbability == probability0) this.snake.setDirection(VELOCITY_RIGHT)
        else if (highestProbability == probability1) this.snake.setDirection(VELOCITY_LEFT)
        else if (highestProbability == probability2) this.snake.setDirection(VELOCITY_UP)
        else if (highestProbability == probability3) this.snake.setDirection(VELOCITY_DOWN)
    }

    update() {
        switch (this.state) {
        case SNAKE_GAME_STATE_ACTIVE: {
            this.processNeuralNetwork()

            const result = this.snake.update(this)
            
            if (result != SNAKE_UPDATE_RESULT_OK) {
                this.state = SNAKE_GAME_STATE_GAME_OVER
                break
            }
            
            if (this.target.position.equals(this.snake.position)) {
                this.collect()
            }

            this.ticksSinceLastTarget += 1
            this.durationInTicks += 1
        } break
        case SNAKE_GAME_STATE_GAME_OVER: {
        } break
        }
    }

    renderOverlay(context, gameBounds, text) {
        context.fillStyle = "rgba(0, 0, 0, 0.5)"
        context.fillRect(gameBounds.x, gameBounds.y, gameBounds.width, gameBounds.height)

        context.font = `${Math.floor(0.1 * gameBounds.width)}px Consolas`
        context.fillStyle = GAME_TEXT_COLOUR
        context.textAlign = "center"
        context.fillText(text, gameBounds.x + gameBounds.width / 2, gameBounds.y + gameBounds.height / 2)
    }

    renderGameGrid(context, gameBounds, cellSize, gridLineWidth = 1) {
        context.fillStyle = GAME_BACKGROUND_COLOUR
        context.fillRect(gameBounds.x, gameBounds.y, gameBounds.width, gameBounds.height)

        context.strokeStyle = GAME_GRID_LINE_COLOUR
        context.lineWidth = gridLineWidth

        context.beginPath()
        for (let idx = 1; idx < this.cols; ++idx) {
            context.moveTo(gameBounds.x + idx * cellSize, gameBounds.y)
            context.lineTo(gameBounds.x + idx * cellSize, gameBounds.y + gameBounds.width)
        }

        for (let idx = 1; idx <= this.rows; ++idx) {
            context.moveTo(gameBounds.x,                    gameBounds.y + idx * cellSize)
            context.lineTo(gameBounds.x + gameBounds.width, gameBounds.y + idx * cellSize)
        }

        context.stroke()
    }

    render(context, gameBounds, gridLineWidth = 1) {
        const cellSize = gameBounds.width / this.cols
        const snakeRadius = cellSize * 0.40
        const excess = Math.max(gameBounds.height - gameBounds.width, 0)

        this.renderGameGrid(context, gameBounds, cellSize, gridLineWidth)

        context.font = `${excess}px Consolas`
        context.textAlign = "start"
        context.fillStyle = GAME_TEXT_COLOUR
        context.fillText(`Score: ${this.score}`, gameBounds.x, gameBounds.y + gameBounds.height, gameBounds.width)

        this.target.render(context, gameBounds, cellSize, snakeRadius)
        this.snake.render(context, gameBounds, cellSize, snakeRadius)

        if (this.state == SNAKE_GAME_STATE_GAME_OVER) {
            this.renderOverlay(context, gameBounds, "Game Over!")
        }
    }
}

class Simulation {
    constructor (context) {
        this.canvas = context.canvas
        this.context = context
        this.innovationCounter = new InnovationCounter()
        this.updatesPerFrame = 10000
        this.frameRate = 100
        this.populationSize = 1000
        this.snakeGameWidth = 20
        this.snakeGameHeight = 20
        this.generationCutoffCount = 10
        this.lastingSpacesUntilGameover = this.snakeGameWidth * this.snakeGameHeight
        this.requestId = null
        
        const baseGeneome = this.innovationCounter.createBaseGenome(sigmod, SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY).randomizeWeights()

        this.species = []
        this.snakeGames = []
        for (let idx = 0; idx < this.populationSize; ++idx) {
            const genome = this.innovationCounter.mutateGenome(baseGeneome)
            this.snakeGames.push(new SnakeGame(20, 20, genome))
        }

        window.addEventListener("resize", this.resizeCanvas.bind(this), false)
        
        this.resizeCanvas()
        this.gameLoop()
    }

    getRectangleViews() {
        const rectangleViews = []
        rectangleViews.push(new Rectangle(0, 0, this.canvas.height / 1.1, this.canvas.height))

        const remainingWidth = this.canvas.width - rectangleViews[0].width

        if (remainingWidth < 200) {
            return rectangleViews
        }

        const gameWindowWidth = remainingWidth / 12
        const gameWindowHeight = gameWindowWidth * 1.1

        const windowColumns = Math.floor(remainingWidth / gameWindowWidth)
        const windowRows = Math.floor(this.canvas.height / gameWindowHeight)

        for (let idx0 = 0, x = rectangleViews[0].width; idx0 < windowColumns; ++idx0, x += gameWindowWidth) {
            for (let idx1 = 0, y = 0; idx1 < windowRows; ++idx1, y += gameWindowHeight) {
                rectangleViews.push(new Rectangle(x, y, gameWindowWidth, gameWindowHeight))
            }
        }

        return rectangleViews
    }

    addGenomeToSpecies(genome) {
        for (let idx = 0; idx < this.species.length; ++idx) {
            const species = this.species[idx]
            if (species.leaderGenome.compatibilityDistance(genome, C1, C2, C3) < DT) {
                species.addGenome(genome)
                return;
            }
        }

        this.species.push(new Species(genome))
    }

    startGeneration() {
        this.snakeGames.sort((a, b) => b.getFitness() - a.getFitness())

        const newGenomes = this.snakeGames.map(game => game.genome).slice(0, this.generationCutoffCount)

        while (newGenomes.length < this.snakeGames.length) {
            let index0 = Math.floor(this.generationCutoffCount * Math.random())
            let index1 = Math.floor(this.generationCutoffCount * Math.random())
            if (index0 > index1) [index0, index1] = [index1, index0]

            const dominant = newGenomes[index0], recessive = newGenomes[index1]
            const genome = this.innovationCounter.createGenomeCrossover(dominant, recessive)
            newGenomes.push(this.innovationCounter.mutateGenome(genome))
        }

        for (let idx = 0; idx < this.snakeGames.length; ++idx) {
            const game = this.snakeGames[idx]
            game.setGenome(newGenomes[idx])
            game.reset()
        }

        // for (let idx = 0; idx < this.snakeGames.length; ++idx) {
        //     const game = this.snakeGames[idx]
        //     this.addGenomeToSpecies(game.genome)
        //     game.reset()
        // }

        // for (let idx = this.species.length - 1; idx >= 0; --idx) {
        //     const species = this.species[idx]
        //     if (species.memberGenomes.length == 0) {
        //         this.species.splice(idx, 1)
        //     }
        // }

        // // Evaluate genomes and assign score
        // for (let idx = 0; idx < this.snakeGames.length; ++idx) {
        //     const game = this.snakeGames[idx]

        //     const score = game.getFitness()
        //     const adjustedScore = score / game.genome.species.members.length

        //     game.genome.species.addAdjustedFitness(game.genome, adjustedScore)
        //     game.genome.species.fitnessPop.add(new FitnessGenome(game.genome, adjustedScore))

        //     if (score > highestScore) {
        //         highestScore = score;
        //         fittestGenome = game.genome;
        //     }
        // }
        
        // // put best genomes from each species into next generation
        // for (Species s : species) {
        //     Collections.sort(s.fitnessPop, fitComp);
        //     Collections.reverse(s.fitnessPop);
        //     FitnessGenome fittestInSpecies = s.fitnessPop.get(0);
        //     nextGenGenomes.add(fittestInSpecies.genome);
        // }
        
        // // Breed the rest of the genomes
        // while (nextGenGenomes.size() < populationSize) { // replace removed genomes by randomly breeding
        //     Species s = getRandomSpeciesBiasedAjdustedFitness(random);
            
        //     Genome p1 = getRandomGenomeBiasedAdjustedFitness(s, random);
        //     Genome p2 = getRandomGenomeBiasedAdjustedFitness(s, random);
            
        //     Genome child;
        //     if (scoreMap.get(p1) >= scoreMap.get(p2)) {
        //         child = Genome.crossover(p1, p2, random);
        //     } else {
        //         child = Genome.crossover(p2, p1, random);
        //     }
        //     if (random.nextFloat() < MUTATION_RATE) {
        //         child.mutation(random);
        //     }
        //     if (random.nextFloat() < ADD_CONNECTION_RATE) {
        //         //System.out.println("Adding connection mutation...");
        //         child.addConnectionMutation(random, connectionInnovation, 10);
        //     }
        //     if (random.nextFloat() < ADD_NODE_RATE) {
        //         //System.out.println("Adding node mutation...");
        //         child.addNodeMutation(random, connectionInnovation, nodeInnovation);
        //     }
        //     nextGenGenomes.add(child);
        // }

        // // const topGenomes = []
        // // for (let idx = 0; idx < 10; ++idx) {
        // // }
    }

    gameLoop() {
        this.requestId = window.setTimeout(this.gameLoop.bind(this), 1000 / this.frameRate)

        for (let idx = 0; idx < this.updatesPerFrame; ++idx) {
            this.update()
        }

        this.render()
    }

    update() {
        let shouldRestart = false
        for (let idx = 0; idx < this.snakeGames.length; ++idx) {
            this.snakeGames[idx].update()

            if (this.snakeGames[idx].ticksSinceLastTarget > this.lastingSpacesUntilGameover) {
                this.snakeGames[idx].state = SNAKE_GAME_STATE_GAME_OVER
            }

            if (this.snakeGames[idx].state != SNAKE_GAME_STATE_GAME_OVER) {
                shouldRestart = true
            }
        }

        if (!shouldRestart) {
            this.startGeneration()
        }

        this.snakeGames.sort((snakeGame0, snakeGame1) => {
            const snakeGameActive0 = snakeGame0.state != SNAKE_GAME_STATE_GAME_OVER
            const snakeGameActive1 = snakeGame1.state != SNAKE_GAME_STATE_GAME_OVER
            if (snakeGameActive0 != snakeGameActive1) {
                return snakeGameActive0 ? -1 : 1
            }

            return snakeGame1.getFitness() - snakeGame0.getFitness()
        })
    }

    render() {
        this.context.fillStyle = SIMULATION_BACKGROUND_COLOUR
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height)

        for (let idx0 = 0; idx0 < this.rectangleViews.length && idx0 < this.snakeGames.length; ++idx0) {
            this.snakeGames[idx0].render(this.context, this.rectangleViews[idx0])
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        this.canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
        this.rectangleViews = this.getRectangleViews()
        this.render()
    }
}

let simulation

async function main() {
    const canvas = document.getElementById("canvas")
    const context = canvas.getContext("2d")

    simulation = new Simulation(context)
    simulation.gameLoop()
}

window.addEventListener("load", main, false)

const VELOCITY_RIGHT = new Vector2( 1, 0)
const VELOCITY_LEFT  = new Vector2(-1, 0)
const VELOCITY_UP    = new Vector2( 0,-1)
const VELOCITY_DOWN  = new Vector2( 0, 1)
