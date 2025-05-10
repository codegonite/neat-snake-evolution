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
const SNAKE_GAME_STATE_GAME_WON = 0x08

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
const GRAPH_SCORE_COLOR = "#FFA500"

const config = new Configuration({
    excessGeneCoefficient: 5.0,
    disjointGeneCoefficient: 5.0,
    weightDifferenceCoefficient: 2.5,
    compatibilityThreshold: 3.0,

    addConnectionMutationRate: 0.10,
    removeConnectionMutationRate: 0.10,
    addNeuronMutationRate: 0.10,
    removeNeuronMutationRate: 0.10,
    weightGaussianMutationRate: 0.08,
    weightUniformMutationRate: 0.00,
    randomWeightRange: 1.0,
    changeWeightRange: 1.0,
    addConnectionAttepmpts: 1,
    activations: [ sigmod ],
})

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

    setDirection(direction) {
        if (this.velocity.dot(direction) >= 0) {
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

    update(snakeGame) {
        snakeGame.tempGridIsValid = false

        const nextPosition = _temp_vector0.addVectors(this.position, this.velocity)
        if (snakeGame.outsideBounds(nextPosition)) {
            return SNAKE_UPDATE_RESULT_HIT_WALL
        }

        for (let idx = 1; idx < this.body.length; ++idx) {
            if (this.body[idx].equals(nextPosition)) {
                return SNAKE_UPDATE_RESULT_HIT_SELF
            }
        }

        while (this.body.length < this.length) {
            this.body.push(this.body[this.body.length - 1].clone())
        }

        for (let idx = this.body.length - 1; idx > 0; --idx) {
            this.body[idx].copy(this.body[idx - 1])
        }

        this.body[0].copy(nextPosition)
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

            const difference0 = _temp_vector0.subVectors(prevPosition, position)
            const difference1 = _temp_vector1.subVectors(nextPosition, position)

            const dotProduct = difference0.dot(difference1)

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
    constructor (cols, rows) {
        this.cols                 = cols
        this.rows                 = rows
        this.tempGrid             = Array.from({ length: this.cols * this.rows })
        this.snake                = new Snake(0, 0)
        this.targetPosition       = new Vector2(0, 0)
        this.state                = SNAKE_GAME_STATE_ACTIVE
        this.ticksSinceLastTarget = 0
        this.durationInTicks      = 0
        this.score                = 0
        this.tempGridIsValid      = false

        this.reset()
    }

    clone() { return new SnakeGame(this.cols, this.rows) }
    // getFitness() { return this.durationInTicks + 200 * this.score * this.score + 2 ** this.score / this.durationInTicks }
    // getFitness() { return Math.max(0, this.durationInTicks + 500 * this.score * this.score + 2 ** this.score - this.score * this.durationInTicks * (1.20 ** this.score)) }
    getFitness() { return Math.max(0, this.durationInTicks + 500 * this.score * this.score + 2 ** this.score - this.score * this.durationInTicks * (1.05 ** this.score)) }
    // getFitness() { return Math.max(0, this.durationInTicks + 350 * this.score * this.score - this.durationInTicks * this.score ** 1.2) }

    outsideBounds(position) {
        return position.x < 0 || position.x >= this.cols || position.y < 0 || position.y >= this.rows
    }

    getTileFromGrid(position) {
        return this.tempGrid[this.rows * position.y + position.x]
    }

    reset() {
        this.state = SNAKE_GAME_STATE_ACTIVE
        this.snake.reset(Math.floor(0.5 * this.cols), Math.floor(0.5 * this.rows))
        this.relocateTarget()

        this.ticksSinceLastTarget = 0
        this.durationInTicks = 0
        this.score = 0
    }

    ensureTempGridIsBuilt() {
        if (!this.tempGridIsValid) {
            this.tempGridIsValid = true
            for (let idx = 0; idx < this.tempGrid.length; ++idx) {
                this.tempGrid[idx] = GRID_TYPE_NONE
            }

            for (let idx = 0; idx < this.snake.body.length; ++idx) {
                const position = this.snake.body[idx]
                this.tempGrid[this.rows * position.y + position.x] = GRID_TYPE_SNAKE
            }

            this.tempGrid[this.rows * this.targetPosition.y + this.targetPosition.x] = GRID_TYPE_FOOD
        }
    }

    processNeuralNetwork(network, searchDirections, outputDirections) {
        const inputs = this.generateNeuralNetworkInputs(searchDirections)
        const outputs = network.process(inputs)

        let indexOfHighestValue = 0
        for (let idx = 1; idx < outputs.length; ++idx) {
            if (outputs[idx].value > outputs[indexOfHighestValue].value) {
                indexOfHighestValue = idx
            }
        }

        this.snake.setDirection(outputDirections[indexOfHighestValue])
    }

    generateNeuralNetworkInputs(directions, inputs = []) {
        this.ensureTempGridIsBuilt()

        for (let idx0 = 0; idx0 < directions.length; ++idx0) {
            const direction = directions[idx0]
            const current = _temp_vector0.copy(this.snake.position)

            let wallDistance = 0, seenTarget = false, seenSnake = false
            while (!this.outsideBounds(current)) {
                current.add(direction)
                wallDistance += 1

                const gridType = this.getTileFromGrid(current)

                if (gridType == GRID_TYPE_FOOD) {
                    seenTarget = true
                    break
                }

                if (gridType == GRID_TYPE_SNAKE) {
                    seenSnake = true
                    break
                }
            }

            inputs.push(1 / Math.max(1, wallDistance), seenTarget, seenSnake)
        }
        
        const distanceToTargetX = this.targetPosition.x - this.snake.position.x
        const distanceToTargetY = this.targetPosition.y - this.snake.position.y

        inputs.push(
            this.snake.velocity.equals(VELOCITY_RIGHT) ? 1 : 0,
            this.snake.velocity.equals(VELOCITY_LEFT) ? 1 : 0,
            this.snake.velocity.equals(VELOCITY_UP) ? 1 : 0,
            this.snake.velocity.equals(VELOCITY_DOWN) ? 1 : 0,
            distanceToTargetX > 0 ? 1 : 0,
            distanceToTargetY > 0 ? 1 : 0,
            distanceToTargetX < 0 ? 1 : 0,
            distanceToTargetY < 0 ? 1 : 0,
            1
        )

        return inputs
    }

    relocateTarget() {
        this.tempGridIsValid = false

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

        context.closePath()
        context.stroke()
    }

    update() {
        switch (this.state) {
        case SNAKE_GAME_STATE_ACTIVE: {
            this.ticksSinceLastTarget += 1
            this.durationInTicks += 1

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
                    this.state = SNAKE_GAME_STATE_GAME_WON
                    break
                }

                this.relocateTarget()
            }
        } break
        case SNAKE_GAME_STATE_GAME_OVER: {
        } break
        case SNAKE_GAME_STATE_GAME_WON: {
        } break
        case SNAKE_GAME_STATE_PAUSE: {
        } break
        }
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

class PopulationStatistics {
    constructor () {
        this.totalScore = 0
        this.totalFitness = 0
        this.totalNeuronCount = 0
        this.bestFitness = 0
        this.bestScore = 0
        this.bestGenomeFitness = 0
        this.bestGenome = null
        this.fittestGenome = null
        this.count = 0
    }

    copy(other) {
        this.totalScore = other.totalScore
        this.totalFitness = other.totalFitness
        this.totalNeuronCount = other.totalNeuronCount
        this.bestFitness = other.bestFitness
        this.bestScore = other.bestScore
        this.bestGenomeFitness = other.bestGenomeFitness
        this.bestGenome = other.bestGenome
        this.fittestGenome = other.fittestGenome
        this.count = other.count
    }

    record(genome, fitness, score) {
        ++this.count

        this.totalScore += score
        this.totalFitness += fitness
        this.totalNeuronCount += genome.neuronGenes.length

        if (this.bestScore <= score) {
            if (this.bestGenome == null || this.bestScore < score || this.bestGenomeFitness < fitness) {
                this.bestGenome = genome
                this.bestGenomeFitness = fitness
            }

            this.bestScore = score
        }

        if (this.bestFitness < fitness) {
            this.bestFitness = fitness
            this.fittestGenome = genome
        }
    }

    add(other) {
        this.totalScore += other.totalScore
        this.totalFitness += other.totalFitness
        this.totalNeuronCount += other.totalNeuronCount
        this.count += other.count

        if (this.bestScore <= other.bestScore) {
            if (this.bestGenome == null || this.bestScore < other.bestScore || this.bestGenomeFitness < other.bestGenomeFitness) {
                this.bestGenome = other.bestGenome
                this.bestGenomeFitness = other.bestGenomeFitness
            }

            this.bestScore = other.bestScore
        }

        if (this.bestFitness <= other.bestFitness) {
            this.bestFitness = other.bestFitness
            this.fittestGenome = other.fittestGenome
        }
    }

    reset() { this.copy(DEFAULT_POPULATION_STATISTICS) }

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
        this.totalGenerationCount = generationCount

        this.generationInfo = new PopulationStatistics()
        this.prevGenerationInfo = new PopulationStatistics()
        this.allTimeGenerationInfo = new PopulationStatistics()
        this.averageScorePerGeneration = []
        this.bestScorePerGeneration = []

        this.genomeIndex = 0

        const MAXIMUM_SNAKE_LENGTH = this.snakeGame.cols * this.snakeGame.rows
        this.LASTING_SPACES_UNTIL_GAMEOVER = Math.floor(0.8 * MAXIMUM_SNAKE_LENGTH)
        this.MAXIMUM_GAME_DURATION = MAXIMUM_SNAKE_LENGTH * MAXIMUM_SNAKE_LENGTH
    }

    graduallyProcessGeneration(maximumTime) {
        let updates = 0
        const finishTime = Date.now() + maximumTime
        while (Date.now() < finishTime && this.genomeIndex < this.population.populationCount) {
            const genome = this.population.genomes[this.genomeIndex++]
            const network = genome.toNeuralNetwork()

            this.snakeGame.reset()
            while (this.snakeGame.state                == SNAKE_GAME_STATE_ACTIVE
            &&     this.snakeGame.durationInTicks      <  this.MAXIMUM_GAME_DURATION
            &&     this.snakeGame.ticksSinceLastTarget <  this.LASTING_SPACES_UNTIL_GAMEOVER) {
                this.snakeGame.processNeuralNetwork(network, SEARCH_DIRECTIONS, ORTHOGONAL_DIRECTIONS)
                this.snakeGame.update()
                ++updates
            }

            genome.fitness = this.snakeGame.getFitness()

            this.generationInfo.record(genome, genome.fitness, this.snakeGame.score)
        }
    }

    shouldTerminate() {
        return this.population.generationCount >= this.totalGenerationCount
    }

    nextGeneration() {
        this.averageScorePerGeneration.push(this.generationInfo.averageScore)
        this.bestScorePerGeneration.push(this.generationInfo.bestScore)

        this.population.repopulate()
        this.population.specifyGenomes()
        this.allTimeGenerationInfo.add(this.generationInfo)
        this.prevGenerationInfo.copy(this.generationInfo)
        this.generationInfo.copy(DEFAULT_POPULATION_STATISTICS)
        this.genomeIndex = 0
    }

    // render(context, rectangle = new Rectangle(0, 0, context.canvas.width, context.canvas.height)) {
    render(context, position = new Vector2(0, 0), size = new Vector2(context.canvas.width, context.canvas.height)) {
        context.fillStyle = GAME_BACKGROUND_COLOUR
        context.fillRect(0, 0, size.x, size.y)

        const scale = new Vector2(size.x - 100, (size.y - 100) / this.allTimeGenerationInfo.bestScore)

        drawLineGraph(context, this.bestScorePerGeneration, position, scale, GRAPH_SCORE_COLOR)
        drawLineGraph(context, this.averageScorePerGeneration, position, scale, SNAKE_COLOUR)

        const generationNumber = this.population.generationCount + 1
        const bestScore = this.prevGenerationInfo.bestScore
        const highScore = this.allTimeGenerationInfo.bestScore
        const populationCount = this.population.populationCount
        const avgNeuronCount = Math.round(this.prevGenerationInfo.averageNeuronCount)
        const speciesCount = this.population.species.length

        context.fillStyle = GAME_TEXT_COLOUR
        context.font = "36px serif"

        context.fillText(
            `Generation #${generationNumber} | Generation best score: ${bestScore} | `
        +   `All time high score: ${highScore} | Population count: ${populationCount} | `
        +   `Avg neuron count: ${avgNeuronCount} | Species Count: ${speciesCount}`,
            position.x,
            position.y + size.y - 9,
            size.x
        )
    }

    update() {
        if (this.genomeIndex >= this.population.populationCount) {
            this.nextGeneration()
        }

        this.graduallyProcessGeneration(MAX_MILLISECONDS_PER_FRAME)
    }

    startSimulation(context) {
        const loop = () => {
            this.requestId = requestAnimationFrame(loop)
            canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
            canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
            this.render(context, new Vector2(0, 0), new Vector2(canvas.width, canvas.height))

            if (this.genomeIndex >= this.population.populationCount) {
                this.nextGeneration()
            }

            this.graduallyProcessGeneration(MAX_MILLISECONDS_PER_FRAME)

            if (this.population.generationCount >= this.totalGenerationCount
            ||  this.allTimeGenerationInfo.bestScore == this.snakeGame.cols * this.snakeGame.rows - 1) {
                cancelAnimationFrame(this.requestId)
            }
        }

        loop()
    }
}

class SimulationUsingPopulation {
    constructor (
        // context = null,
        population = null,
        generationCount = 2500,
        snakeGame = null,
    ) {
        // this.context = context
        // this.canvas = context.canvas
        this.population = population
        this.totalGenerationCount = generationCount
        this.defaultSnakeGame = snakeGame

        // this.bestGenome = this.population.genomes[0]
        // this.fittestGenome = this.population.genomes[0]
        this.generationInfo = new PopulationStatistics()
        this.prevGenerationInfo = new PopulationStatistics()
        this.allTimeGenerationInfo = new PopulationStatistics()
        // this.lastingSpacesUntilGameover = this.snakeGameSize * this.snakeGameSize
        // this.snakeGameSize = 10

        // this.allTimeBestScore = 0

        // this.frameRate = 1000
        // this.updatesPerFrame = 1

        // this.requestId = null

        this.snakeGames = this.population.genomes.map(() => this.defaultSnakeGame.clone())

        // this.snakeGames = this.population.genomes.map(e => new SnakeGame(this.snakeGameSize, this.snakeGameSize, e, e.toNeuralNetwork()))

        // window.addEventListener("resize", this.resizeCanvas.bind(this), false)
        // this.resizeCanvas()
    }

    shouldTerminate() {
        return this.population.generationCount >= this.totalGenerationCount
    }

    nextGeneration() {
        for (let idx = 0; idx < this.population.genomes.length; ++idx) {
            const genome = this.population.genomes[idx]
            const score = this.snakeGames[idx].score

            this.generationInfo.record(genome, genome.fitness, score)
            this.allTimeGenerationInfo.record(genome, genome.fitness, score)
        }

        this.population.repopulate()
        this.population.specifyGenomes()
        this.prevGenerationInfo.copy(this.generationInfo)
        this.generationInfo.reset()

        while (this.snakeGames.length > this.population.populationCount) {
            this.snakeGames.pop()
        }

        while (this.snakeGames.length < this.population.populationCount) {
            this.snakeGames.push(this.defaultSnakeGame.clone())
        }
        
        // this.snakeGames = this.population.genomes.map(e => new SnakeGame(this.snakeGameSize, this.snakeGameSize, e, e.toNeuralNetwork()))
    }

    // resizeCanvas() {
    //     this.canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    //     this.canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    //     this.rectangleViews = this.getRectangleViews()
    //     this.render()
    // }

    // getRectangleViews() {
    //     const usableHeight = this.canvas.height - 100
    //     const rectangleViews = []
    //     rectangleViews.push(new Rectangle(0, 0, usableHeight / 1.1, usableHeight))

    //     const remainingWidth = this.canvas.width - rectangleViews[0].width

    //     if (remainingWidth < 200) {
    //         return rectangleViews
    //     }

    //     const gameWindowWidth = remainingWidth / 12
    //     const gameWindowHeight = gameWindowWidth * 1.1

    //     const windowColumns = Math.floor(remainingWidth / gameWindowWidth)
    //     const windowRows = Math.floor(usableHeight / gameWindowHeight)

    //     for (let idx0 = 0, x = rectangleViews[0].width; idx0 < windowColumns; ++idx0, x += gameWindowWidth) {
    //         for (let idx1 = 0, y = 0; idx1 < windowRows; ++idx1, y += gameWindowHeight) {
    //             rectangleViews.push(new Rectangle(x, y, gameWindowWidth, gameWindowHeight))
    //         }
    //     }

    //     return rectangleViews
    // }

    // gameLoop() {
    //     this.requestId = window.setTimeout(this.gameLoop.bind(this), 1000 / this.frameRate)

    //     for (let idx = 0; idx < this.updatesPerFrame; ++idx) {
    //         this.update()
    //     }

    //     this.render()
    // }

    update() {
        const MAXIMUM_SNAKE_LENGTH = this.snakeGame.cols * this.snakeGame.rows
        const LASTING_SPACES_UNTIL_GAMEOVER = Math.floor(0.8 * MAXIMUM_SNAKE_LENGTH)
        const MAXIMUM_GAME_DURATION = MAXIMUM_SNAKE_LENGTH * MAXIMUM_SNAKE_LENGTH

        let shouldRestart = true
        for (let idx = 0; idx < this.snakeGames.length; ++idx) {
            const snakeGame = this.snakeGames[idx]

            snakeGame.update()

            if (snakeGame.ticksSinceLastTarget > LASTING_SPACES_UNTIL_GAMEOVER) {
                snakeGame.state = SNAKE_GAME_STATE_GAME_OVER
            }

            if (snakeGame.state != SNAKE_GAME_STATE_GAME_OVER) {
                shouldRestart = false
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

        if (shouldRestart) {
            this.nextGeneration()
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

    render(context) {
        context.fillStyle = GAME_BACKGROUND_COLOUR
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)

        for (let idx0 = 0; idx0 < this.rectangleViews.length && idx0 < this.snakeGames.length; ++idx0) {
            this.snakeGames[idx0].render(context, this.rectangleViews[idx0])
        }

        context.fillStyle = GAME_TEXT_COLOUR
        context.textAlign = "start"
        context.font = "36px serif"
        context.fillText(`Generation #${this.population.generationCount + 1} | Generation best score: ${this.generationInfo.bestScore} | All time high score: ${this.allTimeGenerationInfo.bestScore} | Population count: ${this.population.populationCount} | Avg neuron count: ${Math.round(this.generationInfo.averageNeuronCount)} | Species Count: ${this.population.species.length}`, rectangle.x, rectangle.y + rectangle.height - 9, rectangle.width)
    }
}

function drawLineGraph(context, data, position, scale, color = GAME_GRID_LINE_COLOUR) {
    if (!data || data.length == 0) {
        return
    }

    context.strokeStyle = color
    context.lineWidth = 1
    context.lineCap = "round"
    context.beginPath()
    let prevX = position.x, prevY = position.y

    if (data.length > MAX_GRAPH_DATA_POINTS) {
        const STEPS = Math.max(1, Math.floor(data.length / MAX_GRAPH_DATA_POINTS))

        for (let idx0 = 0; idx0 < data.length; idx0 += STEPS) {
            let x = 0, y = 0

            let totalValue = 0
            const endOffset = Math.min(idx0 + STEPS, data.length)
            for (let idx1 = idx0; idx1 < endOffset; ++idx1) {
                totalValue += data[idx1]
            }

            const elementsProcessed = endOffset - idx0

            x = position.x + (idx0 / data.length) * scale.x
            y = position.y + totalValue / elementsProcessed * scale.y

            context.moveTo(prevX, prevY)
            context.lineTo(x, y)

            prevX = x
            prevY = y
        }
    }
    else {
        for (let idx = 0; idx < data.length; ++idx) {
            const x = position.x + (idx / data.length) * scale.x
            const y = position.y + data[idx] * scale.y

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
    document.getElementById("fileInput").addEventListener("input", (event) => {
        const file = event.target.files[0]
        if (!file) {
            console.error("No file selected.")
            return
        }

        const reader = new FileReader()
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result)
            const population = readPopulationFile(data)
            simulation = new GraphSimulation(population, snakeGame, Infinity)
            console.log("Population loaded successfully.")
        }

        reader.readAsArrayBuffer(file)
    })

    const canvas = document.getElementById("canvas")
    const context = canvas.getContext("2d")

    const innovationCounter = new InnovationCounter()
    const startingGenome = Genome.fromTopology(SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY, sigmod, innovationCounter)

    const population = new Population(500, startingGenome, innovationCounter, config)

    const snakeGame = new SnakeGame(10, 10)
    simulation = new GraphSimulation(population, snakeGame, Infinity)

    let requestId = null
    const loop = () => {
        requestId = requestAnimationFrame(loop)

        // canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        // canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
        simulation.render(context)

        if (simulation.genomeIndex >= simulation.population.populationCount) {
            simulation.nextGeneration()
        }

        simulation.graduallyProcessGeneration(MAX_MILLISECONDS_PER_FRAME)

        if (simulation.population.generationCount >= simulation.totalGenerationCount) {
            cancelAnimationFrame(requestId)
        }
    }

    loop()
}

function saveBlobToFile(blob, filename) {
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

window.addEventListener("load", main, false)

const VELOCITY_LEFT  = new Vector2(-1, 0)
const VELOCITY_UP    = new Vector2( 0,-1)
const VELOCITY_RIGHT = new Vector2( 1, 0)
const VELOCITY_DOWN  = new Vector2( 0, 1)

const _temp_vector0 = new Vector2(0, 0)
const _temp_vector1 = new Vector2(0, 0)
const _temp_vector2 = new Vector2(0, 0)

const SEARCH_DIRECTIONS = [
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
    new Vector2(-1, 0),
    new Vector2( 0,-1),
    new Vector2( 1, 0),
    new Vector2( 0, 1),
]

const DEFAULT_POPULATION_STATISTICS = new PopulationStatistics()

const serializer = new BinarySerializer()

const innovationCounter = new InnovationCounter()
const genome = Genome.fromTopology(SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY, sigmod, innovationCounter)
const population = new Population(500, genome, innovationCounter, config)

population.serialize(serializer)
console.log(serializer.bytes())
console.log(population)
console.log(Population.deserialize(new BinaryDeserializer(serializer.bytes())))
