const FRAMES_PER_MILLISECOND = 60 / 1000;
const MILLISECONDS_PER_FRAME = 1.0 / FRAMES_PER_MILLISECOND;

const MOUSE_BUTTON_LEFT_BIT = 0x01;
const MOUSE_BUTTON_RIGHT_BIT = 0x02;
const MOUSE_BUTTON_WHEEL_BIT = 0x04;
const MOUSE_BUTTON_BACK_BIT = 0x08;
const MOUSE_BUTTON_FORWARD_BIT = 0x10;

const KEYCODE_SPACE = 32;
const KEYCODE_BACKQUOTE = 192;
const KEYCODE_DIGIT1 = 49;
const KEYCODE_DIGIT2 = 50;
const KEYCODE_DIGIT3 = 51;
const KEYCODE_DIGIT4 = 52;
const KEYCODE_DIGIT5 = 53;
const KEYCODE_DIGIT6 = 54;
const KEYCODE_DIGIT7 = 55;
const KEYCODE_DIGIT8 = 56;
const KEYCODE_DIGIT9 = 57;
const KEYCODE_DIGIT0 = 48;
const KEYCODE_MINUS = 189;
const KEYCODE_EQUAL = 187;
const KEYCODE_BACKSPACE = 8;
const KEYCODE_TAB = 9;
const KEYCODE_KEY_Q = 81;
const KEYCODE_KEY_W = 87;
const KEYCODE_KEY_E = 69;
const KEYCODE_KEY_R = 82;
const KEYCODE_KEY_T = 84;
const KEYCODE_KEY_Y = 89;
const KEYCODE_KEY_U = 85;
const KEYCODE_KEY_I = 73;
const KEYCODE_KEY_O = 79;
const KEYCODE_KEY_P = 80;
const KEYCODE_BRACKET_LEFT = 219;
const KEYCODE_BRACKET_RIGHT = 221;
const KEYCODE_BACKSLASH = 220;
const KEYCODE_CAPS_LOCK = 20;
const KEYCODE_KEY_A = 65;
const KEYCODE_KEY_S = 83;
const KEYCODE_KEY_D = 68;
const KEYCODE_KEY_F = 70;
const KEYCODE_KEY_G = 71;
const KEYCODE_KEY_H = 72;
const KEYCODE_KEY_J = 74;
const KEYCODE_KEY_K = 75;
const KEYCODE_KEY_L = 76;
const KEYCODE_SEMICOLON = 186;
const KEYCODE_QUOTE = 222;
const KEYCODE_ENTER = 13;
const KEYCODE_SHIFT_LEFT = 16;
const KEYCODE_KEY_Z = 90;
const KEYCODE_KEY_X = 88;
const KEYCODE_KEY_C = 67;
const KEYCODE_KEY_V = 86;
const KEYCODE_KEY_B = 66;
const KEYCODE_KEY_N = 78;
const KEYCODE_KEY_M = 77;
const KEYCODE_COMMA = 188;
const KEYCODE_PERIOD = 190;
const KEYCODE_SLASH = 191;
const KEYCODE_SHIFT_RIGHT = 16;
const KEYCODE_ARROW_UP = 38;
const KEYCODE_CONTROL_LEFT = 17;
const KEYCODE_ALT_LEFT = 18;
const KEYCODE_ARROW_LEFT = 37;
const KEYCODE_ARROW_RIGHT = 39;
const KEYCODE_ARROW_DOWN = 40;

const SQRT3 = Math.sqrt(3);
const HALF_SQRT3 = SQRT3 / 2;
const PLAYER_SIZE = 20;
const HALF_PLAYER_SIZE = PLAYER_SIZE / 2;

const WALL_FORCE = 4;
const MAX_ACCELERATION = 2;

const NEURAL_NETWORK_YELLOW_COLOR = 0xFFDE21;
const NEURAL_NETWORK_BLACK_COLOR  = 0x000000;
const NEURAL_NETWORK_RED_COLOR    = 0xFF0000;
const NEURAL_NETWORK_GREEN_COLOR  = 0x00FF00;
const BACKGROUND_COLOUR           = 0x90D5FF;

