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

function _dependencyCount(key, map, countMap = new Map()) {
    const storedDependencyCount = countMap.get(key);

    if (storedDependencyCount != null || storedDependencyCount != undefined) {
        return storedDependencyCount;
    }

    let count = 0;
    for (const childKey of map.get(key)) {
        count += 1 + dependencyCount(childKey, map, countMap);
    }

    return count;
}

function dependencyCount(value, iterChildrenCallback, countMap = new Map()) {
    const storedDependencyCount = countMap.get(value);

    if (storedDependencyCount != null || storedDependencyCount != undefined) {
        return storedDependencyCount;
    }

    // let count = 0;
    // iterChildrenCallback(child => {
    //     count += 1 + dependencyCount(child, iterChildrenCallback, countMap);
    // });

    const children = iterChildrenCallback(value);
    // // for (let idx = 0; idx < children.length; ++idx) {
    for (const child of children) {
        count += 1 + dependencyCount(child, iterChildrenCallback, countMap);
    }

    storedDependencyCount.set(value, count);
    return count;
}

// function sortMapByDependencyCount(map = new Map()) {
//     const countMap = new Map();
//     return [ ... map.keys() ].sort((key0, key1) => {
//         const dependencyCount0 = dependencyCount(key0, map, countMap);
//         const dependencyCount1 = dependencyCount(key1, map, countMap);
//         return dependencyCount0 - dependencyCount1;
//     });
// }

function sortByDependencyCount(values = [], iterChildrenCallback) {
    const countMap = new Map();
    return values.toSorted((value0, value1) => {
        const dependencyCount0 = dependencyCount(value0, iterChildrenCallback, countMap);
        const dependencyCount1 = dependencyCount(value1, iterChildrenCallback, countMap);
        return dependencyCount0 - dependencyCount1;
    });
}

