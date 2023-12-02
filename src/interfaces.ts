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

export interface IBird {
  _scene: Phaser.Scene | undefined;
  _config: IBirdsParams;
  _sprite: Phaser.GameObjects.Image;
  _spriteTint: Phaser.GameObjects.Image;
  _velocity: number;
  _dead: boolean;
  _frameInputs: unknown[];
  _model: unknown;
  _populationEntity: unknown;
  Dead: boolean;
  Alpha: number;
  Bounds: Phaser.Geom.Rectangle;
  Update(params: { timeElapsed: number; keys?: { up: boolean } }): void;
  Destroy(): void;
}

export interface IUpdateBirdsParams {
  timeElapsed: number;
  keys: IKeys;
  nearestPipes: IPipe[];
}

export interface INeuronShape {
  size: number;
  activation?: (z: number[]) => number[];
}

export interface IFFNeuralNetwork {
  _shapes: INeuronShape[];
  _biases: Array<unknown[]>;
  _weights: Array<unknown[]>[];

  new (shapes: INeuronShape[]): IFFNeuralNetwork;

  predict(inputs: number[]): number[];

  toArray(): number[];

  fromArray(values: number[]): void;
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
  defaultGenotype?: number[];
}

export interface IGenotype {
  fitness: number;
  genotype: number[];
}

export interface IPopulation {
  _params: IPopulationParams;
  _population: IGenotype[];
  _generations: number;
  _lastGeneration: { parents: IGenotype[] } | null;
  Fittest(): IGenotype | undefined;
  Step(tgtImgData?: unknown | undefined): void;
}
export interface IPipeParams {
  scene: Phaser.Scene | undefined;
  x: number;
  spacing: number;
  speed: number;
  config_height: number;
}

export interface IPipe {
  _scene: Phaser.Scene | undefined;
  _config: IPipeParams;
  _sprite1: Phaser.GameObjects.Image;
  _sprite2: Phaser.GameObjects.Image;
  Destroy(): void;
  Update(timeElapsed: number): void;
  Intersects(aabb: Phaser.Geom.Rectangle): boolean;
  Reset(x: number): void;
  readonly X: number;
  readonly Width: number;
}

export type TGenerationColors = "red" | "blue" | "green";
export type TGenerationState = {
  active: boolean;
  color: number;
  nnDefinition: INeuronShape[];
  previousBest: string | null;
};
