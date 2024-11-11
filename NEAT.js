function sigmod(x) {
    return 1 / (1 + Math.exp(-x));
}

function topologicalSortUtil(neuronGene, visited, stack) {
    visited.add(neuronGene.neuronId);

    for (const connectionGene of neuronGene.getInputConnectionIterator()) {
        const inputNeuron = connectionGene.inputNeuron;
        if (!visited.has(inputNeuron.neuronId)) {
            this.topologicalSortUtil(inputNeuron, visited, stack);
        }
    }

    stack.push(neuronGene);
}

function topologicalSortNeuronGenes(neuronGenes) {
    const visited = new Set();
    const stack = [];

    for (const neuronGene of neuronGenes) {
        if (!visited.has(neuronGene.neuronId)) {
            topologicalSortUtil(neuronGene, visited, stack);
        }
    }

    return stack;
}

class ConnectionGene {
    constructor(innovationNumber = 0, inputNeuron = null, outputNeuron = null, weight = 1, enabled = true) {
        this.innovationNumber = innovationNumber;
        this.inputNeuron      = inputNeuron;
        this.outputNeuron     = outputNeuron;
        this.weight           = weight;
        this.enabled          = enabled;
    }
}

class NeuronGene {
    constructor(neuronId = 0, activation = sigmod, inputs = new Map(), outputs = new Map(), value = 0) {
        this.neuronId        = neuronId;
        this.activation      = activation;
        this.inputs          = inputs;
        this.outputs         = outputs;
        this.value           = value;
    }

    addInputConnection(connectionGene) {
        this.inputs.set(connectionGene.inputNeuron.neuronId, connectionGene);
    }

    addOutputConnection(connectionGene) {
        this.outputs.set(connectionGene.outputNeuron.neuronId, connectionGene);
    }

    removeInputConnection(connectionGene) {
        this.inputs.delete(connectionGene.inputNeuron.neuronId);
    }

    removeOutputConnection(connectionGene) {
        this.outputs.delete(connectionGene.outputNeuron.neuronId);
    }

    getInputConnectionIterator() { return this.inputs.values(); }
    getOutputConnectionIterator() { return this.outputs.values(); }
}

class Genome {
    constructor (genomeId = 0, inputCount = 0, outputCount = 0, species = null, connectionGenes = new Map(), neuronGenes = new Map()) {
        this.genomeId        = genomeId;
        this.inputCount      = inputCount;
        this.outputCount     = outputCount;
        this.connectionGenes = connectionGenes;
        this.neuronGenes     = neuronGenes;
        this.species         = species;
    }
    
    addConnectionGene(connectionGene) {
        connectionGene.inputNeuron.addOutputConnection(connectionGene);
        connectionGene.outputNeuron.addInputConnection(connectionGene);
        this.connectionGenes.set(connectionGene.innovationNumber, connectionGene);
    }

    addNeuronGene(neuronGene) {
        this.neuronGenes.set(neuronGene.neuronId, neuronGene);
    }
    
    removeConnectionGene(connectionGene) {
        connectionGene.inputNeuron.removeOutputConnection(connectionGene);
        connectionGene.outputNeuron.removeInputConnection(connectionGene);
        this.connectionGenes.delete(connectionGene.innovationNumber);
    }

    removeNeuronGene(neuronGene) {
        for (const connection of neuronGene.getInputConnectionIterator()) {
            this.removeConnectionGene(connection);
        }

        for (const connection of neuronGene.getOutputConnectionIterator()) {
            this.removeConnectionGene(connection);
        }

        this.neuronGenes.delete(neuronGene.neuronId);
    }

    toNeuralNetwork() {
        const sortedNeuronGenes = topologicalSortNeuronGenes(this.neuronGenes.values());
        const sortedNeuronGenesIdToIndex = new Map(sortedNeuronGenes.map((neuronGene, idx) => [ neuronGene.neuronId, idx ]));
        const neurons = [];

        for (let idx = 0; idx < sortedNeuronGenes.length; ++idx) {
            const neuronGene = sortedNeuronGenes[idx];
            const inputs = [];

            for (const inputConnectionGene of neuronGene.getInputConnectionIterator()) {
                const inputNeuron = neurons[sortedNeuronGenesIdToIndex.get(inputConnectionGene.inputNeuron.neuronId)];
                inputs.push(new NeuralNetworkConnection(inputNeuron, inputConnectionGene.weight));
            }

            neurons.push(new NeuralNetworkNeuron(neuronGene.activation, inputs));
        }

        return new NeuralNetwork(this.inputCount, this.outputCount, neurons);
    }
}

class InnovationCounter {
    constructor (innovationCounter = 0, neuronCounter = 0, genomeCounter = 0) {
        this.innovationCounter = innovationCounter;
        this.neuronCounter = neuronCounter;
        this.genomeCounter = genomeCounter;
    }

    createNeuronGene(activation = sigmod) {
        return new NeuronGene(this.neuronCounter++, activation);
    }

    createConnectionGene(inputNeuron, outputNeuron, weight, enabled = true) {
        return new ConnectionGene(this.innovationCounter++, inputNeuron, outputNeuron, weight, enabled);
    }

    createGenome(inputCount, outputCount) {
        return new Genome(this.genomeCounter++, inputCount, outputCount);
    }

    createBaseGenome(... layerCounts) {
        const genome = this.createGenome(layerCounts[0], layerCounts[layerCounts.length - 1]);
        const layerNeuronGenes = []
        
        for (let idx0 = 0; idx0 < layerCounts.length; ++idx0) {
            const neuronGenes = [];
            const layerCount = layerCounts[idx0];
            
            for (let idx1 = 0; idx1 < layerCount; ++idx1) {
                const neuronGene = this.createNeuronGene(sigmod);
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
                    const connectionGene = this.createConnectionGene(inputNeuron, outputNeuron, 1);
                    genome.addConnectionGene(connectionGene);
                }
            }
        }

        return genome;
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

        return this.neurons[index] = value;
    }

    getOutputValueAt(index) {
        if (index < 0 || index >= this.outputCount) {
            return null;
        }

        return this.neurons[this.neurons.length + index - this.outputCount];
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
    }
}
