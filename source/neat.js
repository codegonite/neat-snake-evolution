// https://nn.cs.utexas.edu/downloads/papers/stanley.cec02.pdf

const INVALID_INDEX_U32 = 0xFFFFFFFF

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

function choice(array, length = array.length, offset = 0) {
    return array[Math.floor(offset + length * Math.random())]
}

function sample(array, count) {
    const population = array.slice(), results = []
    while (results.length < count) {
        const index = Math.floor(Math.random() * population.length);
        results.push(population[index]);
        population.splice(index, 1);
    }
    return results
}

function uniform(min = -1, max = 1) {
    return Math.random() * (max - min) + min
}

function normal() {
    let u1 = Math.random()
    let u2 = Math.random()
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return z0
}

// const activationMap = new Map([
//     [ "clamped", clamped ],
//     [ "sigmod",  sigmod  ],
//     [ "cube",    cube    ],
//     [ "exp",     exp     ],
//     [ "relu",    relu    ],
// ])

function getActivationFunction(name) {
    switch (name) {
        case "clamped": return clamped
        case "sigmod": return sigmod
        case "cube": return cube
        case "exp": return exp
        case "relu": return relu
    }

    throw new Error(`Activation "${name}" doesn't exist!`)
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// function deserializePropertyList(buffer, offset, length) {
//     const result = new Map()
//     const view = new DataView(buffer)

//     const propertyCount = view.getUint32(offset, true); offset += 4

//     for (let idx = 0; idx < propertyCount; ++idx) {
//         const propertyNameLength = view.getUint32(offset, true); offset += 4
//         const propertyNameBuffer = decoder.decode()
//         const propertyName = decoder.decode()
//     }

//     return result
// }

class Configuration {
    constructor ({
        excessGeneCoefficient = 1.0,
        disjointGeneCoefficient = 1.0,
        weightDifferenceCoefficient = 0.4,
        compatibilityThreshold = 80.0,
        addConnectionAttepmpts = 1,
        mutateAddConnectionRate = 0.1,
        mutateRemoveConnectionRate = 0.1,
        mutateAddNeuronRate = 0.1,
        mutateRemoveNeuronRate = 0.1,
        mutateChangeWeightRate = 0.5,
        mutateSetWeightRate = 0.5,
        mutateWeightsGaussianRate = 0.1,
        mutateWeightsUniformRate = 0.1,
        randomWeightRange = 2.0,
        changeWeightRange = 2.0,
        activations = [ sigmod ],
    } = {}) {
        this.excessGeneCoefficient = excessGeneCoefficient
        this.disjointGeneCoefficient = disjointGeneCoefficient
        this.weightDifferenceCoefficient = weightDifferenceCoefficient
        this.compatibilityThreshold = compatibilityThreshold
        this.addConnectionAttepmpts = addConnectionAttepmpts
        this.mutateAddConnectionRate = mutateAddConnectionRate
        this.mutateRemoveConnectionRate = mutateRemoveConnectionRate
        this.mutateAddNeuronRate = mutateAddNeuronRate
        this.mutateRemoveNeuronRate = mutateRemoveNeuronRate
        this.mutateChangeWeightRate = mutateChangeWeightRate
        this.mutateSetWeightRate = mutateSetWeightRate
        this.mutateWeightsGaussianRate = mutateWeightsGaussianRate
        this.mutateWeightsUniformRate = mutateWeightsUniformRate
        this.randomWeightRange = randomWeightRange
        this.changeWeightRange = changeWeightRange
        this.activations = activations
    }

    static deserialize(deserializer = new BinaryDeserializer()) {
        const options = {
            excessGeneCoefficient: deserializer.readFloat64LE(),
            disjointGeneCoefficient: deserializer.readFloat64LE(),
            weightDifferenceCoefficient: deserializer.readFloat64LE(),
            compatibilityThreshold: deserializer.readFloat64LE(),
            mutateAddConnectionRate: deserializer.readFloat64LE(),
            mutateRemoveConnectionRate: deserializer.readFloat64LE(),
            mutateAddNeuronRate: deserializer.readFloat64LE(),
            mutateRemoveNeuronRate: deserializer.readFloat64LE(),
            mutateChangeWeightRate: deserializer.readFloat64LE(),
            mutateSetWeightRate: deserializer.readFloat64LE(),
            mutateWeightsGaussianRate: deserializer.readFloat64LE(),
            mutateWeightsUniformRate: deserializer.readFloat64LE(),
            randomWeightRange: deserializer.readFloat64LE(),
            changeWeightRange: deserializer.readFloat64LE(),
            addConnectionAttepmpts: deserializer.readFloat64LE(),
            activations: [],
        }

        const activationsCount = deserializer.readUint32LE()
        for (let idx = 0; idx < activationsCount; ++idx) {
            const length = deserializer.readUint32LE()
            const activationName = deserializer.readStringUTF8(length)
            const activation = getActivationFunction(activationName)
            options.activations.push(activation)
        }

        return new Configuration(options)
    }

    serialize(serializer = new BinarySerializer()) {
        serializer.writeFloat64LE(this.excessGeneCoefficient)
        serializer.writeFloat64LE(this.disjointGeneCoefficient)
        serializer.writeFloat64LE(this.weightDifferenceCoefficient)
        serializer.writeFloat64LE(this.compatibilityThreshold)
        serializer.writeFloat64LE(this.mutateAddConnectionRate)
        serializer.writeFloat64LE(this.mutateRemoveConnectionRate)
        serializer.writeFloat64LE(this.mutateAddNeuronRate)
        serializer.writeFloat64LE(this.mutateRemoveNeuronRate)
        serializer.writeFloat64LE(this.mutateChangeWeightRate)
        serializer.writeFloat64LE(this.mutateSetWeightRate)
        serializer.writeFloat64LE(this.mutateWeightsGaussianRate)
        serializer.writeFloat64LE(this.mutateWeightsUniformRate)
        serializer.writeFloat64LE(this.randomWeightRange)
        serializer.writeFloat64LE(this.changeWeightRange)
        serializer.writeFloat64LE(this.addConnectionAttepmpts)

        serializer.writeUint32LE(this.activations.length)
        for (let idx = 0; idx < this.activations.length; ++idx) {
            const activationName = this.activations[idx].name;
            serializer.writeUint32LE(activationName.length)
            serializer.writeStringUTF8(activationName)
        }

        return serializer
    }
}

class InnovationCounter {
    constructor (innovationCounter = 0, neuronCounter = 0, genomeCounter = 0) {
        this.innovationCounter = innovationCounter
        this.neuronCounter = neuronCounter
        this.genomeCounter = genomeCounter
    }

    static deserialize(deserializer) {
        const innovationCounter = deserializer.readUint32LE()
        const neuronCounter = deserializer.readUint32LE()
        const genomeCounter = deserializer.readUint32LE()
        return new InnovationCounter(innovationCounter, neuronCounter, genomeCounter)
    }

    serialize(serializer = new BinarySerializer()) {
        serializer.writeUint32LE(this.innovationCounter)
        serializer.writeUint32LE(this.neuronCounter)
        serializer.writeUint32LE(this.genomeCounter)
        return serializer
    }

    getNeuronId() { return this.neuronCounter++ }
    getGenomeId() { return this.genomeCounter++ }
    getInnovationNumber() { return this.innovationCounter++ }
}

class ConnectionGene {
    static crossover(dominant, recessive) {
        if (dominant.innovationNumber != recessive.innovationNumber) {
            throw new Error("The connection gene innovation numbers must match to preform a crossover!")
        }

        const weight = Math.random() < 0.5 ? dominant.weight : recessive.weight
        const enabled = Math.random() < 0.5 ? dominant.enabled : recessive.enabled
        
        return new ConnectionGene(
            dominant.innovationNumber,
            dominant.inputNeuronId,
            dominant.outputNeuronId,
            weight,
            enabled
        )
    }

    constructor (innovationNumber = 0, inputNeuronId = 0, outputNeuronId = 0, weight = 1, enabled = true) {
        this.innovationNumber = innovationNumber
        this.inputNeuronId = inputNeuronId
        this.outputNeuronId = outputNeuronId
        this.weight = weight
        this.enabled = enabled
    }

    clone() {
        return new ConnectionGene(
            this.innovationNumber,
            this.inputNeuronId,
            this.outputNeuronId,
            this.weight,
            this.enabled,
        )
    }

    serialize(serializer) {
        serializer.writeUint32LE(this.innovationNumber)
        serializer.writeUint32LE(this.inputNeuronId)
        serializer.writeUint32LE(this.outputNeuronId)
        serializer.writeFloat64LE(this.weight)
        serializer.writeUint8(this.enabled)
        return serializer
    }

    static deserialize(deserializer) {
        const innovationNumber = deserializer.readUint32LE()
        const inputNeuronId = deserializer.readUint32LE()
        const outputNeuronId = deserializer.readUint32LE()
        const weight = deserializer.readFloat64LE()
        const enabled = deserializer.readUint8()
        return new ConnectionGene(innovationNumber, inputNeuronId, outputNeuronId, weight, enabled)
    }
}

class NeuronGene {
    static crossover(dominant, recessive) {
        if (dominant.neuronId != recessive.neuronId) {
            throw new Error("The neuron gene neuron ids must match to preform a crossover!")
        }

        const activation = Math.random() < 0.5 ? dominant.activation : recessive.activation
        return new NeuronGene(dominant.neuronId, activation)
    }

    constructor (neuronId = 0, activation = null) {
        this.neuronId = neuronId
        this.activation = activation
    }

    clone() {
        return new NeuronGene(this.neuronId, this.activation)
    }

    serialize(serializer) {
        serializer.writeUint32LE(this.neuronId)
        serializer.writeUint32LE(this.activation.name.length)
        serializer.writeStringUTF8(this.activation.name)
        return serializer
    }

    static deserialize(deserializer) {
        const neuronId = deserializer.readUint32LE()
        const length = deserializer.readUint32LE()
        const activationName = deserializer.readStringUTF8(length)
        const activation = getActivationFunction(activationName)
        return new NeuronGene(neuronId, activation)
    }
}

class Genome {
    constructor (genomeId = 0, inputCount = 0, outputCount = 0) {
        this.genomeId                 = genomeId
        this.inputCount               = inputCount
        this.outputCount              = outputCount
        this.species                  = null
        this.connectionGenes          = []
        this.neuronGenes              = []
        this.fitness                  = 0
        this._innovationNumberToIndex = new Map()
        this._neuronIdToIndex         = new Map()
    }

    serialize(serializer) {
        serializer.writeUint32LE(this.genomeId)
        serializer.writeUint32LE(this.inputCount)
        serializer.writeUint32LE(this.outputCount)
        // serializer.writeUint32LE(speciesIndex)
        serializer.writeFloat64LE(this.fitness)

        serializer.writeUint32LE(this.connectionGenes.length)
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            this.connectionGenes[idx].serialize(serializer)
        }

        serializer.writeUint32LE(this.neuronGenes.length)
        for (let idx = 0; idx < this.neuronGenes.length; ++idx) {
            this.neuronGenes[idx].serialize(serializer)
        }

        return serializer
    }

    static deserialize(deserializer) {
        const genome = new Genome()
        genome.genomeId = deserializer.readUint32LE()
        genome.inputCount = deserializer.readUint32LE()
        genome.outputCount = deserializer.readUint32LE()
        
        // const speciesIndex = deserializer.readUint32LE()
        // if (speciesIndex != INVALID_INDEX_U32 && speciesArray !== null && speciesArray !== undefined) {
        //     genome.species = speciesArray[speciesIndex]
        // }
        
        this.fitness = deserializer.readFloat64LE()

        const connectionGenesCount = deserializer.readUint32LE()
        for (let idx = 0; idx < connectionGenesCount; ++idx) {
            genome.connectionGenes.push(ConnectionGene.deserialize(deserializer))
        }

        const neuronGenesCount = deserializer.readUint32LE()
        for (let idx = 0; idx < neuronGenesCount; ++idx) {
            genome.neuronGenes.push(NeuronGene.deserialize(deserializer))
        }

        genome._innovationNumberToIndex = new Map(genome.connectionGenes.map((e, i) => [ e.innovationNumber, i ]))
        genome._neuronIdToIndex = new Map(genome.neuronGenes.map((e, i) => [ e.neuronId, i ]))

        return genome
    }

    static from({ genomeId, inputCount, outputCount, connectionGenes, neuronGenes }) {
        const result = new Genome(genomeId, inputCount, outputCount)
        
        result.connectionGenes            = connectionGenes
        result.neuronGenes                = neuronGenes
        result._innovationNumberToIndex   = new Map(connectionGenes.map((e, i) => [ e.innovationNumber, i ]))
        result._neuronIdToIndex           = new Map(neuronGenes.map((e, i) => [ e.neuronId, i ]))

        return result
    }

    static compatibilityDistance(dominant, recessive, config) {
        let excessGenes = 0
        let disjointGenes = 0
        let matchingGenes = 0
        let totalWeightDifference = 0

        const highestInnovationDominant = dominant.highestConnectionInnovation()
        const highestInnovationRecessive = recessive.highestConnectionInnovation()

        for (let idx0 = 0; idx0 < recessive.connectionGenes.length; ++idx0) {
            const connectionGene = recessive.connectionGenes[idx0]
            if (dominant.findConnectionGene(connectionGene.innovationNumber) == null) {
                if (connectionGene.innovationNumber > highestInnovationDominant) {
                    ++excessGenes
                }
                else {
                    ++disjointGenes
                }
            }
        }

        for (let idx0 = 0; idx0 < dominant.connectionGenes.length; ++idx0) {
            const connectionGene0 = dominant.connectionGenes[idx0]
            const connectionGene1 = recessive.findConnectionGene(connectionGene0.innovationNumber)
            if (connectionGene1 == null) {
                if (connectionGene0.innovationNumber > highestInnovationRecessive) {
                    ++excessGenes
                }
                else {
                    ++disjointGenes
                }
            }
            else {
                totalWeightDifference += Math.abs(connectionGene0.weight - connectionGene1.weight)
                matchingGenes += 1
            }
        }

        const averageWeightDifference = totalWeightDifference / Math.max(1, matchingGenes)

        const highestNeuronIdDominant = dominant.highestNeuronId()
        const highestNeuronIdRecessive = recessive.highestNeuronId()

        for (let idx0 = 0; idx0 < recessive.neuronGenes.length; ++idx0) {
            const neuronGene = recessive.neuronGenes[idx0]
            if (dominant.findNeuronGene(neuronGene.neuronId) == null) {
                if (neuronGene.neuronId > highestNeuronIdDominant) {
                    ++excessGenes
                }
                else {
                    ++disjointGenes
                }
            }
        }

        for (let idx0 = 0; idx0 < dominant.neuronGenes.length; ++idx0) {
            const neuronGene = dominant.neuronGenes[idx0]
            if (recessive.findNeuronGene(neuronGene.neuronId) == null) {
                if (neuronGene.neuronId > highestNeuronIdRecessive) {
                    ++excessGenes
                }
                else {
                    ++disjointGenes
                }
            }
            else {
                matchingGenes += 1
            }
        }

        const geneCount = dominant.connectionGenes.length + dominant.neuronGenes.length
        return (excessGenes * config.excessGeneCoefficient + disjointGenes * config.disjointGeneCoefficient) / geneCount + averageWeightDifference * config.weightDifferenceCoefficient
    }

    static crossover(dominant, recessive, innovation) {
        const offspring = new Genome(innovation.getGenomeId(), dominant.inputCount, dominant.outputCount)

        for (let idx = 0; idx < dominant.neuronGenes.length; ++idx) {
            const dominantGene  = dominant.neuronGenes[idx]
            const recessiveGene = recessive.findNeuronGene(dominantGene.neuronId)

            if (recessiveGene === null || recessiveGene === undefined) {
                offspring.addNeuronGene(dominantGene.clone())
            }
            else {
                offspring.addNeuronGene(NeuronGene.crossover(dominantGene, recessiveGene))
            }
        }

        for (let idx = 0; idx < dominant.connectionGenes.length; ++idx) {
            const dominantGene  = dominant.connectionGenes[idx]
            const recessiveGene = recessive.findConnectionGene(dominantGene.innovationNumber)

            if (recessiveGene === null || recessiveGene === undefined) {
                offspring.addConnectionGene(dominantGene.clone())
            }
            else {
                offspring.addConnectionGene(ConnectionGene.crossover(dominantGene, recessiveGene))
            }
        }

        return offspring
    }

    static fromPrototype(prototype, innovationCounter) {
        const genomeId = innovationCounter.getGenomeId()
        const genome = new Genome(genomeId, prototype.inputCount, prototype.outputCount)

        for (let idx = 0; idx < prototype.neuronGenes.length; ++idx) {
            const { activation } = prototype.neuronGenes[idx]
            const neuronId = innovationCounter.getNeuronId()
            const neuronGene = new NeuronGene(neuronId, activation)
            genome.addNeuronGene(neuronGene)
        }

        const oldNeuronIdToNewNeuronId = new Map(prototype.neuronGenes.map((e, i) => [ e.neuronId, genome.neuronGenes[i].neuronId ]))

        for (let idx = 0; idx < prototype.connectionGenes.length; ++idx) {
            const prototypeGene = prototype.connectionGenes[idx]
            const inputNeuronId = oldNeuronIdToNewNeuronId.get(prototypeGene.inputNeuronId)
            const outputNeuronId = oldNeuronIdToNewNeuronId.get(prototypeGene.outputNeuronId)
            const weight = prototypeGene.weight
            const enabled = prototypeGene.enabled
            const innovationNumber = innovationCounter.getInnovationNumber()
            const connectionGene = new ConnectionGene(innovationNumber, inputNeuronId, outputNeuronId, weight, enabled)
            genome.addConnectionGene(connectionGene)
        }

        return genome
    }

    static fromTopology(layerCounts, activations, innovationCounter) {
        const inputCount = layerCounts[0]
        const outputCount = layerCounts[layerCounts.length - 1]
        const genomeId = innovationCounter.getGenomeId()
        const genome = new Genome(genomeId, inputCount, outputCount)
        const layerNeuronGenes = []

        if (activations instanceof Array == false) {
            activations = Array.from({ length: layerCounts.length }, () => activations)
        }

        for (let idx0 = 0; idx0 < layerCounts.length; ++idx0) {
            const neuronGenes = []
            const layerCount = layerCounts[idx0]

            for (let idx1 = 0; idx1 < layerCount; ++idx1) {
                const neuronId = innovationCounter.getNeuronId()
                const neuronGene = new NeuronGene(neuronId, activations[idx0])
                genome.addNeuronGene(neuronGene)
                neuronGenes.push(neuronGene)
            }

            layerNeuronGenes.push(neuronGenes)
        }

        for (let idx0 = 1; idx0 < layerCounts.length; ++idx0) {
            const prevLayer = layerNeuronGenes[idx0 - 1]
            const currentLayer = layerNeuronGenes[idx0]

            for (let idx1 = 0; idx1 < prevLayer.length; ++idx1) {
                for (let idx2 = 0; idx2 < currentLayer.length; ++idx2) {
                    const inputNeuronId  = prevLayer[idx1].neuronId
                    const outputNeuronId = currentLayer[idx2].neuronId
                    const innovation = innovationCounter.getInnovationNumber()
                    const connectionGene = new ConnectionGene(innovation, inputNeuronId, outputNeuronId, 1, true)
                    genome.addConnectionGene(connectionGene)
                }
            }
        }

        return genome
    }

    highestConnectionInnovation() {
        let innovation = 0
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            innovation = Math.max(innovation, this.connectionGenes[idx].innovationNumber)
        }

        return innovation
    }

    highestNeuronId() {
        let neuronId = 0
        for (let idx = 0; idx < this.neuronGenes.length; ++idx) {
            neuronId = Math.max(neuronId, this.neuronGenes[idx].neuronId)
        }

        return neuronId
    }

    clone() { return this.cloneUsingId(this.genomeId) }

    cloneUsingId(genomeId) {
        const copyGenome = new Genome(genomeId, this.inputCount, this.outputCount)
        copyGenome.neuronGenes = this.neuronGenes.map(e => e.clone())
        copyGenome.connectionGenes = this.connectionGenes.map(e => e.clone())
        copyGenome._innovationNumberToIndex = new Map(this._innovationNumberToIndex)
        copyGenome._neuronIdToIndex = new Map(this._neuronIdToIndex)
        copyGenome.species = this.species
        return copyGenome
    }

    addConnectionGene(connectionGene) {
        this._innovationNumberToIndex.set(connectionGene.innovationNumber, this.connectionGenes.length)
        this.connectionGenes.push(connectionGene)
    }

    addNeuronGene(neuronGene) {
        if (neuronGene == null) {
            throw new Error()
        }

        this._neuronIdToIndex.set(neuronGene.neuronId, this.neuronGenes.length)
        this.neuronGenes.push(neuronGene)
    }

    removeConnectionGene(innovationNumber) {
        const lastConnectionGene = this.connectionGenes.pop()
        const index = this._innovationNumberToIndex.get(innovationNumber)
        this._innovationNumberToIndex.set(innovationNumber, null)

        if (index !== this.connectionGenes.length) {
            this._innovationNumberToIndex.set(lastConnectionGene.innovationNumber, index)
            this.connectionGenes[index] = lastConnectionGene
        }
    }

    removeNeuronGene(neuronId) {
        if (neuronId == null || neuronId == undefined) {
            throw new Error("Cannot remove a null or undefined neuron ID!")
        }

        for (let idx = this.connectionGenes.length - 1; idx >= 0; --idx) {
            const connectionGene = this.connectionGenes[idx]
            if (connectionGene.inputNeuronId == neuronId || connectionGene.outputNeuronId == neuronId) {
                this.removeConnectionGene(connectionGene.innovationNumber)
            }
        }

        const lastNeuronGene = this.neuronGenes.pop()
        const index = this._neuronIdToIndex.get(neuronId)
        this._neuronIdToIndex.set(neuronId, null)

        if (index !== this.neuronGenes.length) {
            this._neuronIdToIndex.set(lastNeuronGene.neuronId, index)
            this.neuronGenes[index] = lastNeuronGene
        }
    }

    findConnectionGene(innovationNumber) {
        const index = this._innovationNumberToIndex.get(innovationNumber)
        return index != null ? this.connectionGenes[index] : null
    }

    findNeuronGene(neuronId) {
        const index = this._neuronIdToIndex.get(neuronId)
        return index != null ? this.neuronGenes[index] : null
    }

    connectionMakesCycle(inputNeuronId, outputNeuronId) {
        const connectionGraph = new Map()
        for (const connectionGene of this.connectionGenes) {
            const outputNeurons = connectionGraph.get(connectionGene.inputNeuronId) || []
            outputNeurons.push(connectionGene.outputNeuronId)
            connectionGraph.set(connectionGene.inputNeuronId, outputNeurons)
        }

        const visited = new Set()
        const pending = [ outputNeuronId ]
        while (pending.length !== 0) {
            const neuronId = pending.pop()

            if (neuronId == inputNeuronId) {
                return true
            }

            if (!visited.has(neuronId)) {
                const outputNeuronIds = connectionGraph.get(neuronId)
                if (outputNeuronIds !== null && outputNeuronIds !== undefined) {
                    Array.prototype.push.apply(pending, outputNeuronIds)
                }

                visited.add(neuronId)
            }
        }

        return false
    }

    topologicalSortUtil(neuronId, visited, stack, backwardsConnectionGraph) {
        visited.add(neuronId)

        const connectionGenes = backwardsConnectionGraph.get(neuronId)
        if (connectionGenes !== null && connectionGenes !== undefined) {
            for (const connectionGene of connectionGenes) {
                if (!visited.has(connectionGene.inputNeuronId)) {
                    this.topologicalSortUtil(connectionGene.inputNeuronId, visited, stack, backwardsConnectionGraph)
                }
            }
        }

        stack.push(this.findNeuronGene(neuronId))
    }

    _topologicalSortNeuronGenes(neuronGenes, backwardsConnectionGraph) {
        const stack = []
        const visited = new Set()

        for (const neuronGene of neuronGenes) {
            if (!visited.has(neuronGene.neuronId)) {
                this.topologicalSortUtil(neuronGene.neuronId, visited, stack, backwardsConnectionGraph)
            }
        }

        return stack
    }

    toNeuralNetwork() {
        const backwardsConnectionGraph = new Map()
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            const connectionGene = this.connectionGenes[idx]
            const connectionGenes = backwardsConnectionGraph.get(connectionGene.outputNeuronId)
            if (connectionGenes !== null && connectionGenes !== undefined) {
                connectionGenes.push(connectionGene)
            }
            else {
                backwardsConnectionGraph.set(connectionGene.outputNeuronId, [ connectionGene ])
            }
        }

        const sortedNeuronGenes = this._topologicalSortNeuronGenes(this.neuronGenes, backwardsConnectionGraph)
        const sortedNeuronIdToIndex = new Map(sortedNeuronGenes.map((neuronGene, idx) => [ neuronGene.neuronId, idx ]))

        const neurons = []
        for (let idx = 0; idx < sortedNeuronGenes.length; ++idx) {
            const neuronGene = sortedNeuronGenes[idx]
            const connectionGenes = backwardsConnectionGraph.get(neuronGene.neuronId)
            const inputs = []

            if (connectionGenes !== null && connectionGenes !== undefined) {
                for (const connectionGene of connectionGenes) {
                    const index = sortedNeuronIdToIndex.get(connectionGene.inputNeuronId)
                    inputs.push(new NeuralNetworkConnection(neurons[index], connectionGene.weight))
                }
            }

            neurons.push(new NeuralNetworkNeuron(neuronGene.activation, inputs))
        }

        return new NeuralNetwork(this.inputCount, this.outputCount, neurons)
    }

    randomizeWeights(config) {
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            this.connectionGenes[idx].weight = config.randomWeightRange * uniform()
        }

        return this
    }

    mutateAddConnection(config, innovationCounter) {
        for (let idx = 0; idx < config.addConnectionAttepmpts; ++idx) {
            const inputNeuron  = choice(this.neuronGenes, this.neuronGenes.length - this.outputCount)
            const outputNeuron = choice(this.neuronGenes, this.neuronGenes.length - this.inputCount, this.inputCount)

            const existingConnection = this.connectionGenes.find(e => {
                return e.inputNeuronId == inputNeuron.neuronId
                &&     e.outputNeuronId == outputNeuron.neuronId
            })

            if (existingConnection !== null && existingConnection !== undefined) {
                continue
            }

            if (this.connectionMakesCycle(inputNeuron.neuronId, outputNeuron.neuronId)) {
                continue
            }

            const weight = config.randomWeightRange * uniform()
            const newConnection = new ConnectionGene(
                innovationCounter.getInnovationNumber(),
                inputNeuron.neuronId,
                outputNeuron.neuronId,
                weight
            )
            
            this.addConnectionGene(newConnection)
            return;
        }
    }

    mutateRemoveConnection(config) {
        if (this.connectionGenes.length == 0) {
            return
        }

        this.removeConnectionGene(choice(this.connectionGenes).innovationNumber)
    }

    mutateAddNeuron(config, innovationCounter) {
        if (this.connectionGenes.length == 0) {
            return
        }

        const connectionToSplit = choice(this.connectionGenes)
        connectionToSplit.enabled = false

        const neuronId = innovationCounter.getNeuronId()
        const newNeuron = new NeuronGene(neuronId, choice(config.activations))

        this.addNeuronGene(newNeuron)
        this.addConnectionGene(new ConnectionGene(innovationCounter.getInnovationNumber(), connectionToSplit.inputNeuronId, neuronId, 1))
        this.addConnectionGene(new ConnectionGene(innovationCounter.getInnovationNumber(), neuronId, connectionToSplit.outputNeuronId, connectionToSplit.weight))
    }

    mutateRemoveNeuron(config) {
        if (this.neuronGenes.length <= this.inputCount + this.outputCount) {
            return
        }

        const remaining = this.neuronGenes.length - this.inputCount - this.outputCount
        const neuronGene = choice(this.neuronGenes, remaining, this.inputCount)
        this.removeNeuronGene(neuronGene.neuronId)
    }

    mutateChangeWeight(config) {
        if (this.connectionGenes.length == 0) {
            return
        }

        const connectionToModify = choice(this.connectionGenes)
        connectionToModify.weight += config.changeWeightRange * uniform()
    }

    mutateSetWeight(config) {
        if (this.connectionGenes.length == 0) {
            return
        }

        const connectionGene = choice(this.connectionGenes)
        connectionGene.weight = config.randomWeightRange * uniform()
    }

    mutateWeightsGaussian(config) {
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            if (Math.random() < config.mutateWeightsGaussianRate) {
                this.connectionGenes[idx].weight += config.changeWeightRange * normal()
            }
        }
    }

    mutateWeightsUniform(config) {
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            if (Math.random() < config.mutateWeightsUniformRate) {
                this.connectionGenes[idx].weight = config.randomWeightRange * uniform()
            }
        }
    }

    mutate(innovationCounter, config) {
        if (config === null || config === undefined) {
            throw new Error("The configuration must be defined!")
        }

        this.mutateWeightsGaussian(config)

        if (Math.random() < config.mutateAddConnectionRate) {
            this.mutateAddConnection(config, innovationCounter)
        }
        
        if (Math.random() < config.mutateRemoveConnectionRate) {
            this.mutateRemoveConnection(config)
        }
        
        if (Math.random() < config.mutateAddNeuronRate) {
            this.mutateAddNeuron(config, innovationCounter)
        }
        
        if (Math.random() < config.mutateRemoveNeuronRate) {
            this.mutateRemoveNeuron(config)
        }
        
        if (Math.random() < config.mutateChangeWeightRate) {
            this.mutateChangeWeight(config)
        }
        
        if (Math.random() < config.mutateSetWeightRate) {
            this.mutateSetWeight(config)
        }

        return this
    }
}

