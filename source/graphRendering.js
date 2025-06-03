class Alignment {
    static bottomLeft = new Alignment(0.0, 0.0)
    static bottomCenter = new Alignment(0.5, 0.0)
    static bottomRight = new Alignment(1.0, 0.0)
    static centerLeft = new Alignment(0.0, 0.5)
    static center = new Alignment(0.5, 0.5)
    static centerRight = new Alignment(1.0, 0.5)
    static topLeft = new Alignment(0.0, 1.0)
    static topCenter = new Alignment(0.5, 1.0)
    static topRight = new Alignment(1.0, 1.0)
    constructor (x, y) { this.x = x; this.y = y; return Object.freeze(this) }
}

class LineGraphRenderer {
    position               = new Vector2(  0.0,   0.0)
    size                   = new Vector2(500.0, 500.0)
    alignment              = Alignment.center
    axisX                  = new Vector2(1.0, 0.0)
    axisY                  = new Vector2(0.0, 1.0)
    maximumDataPoints      = 500

    shouldDisplayGridlines = true

    gridLineColor = "#FFFFFF"

    #tempPosition0 = new Vector2(0, 0)
    #tempPosition1 = new Vector2(0, 0)

    setLocalPositionToVector(vector = new Vector2(0, 0)) {
        vector.x = vector.x - this.size.x * this.alignment.x
        vector.y = vector.y - this.size.y * this.alignment.y
        vector.x = vector.x * this.axisX.x + vector.y * this.axisY.x 
        vector.y = vector.x * this.axisX.y + vector.y * this.axisY.y 
        return vector
    }

    draw(context, data, highestValue, color) {
        if (!data || data.length == 0) {
            return
        }

        const noramlizationFactor = 1.0 / highestValue
        const verticalScale = this.size.height * noramlizationFactor
        const horizontalScale = this.size.width

        context.strokeStyle = color
        context.lineWidth = 1
        context.lineCap = "round"
        context.beginPath()

        this.#tempPosition0.set(0, 0)
        this.#tempPosition1.set(0, 0)

        const steps =  Math.max(1, Math.floor(data.length / this.maximumDataPoints))

        for (let idx0 = 0; idx0 < data.length; idx0 += steps) {
            const progression = idx0 / data.length

            let totalValue = 0
            const endOffset = Math.min(idx0 + steps, data.length)
            for (let idx1 = idx0; idx1 < endOffset; ++idx1) {
                totalValue += data[idx1]
            }

            const value = totalValue / (endOffset - idx0)

            this.#tempPosition0.set(
                this.position.x + progression * horizontalScale,
                this.position.y + value * verticalScale,
            )

            this.#tempPosition0 = this.setLocalPositionToVector(this.#tempPosition0)

            if (idx0 != 0) {
                context.moveTo(this.#tempPosition1.x, this.#tempPosition1.y)
                context.lineTo(this.#tempPosition0.x, this.#tempPosition0.y)
            }
            else {
                context.moveTo(this.#tempPosition0.x, this.#tempPosition0.y)
            }

            this.#tempPosition1.copy(this.#tempPosition0)
        }

        context.stroke()

        if (this.shouldDisplayGridlines) {
            context.strokeStyle = this.gridLineColor
            context.lineWidth = 1
            context.lineCap = "round"
            context.beginPath()

            // context.moveTo(this.position.x, this.position.y)
            // context.lineTo(this.position.x + this.size.width, this.position.y)
            // context.lineTo(this.position.x + this.size.width, this.position.y + this.size.height)
            // context.lineTo(this.position.x, this.position.y + this.size.height)
            // context.lineTo(this.position.x, this.position.y)

            context.stroke()
        }
    }
}

class Dataset {
    label = ""
    data = []
    color = "#00FF00"

    render(context) {
    }
}

class LineGraph {
    datasets = []
    backgroundColor = "#00FF00"
    maximumDataPoints = 500

    position = new Vector2(0.0, 0.0)
    size = new Vector2(500.0, 500.0)
    alignment = Alignment.center
    gridLineStepCounts = new Vector2(0, 10)

    gridLineColor = "#FFFFFF"

    #tileSize = new Vector2(0, 0)

    constructor (context) {
        const canvas = context.canvas
        /** @type {CanvasRenderingContext2D} */
        this.context = context
        this.canvas = canvas

        canvas.addEventListener()
    }

    render() {
        this.context.fillStyle = this.backgroundColor
        this.context.fillRect(0, 0, this.size.x, this.size.y)

        if (this.shouldDisplayGridlines) {
            this.context.beginPath()
            this.#tileSize.divVectors(this.size, this.gridLineStepCounts)

            for (let col = 0; col < this.gridLineStepCounts.x; ++col) {
                this.context.moveTo(col * this.#tileSize.x, row * this.#tileSize.y)
                this.context.lineTo(col * this.#tileSize.x, row * this.#tileSize.y)
            }

            for (let row = 0; row < this.gridLineStepCounts.y; ++row) {
                this.context.moveTo(col * this.#tileSize.x, row * this.#tileSize.y)
                this.context.lineTo(col * this.#tileSize.x, row * this.#tileSize.y)
            }

            this.context.stroke()
        }

        for (let idx = 0; idx < this.datasets.length; ++idx) {
            this.datasets[idx].render()
        }
    }
}
