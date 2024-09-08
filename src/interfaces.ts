import { _PipePairObject } from "./pipe";

export interface IKeys {
  up: Phaser.Input.Keyboard.Key;
  f: Phaser.Input.Keyboard.Key;
  r: Phaser.Input.Keyboard.Key;
}

export interface IBirdsParams {
  scene: Phaser.Scene;
  pop_entity: IGenotype;
  pop_params: IPopulationParams;
  x: number;
  config_width: number;
  config_height: number;
  max_upwards_velocity: number;
  terminal_velocity: number;
  treadmill_speed: number;
  acceleration: number;
  gravity: number;
}

export interface IUpdateBirdsParams {
  timeElapsed: number;
  nearestPipes: _PipePairObject[];
}

export interface INeuronShape {
  size: number;
  activation?: (z: number[]) => number[];
}

export interface IPopulationParams {
  population_size: number;
  genotype: {
    size: number;
  };
  breed: {
    childrenPercentage: number;
    immortalityCutoff: number;
    selectionCutoff: number;
  };
  mutation: {
    odds: number;
    magnitude: number;
    decay: number;
  };
  shapes: INeuronShape[];
  tint: number;
  savedGeneration?: TSavedGeneration;
}

export interface IGenotype {
  fitness: number;
  // Refers to the model exported from the FFNeuralNetwork
  // with the toArray() method
  genotype: number[];
}

export type TStepFunction = (
  generationColor: TGenerationColors,
  generationDetails?: {
    alive: number;
    highScore: number;
    generationCount: number;
  }
) => void;

export interface IPipeParams {
  scene: Phaser.Scene | undefined;
  x: number;
  spacing: number;
  speed: number;
  config_height: number;
}

export type TGenerationColors = "red" | "blue" | "green";
export type TGenerationState = {
  active: boolean;
  color: number;
  nnDefinition: INeuronShape[];
  savedGeneration: TSavedGeneration | null;
};

export type TSavedGeneration = {
  alive: number;
  highScore: number;
  generationCount: number;
  winningGenotype?: IGenotype;
};

export type IGenerationChoice = IKeyInColors<TGenerationState>;

export type IKeyInColors<T> = {
  [key in TGenerationColors]: T;
};

export type TGameStats =
  | {
      score: number;
      generations: IKeyInColors<TSavedGeneration>;
    }
  | undefined;