function topologicalSort(map = new Map()) {
    const sorted  = [];
    const visited = [];
    
    for (const key of map.keys()) {
        visit(key);
    }

    function visit(key) {
        if (sorted.includes(key)) {
            return;
        }

        if (visited.includes(key)) {
            return;
        }

        visited.push(key);

        for (const childKey of map.get(key)) {
            visit(childKey);
        }

        sorted.push(key);
    }

    return sorted;
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

class NeuralNetwork {
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

// class ForwardFeedNeuralNetwork {
//     constructor (inputCount, outputCount, nodes) {
//         this.inputCount = inputCount;
//         this.outputCount = outputCount;
//         this.nodes = nodes;
//     }

//     processInputs(... inputValues) {
//     }
// }

// class NEAT_NeuralNetworkConnection {
//     constructor (inovationNumber = 0, inputNodeIndex = 0, outputNodeIndex = 0, weight = 1, enabled = true) {
//         this.inovationNumber = inovationNumber;
//         this.inputNodeIndex  = inputNodeIndex;
//         this.outputNodeIndex = outputNodeIndex;
//         this.weight          = weight;
//         this.enabled       = enabled;
//     }
    
//     static createCrossover(dominant, recessive) {
//         if (dominant.inovationNumber != recessive.inovationNumber) {
//             return null;
//         }

//         const { inovationNumber, inputNodeIndex, outputNodeIndex } = dominant;
//         const weight    = Math.random() < 0.5 ? dominant.weight : recessive.weight;
//         const enabled = Math.random() < 0.5 ? dominant.enabled : recessive.enabled;
//         return new NEAT_NeuralNetworkConnection(inovationNumber, inputNodeIndex, outputNodeIndex, weight, enabled);
//     }

//     clone() {
//         return new NEAT_NeuralNetworkNode(
//             inovationNumber,
//             inputNodeIndex,
//             outputNodeIndex,
//             weight,
//             enabled,
//         );
//     }
// }

// class NEAT_NeuralNetworkNode {
//     static createCrossover(dominant, recessive) {
//         if (dominant.index != recessive.index) {
//             return null;
//         }

//         const activation = Math.random() < 0.5 ? dominant.activation : recessive.activation;
//         return new NEAT_NeuralNetworkNode(dominant.index, activation);
//     }

//     constructor (index, activation, value = 0) {
//         this.index = index;
//         this.activation = activation;
//         this.value = value;
//     }

//     clone() {
//         return new NEAT_NeuralNetworkNode(this.index, this.activation, this.value);
//     }
// }

// class NEAT_NeuralNetwork {
//     static fromInputOutput(inputCount, outputCount) {
//         // const result = new NEAT_NeuralNetwork(nodes);
//     }

//     constructor (nodes, connections, inputCount, outputCount) {
//         this.nodes        = nodes;
//         this.connections  = connections;
//         this.inputCount   = inputCount;
//         this.outputCount  = outputCount;
//     }

//     clone() {
//         return new NEAT_NeuralNetwork(
//             this.nodes.map(e => e.clone()),
//             this.connections.map(e => e.clone()),
//             this.inputCount,
//             this.outputCount,
//         );
//     }

//     outputNodeAt(idx) {
//         if (idx >= this.outputCount || idx < 0) {
//             return null;
//         }

//         return this.nodes[this.inputCount + idx];
//     }

//     inputNodeAt(idx) {
//         if (idx >= this.inputCount || idx < 0) {
//             return null;
//         }

//         return this.nodes[idx];
//     }

//     processInputs(inputValues) {
//         if (inputValues.length != this.inputCount) {
//             return false;
//         }

//         for (let idx = 0; idx < this.inputCount; ++idx) {
//             this.nodes[idx].value = inputValues[idx];
//         }

//         const nodes = new Map(this.nodes.map(node => [ node.index, node ]));
//         const outputNodeConnections = this.connections.reduce((connectionMap, connection) => {
//             const nodeInputConnections = connectionMap.get(connection.outputNodeIndex) || [];
//             connectionMap.set(connection.outputNodeIndex, [ ... nodeInputConnections, connection ]);
//             return connectionMap;
//         }, new Map());

//         for (const [ outputNodeIndex, connections ] of outputNodeConnections) {
//             const outputNode = nodes.get(outputNodeIndex);
            
//             outputNode.value = 0;
//             for (let idx = 0; idx < connections.length; ++idx) {
//                 const inputNode = nodes.get(connections[idx].inputNodeIndex);
//                 outputNode.value += inputNode.value * connections[idx].weight;
//             }

//             outputNode.value = outputNode.activation(outputNode.value);
//         }

//         return true;

//         // for (let idx = 0; idx < nodeConnections.length; ++idx) {
//         // }

//         // this.connections.sort((a, b) => a.outputNodeIndex - b.outputNodeIndex);

//         // for (let idx = 0; idx < this.connections.length; ++idx) {
//         // }


//         // this.connections.sort((a, b) => a.outputNodeIndex - b.outputNodeIndex);

//         // this.nodeIndexMap.clear();
//         // for (let idx = 0; idx < this.nodes.length; ++idx) {
//         //     this.nodeIndexMap.set(this.nodes[idx].index, idx);
//         // }

//         // let prevConnection = null;
//         // for (let idx = 0; idx < this.connections.length; ++idx) {
//         //     const inputNode = this.nodes[this.nodeIndexMap.get(this.connections.inputNodeIndex)];
//         //     const outputNode = this.nodes[this.nodeIndexMap.get(this.connections.outputNodeIndex)];
//         //     const connection = this.connections[idx];

//         //     outputNode.value += inputNode.value * connection.weight;

//         //     // if (prevConnection.inputNodeIndex < connection.inputNodeIndex && prevConnection.inputNodeIndex >= this.inputCount) {
//         //     if (prevConnection.outputNodeIndex < connection.outputNodeIndex) {
//         //         const activationNodeIndex = this.nodeIndexMap.get(prevConnection.outputNodeIndex);
//         //         if (activationNodeIndex >= this.inputCount) {
//         //             const nodeToActivate = this.nodes[prevConnection.inputNodeIndex];
//         //             nodeToActivate.value = nodeToActivate.activation(nodeToActivate.value);
//         //         }
//         //     }

//         //     prevConnection = connection;
//         // }

//         return true;
//     }

//     addConnection(connection) {
//         this.connections.push(connection);
//     }

//     addNode(node) {
//         this.nodes.push(node);
//     }
// }

// class NEAT_NeuralNetworkSystem {
//     constructor () {
//         this.neuralNetworkIndex = 0;
//         this.inovationNumber = 0;
//         this.connectionSet = [];
//         // this.connectionSet = new Set([]);
//     }

//     createNeuralNetwork(inputCount, outputCount) {
//         const nodes = Array.from({ length: inputCount + outputCount }, () => new NEAT_NeuralNetworkNode);
//         return new NEAT_NeuralNetwork(nodes, [], inputCount, outputCount);
//     }

//     // createConnection(inputIndex, outputIndex, weight, enabled) {
//     //     const connection = this.connectionSet.find(([idxInput, idxOutput]) => idxInput == inputIndex && idxOutput == outputIndex);
//     //     const inovationNumber = (connection == null || connection == undefined) ? this.inovationNumber++ : connection.inovationNumber;
//     //     return new NEAT_NeuralNetworkConnection(inovationNumber, inputIndex, outputIndex, weight, enabled);
//     // }

//     createMutation(neuralNetwork) {
//         for (let idx = 0; idx < neuralNetwork.connections.length; ++idx) {
//             neuralNetwork.connections[idx].weight += 0.5 * Math.random();
//         }
//     }

//     createCrossover(dominant, recessive) {
//         const offspring = this.createNeuralNetwork();
//         // const offspring = new NEAT_NeuralNetwork();

//         for (let idx = 0; idx < dominant.nodes.length; ++idx) {
//             const dominantNode = dominant.nodes[idx];
//             const recessiveNode = recessive.nodes.find(node => node.index == dominantNode.index);

//             if (recessiveNode == null || recessiveNode == undefined) {
//                 offspring.addNode(dominantNode);
//             }
//             else {
//                 offspring.addNode(NEAT_NeuralNetworkNode.createCrossover(dominantNode, recessiveNode));
//             }
//         }

//         for (let idx = 0; idx < dominant.connections.length; ++idx) {
//             const dominantConnection = dominant.connections[idx];
//             const recessiveConnection = recessive.connections.find(connection => connection.inovationNumber == dominantConnection.inovationNumber);

//             if (recessiveConnection == null || recessiveConnection == undefined) {
//                 offspring.addConnection(dominantConnection);
//             }
//             else {
//                 offspring.addConnection(NEAT_NeuralNetworkConnection.createCrossover(dominantConnection, recessiveConnection));
//             }
//         }

//         return offspring;
//     }
// }

class NEAT_NeuralNetworkNode {
    static createCrossover(dominant, recessive) {
        if (dominant.index != recessive.index) {
            return null;
        }

        const activation = Math.random() < 0.5 ? dominant.activation : recessive.activation;
        return new NEAT_NeuralNetworkNode(dominant.index, activation);
    }

    constructor (index = 0, activation = sigmod, value = 0) {
        this.activation = activation;
        this.index = index;
        this.value = value;
    }

    clone() {
        return new NEAT_NeuralNetworkNode(this.index, this.activation, this.value);
    }
    
}

class NEAT_NeuralNetworkConnection {
    static createCrossover(dominant, recessive) {
        if (dominant.inputIndex != recessive.inputIndex || dominant.outputIndex != recessive.outputIndex) {
            return null;
        }

        const { inputNodeIndex, outputNodeIndex } = dominant;
        const weight    = Math.random() < 0.5 ? dominant.weight : recessive.weight;
        const enabled = Math.random() < 0.5 ? dominant.enabled : recessive.enabled;
        return new NEAT_NeuralNetworkConnection(inputNodeIndex, outputNodeIndex, weight, enabled);
    }

    constructor (inputIndex = 0, outputIndex = 0, weight = 1, enabled = true) {
        this.inputIndex = inputIndex;
        this.outputIndex = outputIndex;
        this.weight = weight;
        this.enabled = enabled;
    }

    clone() {
        return new NEAT_NeuralNetworkConnection(
            this.inputIndex,
            this.outputIndex,
            this.weight,
            this.enabled,
        );
    }
}

class NEAT_NeuralNetwork {
    static createBase(inputCount, outputCount, activation = sigmod) {
        const nodes       = Array.from({ length: inputCount + outputCount }, (_, idx) => new NEAT_NeuralNetworkNode(idx, activation));
        const connections = [];

        for (let idx0 = 0; idx0 < inputCount; ++idx0) {
            for (let idx1 = 0; idx1 < outputCount; ++idx1) {
                connections.push(new NEAT_NeuralNetworkConnection(idx0, inputCount + idx1, 1, true));
            }
        }

        return new NEAT_NeuralNetwork(inputCount, outputCount, nodes, connections);
    }

    static createCrossover(dominant, recessive) {
        const offspring = new NEAT_NeuralNetwork(dominant.inputCount, dominant.outputCount, [], []);

        for (let idx = 0; idx < dominant.nodes.length; ++idx) {
            const dominantNode = dominant.nodes[idx];
            const recessiveNode = recessive.nodes.find(node => node.index == dominantNode.index);

            if (recessiveNode == null || recessiveNode == undefined) {
                offspring.nodes.push(dominantNode);
            }
            else {
                offspring.nodes.push(NEAT_NeuralNetworkNode.createCrossover(dominantNode, recessiveNode));
            }
        }

        for (let idx = 0; idx < dominant.connections.length; ++idx) {
            const dominantConnection = dominant.connections[idx];
            const recessiveConnection = recessive.connections.find(connection => connection.inputIndex  == dominantConnection.inputIndex
            &&                                                                   connection.outputIndex == dominantConnection.outputIndex);

            if (recessiveConnection == null || recessiveConnection == undefined) {
                offspring.connections.push(dominantConnection);
            }
            else {
                offspring.connections.push(NEAT_NeuralNetworkConnection.createCrossover(dominantConnection, recessiveConnection));
            }
        }

        return offspring;
    }

    constructor (inputCount, outputCount, nodes = [], connections = []) {
        this.inputCount = inputCount;
        this.outputCount = outputCount;
        this.connections = connections;
        this.nodes = nodes;
    }
    
    inputNodeAt(idx) {
        if (idx >= this.inputCount || idx < 0) {
            return null;
        }

        return this.nodes[idx];
    }

    outputNodeAt(idx) {
        if (idx >= this.outputCount || idx < 0) {
            return null;
        }

        return this.nodes[this.inputCount + idx];
    }

    clone() {
        return new NEAT_NeuralNetwork(
            this.inputCount,
            this.outputCount,
            this.nodes.map(e => e.clone()),
            this.connections.map(e => e.clone()),
        );
    }

    randomize(randomCallback = () => 2 * (Math.random() - 0.5)) {
        for (let idx = 0; idx < this.connections.length; ++idx) {
            this.connections[idx].weight = randomCallback(this.connections[idx].weight);
        }

        return this;
    }

    processInputs(... inputValues) {
        if (inputValues.length != this.inputCount) {
            return false;
        }

        for (let idx = 0; idx < this.inputCount; ++idx) {
            this.nodes[idx].value = inputValues[idx];
        }

        const nodes = new Map(this.nodes.map(node => [ node.index, node ]));
        const outputNodeConnections = this.connections.reduce((connectionMap, connection) => {
            const nodeInputConnections = connectionMap.get(connection.outputIndex) || [];
            connectionMap.set(connection.outputIndex, [ ... nodeInputConnections, connection ]);
            return connectionMap;
        }, new Map());

        for (const [ outputIndex, connections ] of outputNodeConnections) {
            const outputNode = nodes.get(outputIndex);

            outputNode.value = 0;
            for (let idx = 0; idx < connections.length; ++idx) {
                const inputNode = nodes.get(connections[idx].inputIndex);
                outputNode.value += inputNode.value * connections[idx].weight;
            }

            outputNode.value = outputNode.activation(outputNode.value);
        }

        return true;
    }
}

class ConnectionGene {
    static _innovationCounter = 0;

    static crossover(dominant, recessive) {
        if (dominant.innovationNumber != recessive.innovationNumber) {
            return null;
        }

        const weight = Math.random() < 0.5 ? dominant.weight : recessive.weight;
        const enabled = Math.random() < 0.5 ? dominant.enabled : recessive.enabled;
        
        return new ConnectionGene(dominant.innovationNumber,
                                  dominant.inputIdx,
                                  dominant.outputIdx,
                                  weight, enabled);
    }

    static create(inputNeuronId = 0, outputNeuronId = 0, weight = 1, enabled = true) {
        return new ConnectionGene(ConnectionGene._innovationCounter++, inputNeuronId, outputNeuronId, weight, enabled);
    }

    constructor (innovationNumber = 0, inputNeuronId = 0, outputNeuronId = 0, weight = 1, enabled = true) {
        this.innovationNumber = innovationNumber;
        this.inputNeuronId = inputNeuronId;
        this.outputNeuronId = outputNeuronId;
        this.weight = weight;
        this.enabled = enabled;
    }
}

class NeuronGene {
    static _neuronCounter = 0;

    static crossover(dominant, recessive) {
        if (dominant.neuronId != recessive.neuronId) {
            return null;
        }

        const activation = Math.random() < 0.5 ? dominant.activation : recessive.activation;
        return new NeuronGene(dominant.neuronId, activation);
    }

    constructor (neuronId = 0, activation = sigmod, value = 0) {
        this.neuronId = neuronId;
        this.activation = activation;
        this.value = value;
    }

    dependencyCount(neuronIdToGene, connectionGraph, countMap = new Map()) {
        const storedDependencyCount = countMap.get(this.neuronId);

        if (storedDependencyCount !== null || storedDependencyCount !== undefined) {
            return storedDependencyCount;
        }

        let count = 0;
        const connections = connectionGraph.get(this.neuronId);

        if (connections !== null || connections !== undefined) {
            for (let idx = 0; idx < connections.length; ++idx) {
                const neuronGene = neuronIdToGene.get(connections[idx].inputNeuronId);
                count += 1 + neuronGene.dependencyCount(neuronIdToGene, connectionGraph, countMap);
            }
        }

        countMap.set(this.neuronId, count);
        return count;
    }
}

class NeuralNetworkGenome {
    static _genomeCounter = 0;

    static crossover(dominant, recessive) {
        // genomeId should be equal to dominant.genomeId since ids should be maintained during crossovers.
        const genomeId = NeuralNetworkGenome._genomeCounter++;
        const offspring = new NeuralNetworkGenome(genomeId, dominant.inputCount, dominant.outputCount);

        for (let idx = 0; idx < dominant.neurons.length; ++idx) {
            const dominantNeuron = dominant.neurons[idx];
            const recessiveNeuron = recessive.neurons.find(neuron => neuron.neuronId == dominantNeuron.neuronId);

            if (recessiveNeuron == null || recessiveNeuron == undefined) {
                offspring.neurons.push(dominantNeuron);
            }
            else {
                offspring.neurons.push(NeuronGene.crossover(dominantNeuron, recessiveNeuron));
            }
        }

        for (let idx = 0; idx < dominant.connections.length; ++idx) {
            const dominantConnection = dominant.connections[idx];
            const recessiveConnection = recessive.connections.find(connection => connection.innovationNumber == dominantConnection.innovationNumber);

            if (recessiveConnection == null || recessiveConnection == undefined) {
                offspring.connections.push(dominantConnection);
            }
            else {
                offspring.connections.push(ConnectionGene.crossover(dominantConnection, recessiveConnection));
            }
        }

        return offspring;
    }

    static mutation(genome) {
        const genomeId  = NeuralNetworkGenome._genomeCounter++;
        return new NeuralNetworkGenome(genomeId);
    }

    static createBase(inputCount = 0, outputCount = 0) {
        const neurons = [];
        const connections = [];
        let inovationNumber = 0;
        let neuronId = 0;

        for (let idx0 = 0; idx0 < inputCount; ++idx0) {
            neurons.push(new NeuronGene(neuronId++));
        }
        
        for (let idx1 = 0; idx1 < outputCount; ++idx1) {
            neurons.push(new NeuronGene(neuronId++));
        }

        for (let idx0 = 0; idx0 < inputCount; ++idx0) {
            for (let idx1 = 0; idx1 < outputCount; ++idx1) {
                connections.push(new ConnectionGene(inovationNumber++, idx0, inputCount + idx1));
            }
        }

        return new NeuralNetworkGenome(this._genomeCounter++, inputCount, outputCount, neurons, connections);
    }

    constructor (genomeId = 0, inputCount = 0, outputCount = 0, neurons = [], connections = []) {
        this.genomeId = genomeId;
        this.neurons = neurons;
        this.connections = connections;
        this.inputCount = inputCount;
        this.outputCount = outputCount;
    }

    createConnectionGraph() {
        const connectionGraph = new Map();

        for (let idx = 0; idx < this.connections.length; ++idx) {
            const connection = this.connections[idx];
            const nodeConnections = connectionGraph.get(connection.outputNeuronId) || [];
            nodeConnections.push(connection);
            connectionGraph.set(connection.outputNeuronId, nodeConnections);
        }

        return connectionGraph;
    }

    toNeuralNetwork() {
        const neuronIdToGene = new Map(this.neurons.map(neuron => [ neuron.neuronId, neuron ]));
        const connectionGraph = this.createConnectionGraph();
        
        const dependencyCounts = new Map();
        const sortedNeuronGenes = this.neurons.toSorted((neuron0, neuron1) => {
            const dependencyCount0 = neuron0.dependencyCount(neuronIdToGene, connectionGraph, dependencyCounts);
            const dependencyCount1 = neuron1.dependencyCount(neuronIdToGene, connectionGraph, dependencyCounts);
            return dependencyCount0 - dependencyCount1;
        });

        const sortedNeuronIdToIndex = new Map(sortedNeuronGenes.map((neuronGene, idx) => [ neuronGene.neuronId, idx ]));
        const neurons = sortedNeuronGenes.map(neuronGene => new FeedForwardNeuralNetworkNeuron(neuronGene.activation));

        for (let idx = 0; idx < neurons.length; ++idx) {
            const inputConnections = connectionGraph.get(sortedNeuronGenes[idx].neuronId) || [];

            neurons[idx].inputs = inputConnections.map(connection => {
                const inputNeuronIndex = sortedNeuronIdToIndex.get(connection.inputNeuronId);
                return new FeedForwardNeuralNetworkConnection(neurons[inputNeuronIndex], connection.weight);
            });
        }

        const inputNeurons = neurons.slice(0, this.inputCount);
        const outputNeurons = neurons.slice(neurons.length - this.outputCount);
        const neuronsToProcess = neurons.slice(this.inputCount);

        return new FeedForwardNeuralNetwork(inputNeurons, outputNeurons, neuronsToProcess);
    }

    mutateAddConnection() {
    }

    mutateRemoveConnection() {
    }

    mutateAddNeuron() {
    }

    mutateRemoveNeuron() {
    }
}

class FeedForwardNeuralNetworkConnection {
    constructor (neuron, weight) {
        this.neuron = neuron;
        this.weight = weight;
    }
}

class FeedForwardNeuralNetworkNeuron {
    constructor (activation, inputs) {
        this.activation = activation;
        this.inputs = inputs;
        this.value = 0;
    }

    process() {
        this.value = 0;
        for (let idx = 0; idx < this.inputs.length; ++idx) {
            const { weight, neuron } = this.inputs[idx];
            this.value += neuron.value * weight;
        }

        this.value = this.activation(this.value);
        return this.value;
    }
}

class FeedForwardNeuralNetwork {
    constructor (inputNeurons, outputNeurons, neuronsToProcess) {
        this.inputNeurons = inputNeurons;
        this.outputNeurons = outputNeurons;
        this.neuronsToProcess = neuronsToProcess;
    }

    setInputValueAt(index, value) {
        return this.inputNeurons[index].value = value;
    }

    getOutputValueAt(index) {
        return this.outputNeurons[index].value;
    }

    process() {
        for (let idx = 0; idx < this.neuronsToProcess.length; ++idx) {
            this.neuronsToProcess[idx].process();
        }

        return this.outputNeurons.map(neuron => neuron.value);
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
        this.players = Array.from({ length: this.batchSize }, () => new NEAT_ComputerPlayer(new TargetObject(), NEAT_NeuralNetwork.createBase(4, 3)));
        // this.players = Array.from({ length: this.batchSize }, () => new NEAT_ComputerPlayer(new TargetObject(), this.system.createNeuralNetwork(3, 3)));

        // this.startGeneration(NEAT_NeuralNetwork.createBase(4, 3), true);
        this.startGeneration(false);
    }

    startGeneration(applyNeat = true) {
        ++this.generationNumber;
        this.batchStartTime = Date.now();

        if (applyNeat) {
            this.players.sort((a, b) => a.fitness - b.fitness);
            const cutoffCount = Math.floor(0.25 * this.batchSize);
            this.players = this.players.slice(0, cutoffCount);

            while (this.players.length < this.batchSize) {
                const player0 = this.players[Math.floor(cutoffCount * Math.random())];
                const player1 = this.players[Math.floor(cutoffCount * Math.random())];
                const dominant  = player0.fitness > player1.fitness ? player0.neuralNetwork : player1.neuralNetwork;
                const recessive = player1.fitness > player0.fitness ? player1.neuralNetwork : player0.neuralNetwork;
                const neuralNetwork = NEAT_NeuralNetwork.createCrossover(dominant, recessive);
                this.players.push(new NEAT_ComputerPlayer(new TargetObject(), neuralNetwork));
            }
        }

        for (let idx = 0; idx < this.players.length; ++idx) {
            this.players[idx].reset(this);
            // this.players[idx].neuralNetwork = neuralNetwork.clone();

            // if (idx != 0) {
            //     if (randomizeAll || Math.random() <= MUTATION_RATE) {
            //         this.players[idx].neuralNetwork.randomize(this.mutationRandomize);
            //     }
            //     else {
            //         this.players[idx].neuralNetwork.randomize(this.regularRandomize);
            //     }
            // }
        }
    }

    update() {
        // this.bestPlayer = this.players.reduce((bestPlayer, player) => {
        //     const bestPlayerFitness = bestPlayer.calculateFitness(canvas);
        //     const playerFitness = player.calculateFitness(canvas);
        //     return bestPlayerFitness > playerFitness ? bestPlayer : player;
        // });

        this.players.sort((a, b) => a.fitness - b.fitness);

        for (let idx = 0; idx < this.players.length; ++idx) {
            this.players[idx].update(this);
        }

        if (Date.now() - this.batchStartTime > this.batchDuration) {
            this.startGeneration(true);
        }

        this.render();
    }

    render() {
        this.context.fillStyle = "#90D5FF";
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        for (let idx = 0; idx < this.players.length; ++idx) {
            const gradient = idx / this.players.length;
            this.players[idx].render(this.context, `hsl(288, 100%, ${Math.floor(gradient * 50)}%)`);
        }

        // this.players[0].neuralNetwork.render(this.context);

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
