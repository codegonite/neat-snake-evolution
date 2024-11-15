const MUTATE_ADD_CONNECTION_RATE = 0.1;
const MUTATE_REMOVE_CONNECTION_RATE = 0.1;
const MUTATE_ADD_NEURON_RATE = 0.1;
const MUTATE_REMOVE_NEURON_RATE = 0.1;
const MUTATE_CHANGE_WEIGHT_RATE = 0.5;
const MUTATE_SET_WEIGHT_RATE = 0.5;

class ConnectionGene {
    static crossover(dominant, recessive) {
        if (dominant.innovationNumber != recessive.innovationNumber) {
            return null;
        }

        const weight = Math.random() < 0.5 ? dominant.weight : recessive.weight;
        const enabled = Math.random() < 0.5 ? dominant.enabled : recessive.enabled;
        
        return new ConnectionGene(
            dominant.innovationNumber,
            dominant.inputNeuronId,
            dominant.outputNeuronId,
            weight,
            enabled
        );
    }

    constructor (innovationNumber = 0, inputNeuronId = 0, outputNeuronId = 0, weight = 1, enabled = true) {
        this.innovationNumber = innovationNumber;
        this.inputNeuronId = inputNeuronId;
        this.outputNeuronId = outputNeuronId;
        this.weight = weight;
        this.enabled = enabled;
        this.index = 0;
    }

    clone() {
        return new ConnectionGene(
            this.innovationNumber,
            this.inputNeuronId,
            this.outputNeuronId,
            this.weight,
            this.enabled,
        );
    }
}

class NeuronGene {
    static crossover(dominant, recessive) {
        if (dominant.neuronId != recessive.neuronId) {
            return null;
        }

        const activation = Math.random() < 0.5 ? dominant.activation : recessive.activation;
        return new NeuronGene(dominant.neuronId, activation);
    }

    constructor (neuronId = 0, activation = null) {
        this.neuronId = neuronId;
        this.activation = activation;
        this.index = 0;
    }

    clone() {
        return new NeuronGene(this.neuronId, this.activation);
    }
}

class ConnectionGraph extends Map {
    addConnectionToGraph(keyForward, keyBackward, connectionGene) {
        const connectionGraph = this.get(keyForward) || new Map();
        connectionGraph.set(keyBackward, connectionGene);
        this.set(keyForward, connectionGraph);
    }

    removeConnectionFromGraph(keyForward, keyBackward) {
        const connectionGraph  = this.get(keyForward);
        connectionGraph.delete(keyBackward);
        this.set(keyForward, connectionGraph);
    }

    iterateNeuronConnections(neuronId, removeConnectionCallback) {
        const connectionGraph = this.get(neuronId);

        if (connectionGraph === null || connectionGraph === undefined) {
            return;
        }

        for (const connectionGene of connectionGraph.values()) {
            removeConnectionCallback(connectionGene);
        }
    }

    getNeuronDependencyCount(neuronId, dependencyCountMap = new Map()) {
        const dependencyCount = dependencyCountMap.get(neuronId);
        if (dependencyCount != null) {
            return dependencyCount;
        }

        const connectionMap = this.get(neuronId);
        if (connectionMap == null) {
            return 0;
        }

        let count = 0;
        for (const neuronId of connectionMap.keys()) {
            count += 1 + this.getNeuronDependencyCount(neuronId, dependencyCountMap);
        }

        return count;
    }
}

class Genome {
    constructor (genomeId = 0, inputCount = 0, outputCount = 0) {
        this.genomeId                = genomeId;
        this.inputCount              = inputCount;
        this.outputCount             = outputCount;
        this.connectionGenes         = [];
        this.neuronGenes             = [];
        this.innovationNumberToIndex = new Map();
        this.neuronIdToIndex         = new Map();
        this.forwardGraph            = new ConnectionGraph();
        this.backwardGraph           = new ConnectionGraph();
        this.species                 = null;
        this.defaultActivation       = null;
    }

    clone() {
        const copyGenome = new Genome(this.genomeId, this.inputCount, this.outputCount);

        for (let idx = 0; idx < this.neuronGenes.length; ++idx) {
            copyGenome.addNeuronGene(this.neuronGenes[idx].clone());
        }

        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            copyGenome.addConnectionGene(this.connectionGenes[idx].clone());
        }