const MAX_ANGLE_CHANGE = 6 * Math.PI / 180;

const PLAYER_COUNT = 1000;
const MUTATION_RATE = 0.05;
const BATCH_DURATION = 30000;

let displayLines = false;

// const cloneMapPair = pair => (pair[1] = pair[1].clone(), pair);
// const cloneMap = (map) => new Map([ ... map.entries() ].map(cloneMapPair));

function cloneMap(map) {
    const clone = new Map();
    
    for (const [key, value] of map) {
        clone.set(key, value.clone());
    }

    return clone;
}

function groupBy(iterable, getGroupKey) {
    const groupMap = new Map();

    for (const item of iterable) {
        const key = getGroupKey(item);
        const group = groupMap.get(key);

        if (!group) {
            groupMap.set(key, [ item ]);
            continue;
        }

        group.push(item);
    }

    return groupMap;
}

function groupByAndMap(iterable, getGroupKey, mapCallback) {
    const groupMap = new Map();

    for (const item of iterable) {
        const key = getGroupKey(item);
        const group = groupMap.get(key);

        if (!group) {
            groupMap.set(key, [ mapCallback(item) ]);
            continue;
        }

        group.push(mapCallback(item));
    }

    return groupMap;
}

function lerpColors(color0, color1, t) {
    const color0_component0 = (color0 & 0xFF0000) >> 16;
    const color0_component1 = (color0 & 0x00FF00) >> 8;
    const color0_component2 = (color0 & 0x0000FF);
    const color1_component0 = (color1 & 0xFF0000) >> 16;
    const color1_component1 = (color1 & 0x00FF00) >> 8;
    const color1_component2 = (color1 & 0x0000FF);
    const component0 = Math.floor(color0_component0 + t * (color1_component0 - color0_component0)) & 0xFF;
    const component1 = Math.floor(color0_component1 + t * (color1_component1 - color0_component1)) & 0xFF;
    const component2 = Math.floor(color0_component2 + t * (color1_component2 - color0_component2)) & 0xFF;
    return (component0 << 16) | (component1 << 8) | component2;
}

function convertToColorString(value) {
    return `#${value.toString(16).padStart(6, "0")}`;
}

function sigmod(x) {
    return 1 / (1 + Math.exp(-x));
}

function getNeuronDependencyCount(neuronId, backwardsConnectionGraph, dependencyCountMap = new Map()) {
    const storedCount = dependencyCountMap.get(neuronId);
    if (storedCount !== null && storedCount !== undefined) {
        return storedCount;
    }

    const connections = backwardsConnectionGraph.get(neuronId);
    if (connections == null || connections.length == 0) {
        return 0;
    }

    let count = 0;
    for (const connection of connections) {
        count += 1 + getNeuronDependencyCount(connection.inputNeuronId, backwardsConnectionGraph, dependencyCountMap);
    }

    dependencyCountMap.set(neuronId, count);
    return count;
}

function makeDependencyCountMap(neuronGenes, backwardsConnectionGraph) {
    const dependencyCountMap = new Map();

    for (const neuronGene of neuronGenes) {
        const neuronId = neuronGene.neuronId;

        if (dependencyCountMap.has(neuronId)) {
            continue;
        }

        let count = 0;
        for (const queue = [ neuronId ]; queue.length != 0;) {
            const currentNeuronId = queue.pop();
            const currentDependencyCount = dependencyCountMap.get(currentNeuronId);
            
            if (currentDependencyCount !== null && currentDependencyCount !== undefined) {
                count += 1 + currentDependencyCount;
                continue;
            }

            const connections = backwardsConnectionGraph.get(currentNeuronId);
            if (!connections || connections.length === 0) {
                dependencyCountMap.set(currentNeuronId, 0);
                continue;
            }

            for (let idx = 0; idx < connections.length; ++idx) {
                queue.push(connections[idx].inputNeuronId);
            }
        }

        dependencyCountMap.set(neuronId, count);
    }

    return dependencyCountMap;
}

// function countChildren(node, queue = []) {
//     node.children.forEach((child) => queue.push(child));

//     let childrenCount = 0;
//     while (queue.length != 0) {
//         const currentNode = queue.shift();

