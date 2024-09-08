import { INeuronShape } from "./interfaces";
import { add, dot } from "./math";

export const ffnet = {
  FFNeuralNetwork: class {
    _shapes: INeuronShape[];
    _biases: number[][];
    _weights: number[][][];

    constructor(shapes: INeuronShape[]) {
      function _InitRandomArray(sz: number) {
        // Returns an array of length 'sz' with random numbers between -1 and 1
        return [...Array(sz)].map((_) => Math.random() * 2 - 1);
      }

      // The shapes represent the number of neurons in each layer
      // as well as the activation function for that layer
      this._shapes = shapes;
      // The biases are an array of arrays containing random number from -1 to 1
      // , one for each layer
      this._biases = shapes.slice(1).map((x) => _InitRandomArray(x.size));
      // The weights are an array of matrices
      this._weights = [];

      // Initiliazing the weights
      // For each neuron layer, create a matrix of weights
      for (let i = 1; i < shapes.length; i++) {
        this._weights.push(
          // [...Array(shapes[i].size)] creates an array of the length of the current layer
          [...Array(shapes[i].size)].map((_) =>
            // For each value of that array, create an array of the length of the previous layer
            // With values between -1 and 1
            // This is the weight matrix
            _InitRandomArray(shapes[i - 1].size)
          )
        );
      }
    }

    predict(inputs: number[]) {
      let X = inputs;
      // For each layer of neurons
      for (let i = 0; i < this._weights.length; i++) {
        const layer_weights = this._weights[i];
        const layer_bias = this._biases[i];
        // z = wx + b
        // z = dot(inputs, layer_weights) + layer_bias
        const z = add(
          layer_weights.map((w) => dot(X, w)),
          layer_bias
        );

        // a = σ(z)
        // a = activation_of_the_layer(z) (smoothing function)
        const a = (this._shapes[i + 1].activation as (z: number[]) => number[])(
          z
        );
        // The output from the layer becomes the input to the next.
        X = a;
      }
      return X;
    }

    // Method to convert the biases and weights to a single array
    // to save the model
    toArray() {
      return [...this._biases.flat()].concat([...this._weights.flat().flat()]);
    }

    // Method to convert an array back to the biases and weights
    // to initialize with a previously saved model
    fromArray(values: number[]) {
      const arr = [...values];

      for (let b of this._biases) {
        b.splice(0, b.length, ...arr.splice(0, b.length));
      }
      for (let w of this._weights) {
        for (let w1 of w) {
          w1.splice(0, w1.length, ...arr.splice(0, w1.length));
        }
      }
    }
  },
};
