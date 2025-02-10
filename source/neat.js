// https://nn.cs.utexas.edu/downloads/papers/stanley.cec02.pdf

const MUTATE_ADD_CONNECTION_RATE = 0.1
const MUTATE_REMOVE_CONNECTION_RATE = 0.1
const MUTATE_ADD_NEURON_RATE = 0.1
const MUTATE_REMOVE_NEURON_RATE = 0.1
const MUTATE_CHANGE_WEIGHT_RATE = 0.5
const MUTATE_SET_WEIGHT_RATE = 0.5

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
}

class Genome {
    constructor (genomeId = 0, inputCount = 0, outputCount = 0) {
        this.genomeId                 = genomeId
        this.inputCount               = inputCount
        this.outputCount              = outputCount
        this.connectionGenes          = []
        this.neuronGenes              = []
        this.species                  = null
        this._innovationNumberToIndex = new Map()
        this._neuronIdToIndex         = new Map()
    }

    clone() {
        const copyGenome = new Genome(this.genomeId, this.inputCount, this.outputCount)

        for (let idx = 0; idx < this.neuronGenes.length; ++idx) {
            copyGenome.addNeuronGene(this.neuronGenes[idx].clone())
        }

        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            copyGenome.addConnectionGene(this.connectionGenes[idx].clone())
        }