//         childrenCount++;

//         currentNode.children.forEach((child) => queue.push(child));
//     }

//     return childrenCount;
// }

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

class LayeredNeuralNetwork {
    static fromFormat(layerSizes, activation) {
        let weightCount = 0;
        let biasCount = 0;
        for (let idx = 1; idx < layerSizes.length; ++idx) {
            weightCount += layerSizes[idx] * layerSizes[idx - 1];
            biasCount += layerSizes[idx];
        }

        const layers = layerSizes.map(length => Array.from({ length }, () => 0));
        const weights = Array.from({ length: weightCount }, (_) => 0);
        const biases = Array.from({ length: biasCount }, (_) => 0);

        return new NeuralNetwork(layers, weights, biases, activation);
    }

    constructor (layers = [], weights = [], biases = [], activation = sigmod) {
        this.layers = layers;
        this.weights = weights;
        this.biases = biases;
        this.activation = activation;
    }

    clone() {
        const layers = this.layers.map(e => e.slice());
        const weights = this.weights.slice();
        const biases = this.biases.slice();
        const activation = this.activation;
        return new NeuralNetwork(layers, weights, biases, activation);
    }

    processInputs(... inputs) {
        const firstLayer = this.layers[0];

        if (inputs.length != firstLayer.length) {
            return new Error("Invalid input count!");
        }

        for (let idx = 0; idx < firstLayer.length; ++idx) {
            firstLayer[idx] = inputs[idx];
        }

        for (let layerIdx = 1, biasIdx = 0; layerIdx < this.layers.length; ++layerIdx) {
            const currentLayer = this.layers[layerIdx];
            const prevLayer = this.layers[layerIdx - 1];

            for (let idx0 = 0, weightIdx = 0; idx0 < currentLayer.length; ++idx0, ++biasIdx) {
                currentLayer[idx0] = 0;
                for (let idx1 = 0; idx1 < prevLayer.length; ++idx1, ++weightIdx) {
                    currentLayer[idx0] += this.weights[weightIdx] * prevLayer[idx1];
                }

                currentLayer[idx0] = this.activation(currentLayer[idx0] + this.biases[biasIdx]);
            }
        }

        return this.layers[this.layers.length - 1].slice();
    }

    randomize(randomCallback = Math.random) {
        for (let idx = 0; idx < this.weights.length; ++idx) {
            this.weights[idx] = randomCallback(this.weights[idx]);
        }

        for (let idx = 0; idx < this.biases.length; ++idx) {
            this.biases[idx] = randomCallback(this.biases[idx]);
        }

        return this;
    }

    render(context, { x, y, layerDist = 100, nodeDist = 60, nodeSize = 20 }) {
        const neuralNetworkWidth = (this.layers.length - 1) * layerDist;

        for (let layerIdx = 1; layerIdx < this.layers.length; ++layerIdx) {
            const currentLayer = this.layers[layerIdx];
            const prevLayer = this.layers[layerIdx - 1];

            const currentLayerX = layerIdx * layerDist - neuralNetworkWidth / 2;
            const prevLayerX = currentLayerX - layerDist;

            for (let idx0 = 0, weightIdx = 0; idx0 < currentLayer.length; ++idx0) {
                for (let idx1 = 0; idx1 < prevLayer.length; ++idx1, ++weightIdx) {
                    const weight = this.weights[weightIdx];
                    const weightClamped = Math.min(Math.max(weight, -1), 1);
                    const connectionColor = lerpColors(NEURAL_NETWORK_RED_COLOR, NEURAL_NETWORK_GREEN_COLOR, weightClamped);

                    const currentLayerHeight = (currentLayer.length - 1) * nodeDist;
                    const prevLayerHeight = (prevLayer.length - 1) * nodeDist;

                    const prevNodeY    = idx1 * nodeDist - prevLayerHeight / 2;
                    const currentNodeY = idx0 * nodeDist - currentLayerHeight / 2;

                    context.lineWidth = Math.abs(weight);
                    context.strokeStyle = convertToColorString(connectionColor);

                    context.beginPath();
                    context.moveTo(x + prevLayerX, y + prevNodeY);
                    context.lineTo(x + currentLayerX, y + currentNodeY);
                    context.closePath();
                    context.stroke();
                }
            }
        }

        for (let layerIdx = 0; layerIdx < this.layers.length; ++layerIdx) {
            const currentLayer = this.layers[layerIdx];
            const currentLayerX = layerIdx * layerDist - neuralNetworkWidth / 2;
            const currentLayerHeight = (currentLayer.length - 1) * nodeDist;

            for (let idx = 0; idx < this.layers[layerIdx].length; ++idx) {
                const nodeValue = Math.min(Math.max(this.layers[layerIdx][idx], 0), 1);
                const nodeColor = lerpColors(NEURAL_NETWORK_BLACK_COLOR, NEURAL_NETWORK_YELLOW_COLOR, nodeValue);
                const borderColor = lerpColors(nodeColor, 0x232323, 0.15);
                const currentNodeY = idx * nodeDist - currentLayerHeight / 2;
                
                context.beginPath();
                context.arc(x + currentLayerX, y + currentNodeY, nodeSize / 2, 0, 2 * Math.PI, false);
                context.closePath();

                context.fillStyle = convertToColorString(nodeColor);
                context.fill();

                context.lineWidth = 2;
                context.strokeStyle = convertToColorString(borderColor);
                context.stroke();
            }
        }
    }
}

