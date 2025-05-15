class Alignment {
    static bottomLeft = new ReadonlyVector2(0.0, 0.0)
    static bottomCenter = new ReadonlyVector2(0.5, 0.0)
    static bottomRight = new ReadonlyVector2(1.0, 0.0)
    static centerLeft = new ReadonlyVector2(0.0, 0.5)
    static center = new ReadonlyVector2(0.5, 0.5)
    static centerRight = new ReadonlyVector2(1.0, 0.5)
    static topLeft = new ReadonlyVector2(0.0, 1.0)
    static topCenter = new ReadonlyVector2(0.5, 1.0)
    static topRight = new ReadonlyVector2(1.0, 1.0)
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
    // #tempOffset    = new Vector2(0, 0)

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
