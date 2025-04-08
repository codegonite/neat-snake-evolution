let simulation

const FRAMES_PER_MILLISECOND = 32 / 1000
const MILLISECONDS_PER_FRAME = 1.0 / FRAMES_PER_MILLISECOND
const MAX_MILLISECONDS_PER_FRAME = 1000 / 30

const GRID_TYPE_NONE = 0x00
const GRID_TYPE_FOOD = 0x01
const GRID_TYPE_SNAKE = 0x02
const GRID_TYPE_WALL = 0x04

const MAX_GRAPH_DATA_POINTS = 500

const SNAKE_GAME_STATE_ACTIVE = 0x01
const SNAKE_GAME_STATE_GAME_OVER = 0x02
const SNAKE_GAME_STATE_PAUSE = 0x04

const SNAKE_UPDATE_RESULT_OK = 0x00
const SNAKE_UPDATE_RESULT_HIT_WALL = 0x01
const SNAKE_UPDATE_RESULT_HIT_SELF = 0x02

const SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY = [ 33, 4 ]

const TARGET_COLOUR = "#01796F"
const SNAKE_COLOUR = "#FEFCFF"
const GAME_BACKGROUND_COLOUR = "#2A2B2D"
const GAME_GRID_LINE_COLOUR = "#1F1F1F"
const GAME_TEXT_COLOUR = "#FFD700"
const SIMULATION_BACKGROUND_COLOUR = "#0F0F0F"

const config = new Configuration({
    excessGeneCoefficient: 5.0,
    disjointGeneCoefficient: 5.0,
    weightDifferenceCoefficient: 2.5,
    compatibilityThreshold: 3.5,

    mutateAddConnectionRate: 0.10,
    mutateRemoveConnectionRate: 0.10,
    mutateAddNeuronRate: 0.10,
    mutateRemoveNeuronRate: 0.10,
    mutateChangeWeightRate: 0.50,
    mutateSetWeightRate: 0.25,
    randomWeightRange: 2.0,
    changeWeightRange: 2.0,
})