class Species {
    constructor (leaderGenome = null) {
        this.leader = leaderGenome
        this.members = leaderGenome ? [ leaderGenome ] : []
        this.totalFitness = 0

        if (this.leader !== null && this.leader !== undefined) {
            this.leader.species = this
        }
    }

    addGenome(genome, fitness) {
        genome.species = this
        this.members.push(genome)
        this.totalFitness += fitness
    }

    reset(leaderGenome) {
        this.leader = leaderGenome
        this.members = []
        this.leader.species = this
        this.totalFitness = 0
    }

    selectRandomGenomeFitnessBiased() {
        let accumulatedFitness = 0
        const randomFitness = this.totalFitness * Math.random()

        for (let idx = 0; idx < this.members.length; ++idx) {
            const genome = this.members[idx]

            accumulatedFitness += genome.fitness
            if (accumulatedFitness >= randomFitness) {
                return genome
            }
        }

        throw new Error(`Selected a genome from outside the array bounds! randomFitness: ${randomFitness} totalFitness: ${this.totalFitness}`)
    }

    static deserialize(deserializer, genomeMap) {
        const species = new Species()

        species.totalFitness = deserializer.readFloat64LE()
        const leaderGenomeId = deserializer.readUint32LE()
        species.leader = genomeMap.get(leaderGenomeId)

        if (species.leader === null || species.leader === undefined) {
            throw new Error(`Cannot find the genome of ID ({${leaderGenomeId}}) when deserializing Species!`)
        }

        species.leader.species = species

        const memberCount = deserializer.readUint32LE()
        for (let idx = 0; idx < memberCount; ++idx) {
            const genomeId = deserializer.readUint32LE()
            const genome = genomeMap.get(genomeId)

            if (genome === null || genome === undefined) {
                throw new Error(`Cannot find the genome of ID ({${genomeId}}) when deserializing Species!`)
            }

            genome.species = species

            species.members.push(genome)
        }

        return species
    }

