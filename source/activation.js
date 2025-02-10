function clamped(x) {
    return Math.max(Math.min(x, 1), 0)
}

function sigmod(x) {
    return 1 / (1 + Math.exp(-x))
}

function cube(x) {
    return x * x * x
}

function exp(x) {
    return Math.exp(x)
}

function relu(x) {
    return Math.max(x, 0)
}
