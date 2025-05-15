# Neural Network Snake Game (NEAT)

This project implements the NEAT (NeuroEvolution of Augmenting Topologies) algorithm to evolve neural networks capable of playing the classic Snake game. Built with **JavaScript**, **HTML**, and **CSS**.

## Overview

This project demonstrates use of the NEAT algorithm to train neural networks. Through the use of the NEAT algorithm, Snake agents are able to learn strategies to survive and maximize its score without human assistance or interation. The visualization allows users to observe the learning process and experiment with different configurations.

![NEAT Snake Demo](https://github.com/codegonite/Snake_Game_NEAT/assets/SnakeTrainingNEAT.gif)

## Getting Started

1. **Clone the repository:**
    ```bash
    git clone https://github.com/codegonite/Snake_Game_NEAT.git
    cd neat-snake
    ```

2. **Open `index.html` in your browser.**

No additional dependencies required.

## How It Works

1. The NEAT algorithm generates a population of genomes.
2. Each genome describes the structure of the neural networks and are used for evolution implementations.
3. Fitness is evaluated based on the Snake's performance (length, survival time).
4. The best networks are selected and evolved for the next generation.

## References

- [NEAT Algorithm Paper](https://nn.cs.utexas.edu/downloads/papers/stanley.cec02.pdf)
- [Snake Game](https://en.wikipedia.org/wiki/Snake_(video_game_genre))