    serialize(serializer = new BinarySerializer()) {
        serializer.writeFloat64LE(this.totalFitness)
        serializer.writeUint32LE(this.leader.genomeId)

        serializer.writeUint32LE(this.members.length)
        for (let idx = 0; idx < this.members.length; ++idx) {
            serializer.writeUint32LE(this.members[idx].genomeId)
        }

        return serializer
    }
}

class Population {
    constructor (populationCount = 0, startingGenome = null, innovationCounter = null, config = null) {
        this.populationCount = populationCount
        this.innovationCounter = innovationCounter
        this.startingGenome = startingGenome
        this.config = config
        this.species = []
        this.genomes = []
        this.generationCount = 0

        while (this.genomes.length < this.populationCount) {
            const genomeId = this.innovationCounter.getGenomeId()
            const genome = this.startingGenome.cloneUsingId(genomeId)
            this.genomes.push(genome.randomizeWeights(config))
        }

        this.specifyGenomes()
    }

    static deserialize(deserializer) {
        const population = new Population()
        population.populationCount = deserializer.readUint32LE()
        population.generationCount = deserializer.readUint32LE()
        population.innovationCounter = InnovationCounter.deserialize(deserializer)
        population.config = Configuration.deserialize(deserializer)

        const genomeMap = new Map()

        const genomeCount = deserializer.readUint32LE()
        for (let idx = 0; idx < genomeCount; ++idx) {
            const genome = Genome.deserialize(deserializer)
            population.genomes.push(genome)
            genomeMap.set(genome.genomeId, genome)
        }

        const speciesCount = deserializer.readUint32LE()
        for (let idx = 0; idx < speciesCount; ++idx) {
            population.species.push(Species.deserialize(deserializer, genomeMap))
        }

        return population
    }