        return copyGenome;
    }

    toNeuralNetwork() {
        const dependencyCountMap = new Map();
        const sortedNeuronGenes = this.neuronGenes.toSorted((neuronGene0, neuronGene1) => {
            const dependencyCount0 = this.backwardGraph.getNeuronDependencyCount(neuronGene0.neuronId, dependencyCountMap);
            const dependencyCount1 = this.backwardGraph.getNeuronDependencyCount(neuronGene1.neuronId, dependencyCountMap);
            return dependencyCount0 - dependencyCount1;
        });

        const neuronIdToIndex = new Map(sortedNeuronGenes.map((neuronGene, idx) => [ neuronGene.neuronId, idx ]));
        const neurons = [];

        for (let idx = 0; idx < sortedNeuronGenes.length; ++idx) {
            const neuronGene = sortedNeuronGenes[idx];
            const connectionMap = this.backwardGraph.get(neuronGene.neuronId);
            const inputs = [];

            if (connectionMap !== null && connectionMap !== undefined) {
                for (const connectionGene of connectionMap.values()) {
                    const index = neuronIdToIndex.get(connectionGene.inputNeuronId);
                    inputs.push(new NeuralNetworkConnection(neurons[index], connectionGene.weight));
                }
            }

            neurons.push(new NeuralNetworkNeuron(neuronGene.activation, inputs));
        }

        return new NeuralNetwork(this.inputCount, this.outputCount, neurons);
    }

    getNeuronGenes() {
        return this.neuronGenes;
    }
    
    getConnectionGenes() {
        return this.connectionGenes;
    }

    addConnectionGene(connectionGene) {
        const { inputNeuronId, outputNeuronId } = connectionGene;
        this.forwardGraph.addConnectionToGraph(inputNeuronId, outputNeuronId, connectionGene);
        this.backwardGraph.addConnectionToGraph(outputNeuronId, inputNeuronId, connectionGene);

        connectionGene.index = this.connectionGenes.length;
        this.connectionGenes.push(connectionGene);
    }

    addNeuronGene(neuronGene) {
        neuronGene.index = this.neuronGenes.length;
        this.neuronGenes.push(neuronGene);
    }

    removeConnectionGene(connectionGene) {
        const { inputNeuronId, outputNeuronId } = connectionGene;
        this.forwardGraph.removeConnectionFromGraph(inputNeuronId, outputNeuronId);
        this.backwardGraph.removeConnectionFromGraph(outputNeuronId, inputNeuronId);

        const lastConnectionGene = this.connectionGenes.pop();
        this.connectionGenes[connectionGene.index] = lastConnectionGene;
        lastConnectionGene.index = connectionGene.index;
        connectionGene.index = null;
    }

    removeNeuronGene(neuronGene) {
        const connectionGenesToRemove = [];
        this.forwardGraph.iterateNeuronConnections(neuronGene.neuronId, connectionGene => connectionGenesToRemove.push(connectionGene));
        this.backwardGraph.iterateNeuronConnections(neuronGene.neuronId, connectionGene => connectionGenesToRemove.push(connectionGene));

        for (const connectionGene of connectionGenesToRemove) {
            this.removeConnectionGene(connectionGene);
        }

        const lastNeuronGene = this.neuronGenes.pop();
        this.neuronGenes[neuronGene.index] = lastNeuronGene;
        lastNeuronGene.index = neuronGene.index;
        neuronGene.index = null;
    }

    findConnectionGene(innovationNumber) {
        const index = this.innovationNumberToIndex.get(innovationNumber);
        return index != null ? this.connectionGenes[index] : null;
    }
    
    findNeuronGene(neuronId) {
        const index = this.neuronIdToIndex.get(neuronId);
        return index != null ? this.neuronGenes[index] : null;
    }

    connectionMakesCycle(inputNeuronId, outputNeuronId) {
        const visited = new Set();
        const pending = [ outputNeuronId ];

        while (pending.length != 0) {
            const neuronId = pending.pop();

            if (neuronId == inputNeuronId) {
                return true;
            }

            if (visited.has(neuronId)) {
                continue;
            }

            const connections = this.forwardGraph.get(neuronId);
            if (connections !== null && connections !== undefined) {
                for (const connection of connections) {
                    pending.push(connection.outputNeuronId);
                }
            }

            visited.add(neuronId);
        }

        return false;
    }
	
    compatibilityDistance(other, c1, c2, c3) {
        let excessGenes = 0;
        let disjointGenes = 0;
        let sharedGeneCount = 0;
        let totalWeightDifference = 0;

        let avgWeightDiff = totalWeightDifference / sharedGeneCount;
        return excessGenes * c1 + disjointGenes * c2 + avgWeightDiff * c3;
    }

    randomizeWeights() {
        for (let idx = 0; idx < this.connectionGenes.length; ++idx) {
            this.connectionGenes[idx].weight = Math.random() - 0.5;
        }

        return this;
    }
}