        return copyGenome
    }

    addConnectionGene(connectionGene) {
        this._innovationNumberToIndex.set(connectionGene.innovationNumber, this.connectionGenes.length)
        this.connectionGenes.push(connectionGene)
    }

    addNeuronGene(neuronGene) {
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
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            const connectionGene = this.connectionGenes[idx]
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

    _topologicalSortNeuronGenes(neuronGenes, backwardsConnectionGraph) {
        const visited = new Set()
        const stack = []

        const topologicalSortUtil = (neuronId) => {
            visited.add(neuronId)

            const connectionGenes = backwardsConnectionGraph.get(neuronId)
            if (connectionGenes !== null && connectionGenes !== undefined) {
                for (const connectionGene of connectionGenes) {
                    if (!visited.has(connectionGene.inputNeuronId)) {
                        topologicalSortUtil(connectionGene.inputNeuronId)
                    }
                }
            }

            stack.push(this.neuronGenes[this._neuronIdToIndex.get(neuronId)])
        }

        for (const neuronGene of neuronGenes) {
            if (!visited.has(neuronGene.neuronId)) {
                topologicalSortUtil(neuronGene.neuronId)
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

    compatibilityDistance(other, c1, c2, c3) {
        let excessGenes = 0
        let disjointGenes = 0
        let sharedGeneCount = 0
        let totalWeightDifference = 0

        let avgWeightDiff = totalWeightDifference / sharedGeneCount
        return excessGenes * c1 + disjointGenes * c2 + avgWeightDiff * c3
    }

    randomizeWeights() {
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            this.connectionGenes[idx].weight = Math.random() - 0.5
        }

        return this
    }
}

class Species {
    constructor (leaderGenome) {
        this.leaderGenome = leaderGenome
        this.memberGenomes = [ leaderGenome ]
        this.totalSpeciesFitness = 0
        this.leaderSpeciesFitness = 0
        this.leaderGenome.species = this
    }

    setLeaderGenome(genome) {
        if (!this.memberGenomes.includes(genome)) {
            throw new Error("The leader genome must be a part of the species!")
        }

        this.leaderGenome = genome
    }

    addGenome(genome, fitness) {
        this.memberGenomes.push(genome)
        this.totalSpeciesFitness -= fitness
    }
}

class Population {
    constructor () {
        this.species = []
    }
}

class Configuration {
}

class InnovationCounter {
    constructor (innovationCounter = 0, neuronCounter = 0, genomeCounter = 0) {
        this.innovationCounter = innovationCounter
        this.neuronCounter = neuronCounter
        this.genomeCounter = genomeCounter
    }

    createNeuronGene(activation) {
        return new NeuronGene(this.neuronCounter++, activation)
    }

    createConnectionGene(inputNeuronId, outputNeuronId, weight, enabled = true) {
        return new ConnectionGene(this.innovationCounter++, inputNeuronId, outputNeuronId, weight, enabled)
    }

    createGenome(inputCount, outputCount) {
        return new Genome(this.genomeCounter++, inputCount, outputCount)
    }

    createBaseGenome(activation, layerCounts) {
        const genome = this.createGenome(layerCounts[0], layerCounts[layerCounts.length - 1])
        const layerNeuronGenes = []

        for (let idx0 = 0; idx0 < layerCounts.length; ++idx0) {
            const neuronGenes = []
            const layerCount = layerCounts[idx0]

            for (let idx1 = 0; idx1 < layerCount; ++idx1) {
                const neuronGene = this.createNeuronGene(activation)
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
                    const inputNeuron  = prevLayer[idx1]
                    const outputNeuron = currentLayer[idx2]
                    const connectionGene = this.createConnectionGene(inputNeuron.neuronId, outputNeuron.neuronId, 1, true)
                    genome.addConnectionGene(connectionGene)
                }
            }
        }

        return genome
    }

    createGenomeCrossover(dominant, recessive) {
        const offspring = this.createGenome(dominant.inputCount, dominant.outputCount)

        for (const dominantGene of dominant.neuronGenes) {
            const recessiveGene = recessive.findNeuronGene(dominantGene.neuronId)

            if (recessiveGene === null || recessiveGene === undefined) {
                offspring.addNeuronGene(dominantGene.clone())
            }
            else {
                offspring.addNeuronGene(NeuronGene.crossover(dominantGene, recessiveGene))
            }
        }

        for (const dominantGene of dominant.connectionGenes) {
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

    mutateAddConnection(genome) {
        const inputNeuron  = genome.neuronGenes[Math.floor(genome.neuronGenes.length * Math.random())]
        const outputNeuron = genome.neuronGenes[Math.floor(genome.neuronGenes.length * Math.random())]

        const existingConnection = genome.findConnectionGene(inputNeuron.neuronId, outputNeuron.neuronId)

        if (existingConnection !== null || existingConnection !== undefined) {
            return
        }

        if (genome.connectionMakesCycle(inputNeuron.neuronId, outputNeuron.neuronId)) {
            return
        }

        const newConnection = this.createConnectionGene(inputNeuron.neuronId, outputNeuron.neuronId, 2 * Math.random() - 1)
        genome.addConnectionGene(newConnection)
    }

    mutateRemoveConnection(genome) {
        if (genome.connectionGenes.length == 0) {
            return
        }

        const connectionToRemove = genome.connectionGenes[Math.floor(genome.connectionGenes.length * Math.random())]
        genome.removeConnectionGene(connectionToRemove.innovationNumber)
    }

    mutateAddNeuron(genome) {
        if (genome.connectionGenes.length == 0) {
            return
        }

        const connectionToSplit = genome.connectionGenes[Math.floor(genome.connectionGenes.length * Math.random())]
        connectionToSplit.enabled = false

        const newNeuron = this.createNeuronGene(genome.neuronGenes[0].activation)
        genome.addNeuronGene(newNeuron)
        
        genome.addConnectionGene(this.createConnectionGene(connectionToSplit.inputNeuronId, newNeuron.neuronId,               1))
        genome.addConnectionGene(this.createConnectionGene(newNeuron.neuronId,              connectionToSplit.outputNeuronId, connectionToSplit.weight))
    }

    mutateRemoveNeuron(genome) {
        if (genome.neuronGenes.length - genome.inputCount - genome.outputCount <= 0) {
            return
        }

        const neuronToRemove = genome.neuronGenes[Math.floor(genome.neuronGenes.length * Math.random())]
        genome.removeNeuronGene(neuronToRemove.neuronId)
    }

    mutateChangeWeight(genome) {
        if (genome.connectionGenes.length == 0) {
            return
        }

        const index = Math.floor(genome.connectionGenes.length * Math.random())
        const connectionToModify = genome.connectionGenes[index]
        connectionToModify.weight += Math.random()
    }

    mutateSetWeight(genome) {
        if (genome.connectionGenes.length == 0) {
            return
        }

        const index = Math.floor(genome.connectionGenes.length * Math.random())
        const connectionToModify = genome.connectionGenes[index]
        connectionToModify.weight = 4 * Math.random() - 2
    }

    mutateGenome(genome) {
        const result = genome.clone()

        if (Math.random() < MUTATE_ADD_CONNECTION_RATE) {
            this.mutateAddConnection(result)
        }

        if (Math.random() < MUTATE_REMOVE_CONNECTION_RATE) {
            this.mutateRemoveConnection(result)
        }

        if (Math.random() < MUTATE_ADD_NEURON_RATE) {
            this.mutateAddNeuron(result)
        }

        if (Math.random() < MUTATE_REMOVE_NEURON_RATE) {
            this.mutateRemoveNeuron(result)
        }

        if (Math.random() < MUTATE_CHANGE_WEIGHT_RATE) {
            this.mutateChangeWeight(result)
        }

        if (Math.random() < MUTATE_SET_WEIGHT_RATE) {
            this.mutateSetWeight(result)
        }

        return result
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
    }

    static from(genome) {
    }

    process(... values) {
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

        const outputValues = []
        for (let idx = this.neurons.length - this.outputCount; idx < this.neurons.length; ++idx) {
            outputValues.push(this.neurons[idx].value)
        }

        return outputValues
    }
}

function addGenomeToSpeciesArray(speciesArray, genome) {
    for (let idx = 0; idx < speciesArray.length; ++idx) {
        const species = this.species[idx]
        if (species.leaderGenome.compatibilityDistance(genome, C1, C2, C3) < DT) {
            species.addGenome(genome)
            return
        }
    }

    speciesArray.push(new Species(genome))
}