    serialize(serializer = new BinarySerializer()) {
        serializer.writeUint32LE(this.populationCount)
        serializer.writeUint32LE(this.generationCount)
        this.innovationCounter.serialize(serializer)
        this.config.serialize(serializer)

        serializer.writeUint32LE(this.genomes.length)
        for (let idx = 0; idx < this.genomes.length; ++idx) {
            this.genomes[idx].serialize(serializer)
        }

        serializer.writeUint32LE(this.species.length)
        for (let idx = 0; idx < this.species.length; ++idx) {
            this.species[idx].serialize(serializer)
        }

        return serializer
    }

    selectRandomSpeciesFitnessBiased() {
        let totalAdjustedFitness = 0
        for (let idx = 0; idx < this.species.length; ++idx) {
            const species = this.species[idx]
            totalAdjustedFitness += species.totalFitness / species.members.length
        }

        let accumulatedFitness = 0
        const randomFitness = totalAdjustedFitness * Math.random()
        for (let idx = 0; idx < this.species.length; ++idx) {
            const species = this.species[idx]
            
            accumulatedFitness += species.totalFitness / species.members.length

            if (accumulatedFitness >= randomFitness) {
                return species
            }
        }

        throw new Error(`Selected a species from outside the array bounds! randomFitness: ${randomFitness} totalAdjustedFitness: ${totalAdjustedFitness}`)
    }