class Species {
    constructor () {
        this.leaderGenome  = leaderGenome;
        this.memberGenomes = memberGenomes;
        this.totalSpeciesFitness = totalSpeciesFitness;
    }

    setLeaderGenome(genome) {
        this.leaderGenome = genome;
    }

    addGenome(genome, fitness) {
    }
}

class InnovationCounter {
    constructor (innovationCounter = 0, neuronCounter = 0, genomeCounter = 0) {
        this.innovationCounter = innovationCounter;
        this.neuronCounter = neuronCounter;
        this.genomeCounter = genomeCounter;
    }

    createNeuronGene(activation) {
        return new NeuronGene(this.neuronCounter++, activation);
    }

    createConnectionGene(inputNeuronId, outputNeuronId, weight, enabled = true) {
        return new ConnectionGene(this.innovationCounter++, inputNeuronId, outputNeuronId, weight, enabled);
    }

    createGenome(inputCount, outputCount) {
        return new Genome(this.genomeCounter++, inputCount, outputCount);
    }

    createBaseGenome(activation, layerCounts) {
        const genome = this.createGenome(layerCounts[0], layerCounts[layerCounts.length - 1]);
        const layerNeuronGenes = [];

        for (let idx0 = 0; idx0 < layerCounts.length; ++idx0) {
            const neuronGenes = [];
            const layerCount = layerCounts[idx0];

            for (let idx1 = 0; idx1 < layerCount; ++idx1) {
                const neuronGene = this.createNeuronGene(activation);
                genome.addNeuronGene(neuronGene);
                neuronGenes.push(neuronGene);
            }

            layerNeuronGenes.push(neuronGenes);
        }

        for (let idx0 = 1; idx0 < layerCounts.length; ++idx0) {
            const prevLayer = layerNeuronGenes[idx0 - 1];
            const currentLayer = layerNeuronGenes[idx0];

            for (let idx1 = 0; idx1 < prevLayer.length; ++idx1) {
                for (let idx2 = 0; idx2 < currentLayer.length; ++idx2) {
                    const inputNeuron  = prevLayer[idx1];
                    const outputNeuron = currentLayer[idx2];
                    const connectionGene = this.createConnectionGene(inputNeuron.neuronId, outputNeuron.neuronId, 1, true);
                    genome.addConnectionGene(connectionGene);
                }
            }
        }

        return genome;
    }

    createGenomeCrossover(dominant, recessive) {
        const offspring = this.createGenome(dominant.inputCount, dominant.outputCount);

        for (const dominantGene of dominant.getNeuronGenes()) {
            const recessiveGene = recessive.findNeuronGene(dominantGene.neuronId);

            if (recessiveGene === null || recessiveGene === undefined) {
                offspring.addNeuronGene(dominantGene.clone());
            }
            else {
                offspring.addNeuronGene(NeuronGene.crossover(dominantGene, recessiveGene));
            }
        }

        for (const dominantGene of dominant.getConnectionGenes()) {
            const recessiveGene = recessive.findConnectionGene(dominantGene.innovationNumber);

            if (recessiveGene === null || recessiveGene === undefined) {
                offspring.addConnectionGene(dominantGene.clone());
            }
            else {
                offspring.addConnectionGene(ConnectionGene.crossover(dominantGene, recessiveGene));
            }
        }

        return offspring;
    }

    mutateAddConnection(genome) {
        const inputNeuron  = genome.neuronGenes[Math.floor(genome.neuronGenes.length * Math.random())];
        const outputNeuron = genome.neuronGenes[Math.floor(genome.neuronGenes.length * Math.random())];

        const existingConnection = genome.findConnectionGene(inputNeuron.neuronId, outputNeuron.neuronId);

        if (existingConnection !== null || existingConnection !== undefined) {
            return;
        }

        if (genome.connectionMakesCycle(inputNeuron.neuronId, outputNeuron.neuronId)) {
            return;
        }

        const newConnection = this.createConnectionGene(inputNeuron.neuronId, outputNeuron.neuronId, 2 * Math.random() - 1);
        genome.addConnectionGene(newConnection);
    }

