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
        this.species                  = null
        this.connectionGenes          = []
        this.neuronGenes              = []
        this.fitness                  = 0
        this._innovationNumberToIndex = new Map()
        this._neuronIdToIndex         = new Map()
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

        for (const dominantGene of dominant.getNeuronGenes()) {
            const recessiveGene = recessive.findNeuronGene(dominantGene.neuronId)

            if (recessiveGene === null || recessiveGene === undefined) {
                offspring.addNeuronGene(dominantGene.clone())
            }
            else {
                offspring.addNeuronGene(NeuronGene.crossover(dominantGene, recessiveGene))
            }
        }

        for (const dominantGene of dominant.getConnectionGenes()) {
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

    static fromTopology(layerCounts, activation, innovationCounter) {
        const inputCount = layerCounts[0]
        const outputCount = layerCounts[layerCounts.length - 1]
        const genomeId = innovationCounter.getGenomeId()
        const genome = new Genome(genomeId, inputCount, outputCount)
        const layerNeuronGenes = []

        for (let idx0 = 0; idx0 < layerCounts.length; ++idx0) {
            const neuronGenes = []
            const layerCount = layerCounts[idx0]

            for (let idx1 = 0; idx1 < layerCount; ++idx1) {
                const neuronId = innovationCounter.getNeuronId()
                const neuronGene = new NeuronGene(neuronId, activation)
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

    getNeuronGenes() { return this.neuronGenes }
    getConnectionGenes() { return this.connectionGenes }

    highestConnectionInnovation() {
        let innovation = 0
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            innovation = Math.max(innovation, this.connectionGenes[idx].innovationNumber)
        }

        return innovation
    }

    highestNeuronId() {
        let innovation = 0
        for (let idx = 0; idx < this.neuronGenes.length; ++idx) {
            innovation = Math.max(innovation, this.neuronGenes[idx].neuronId)
        }

        return innovation
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
        // return this.connectionGenes.get(innovationNumber)
        const index = this._innovationNumberToIndex.get(innovationNumber)
        return index != null ? this.connectionGenes[index] : null
    }

    findNeuronGene(neuronId) {
        // return this.neuronGenes.get(neuronId)
        const index = this._neuronIdToIndex.get(neuronId)
        return index != null ? this.neuronGenes[index] : null
    }

    connectionMakesCycle(inputNeuronId, outputNeuronId) {
        const connectionGraph = new Map()
        for (const connectionGene of this.getConnectionGenes()) {
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

        const sortedNeuronGenes = this._topologicalSortNeuronGenes(this.getNeuronGenes(), backwardsConnectionGraph)
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
            this.connectionGenes[idx].weight = config.randomWeightRange * (2 * Math.random() - 1)
        }

        return this
    }

    mutateAddConnection(config, innovationCounter) {
        const inputNeuron  = this.neuronGenes[Math.floor(this.neuronGenes.length * Math.random())]
        const outputNeuron = this.neuronGenes[Math.floor(this.neuronGenes.length * Math.random())]

        const existingConnection = this.connectionGenes.find(e => {
            return e.inputNeuronId == inputNeuron.neuronId
            &&     e.outputNeuronId == outputNeuron.neuronId
        })

        if (existingConnection !== null && existingConnection !== undefined) {
            return
        }

        if (this.connectionMakesCycle(inputNeuron.neuronId, outputNeuron.neuronId)) {
            return
        }

        const newConnection = new ConnectionGene(innovationCounter.getInnovationNumber(), inputNeuron.neuronId, outputNeuron.neuronId, config.randomWeightRange * (2 * Math.random() - 1))
        this.addConnectionGene(newConnection)
    }

    mutateRemoveConnection(config) {
        if (this.connectionGenes.length == 0) {
            return
        }

        const index = Math.floor(this.connectionGenes.length * Math.random())
        this.removeConnectionGene(this.connectionGenes[index].innovationNumber)
    }

    mutateAddNeuron(config, innovationCounter) {
        if (this.connectionGenes.length == 0) {
            return
        }

        const connectionToSplit = this.connectionGenes[Math.floor(this.connectionGenes.length * Math.random())]
        connectionToSplit.enabled = false

        const neuronId = innovationCounter.getNeuronId()
        const newNeuron = new NeuronGene(neuronId, this.neuronGenes[0].activation)

        this.addNeuronGene(newNeuron)
        this.addConnectionGene(new ConnectionGene(innovationCounter.getInnovationNumber(), connectionToSplit.inputNeuronId, neuronId, 1))
        this.addConnectionGene(new ConnectionGene(innovationCounter.getInnovationNumber(), neuronId, connectionToSplit.outputNeuronId, connectionToSplit.weight))
    }

    mutateRemoveNeuron(config) {
        if (this.neuronGenes.length <= this.inputCount + this.outputCount) {
            return
        }

        const index = Math.floor(this.neuronGenes.length * Math.random())
        this.removeNeuronGene(this.neuronGenes[index].neuronId)

        // const neuronToRemove = this.neuronGenes[Math.floor(this.neuronGenes.length * Math.random())]
        // this.removeNeuronGene(neuronToRemove.neuronId)
    }

    mutateChangeWeight(config) {
        if (this.connectionGenes.length == 0) {
            return
        }

        const index = Math.floor(this.connectionGenes.length * Math.random())
        const connectionToModify = this.connectionGenes[index]
        connectionToModify.weight += config.changeWeightRange * (2 * Math.random() - 1)
    }

    mutateSetWeight(config) {
        if (this.connectionGenes.length == 0) {
            return
        }

        const index = Math.floor(this.connectionGenes.length * Math.random())
        this.connectionGenes[index].weight = config.randomWeightRange * (2 * Math.random() - 1)
    }

    mutate(innovationCounter, config) {
        if (config === null || config === undefined) {
            throw new Error("The configuration must be defined!")
        }

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
    constructor (leaderGenome) {
        this.leader = leaderGenome
        this.members = [ leaderGenome ]
        this.leader.species = this
        this.adjustedFitness = 0
        this.totalFitness = 0
    }

    setLeaderGenome(genome) {
        if (!this.members.includes(genome)) {
            throw new Error("The leader genome must be a part of the species!")
        }

        this.leader = genome
        genome.species = this
    }

    updateLeaderGenome() {
        for (let idx = 0; idx < this.members.length; ++idx) {
            const member = this.members[idx]
            if (this.leader.fitness < member.fitness) {
                this.leader = member
            }
        }

        return this.leader
    }

    updateFitness() {
        this.totalFitness = 0
        
        for (let idx = 0; idx < this.members.length; ++idx) {
            const member = this.members[idx]
            if (this.leader.fitness < member.fitness) {
                this.leader = member
            }

            this.totalFitness += member.fitness
        }

        // this.adjustedFitness = this.totalFitness / this.members.length
    }

    addGenome(genome) {
        genome.species = this
        this.members.push(genome)
        // this.totalFitness += genome.fitness
        // if (this.leader.fitness < genome.fitness) {
        //     this.leader = genome
        // }
    }

    reset(leaderGenome) {
        this.leader = leaderGenome
        this.members = []
        this.leader.species = this
        this.totalFitness = 0
    }

    addFitness(fitness) {
        this.totalFitness += fitness
    }
}

function selectRandomSpeciesFitnessBiased(speciesArray) {
    let totalAdjustedFitness = 0
    for (let idx = 0; idx < speciesArray.length; ++idx) {
        const species = speciesArray[idx]
        totalAdjustedFitness += species.totalFitness / species.members.length
    }

    let accumulatedFitness = 0
    const randomFitness = totalAdjustedFitness * Math.random()
    for (let idx = 0; idx < speciesArray.length; ++idx) {
        const species = speciesArray[idx]
        accumulatedFitness += species.totalFitness / species.members.length

        if (accumulatedFitness >= randomFitness) {
            return species
        }
    }

    throw new Error(`Selected a species from outside the array bounds! randomFitness: ${randomFitness} totalAdjustedFitness: ${totalAdjustedFitness}`)
}

function selectRandomGenomeFromSpeciesFitnessBiased(species) {
    // let totalFitness = 0
    // for (let idx = 0; idx < species.members.length; ++idx) {
    //     totalFitness += species.members[idx].fitness
    // }

    let accumulatedFitness = 0
    const randomFitness = species.totalFitness * Math.random()
    for (let idx = 0; idx < species.members.length; ++idx) {
        const genome = species.members[idx]

        accumulatedFitness += genome.fitness
        if (accumulatedFitness >= randomFitness) {
            return genome
        }

    }

    throw new Error(`Selected a genome from outside the array bounds! randomFitness: ${randomFitness} totalFitness: ${species.totalFitness}`)
}

function groupGenomesIntoSpecies(genomes, config) {
    const speciesArray = []

    loop: for (let idx0 = 0; idx0 < genomes.length; ++idx0) {
        const genome = genomes[idx0]
        for (let idx1 = 0; idx1 < speciesArray.length; ++idx1) {
            const species = speciesArray[idx1]

            if (Genome.compatibilityDistance(species.leader, genome, config) < this.config.compatibilityThreshold) {
                species.addGenome(genome)
                continue loop
            }
        }

        speciesArray.push(new Species(genome))
    }

    return speciesArray
}

class Population {
    constructor (populationCount = 100, startingGenome, innovationCounter, config) {
        this.innovationCounter = innovationCounter
        this.populationCount = populationCount
        this.startingGenome = startingGenome
        this.config = config
        this.generationCount = 0
        this.species = []
        this.genomes = []

        while (this.genomes.length < this.populationCount) {
            const genomeId = this.innovationCounter.getGenomeId()
            this.genomes.push(this.startingGenome.cloneUsingId(genomeId).randomizeWeights(config))
            // this.genomes.push(this.startingGenome.cloneUsingId(genomeId).mutate(innovationCounter, config))
        }
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

        let newGenomes = []
        for (let idx = 0; idx < this.species.length; ++idx) {
            const species = this.species[idx]
            species.updateFitness()

            newGenomes.push(species.leader.clone())
        }

        while (newGenomes.length < this.populationCount) {
            const species   = selectRandomSpeciesFitnessBiased(this.species)
            const genome0   = selectRandomGenomeFromSpeciesFitnessBiased(species)
            const genome1   = selectRandomGenomeFromSpeciesFitnessBiased(species)
            const dominant  = genome0.fitness > genome1.fitness ? genome0 : genome1
            const recessive = genome0.fitness > genome1.fitness ? genome1 : genome0
            const newGenome = Genome.crossover(dominant, recessive, this.innovationCounter).mutate(this.innovationCounter, this.config)
            newGenomes.push(newGenome)
        }

        this.genomes = newGenomes
        return this
    }

    evaluate(callback) {
        for (let idx = 0; idx < this.genomes.length; ++idx) {
            const genome = this.genomes[idx]
            if (genome.species == null) {
                throw new Error()
            }

            genome.fitness = callback(genome)
        }

        for (let idx = 0; idx < this.species.length; ++idx) {
            this.species[idx].updateFitness()
        }

        return this
    }

    processGeneration(callback) {
        this.specifyGenomes()
        // callback(this)
        this.evaluate(callback)
        this.repopulate()
        return this
    }
}

class Configuration {
    constructor (object = {}) {
        this.excessGeneCoefficient = object.excessGeneCoefficient ?? 1.0
        this.disjointGeneCoefficient = object.disjointGeneCoefficient ?? 1.0
        this.weightDifferenceCoefficient = object.weightDifferenceCoefficient ?? 0.4
        this.compatibilityThreshold = object.compatibilityThreshold ?? 80.0
        this.generationCuttoff = object.generationCuttoff ?? 10
        this.mutateAddConnectionRate = object.mutateAddConnectionRate ?? 0.1
        this.mutateRemoveConnectionRate = object.mutateRemoveConnectionRate ?? 0.1
        this.mutateAddNeuronRate = object.mutateAddNeuronRate ?? 0.1
        this.mutateRemoveNeuronRate = object.mutateRemoveNeuronRate ?? 0.1
        this.mutateChangeWeightRate = object.mutateChangeWeightRate ?? 0.5
        this.mutateSetWeightRate = object.mutateSetWeightRate ?? 0.5
        this.randomWeightRange = object.randomWeightRange ?? 2.0
        this.changeWeightRange = object.changeWeightRange ?? 2.0
    }
}

class InnovationCounter {
    constructor (innovationCounter = 0, neuronCounter = 0, genomeCounter = 0) {
        this.innovationCounter = innovationCounter
        this.neuronCounter = neuronCounter
        this.genomeCounter = genomeCounter
    }

    getNeuronId() { return this.neuronCounter++ }
    getGenomeId() { return this.genomeCounter++ }
    getInnovationNumber() { return this.innovationCounter++ }
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

        const outputValues = []
        for (let idx = this.neurons.length - this.outputCount; idx < this.neurons.length; ++idx) {
            outputValues.push(this.neurons[idx].value)
        }

        return outputValues
    }
}