class TargetObject {
    constructor () {
        this.position = new Vector2(0, 0);
    }

    relocate(width, height) {
        this.position.x = width * Math.random();
        this.position.y = height * Math.random();
    }

    isColliding(x, y) {
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) - PLAYER_SIZE;
        return distance < 0;
    }

    render(context, color = "#000000") {
        context.fillStyle = color;
        context.fillRect(this.position.x - PLAYER_SIZE / 2, this.position.y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
    }
}

class NEAT_ComputerPlayer {
    constructor (target, neuralNetwork) {
        this.target = target;
        this.neuralNetwork = neuralNetwork;
        this.position = new Vector2(0, 0);
        this.velocity = new Vector2(0, 0);
        this.prevPosition = new Vector2(0, 0);
        this.normalizedDirection = new Vector2(0, 0);
        this.angle = 0;
        
        this.startTime = Date.now();
        this.lastCollectedTime = Date.now();
        this.targetsCollected = 0;
        this.distanceTraveled = 0;
        this.fitness = 0;
        this.maxFitness = 0;
    }

    relocateTarget(width, height) {
        this.target.relocate(width, height);
        
        this.target.relocate(width, height);
        // while (this.target.isColliding(this.position.x, this.position.y)) {
        while (this.target.position.distance(this.position) <= 200) {
            this.target.relocate(width, height);
        }
    }

    reset(game) {
        const canvas = game.context.canvas;
        this.position.set(canvas.width / 2, canvas.height / 2);
        this.velocity.set(0, 0);
        this.startTime = Date.now();
        this.lastCollectedTime = Date.now();
        this.targetsCollected = 0;
        this.distanceTraveled = 0;
        this.angle = 0;
        this.fitness = 0;
        this.maxFitness = 0;

        const { width, height } = game.context.canvas;
        this.relocateTarget(width, height);

        return this;
    }

    render(context, color) {
        context.save();

        context.translate(this.position.x, this.position.y);
        context.rotate(this.angle);

        context.lineWidth = 2;
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(HALF_PLAYER_SIZE * HALF_SQRT3, 0);
        context.lineTo(-HALF_PLAYER_SIZE * HALF_SQRT3, -HALF_PLAYER_SIZE);
        context.lineTo(-HALF_PLAYER_SIZE * HALF_SQRT3,  HALF_PLAYER_SIZE);
        context.closePath();
        context.stroke();

        context.restore();

        if (displayLines) {
            context.strokeStyle = convertToColorString(NEURAL_NETWORK_GREEN_COLOR);
            context.beginPath();
            context.moveTo(this.position.x, this.position.y);
            context.lineTo(this.target.position.x, this.target.position.y);
            context.closePath();
            context.stroke();
        }

        this.target.render(context, color);
    }