    mutateRemoveConnection(genome) {
        if (genome.connectionGenes.length == 0) {
            return;
        }

        const connectionToRemove = genome.connectionGenes[Math.floor(genome.connectionGenes.length * Math.random())];
        genome.removeConnectionGene(connectionToRemove);
    }

    mutateAddNeuron(genome) {
        if (genome.connectionGenes.length == 0) {
            return;
        }

        const connectionToSplit = genome.connectionGenes[Math.floor(genome.connectionGenes.length * Math.random())];
        connectionToSplit.enabled = false;

        const newNeuron = this.createNeuronGene(genome.neuronGenes[0].activation);
        genome.addNeuronGene(newNeuron);
        
        genome.addConnectionGene(this.createConnectionGene(connectionToSplit.inputNeuronId, newNeuron.neuronId,               1));
        genome.addConnectionGene(this.createConnectionGene(newNeuron.neuronId,              connectionToSplit.outputNeuronId, connectionToSplit.weight));
    }

    mutateRemoveNeuron(genome) {
        if (genome.neuronGenes.length - genome.inputCount - genome.outputCount <= 0) {
            return;
        }

        const neuronToRemove = genome.neuronGenes[Math.floor(genome.neuronGenes.length * Math.random())];
        genome.removeNeuronGene(neuronToRemove);
    }

    mutateChangeWeight(genome) {
        if (genome.connectionGenes.length == 0) {
            return;
        }

        const index = Math.floor(genome.connectionGenes.length * Math.random());
        const connectionToModify = genome.connectionGenes[index];
        connectionToModify.weight += Math.random();
    }

    mutateSetWeight(genome) {
        if (genome.connectionGenes.length == 0) {
            return;
        }

        const index = Math.floor(genome.connectionGenes.length * Math.random());
        const connectionToModify = genome.connectionGenes[index];
        connectionToModify.weight = 4 * Math.random() - 2;
    }

    mutateGenome(genome) {
        const result = genome.clone();

        if (Math.random() < MUTATE_ADD_CONNECTION_RATE) {
            this.mutateAddConnection(result);
        }

        if (Math.random() < MUTATE_REMOVE_CONNECTION_RATE) {
            this.mutateRemoveConnection(result);
        }

        if (Math.random() < MUTATE_ADD_NEURON_RATE) {
            this.mutateAddNeuron(result);
        }

        if (Math.random() < MUTATE_REMOVE_NEURON_RATE) {
            this.mutateRemoveNeuron(result);
        }

        if (Math.random() < MUTATE_CHANGE_WEIGHT_RATE) {
            this.mutateChangeWeight(result);
        }

        if (Math.random() < MUTATE_SET_WEIGHT_RATE) {
            this.mutateSetWeight(result);
        }

        return result;
    }
}

class NeuralNetworkConnection {
    constructor (neuron, weight) {
        this.neuron = neuron;
        this.weight = weight;
    }
}

class NeuralNetworkNeuron {
    constructor (activation, inputs) {
        this.activation = activation;
        this.inputs = inputs;
        this.value = 0;
    }
}

class NeuralNetwork {
    constructor (inputCount, outputCount, neurons) {
        this.inputCount = inputCount;
        this.outputCount = outputCount;
        this.neurons = neurons;
    }

    setInputValueAt(index, value) {
        if (index < 0 || index >= this.inputCount) {
            return null;
        }

        return this.neurons[index].value = value;
    }

    getOutputValueAt(index) {
        if (index < 0 || index >= this.outputCount) {
            return null;
        }

        return this.neurons[this.neurons.length + index - this.outputCount].value;
    }

    process() {
        for (let idx = this.inputCount; idx < this.neurons.length; ++idx) {
            const currentNeuron = this.neurons[idx];

            currentNeuron.value = 0;
            for (let idx = 0; idx < currentNeuron.inputs.length; ++idx) {
                const connection = currentNeuron.inputs[idx];
                currentNeuron.value += connection.neuron.value * connection.weight;
            }

            currentNeuron.value = currentNeuron.activation(currentNeuron.value);
        }

        return this;
    }
}
