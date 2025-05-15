const FRAMES_PER_MILLISECOND = 32 / 1000
const MILLISECONDS_PER_FRAME = 1.0 / FRAMES_PER_MILLISECOND
const MAX_MILLISECONDS_PER_FRAME = 1000 / 30
const SNAKE_GAME_ASPECT = 1.2
const DEFAULT_SNAKE_LENGTH = 1
const POPULATION_SUGGESTED_FILENAME = "SnakeGamePopulation.bin"

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

class Snake {
    constructor (startX = 0, startY = 0) {
        this.body = [ new Vector2(startX, startY) ]
        this.velocity = new Vector2(1, 0)
        this.length = DEFAULT_SNAKE_LENGTH
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
        this.length = DEFAULT_SNAKE_LENGTH
        this.body[0].set(startX, startY)
        if (this.body.length > 1) {
            this.body.splice(1, this.body.length - 1)
        }
    }

    update(snakeGame) {
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

    render(context, position, size, cellSize, snakeRadius) {
        const halfCellSize = cellSize / 2

        if (this.body.length == 1) {
            const x = position.x + this.body[0].x * cellSize + halfCellSize
            const y = position.y + this.body[0].y * cellSize + halfCellSize

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
            const currPosition = this.body[idx    ]
            const prevPosition = this.body[idx - 1] || currPosition
            const nextPosition = this.body[idx + 1] || currPosition

            const difference0 = _temp_vector0.subVectors(prevPosition, currPosition)
            const difference1 = _temp_vector1.subVectors(nextPosition, currPosition)

            const dotProduct = difference0.dot(difference1)

            const x0 = position.x + 0.5 * (prevPosition.x + currPosition.x) * cellSize + halfCellSize
            const y0 = position.y + 0.5 * (prevPosition.y + currPosition.y) * cellSize + halfCellSize

            const x1 = position.x + currPosition.x * cellSize + halfCellSize
            const y1 = position.y + currPosition.y * cellSize + halfCellSize

            const x2 = position.x + 0.5 * (nextPosition.x + currPosition.x) * cellSize + halfCellSize
            const y2 = position.y + 0.5 * (nextPosition.y + currPosition.y) * cellSize + halfCellSize

            if (dotProduct == 0 && !prevPosition.equals(currPosition) && !nextPosition.equals(currPosition)) {
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
    getFitness() { return Math.max(0, this.durationInTicks + 500 * this.score * this.score + 2 ** this.score - this.score * this.durationInTicks * (1.05 ** this.score)) }

    outsideBounds(position) {
        return position.x < 0 || position.x >= this.cols || position.y < 0 || position.y >= this.rows
    }

    getTileFromGrid(position) {
        return this.tempGrid[this.cols * position.y + position.x]
    }

    reset() {
        this.tempGridIsValid = false
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

            this.tempGrid[this.cols * this.targetPosition.y + this.targetPosition.x] = GRID_TYPE_FOOD
            
            for (let idx = 0; idx < this.snake.body.length; ++idx) {
                const position = this.snake.body[idx]
                this.tempGrid[this.cols * position.y + position.x] = GRID_TYPE_SNAKE
            }
        }
    }

    generateDirectionalInfo(directions, inputs = []) {
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
        this.ensureTempGridIsBuilt()

        const availibleSpaces = []

        for (let idx = 0; idx < this.tempGrid.length; ++idx) {
            if (this.tempGrid[idx] != GRID_TYPE_SNAKE) {
                availibleSpaces.push(idx)
            }
        }

        if (availibleSpaces.length == 0) {
            return false
        }

        const index = choice(availibleSpaces)
        const col = index % this.cols
        const row = Math.floor(index / this.cols)
        this.targetPosition.set(col, row)
        this.tempGrid[this.targetPosition.row * this.cols + this.targetPosition.col] = GRID_TYPE_SNAKE
        this.tempGrid[row * this.cols + col] = GRID_TYPE_FOOD

        for (let idx = 0; idx < this.snake.body.length; ++idx) {
            if (this.snake.body[idx].equals(this.targetPosition)) {
                throw new Error("The target cannot be on top of the snake!")
            }
        }

        return true
    }

    renderTarget(context, position, size, cellSize, targetRadius) {
        const targetPositionX = position.x + this.targetPosition.x * cellSize + cellSize / 2
        const targetPositionY = position.y + this.targetPosition.y * cellSize + cellSize / 2

        context.fillStyle = TARGET_COLOUR
        context.beginPath()
        context.ellipse(targetPositionX, targetPositionY, targetRadius, targetRadius, 0, 0, 2 * Math.PI, false)
        context.closePath()
        context.fill()
    }

    renderOverlay(context, position, size, text) {
        context.fillStyle = "rgba(0, 0, 0, 0.5)"
        context.fillRect(position.x, position.y, size.width, size.height)

        context.font = `${Math.floor(0.1 * size.width)}px Consolas`
        context.fillStyle = GAME_TEXT_COLOUR
        context.textAlign = "center"
        context.fillText(text, position.x + size.width / 2, position.y + size.height / 2)
    }

    renderGameGrid(context, position, size, cellSize, gridLineWidth = 1) {
        context.fillStyle = GAME_BACKGROUND_COLOUR
        context.fillRect(position.x, position.y, size.width, size.height)

        context.strokeStyle = GAME_GRID_LINE_COLOUR
        context.lineWidth = gridLineWidth

        context.beginPath()
        for (let idx = 1; idx < this.cols; ++idx) {
            context.moveTo(position.x + idx * cellSize, position.y)
            context.lineTo(position.x + idx * cellSize, position.y + size.width)
        }

        for (let idx = 1; idx <= this.rows; ++idx) {
            context.moveTo(position.x,                    position.y + idx * cellSize)
            context.lineTo(position.x + size.width, position.y + idx * cellSize)
        }

        context.closePath()
        context.stroke()
    }

    update() {
        switch (this.state) {
        case SNAKE_GAME_STATE_ACTIVE: {
            this.ticksSinceLastTarget += 1
            this.durationInTicks += 1

            this.tempGridIsValid = false
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

                if (!this.relocateTarget()) {
                    this.state = SNAKE_GAME_STATE_GAME_OVER
                    break
                }
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

    render(context, position, size, gridLineWidth = 1) {
        const cellSize = size.width / this.cols
        const snakeRadius = cellSize * 0.40
        const excess = Math.max(size.height - size.width, 0)

        this.renderGameGrid(context, position, size, cellSize, gridLineWidth)
        this.renderTarget(context, position, size, cellSize, snakeRadius)
        this.snake.render(context, position, size, cellSize, snakeRadius)

        context.font = `${excess}px Consolas`
        context.textAlign = "start"
        context.fillStyle = GAME_TEXT_COLOUR
        context.fillText(`Score: ${this.score}`, position.x, position.y + size.height, size.width)

        if (this.state == SNAKE_GAME_STATE_GAME_OVER) {
            this.renderOverlay(context, position, size, "Game Over!")
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

        this.lineGraphRenderer = new LineGraphRenderer()
        this.lineGraphRenderer.axisX.set(1,  0)
        this.lineGraphRenderer.axisY.set(0, -1)
        this.lineGraphRenderer.alignment = Alignment.topLeft

        this.runtimeSnakeGame = snakeGame.clone()
        this.currentBestNetwork = this.population.genomes[0].toNeuralNetwork()

        this.genomeIndex = 0

        const MAXIMUM_SNAKE_LENGTH = this.snakeGame.cols * this.snakeGame.rows
        this.LASTING_SPACES_UNTIL_GAMEOVER = Math.floor(0.8 * MAXIMUM_SNAKE_LENGTH)
        this.MAXIMUM_GAME_DURATION = MAXIMUM_SNAKE_LENGTH * MAXIMUM_SNAKE_LENGTH
    }

    graduallyProcessGeneration(maximumTime) {
        let updates = 0
        const finishTime = Date.now() + maximumTime
        while (Date.now() < finishTime && this.genomeIndex < this.population.genomes.length) {
            const genome = this.population.genomes[this.genomeIndex++]
            const network = genome.toNeuralNetwork()

            this.snakeGame.reset()
            while (!this.isSnakeGameDone(this.snakeGame)) {
                this.processFrameUsingNeuralNetwork(this.snakeGame, network)
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

    render(context, position = new Vector2(0, 0), size = new Vector2(context.canvas.width, context.canvas.height)) {
        context.fillStyle = GAME_BACKGROUND_COLOUR
        context.fillRect(0, 0, size.x, size.y)

        context.fillStyle = GAME_TEXT_COLOUR
        context.font = "36px monospace"
        context.textBaseline = "bottom"

        const generationNumber = this.population.generationCount + 1
        const bestScore = this.prevGenerationInfo.bestScore
        const highScore = this.allTimeGenerationInfo.bestScore
        const populationCount = this.population.populationCount
        const avgNeuronCount = Math.round(this.prevGenerationInfo.averageNeuronCount)
        const speciesCount = this.population.species.length

        const text = `Generation #${generationNumber} | Generation best score: ${bestScore} | `
        +            `All time high score: ${highScore} | Population count: ${populationCount} | `
        +            `Avg neuron count: ${avgNeuronCount} | Species Count: ${speciesCount}`
        const metrics = context.measureText(text)
        const textHeight = metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent

        this.lineGraphRenderer.size.width = 0.5 * context.canvas.width
        this.lineGraphRenderer.size.height = context.canvas.height - textHeight

        this.lineGraphRenderer.draw(context, this.bestScorePerGeneration, this.allTimeGenerationInfo.bestScore, GRAPH_SCORE_COLOR)
        this.lineGraphRenderer.draw(context, this.averageScorePerGeneration, this.allTimeGenerationInfo.bestScore, SNAKE_COLOUR)
        context.fillText(text, position.x, position.y + size.y, size.x)

        const remainingWidth = context.canvas.width - this.lineGraphRenderer.size.width
        // const gameDisplaySize = Math.min(remainingWidth, this.lineGraphRenderer.size.height)
        const gameWidth = Math.min(remainingWidth, this.lineGraphRenderer.size.height / SNAKE_GAME_ASPECT)
        const gameOffset = 0.5 * (remainingWidth - gameWidth)

        this.runtimeSnakeGame.render(context, new Vector2(this.lineGraphRenderer.size.width + gameOffset, 0), new Vector2(gameWidth, this.lineGraphRenderer.size.height), 1)
    }

    isSnakeGameDone(snakeGame) {
        const MAXIMUM_SNAKE_LENGTH = snakeGame.cols * snakeGame.rows
        const LASTING_SPACES_UNTIL_GAMEOVER = Math.floor(0.8 * MAXIMUM_SNAKE_LENGTH)
        const MAXIMUM_GAME_DURATION = MAXIMUM_SNAKE_LENGTH * MAXIMUM_SNAKE_LENGTH

        return snakeGame.state                != SNAKE_GAME_STATE_ACTIVE
        ||     snakeGame.durationInTicks      > MAXIMUM_GAME_DURATION
        ||     snakeGame.ticksSinceLastTarget > LASTING_SPACES_UNTIL_GAMEOVER
    }

    processFrameUsingNeuralNetwork(snakeGame, network) {
        const inputs = snakeGame.generateDirectionalInfo(SEARCH_DIRECTIONS)
        const index = network.predict(inputs)
        snakeGame.snake.setDirection(ORTHOGONAL_DIRECTIONS[index])
        snakeGame.update()
    }

    update() {
        if (this.genomeIndex >= this.population.genomes.length) {
            this.nextGeneration()
        }

        this.graduallyProcessGeneration(MAX_MILLISECONDS_PER_FRAME)
        this.processFrameUsingNeuralNetwork(this.runtimeSnakeGame, this.currentBestNetwork)

        if (this.isSnakeGameDone(this.runtimeSnakeGame)) {
            const genome = this.allTimeGenerationInfo.bestGenome ?? this.population.genomes[0]
            this.currentBestNetwork = genome.toNeuralNetwork()
            this.runtimeSnakeGame.reset()
        }
    }
}

function main() {
    const canvas = document.getElementById("simulation-canvas")
    const context = canvas.getContext("2d")

    const saveButton = document.getElementById("save-button")
    const saveAsButton = document.getElementById("save-as-button")
    const restoreButton = document.getElementById("restore-button")
    const resetButton = document.getElementById("reset-button")
    const populationInput = document.getElementById("population-input")
    const populationSlider = document.getElementById("population-slider")

    const innovationCounter = new InnovationCounter()
    const startingGenome = Genome.fromTopology(SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY, sigmod, innovationCounter)

    const population = new Population(500, startingGenome, innovationCounter, config)

    const snakeGame = new SnakeGame(10, 10)
    let simulation = new GraphSimulation(population, snakeGame, Infinity)
    const mimeType = "application/octet-stream"

    const populationSliderMin = Number(populationSlider.min)
    const populationSliderMax = Number(populationSlider.max)

    populationSlider.addEventListener('input', () => {
        populationInput.value = populationSlider.value
    })

    populationInput.addEventListener('input', () => {
        if (populationInput.value >= populationSliderMin && populationInput.value <= populationSliderMax) {
            populationSlider.value = populationInput.value
        }
    })

    populationSlider.addEventListener("change", () => {
        simulation.population.populationCount = Number(populationSlider.value)
    })

    populationInput.addEventListener("change", () => {
        simulation.population.populationCount = Number(populationSlider.value)
    })

    resetButton.addEventListener("click", () => {
        const innovationCounter = new InnovationCounter()
        const startingGenome = Genome.fromTopology(SNAKE_NEURAL_NETWORK_BASE_TOPOLOGY, sigmod, innovationCounter)
        const population = new Population(500, startingGenome, innovationCounter, config)

        simulation = new GraphSimulation(population, snakeGame, Infinity)
    })

    saveButton.onclick = function (event) {
        const serializer = new BinarySerializer([])
        simulation.population.serialize(serializer)
        
        const blob = new Blob([ serializer.arrayBuffer() ], { type: mimeType })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = POPULATION_SUGGESTED_FILENAME
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    saveAsButton.onclick = function (event) {
        const serializer = new BinarySerializer([])
        simulation.population.serialize(serializer)

        try {
            window.showSaveFilePicker({
                suggestedName: POPULATION_SUGGESTED_FILENAME,
                types: [{
                    description: 'Binary Files',
                    accept: { [mimeType]: ['.bin'] },
                }],
            }).then(handle => {
                const blob = new Blob([ serializer.arrayBuffer() ], { type: mimeType })
                handle.createWritable(blob).then(writable => {
                    writable.write().then(() => {
                        writable.close()
                    })
                })
            })
        } catch (error) {
            console.error("Error saving file:", error)
        }
    }

    restoreButton.onclick = function (event) {
        const input = document.createElement("input")
        input.type = "file"
        document.body.appendChild(input)

        input.oninput = function (event) {
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
        }

        input.click()
        document.body.removeChild(input)
    }

    let requestId = null
    const loop = () => {
        requestId = requestAnimationFrame(loop)
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight


        simulation.update()
        simulation.render(context)

        if (simulation.population.generationCount >= simulation.totalGenerationCount) {
            cancelAnimationFrame(requestId)
        }
    }

    loop()
}

window.addEventListener("load", main, false)

const VELOCITY_LEFT  = new Vector2(-1, 0)
const VELOCITY_UP    = new Vector2( 0,-1)
const VELOCITY_RIGHT = new Vector2( 1, 0)
const VELOCITY_DOWN  = new Vector2( 0, 1)

const _temp_vector0 = new Vector2(0, 0)
const _temp_vector1 = new Vector2(0, 0)

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