    update(game) {
        const canvas = game.context.canvas;
        this.normalizedDirection.set(Math.cos(this.angle), Math.sin(this.angle));

        const distance = this.target.position.clone().sub(this.position);
        const targetSide = this.normalizedDirection.dot(distance.clone().normalize());
        const result = this.neuralNetwork.processInputs(targetSide < 0, targetSide > 0, distance.magnitude(), 1);

        if (result) {
            const forwardAcceleration = this.neuralNetwork.outputNodeAt(0).value;
            const turnLeft            = this.neuralNetwork.outputNodeAt(1).value;
            const turnRight           = this.neuralNetwork.outputNodeAt(2).value;

            this.velocity.addScaledVector(this.normalizedDirection, forwardAcceleration);
            this.angle += MAX_ANGLE_CHANGE * (turnRight - turnLeft);
        }

        if (this.target.isColliding(this.position.x, this.position.y)) {
            ++this.targetsCollected;
            this.lastCollectedTime = Date.now();
            this.relocateTarget(canvas.width, canvas.height);
        }

        if (this.position.x >= canvas.width - HALF_PLAYER_SIZE) {
            this.velocity.x -= WALL_FORCE;
        }
        else if (this.position.x < HALF_PLAYER_SIZE) {
            this.velocity.x += WALL_FORCE;
        }
        else if (this.position.y >= canvas.height - HALF_PLAYER_SIZE) {
            this.velocity.y -= WALL_FORCE;
        }
        else if (this.position.y < HALF_PLAYER_SIZE) {
            this.velocity.y += WALL_FORCE;
        }

        this.position.add(this.velocity);
        this.velocity.mulScalar(0.9);

        this.distanceTraveled += this.position.distance(this.prevPosition);
        this.prevPosition.copy(this.position);

        const duration = this.lastCollectedTime - this.startTime;
        this.fitness = this.targetsCollected * BATCH_DURATION - duration - 0.0005 * distance + 0.2 * this.distanceTraveled;
        this.maxFitness = Math.max(this.maxFitness, this.fitness);
    }
}

class ComputerPlayer {
    constructor (target, neuralNetwork) {
        this.target = target;
        this.neuralNetwork = neuralNetwork;
        this.position = new Vector2(0, 0);
        this.velocity = new Vector2(0, 0);
        this.prevPosition = new Vector2(0, 0);
        this.normalizedDirection = new Vector2(0, 0);
        this.angle = 0;
        
        this.startTime = Date.now();
        this.lastCollectedTime = Date.now();
        this.targetsCollected = 0;
        this.totalDistance = 0;
    }

    calculateFitness(canvas) {
        const duration = this.lastCollectedTime - this.startTime;
        const distance = this.position.distance(this.target.position);
        // const canvasDiangonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        return this.targetsCollected * BATCH_DURATION - duration - distance / 1000 + this.totalDistance / 5;
    }

    reset() {
        this.startTime = Date.now();
        this.lastCollectedTime = Date.now();
        this.targetsCollected = 0;
        this.totalDistance = 0;
    }

    checkTargetCollection(width, height) {
    }

    collect() {
        this.lastCollectedTime = Date.now();
        ++this.targetsCollected;
    }

    relocateTarget(width, height) {
        this.target.relocate(width, height);
        // while (this.target.isColliding(this.position.x, this.position.y)) {
        while (this.target.position.distance(this.position) <= 1000) {
            this.target.relocate(width, height);
        }
    }

