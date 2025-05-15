class Vector2 {
    static fromObject(v) { return new Vector2(v.x, v.y) }
    static fromArray(v)  { return new Vector2(v[0], v[1]) }
    static all(value) { return new Vector2(value, value) }

    constructor (x = 0, y = 0) {
        this.x = x
        this.y = y
    }

    get width() { return this.x }
    get height() { return this.y }

    get s() { return this.x }
    get t() { return this.y }

    get u() { return this.x }
    get v() { return this.y }

    set width(value) { return this.x = value }
    set height(value) { return this.y = value }

    set s(value) { return this.x = value }
    set t(value) { return this.y = value }

    set u(value) { return this.x = value }
    set v(value) { return this.y = value }

    *[Symbol.iterator]() { yield this.x; yield this.y }
    clone()              { return new Vector2(this.x, this.y) }
    set(x, y)            { this.x = x; this.y = y; return this }
    copy(other)          { this.x = other.x; this.y = other.y; return this }
    toObject()           { return { x: this.x, y: this.y } }
    toArray()            { return [this.x, this.y] }

    equals(other)        { return this.x == other.x && this.y == other.y }

    magnitudeSquared() { return this.x * this.x + this.y * this.y }
    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y) }
    dot(other) { return this.x * other.x + this.y * other.y }
    cross() { return this.x * this.y - this.y * this.x }
    neg() { this.x = -this.x; this.y = -this.y; return this }

    addScalar(scalar) { this.x += scalar; this.y += scalar; return this }
    subScalar(scalar) { this.x -= scalar; this.y -= scalar; return this }
    mulScalar(scalar) { this.x *= scalar; this.y *= scalar; return this }
    divScalar(scalar) { this.x /= scalar; this.y /= scalar; return this }
    addVectors(v0, v1) { this.x = v0.x + v1.x; this.y = v0.y + v1.y; return this }
    subVectors(v0, v1) { this.x = v0.x - v1.x; this.y = v0.y - v1.y; return this }
    mulVectors(v0, v1) { this.x = v0.x * v1.x; this.y = v0.y * v1.y; return this }
    divVectors(v0, v1) { this.x = v0.x / v1.x; this.y = v0.y / v1.y; return this }
    add(other) { this.x += other.x; this.y += other.y; return this }
    sub(other) { this.x -= other.x; this.y -= other.y; return this }
    mul(other) { this.x *= other.x; this.y *= other.y; return this }
    div(other) { this.x /= other.x; this.y /= other.y; return this }

    addScaledVector(other, scalar) { this.x += scalar * other.x; this.y += scalar * other.y; return this }
    subScaledVector(other, scalar) { this.x -= scalar * other.x; this.y -= scalar * other.y; return this }

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

class ReadonlyVector2 extends Vector2 {
    constructor (x, y) {
        super(x, y)
        return Object.freeze(this)
    }
}