    specifyGenomes() {
        for (let idx = 0; idx < this.species.length; ++idx) {
            const species = this.species[idx]
            species.reset(species.leader)
        }

        loop: for (let idx0 = 0; idx0 < this.genomes.length; ++idx0) {
            const genome = this.genomes[idx0]

            for (let idx1 = 0; idx1 < this.species.length; ++idx1) {
                const species = this.species[idx1]

                if (Genome.compatibilityDistance(species.leader, genome, this.config) < this.config.compatibilityThreshold) {
                    species.addGenome(genome)
                    continue loop
                }
            }

            this.species.push(new Species(genome))
        }

        for (let idx = this.species.length - 1; idx >= 0; --idx) {
            const species = this.species[idx]

            if (species.members.length == 0) {
                this.species.splice(idx, 1)
            }
        }

        return this
    }

    repopulate() {
        ++this.generationCount

        const newGenomes = []
        for (let idx = 0; idx < this.species.length; ++idx) {
            const species = this.species[idx]
            
            species.totalFitness = 0
            for (let idx = 0; idx < species.members.length; ++idx) {
                const member = species.members[idx]
                species.totalFitness += member.fitness
                if (species.leader.fitness < member.fitness) {
                    species.leader = member
                }
            }

            newGenomes.push(species.leader.clone())
        }

        while (newGenomes.length < this.populationCount) {
            const species   = this.selectRandomSpeciesFitnessBiased()
            const genome0   = species.selectRandomGenomeFitnessBiased()
            const genome1   = species.selectRandomGenomeFitnessBiased()
            const dominant  = genome0.fitness > genome1.fitness ? genome0 : genome1
            const recessive = genome0.fitness > genome1.fitness ? genome1 : genome0
            
            const newGenome = Genome.crossover(dominant, recessive, this.innovationCounter)
            newGenomes.push(newGenome.mutate(this.innovationCounter, this.config))
        }

        this.genomes = newGenomes

        return this
    }
}