    update(game) {
        this.normalizedDirection.set(Math.cos(this.angle), Math.sin(this.angle));
 
        const canvas = game.context.canvas;
        const distance = new Vector2().subVectors(this.target.position, this.position);
        const angleDifference = Math.atan2(distance.y, distance.x) - this.angle;
        const targetSide = this.normalizedDirection.dot(distance.clone().normalize());
        const canvasDiangonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        // const guess = this.neuralNetwork.processInputs(distanceX, distanceY, angleDifference);
        // const guess = this.neuralNetwork.processInputs(distanceX > 0, distanceX < 0, distanceY > 0, distanceY < 0, angleDifference);
        // const guess = this.neuralNetwork.processInputs(targetSide > 0, targetSide < 0, distance.magnitude(), angleDifference);
        const guess = this.neuralNetwork.processInputs(targetSide > 0, targetSide < 0, distance.magnitude() / canvasDiangonal);
        // const guess = this.neuralNetwork.processInputs(targetSide, distance.magnitude());
        // const guess = this.neuralNetwork.processInputs(targetSide);

        if (guess instanceof Error) {
            console.error(guess.message);
        }
        else if (guess !== null || guess !== undefined) {
            const [ forwardAcceleration, turnLeft, turnRight ] = guess;
            this.velocity.addScaledVector(this.normalizedDirection, forwardAcceleration);
            this.angle += MAX_ANGLE_CHANGE * (turnRight - turnLeft);
        }

        if (this.position.x >= canvas.width - HALF_PLAYER_SIZE) {
            this.velocity.x -= WALL_FORCE;
        }
        else if (this.position.x < HALF_PLAYER_SIZE) {
            this.velocity.x += WALL_FORCE;
        }
        else if (this.position.y >= canvas.height - HALF_PLAYER_SIZE) {
            this.velocity.y -= WALL_FORCE;
        }
        else if (this.position.y < HALF_PLAYER_SIZE) {
            this.velocity.y += WALL_FORCE;
        }

        if (this.target.isColliding(this.position.x, this.position.y)) {
            this.collect();
            this.relocateTarget(canvas.width, canvas.height);
        }

        this.position.add(this.velocity);
        this.totalDistance += this.position.distance(this.prevPosition);
        this.velocity.mulScalar(0.9);

        this.calculateFitness(canvas);
        this.prevPosition.copy(this.position);
    }

    render(context, color = "#000000") {
        context.save();

        context.translate(this.position.x, this.position.y);
        context.rotate(this.angle);

        context.lineWidth = 2;
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(HALF_PLAYER_SIZE * HALF_SQRT3, 0);
        context.lineTo(-HALF_PLAYER_SIZE * HALF_SQRT3, -HALF_PLAYER_SIZE);
        context.lineTo(-HALF_PLAYER_SIZE * HALF_SQRT3,  HALF_PLAYER_SIZE);
        context.closePath();
        context.stroke();

        context.restore();

        if (displayLines) {
            context.strokeStyle = convertToColorString(NEURAL_NETWORK_GREEN_COLOR);
            context.beginPath();
            context.moveTo(this.position.x, this.position.y);
            context.lineTo(this.target.position.x, this.target.position.y);
            context.closePath();
            context.stroke();
        }

        this.target.render(context, color);
    }
}

class _Game {
    constructor (context) {
        this.canvas = context.canvas;
        this.context = context;

        window.addEventListener("resize", this.resizeCallback.bind(this), false);
        this.resizeCallback();

        this.batchStartTime = 0;
        this.batchDuration = 10000;
        this.batchSize = 100;
        this.generationNumber = 0;
    }

    startGeneration() {
    }

    update() {
        // this.players.sort((a, b) => a.fitness - b.fitness);

        // for (let idx = 0; idx < this.players.length; ++idx) {
        //     this.players[idx].update(this);
        // }

        if (Date.now() - this.batchStartTime > this.batchDuration) {
            this.startGeneration();
        }

        this.render();
    }

    render() {
        this.context.fillStyle = "#90D5FF";
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        // for (let idx = 0; idx < this.players.length; ++idx) {
        //     const gradient = idx / this.players.length;
        //     this.players[idx].render(this.context, `hsl(288, 100%, ${Math.floor(gradient * 50)}%)`);
        // }

        const messageString = `GenerationNumber: ${this.generationNumber} | time: ${Date.now() - this.batchStartTime}`;

        this.context.font = "24px consolas";
        this.context.fillStyle = "#A020F0";
        this.context.fillText(messageString, 0, this.context.canvas.height - 2);
    }
    
    resizeCallback() {
        this.canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        this.canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    }

    setupGameLoop() {
        window.setInterval(this.update.bind(this), MILLISECONDS_PER_FRAME);
    }
}