function calculateSnakeGameFitness(score, duration) {
    return Math.max(0.1, duration + 500 * score ** (1 + score / 50) - (.25 * duration) ** 1.3 * score ** 1.2)
}

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
        this.length += 1
    }

    reset(startX, startY) {
        this.length = 1
        this.body[0].set(startX, startY)
        if (this.body.length > 1) {
            this.body.splice(1, this.body.length - 1)
        }
    }

    update(snakeGame) {
        const nextPositionX = this.body[0].x + this.velocity.x
        const nextPositionY = this.body[0].y + this.velocity.y

        if (snakeGame.outsideBounds(nextPositionX, nextPositionY)) {
            return SNAKE_UPDATE_RESULT_HIT_WALL
        }

        for (let idx = 1; idx < this.body.length; ++idx) {
            if (this.body[idx].x == nextPositionX
            &&  this.body[idx].y == nextPositionY) {
                return SNAKE_UPDATE_RESULT_HIT_SELF
            }
        }

        if (this.body.length < this.length) {
            this.body.push(this.body[this.body.length - 1].clone())
        }

        for (let idx = this.body.length - 1; idx > 0; --idx) {
            this.body[idx].copy(this.body[idx - 1])
        }

        this.body[0].set(nextPositionX, nextPositionY)
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
    constructor (cols, rows, genome, network) {
        this.cols                 = cols
        this.rows                 = rows
        this.snake                = new Snake(0, 0)
        this.targetPosition       = new Vector2(0, 0)
        this.state                = SNAKE_GAME_STATE_ACTIVE
        this.genome               = genome
        this.network              = network
        this.ticksSinceLastTarget = 0
        this.durationInTicks      = 0
        this.score                = 0
        this.tempGrid             = Array.from({ length: this.cols * this.rows })

        this.reset()
    }

    getFitness() {
        return Math.max(0.1, this.durationInTicks + 500 * this.score ** (1 + this.score / 10) + 2 ** this.score - (.25 * this.durationInTicks) ** 1.3 * this.score ** 1.2)
    }

    reset() {
        this.state = SNAKE_GAME_STATE_ACTIVE
        this.snake.reset(Math.floor(0.5 * this.cols), Math.floor(0.5 * this.rows))
        this.relocateTarget()

        this.ticksSinceLastTarget = 0
        this.durationInTicks = 0
        this.score = 0
    }

    outsideBounds(x, y) {
        return x < 0 || x >= this.cols
        ||     y < 0 || y >= this.rows
    }

    getTileFromGrid(x, y) {
        return this.tempGrid[this.rows * y + x]
    }
    
    buildTempGrid() {
        for (let idx = 0; idx < this.tempGrid.length; ++idx) {
            this.tempGrid[idx] = GRID_TYPE_NONE
        }

        for (let idx = 0; idx < this.snake.body.length; ++idx) {
            const position = this.snake.body[idx]
            this.tempGrid[this.rows * position.y + position.x] = GRID_TYPE_SNAKE
        }

        this.tempGrid[this.rows * this.targetPosition.y + this.targetPosition.x] = GRID_TYPE_FOOD

        return this.tempGrid
    }

    processNeuralNetwork() {
        const inputs = []
        
        this.buildTempGrid(this.tempGrid)
        for (let idx0 = 0; idx0 < GAME_SEARCH_DIRECTIONS.length; ++idx0) {
            const direction = GAME_SEARCH_DIRECTIONS[idx0]
            const current = this.snake.position.clone()

            let wallDistance = 0, seenTarget = false, seenSnake = false
            while (!this.outsideBounds(current.x, current.y)) {
                current.add(direction)
                wallDistance += 1

                const gridType = this.getTileFromGrid(current.x, current.y)

                if (gridType == GRID_TYPE_FOOD) {
                    seenTarget = true
                    break
                }

                if (gridType == GRID_TYPE_SNAKE) {
                    seenSnake = true
                    break
                }
            }

            inputs.push(1 / wallDistance, seenTarget, seenSnake)
        }

        const distanceToTargetX = this.targetPosition.x - this.snake.position.x
        const distanceToTargetY = this.targetPosition.y - this.snake.position.y

        inputs.push(
            this.snake.velocity.dot(VELOCITY_RIGHT) == 1 ? 1 : 0,
            this.snake.velocity.dot(VELOCITY_LEFT) == 1 ? 1 : 0,
            this.snake.velocity.dot(VELOCITY_UP) == 1 ? 1 : 0,
            this.snake.velocity.dot(VELOCITY_DOWN) == 1 ? 1 : 0,
            distanceToTargetX > 0 ? 1 : 0,
            distanceToTargetY > 0 ? 1 : 0,
            distanceToTargetX < 0 ? 1 : 0,
            distanceToTargetY < 0 ? 1 : 0,
            1
        )

        const results = this.network.process(inputs)

        let indexOfHighestValue = 0
        for (let idx = 1; idx < results.length; ++idx) {
            if (results[idx] > results[indexOfHighestValue]) {
                indexOfHighestValue = idx
            }
        }

        const direction = ORTHOGONAL_DIRECTIONS[indexOfHighestValue]

        if (this.snake.velocity.dot(direction) >= 0) {
            this.snake.velocity.copy(direction)
        }
    }

    relocateTarget() {
        loop: while (true) {
            this.targetPosition.set(Math.floor(this.cols * Math.random()),
                                    Math.floor(this.rows * Math.random()))
            for (let idx = 0; idx < this.snake.body.length; ++idx) {
                if (this.snake.body[idx].equals(this.targetPosition)) {
                    continue loop
                }
            }

            break
        }
    }

    update() {
        switch (this.state) {
        case SNAKE_GAME_STATE_ACTIVE: {
            this.ticksSinceLastTarget += 1
            this.durationInTicks += 1

            this.processNeuralNetwork()

            const result = this.snake.update(this)
            
            if (result != SNAKE_UPDATE_RESULT_OK) {
                this.state = SNAKE_GAME_STATE_GAME_OVER
                break
            }

            if (this.snake.position.equals(this.targetPosition)) {
                this.snake.collect()
                this.ticksSinceLastTarget = 0
                this.score += 1

                if (this.snake.length == this.cols * this.rows) {
                    this.state = SNAKE_GAME_STATE_GAME_OVER
                    break
                }

                this.relocateTarget()
            }
        } break
        case SNAKE_GAME_STATE_GAME_OVER: {
        } break
        }
    }

    renderTarget(context, gameBounds, cellSize, targetRadius) {
        const targetPositionX = gameBounds.x + this.targetPosition.x * cellSize + cellSize / 2
        const targetPositionY = gameBounds.y + this.targetPosition.y * cellSize + cellSize / 2

        context.fillStyle = TARGET_COLOUR
        context.beginPath()
        context.ellipse(targetPositionX, targetPositionY, targetRadius, targetRadius, 0, 0, 2 * Math.PI, false)
        context.closePath()
        context.fill()
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
        this.renderTarget(context, gameBounds, cellSize, snakeRadius)
        this.snake.render(context, gameBounds, cellSize, snakeRadius)

        context.font = `${excess}px Consolas`
        context.textAlign = "start"
        context.fillStyle = GAME_TEXT_COLOUR
        context.fillText(`Score: ${this.score}`, gameBounds.x, gameBounds.y + gameBounds.height, gameBounds.width)

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
        
        this.populationSize = 500
        this.generationCutoffCount = 100
        this.frameRate = 1000
        this.updatesPerFrame = 16
        this.snakeGameWidth = 20
        this.snakeGameHeight = 20
        this.lastingSpacesUntilGameover = this.snakeGameWidth * this.snakeGameHeight
        
        this.config = new Configuration({
            excessGeneCoefficient: 5.0,
            disjointGeneCoefficient: 5.0,
            weightDifferenceCoefficient: 2.5,
            compatibilityThreshold: 3.5,

            mutateAddConnectionRate: 0.10,
            mutateRemoveConnectionRate: 0.10,
            mutateAddNeuronRate: 0.10,
            mutateRemoveNeuronRate: 0.10,
            mutateChangeWeightRate: 0.50,
            mutateSetWeightRate: 0.50,
            randomWeightRange: 2.0,
            changeWeightRange: 2.0,

            addConnectionAttepmpts: 8,
        })
        
        this.requestId = null
        
        this.startingGenome = Genome.fromTopology(SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY, sigmod, this.innovationCounter)
        
        this.species = []
        this.snakeGames = []

        for (let idx = 0; idx < this.populationSize; ++idx) {
            const genomeId = this.innovationCounter.getGenomeId()
            const genome = this.startingGenome.cloneUsingId(genomeId).randomizeWeights(this.config)
            this.snakeGames.push(new SnakeGame(this.snakeGameWidth, this.snakeGameHeight, genome, genome.toNeuralNetwork()))
        }

        window.addEventListener("resize", this.resizeCanvas.bind(this), false)
        
        this.resizeCanvas()
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

    startGeneration() {
        this.snakeGames.sort((game0, game1) => game1.getFitness() - game0.getFitness())

        const newGenomes = this.snakeGames.slice(0, this.generationCutoffCount).map(e => e.genome)

        while (newGenomes.length < this.populationSize) {
            let index0 = Math.floor(this.generationCutoffCount * Math.random())
            let index1 = Math.floor(this.generationCutoffCount * Math.random())
            if (index0 > index1) [index0, index1] = [index1, index0]

            const dominant = newGenomes[index0], recessive = newGenomes[index1]
            const genome = Genome.crossover(dominant, recessive, this.innovationCounter)
            newGenomes.push(genome.mutate(this.innovationCounter, this.config))
        }

        this.snakeGames = newGenomes.map(e => new SnakeGame(this.snakeGameWidth, this.snakeGameHeight, e, e.toNeuralNetwork()))
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

class GenerationStatistics {
    constructor () {
        this.totalScore = 0
        this.totalNeuronCount = 0
        this.bestScore = 0
        this.count = 0
    }

    copy(other) {
        this.totalScore = other.totalScore
        this.totalNeuronCount = other.totalNeuronCount
        this.bestScore = other.bestScore
        this.count = other.count
    }

    record(genome, score) {
        this.totalScore += score
        this.totalNeuronCount += genome.neuronGenes.length
        this.bestScore = Math.max(this.bestScore, score)
        ++this.count
    }

    reset() {
        this.totalScore = 0
        this.totalNeuronCount = 0
        this.bestScore = 0
        this.count = 0
    }

    get averageNeuronCount() { return this.totalNeuronCount / Math.max(1, this.count) }
    get averageScore() { return this.totalScore / Math.max(1, this.count) }
}

class GraphSimulation {
    constructor (
        population = null,
        snakeGame = new SnakeGame(20, 20),
        generationCount = 2500,
    ) {
        this.population = population
        this.snakeGame = snakeGame

        this.averageScorePerGeneration = []
        this.bestScorePerGeneration = []
        this.maxUpdatesPerFrame = 1
        // this.maxUpdatesPerFrame = 6000000

        this.bestGenome = this.population.genomes[0]
        this.fittestGenome = this.population.genomes[0]

        this.prevGenerationInfo = new GenerationStatistics()
        this.generationInfo = new GenerationStatistics()

        this.allTimeBestScore = 0

        this.genomeIndex = 0
        this.requestId = null

        this.totalGenerationCount = generationCount
    }

    isGenerationDone() { return this.genomeIndex == this.population.genomes.length }
    isGenerationStarting() { return this.genomeIndex == 0 }

    nextGeneration() {
        this.averageScorePerGeneration.push(this.generationInfo.averageScore)
        this.bestScorePerGeneration.push(this.generationInfo.bestScore)
        // this.allTimeBestScore = Math.max(this.allTimeBestScore, this.generationInfo.bestScore)

        this.population.repopulate()
        this.population.specifyGenomes()
        this.prevGenerationInfo.copy(this.generationInfo)
        this.generationInfo.reset()
        this.genomeIndex = 0
    }

    graduallyProcessGeneration(maximumTime) {
        let updates = 0
        const finishTime = Date.now() + maximumTime

        const MAXIMUM_SNAKE_LENGTH = this.snakeGame.cols * this.snakeGame.rows
        const LASTING_SPACES_UNTIL_GAMEOVER = Math.floor(0.8 * MAXIMUM_SNAKE_LENGTH)
        const MAXIMUM_GAME_DURATION = MAXIMUM_SNAKE_LENGTH * MAXIMUM_SNAKE_LENGTH

        while (Date.now() < finishTime && updates < this.maxUpdatesPerFrame && this.genomeIndex < this.population.genomes.length) {
            const genome = this.population.genomes[this.genomeIndex++]

            this.snakeGame.reset()
            // this.snakeGame.genome = genome
            this.snakeGame.network = genome.toNeuralNetwork()

            while (this.snakeGame.state                != SNAKE_GAME_STATE_GAME_OVER
            &&     this.snakeGame.ticksSinceLastTarget <  LASTING_SPACES_UNTIL_GAMEOVER
            &&     this.snakeGame.durationInTicks      <  MAXIMUM_GAME_DURATION) {
                this.snakeGame.update()
                ++updates
            }

            this.generationInfo.record(genome, this.snakeGame.score)

            genome.fitness = this.snakeGame.getFitness()

            if (this.snakeGame.score >= this.allTimeBestScore) {
                if (genome.fitness > this.bestGenome.fitness) {
                    this.bestGenome = genome
                }

                this.allTimeBestScore = this.snakeGame.score
            }

            if (genome.fitness > this.fittestGenome.fitness) {
                this.fittestGenome = genome
            }
        }
    }

    drawFrame(context) {
        context.fillStyle = GAME_BACKGROUND_COLOUR
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)

        drawGraph(context, this.bestScorePerGeneration, this.allTimeBestScore, "#FFA500")
        drawGraph(context, this.averageScorePerGeneration, this.allTimeBestScore, SNAKE_COLOUR)

        context.fillStyle = GAME_TEXT_COLOUR
        context.font = "36px serif"
        context.fillText(`Generation #${this.population.generationCount} | Generation best score: ${this.prevGenerationInfo.bestScore} | All time high score: ${this.allTimeBestScore} | Population count: ${this.population.populationCount} | Avg neuron count: ${Math.round(this.prevGenerationInfo.averageNeuronCount)} | Species Count: ${this.population.species.length}`, 0, context.canvas.height - 9, context.canvas.width)
    }

    startSimulation(context) {
        const loop = () => {
            this.requestId = requestAnimationFrame(loop)
            canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
            canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
            this.drawFrame(context)

            if (this.isGenerationDone()) {
                this.nextGeneration()
            }

            this.graduallyProcessGeneration(MAX_MILLISECONDS_PER_FRAME)

            if (this.population.generationCount >= this.totalGenerationCount) {
                cancelAnimationFrame(this.requestId)
            }
        }

        loop()
    }

    _startSimulation(context) {
        const LASTING_SPACES_UNTIL_GAMEOVER = Math.floor(0.8 * this.snakeGame.cols * this.snakeGame.rows)
        const SAMPLE_COUNT = 5

        const loop = () => {
            this.requestId = requestAnimationFrame(loop)
            context.canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
            context.canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight

            for (let idx0 = 0; idx0 < this.population.genomes.length; ++idx0) {
                const genome = this.population.genomes[idx0]
                genome.fitness = 0

                let averageScore = 0
                for (let idx1 = 0; idx1 < SAMPLE_COUNT; ++idx1) {
                    this.snakeGame.reset()
                    this.snakeGame.network = genome.toNeuralNetwork()

                    while (this.snakeGame.state != SNAKE_GAME_STATE_GAME_OVER
                    &&     this.snakeGame.ticksSinceLastTarget < LASTING_SPACES_UNTIL_GAMEOVER) {
                        this.snakeGame.update()
                    }

                    averageScore += this.snakeGame.score
                    genome.fitness += this.snakeGame.getFitness()
                }

                averageScore /= SAMPLE_COUNT
                genome.fitness /= SAMPLE_COUNT

                this.generationInfo.record(genome, averageScore)
                if (averageScore >= this.allTimeBestScore) {
                    if (genome.fitness > this.bestGenome.fitness) {
                        this.bestGenome = genome
                    }

                    this.allTimeBestScore = averageScore
                }

                if (genome.fitness > this.fittestGenome.fitness) {
                    this.fittestGenome = genome
                }
            }

            this.nextGeneration()

            this.drawFrame(context)

            if (this.population.generationCount >= this.totalGenerationCount) {
                cancelAnimationFrame(this.requestId)
            }
        }

        loop()
    }
}

class SimulationUsingPopulation {
    constructor (
        context = null,
        population = null,
        generationCount = 2500,
    ) {
        this.context = context
        this.canvas = context.canvas
        this.population = population
        this.totalGenerationCount = generationCount

        // this.population.genomes[0] = Genome.fromPrototype(perfectGenome, population.innovationCounter)

        this.bestGenome = this.population.genomes[0]
        this.fittestGenome = this.population.genomes[0]
        this.prevGenerationInfo = new GenerationStatistics()
        this.generationInfo = new GenerationStatistics()
        this.snakeGameSize = 10
        this.lastingSpacesUntilGameover = this.snakeGameSize * this.snakeGameSize

        this.allTimeBestScore = 0

        // this.frameRate = 1000
        // this.updatesPerFrame = 250

        this.frameRate = 1000
        this.updatesPerFrame = 1

        this.requestId = null

        this.snakeGames = this.population.genomes.map(e => new SnakeGame(this.snakeGameSize, this.snakeGameSize, e, e.toNeuralNetwork()))

        window.addEventListener("resize", this.resizeCanvas.bind(this), false)
        this.resizeCanvas()
    }

    startGeneration() {
        this.population.repopulate()
        this.population.specifyGenomes()
        this.prevGenerationInfo.copy(this.generationInfo)
        this.generationInfo.reset()

        this.snakeGames = this.population.genomes.map(e => new SnakeGame(this.snakeGameSize, this.snakeGameSize, e, e.toNeuralNetwork()))
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        this.canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
        this.rectangleViews = this.getRectangleViews()
        this.render()
    }

    getRectangleViews() {
        const usableHeight = this.canvas.height - 100
        const rectangleViews = []
        rectangleViews.push(new Rectangle(0, 0, usableHeight / 1.1, usableHeight))

        const remainingWidth = this.canvas.width - rectangleViews[0].width

        if (remainingWidth < 200) {
            return rectangleViews
        }

        const gameWindowWidth = remainingWidth / 12
        const gameWindowHeight = gameWindowWidth * 1.1

        const windowColumns = Math.floor(remainingWidth / gameWindowWidth)
        const windowRows = Math.floor(usableHeight / gameWindowHeight)

        for (let idx0 = 0, x = rectangleViews[0].width; idx0 < windowColumns; ++idx0, x += gameWindowWidth) {
            for (let idx1 = 0, y = 0; idx1 < windowRows; ++idx1, y += gameWindowHeight) {
                rectangleViews.push(new Rectangle(x, y, gameWindowWidth, gameWindowHeight))
            }
        }

        return rectangleViews
    }

    gameLoop() {
        this.requestId = window.setTimeout(this.gameLoop.bind(this), 1000 / this.frameRate)

        for (let idx = 0; idx < this.updatesPerFrame; ++idx) {
            this.update()
        }

        this.render()
    }
    
    render() {
        this.context.fillStyle = GAME_BACKGROUND_COLOUR
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height)

        for (let idx0 = 0; idx0 < this.rectangleViews.length && idx0 < this.snakeGames.length; ++idx0) {
            this.snakeGames[idx0].render(this.context, this.rectangleViews[idx0])
        }

        this.context.fillStyle = GAME_TEXT_COLOUR
        this.context.textAlign = "start"
        this.context.font = "36px serif"
        this.context.fillText(`Generation #${this.population.generationCount} | Generation best score: ${this.generationInfo.bestScore} | All time high score: ${this.allTimeBestScore} | Population count: ${this.population.populationCount} | Avg neuron count: ${Math.round(this.generationInfo.averageNeuronCount)} | Species Count: ${this.population.species.length}`, 0, this.context.canvas.height - 9, this.context.canvas.width)
    }

    // 
    // TODO: Remove all instances where the snake game accesses the genome.
    // 
    update() {
        let shouldRestart = false
        for (let idx = 0; idx < this.snakeGames.length; ++idx) {
            const snakeGame = this.snakeGames[idx]

            snakeGame.update()
            this.generationInfo.record(snakeGame.genome, snakeGame.score)

            if (snakeGame.ticksSinceLastTarget > this.lastingSpacesUntilGameover) {
                snakeGame.state = SNAKE_GAME_STATE_GAME_OVER
            }

            if (snakeGame.state != SNAKE_GAME_STATE_GAME_OVER) {
                shouldRestart = true
            }

            snakeGame.genome.fitness = snakeGame.getFitness()

            if (snakeGame.score > this.allTimeBestScore) {
                this.bestGenome = snakeGame.genome
                this.allTimeBestScore = snakeGame.score
            }

            if (snakeGame.genome.fitness > this.fittestGenome.fitness) {
                this.fittestGenome = snakeGame.genome
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
}

function drawGraph(context, data, highestValue, color = GAME_GRID_LINE_COLOUR) {
    if (!data || data.length == 0) {
        return
    }

    context.strokeStyle = color
    context.lineWidth = 1
    context.lineCap = "round"
    context.beginPath()
    let prevX = 0, prevY = 0

    if (data.length > MAX_GRAPH_DATA_POINTS) {
        const STEPS = Math.max(1, Math.floor(data.length / MAX_GRAPH_DATA_POINTS))

        for (let idx0 = 0; idx0 < data.length; idx0 += STEPS) {
            let x = 0, y = 0

            let totalValue = 0
            const endOffset = Math.min(idx0 + STEPS, data.length)
            for (let idx1 = idx0; idx1 < endOffset; ++idx1) {
                totalValue += data[idx1]
            }

            x = (idx0 / data.length) * (context.canvas.width - 100)
            y = (context.canvas.height - 100) * totalValue / (endOffset - idx0) / highestValue

            context.moveTo(prevX, prevY)
            context.lineTo(x, y)

            prevX = x
            prevY = y
        }
    }
    else {
        for (let idx = 0; idx < data.length; ++idx) {
            const y = (context.canvas.height - 100) * data[idx] / highestValue
            const x = (idx / data.length) * (context.canvas.width - 100)

            context.moveTo(prevX, prevY)
            context.lineTo(x, y)

            prevX = x
            prevY = y
        }
    }

    context.stroke()

    context.fillStyle = color
    context.font = "36px serif"
    context.textAlign = "start"
    context.fillText(data[data.length - 1].toString(), prevX, prevY + 18)
}

function main() {
    const canvas = document.getElementById("canvas")
    const context = canvas.getContext("2d")

    // const config = new Configuration({
    //     excessGeneCoefficient: 5.0,
    //     disjointGeneCoefficient: 5.0,
    //     weightDifferenceCoefficient: 2.5,
    //     compatibilityThreshold: 3.5,

    //     mutateAddConnectionRate: 0.10,
    //     mutateRemoveConnectionRate: 0.10,
    //     mutateAddNeuronRate: 0.10,
    //     mutateRemoveNeuronRate: 0.10,
    //     mutateChangeWeightRate: 0.50,
    //     mutateSetWeightRate: 0.25,
    //     randomWeightRange: 2.0,
    //     changeWeightRange: 2.0,
    // })

    const innovationCounter = new InnovationCounter()
    const startingGenome = Genome.fromTopology(SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY, sigmod, innovationCounter)

    const population = new Population(500, startingGenome, innovationCounter, config)
    simulation = new SimulationUsingPopulation(context, population, 2000000)
    simulation.gameLoop()
}

function main0() {
    const canvas = document.getElementById("canvas")
    const context = canvas.getContext("2d")
    simulation = new Simulation(context)
    simulation.gameLoop()
}

function main1() {
    const canvas = document.getElementById("canvas")
    const context = canvas.getContext("2d")

    // const config = new Configuration({
    //     excessGeneCoefficient: 4.0,
    //     disjointGeneCoefficient: 4.0,
    //     weightDifferenceCoefficient: 3.0,
    //     compatibilityThreshold: 4.0,

    //     mutateAddConnectionRate: 0.05,
    //     mutateRemoveConnectionRate: 0.05,
    //     mutateAddNeuronRate: 0.05,
    //     mutateRemoveNeuronRate: 0.05,
    //     mutateChangeWeightRate: 0.50,
    //     mutateSetWeightRate: 0.20,
    //     randomWeightRange: 2.0,
    //     changeWeightRange: 0.5,
    // })

    // const config = new Configuration({
    //     excessGeneCoefficient: 5.0,
    //     disjointGeneCoefficient: 5.0,
    //     weightDifferenceCoefficient: 2.5,
    //     compatibilityThreshold: 3.5,

    //     mutateAddConnectionRate: 0.10,
    //     mutateRemoveConnectionRate: 0.10,
    //     mutateAddNeuronRate: 0.10,
    //     mutateRemoveNeuronRate: 0.10,
    //     mutateChangeWeightRate: 0.50,
    //     mutateSetWeightRate: 0.25,
    //     randomWeightRange: 2.0,
    //     changeWeightRange: 2.0,
    // })

    // const config = new Configuration({
    //     excessGeneCoefficient: 5.0,
    //     disjointGeneCoefficient: 5.0,
    //     weightDifferenceCoefficient: 2.5,
    //     compatibilityThreshold: 3.5,

    //     mutateAddConnectionRate: 0.10,
    //     mutateRemoveConnectionRate: 0.10,
    //     mutateAddNeuronRate: 0.10,
    //     mutateRemoveNeuronRate: 0.10,
    //     mutateChangeWeightRate: 0.50,
    //     mutateSetWeightRate: 0.50,
    //     randomWeightRange: 2.0,
    //     changeWeightRange: 2.0,
    // })

    const innovationCounter = new InnovationCounter()
    const startingGenome = Genome.fromTopology(SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY, sigmod, innovationCounter)
    // const startingGenome = new Genome(innovationCounter.getGenomeId(), SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY[0], SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY[SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY.length - 1])

    // for (let idx = startingGenome.inputCount + startingGenome.outputCount; idx > 0; --idx) {
    //     startingGenome.addNeuronGene(new NeuronGene(innovationCounter.getNeuronId(), sigmod))
    // }

    const population = new Population(5000, startingGenome, innovationCounter, config)
    population.specifyGenomes()
    
    const snakeGame = new SnakeGame(20, 20)
    simulation = new GraphSimulation(population, snakeGame, 2000000)

    // simulation._startSimulation(context)
    simulation.startSimulation(context)
}

window.addEventListener("load", main, false)
// window.addEventListener("load", main1, false)

const VELOCITY_LEFT  = new Vector2(-1, 0)
const VELOCITY_UP    = new Vector2( 0,-1)
const VELOCITY_RIGHT = new Vector2( 1, 0)
const VELOCITY_DOWN  = new Vector2( 0, 1)

const GAME_SEARCH_DIRECTIONS = [
    new Vector2( 1, 0),
    new Vector2( 1,-1),
    new Vector2( 0,-1),
    new Vector2(-1,-1),
    new Vector2(-1, 0),
    new Vector2(-1, 1),
    new Vector2( 0, 1),
    new Vector2( 1, 1),
]

const ORTHOGONAL_DIRECTIONS = [
    VELOCITY_RIGHT,
    VELOCITY_LEFT,
    VELOCITY_UP,
    VELOCITY_DOWN,
]