class NeuralNetworkConnection {
    constructor (neuron, weight) {
        this.neuron = neuron
        this.weight = weight

        if (neuron === null || neuron === undefined) {
            throw new Error("The neuron provided must be non-null!")
        }
    }
}

class NeuralNetworkNeuron {
    constructor (activation, inputs) {
        this.activation = activation
        this.inputs = inputs
        this.value = 0
    }
}

class NeuralNetwork {
    constructor (inputCount, outputCount, neurons) {
        this.inputCount = inputCount
        this.outputCount = outputCount
        this.neurons = neurons

        this.outputNeurons = this.neurons.slice(this.neurons.length - outputCount)
        this.inputNeurons = this.neurons.slice(0, inputCount)
    }

    process(values) {
        if (values.length > this.inputCount) {
            throw new Error("The number of values given is greater than the input count of the neural network!")
        }

        if (values.length < this.inputCount) {
            throw new Error("The number of values given is less than the input count of the neural network!")
        }

        for (let idx = 0; idx < this.inputCount; ++idx) {
            this.neurons[idx].value = values[idx]
        }

        for (let idx0 = this.inputCount; idx0 < this.neurons.length; ++idx0) {
            const currentNeuron = this.neurons[idx0]

            currentNeuron.value = 0
            for (let idx1 = 0; idx1 < currentNeuron.inputs.length; ++idx1) {
                const connection = currentNeuron.inputs[idx1]
                currentNeuron.value += connection.neuron.value * connection.weight
            }

            currentNeuron.value = currentNeuron.activation(currentNeuron.value)
        }

        return this.outputNeurons
    }
}