class Game {
    constructor (context) {
        const canvas = context.canvas;

        this.context = context;

        window.addEventListener("resize", this.resizeCallback.bind(this), false);
        this.resizeCallback();

        this.players = Array.from({ length: PLAYER_COUNT }, () => {
            return new ComputerPlayer(new TargetObject(), null);
        });

        this.bestPlayer = this.players[0];
        this.batchStartTime = Date.now();
        this.batchDuration = BATCH_DURATION;
        this.generationNumber = 0;

        this.startGeneration(NeuralNetwork.fromFormat([3, 3], sigmod), true);

        window.addEventListener("keydown", (event) => {
            if (event.keyCode == KEYCODE_SPACE) {
                game.startGeneration(game.bestPlayer.neuralNetwork);
            }

            if (event.keyCode == KEYCODE_KEY_L) {
                displayLines = !displayLines;
            }
        });
    }

    mutationRandomize(value) { return value + 2 * (Math.random() - 0.5); }
    regularRandomize(value) { return value + 0.5 * (Math.random() - 0.5); }

    startGeneration(neuralNetwork, randomizeAll = false) {
        ++this.generationNumber;
        this.batchStartTime = Date.now();

        for (let idx = 0; idx < this.players.length; ++idx) {
            this.players[idx].reset();

            this.players[idx].position.x = canvas.width / 2;
            this.players[idx].position.y = canvas.height / 2;
            this.players[idx].relocateTarget(canvas.width, canvas.height);

            this.players[idx].neuralNetwork = neuralNetwork.clone();

            if (idx == 0) {
                continue;
            }
            
            if (randomizeAll || Math.random() <= MUTATION_RATE) {
                this.players[idx].neuralNetwork.randomize(this.mutationRandomize);
            }
            else {
                this.players[idx].neuralNetwork.randomize(this.regularRandomize);
            }
        }
    }

    update() {
        this.bestPlayer = this.players.reduce((bestPlayer, player) => {
            const bestPlayerFitness = bestPlayer.calculateFitness(canvas);
            const playerFitness = player.calculateFitness(canvas);
            return bestPlayerFitness > playerFitness ? bestPlayer : player;
        });

        for (let idx = 0; idx < this.players.length; ++idx) {
            this.players[idx].update(this);
        }

        if (Date.now() - this.batchStartTime > this.batchDuration) {
            this.startGeneration(this.bestPlayer.neuralNetwork);
        }

        this.render();
    }

    render() {
        this.context.fillStyle = "#90D5FF";
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        for (let idx = 0; idx < this.players.length; ++idx) {
            if (this.players[idx] == this.bestPlayer) {
                this.bestPlayer.render(this.context, convertToColorString(NEURAL_NETWORK_YELLOW_COLOR));
                continue;
            }

            this.players[idx].render(this.context);
        }

        const messageString = `GenerationNumber: ${this.generationNumber} | bestPlayer: { targetsCollected: ${this.bestPlayer.targetsCollected}, fitness: ${this.bestPlayer.calculateFitness()} }`;

        this.context.font = "24px consolas";
        this.context.fillStyle = "#A020F0";
        this.context.fillText(messageString, 0, this.context.canvas.height - 2);

        if (this.bestPlayer) {
            this.bestPlayer.neuralNetwork.render(this.context, {
                x: 100,
                y: 80,
                layerDist: 40,
                nodeDist: 30,
                nodeSize: 10,
            });
        }
    }

    resizeCallback() {
        const canvas = this.context.canvas;
        canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    }

    setupGameLoop() {
        window.setInterval(this.update.bind(this), MILLISECONDS_PER_FRAME);
    }
}

let game

async function main() {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    // game = new Game(context);
    game = new _Game(context);
    game.setupGameLoop();
}

// window.addEventListener("load", main, false);

/*
console.time("innovationCounter.createBaseGenome");
const innovationCounter = new InnovationCounter();
const genome = innovationCounter.createBaseGenome(2000, 2000);
console.profile("genome.toNeuralNetwork")
const neuralNetwork = genome.toNeuralNetwork();
console.profileEnd("genome.toNeuralNetwork")
console.log(neuralNetwork);
console.timeEnd("innovationCounter.createBaseGenome");
 */
