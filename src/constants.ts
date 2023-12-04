import {
  IGenerationChoice,
  TGenerationColors,
  TSavedGeneration,
} from "./interfaces";

export const _GRAVITY = 900;
export const _TERMINAL_VELOCITY = 400;
export const _MAX_UPWARDS_VELOCITY = -300;
export const _UPWARDS_ACCELERATION = -450;
export const _PIPE_SPACING_X = 250;
export const _PIPE_SPACING_Y = 100;
export const _TREADMILL_SPEED = -125;

export const _CONFIG_WIDTH = 960;
export const _CONFIG_HEIGHT = 540;
export const _GROUND_Y = _CONFIG_HEIGHT;
export const _BIRD_POS_X = 50;

export const _AMOUT_OF_PIPES_FOR_INPUTS = 2;

export const COLOR_RED = 0xff0000;
export const COLOR_BLUE = 0x0000ff;
export const COLOR_GREEN = 0x00ff00;
export const GENERATION_BIRD_AMOUNT = 100;

export const GENERATIONS_COLORS: TGenerationColors[] = ["red", "blue", "green"];

export const neuralNetworkActivationFunctions = {
  sigmoid: (z: number[]) => z.map((v) => 1.0 / (1.0 + Math.exp(-v))),
  relu: (z: number[]) => z.map((v) => Math.max(v, 0)),
};

export const defaultSavedGenerationObject: {
  [key in TGenerationColors]: TSavedGeneration;
} = {
  red: {
    alive: 0,
    highScore: 0,
    generationCount: 0,
  },
  blue: {
    alive: 0,
    highScore: 0,
    generationCount: 0,
  },
  green: {
    alive: 0,
    highScore: 0,
    generationCount: 0,
  },
};

export const settings: IGenerationChoice = {
  red: {
    active: true,
    color: COLOR_RED,
    nnDefinition: [
      { size: 7 },
      { size: 5, activation: neuralNetworkActivationFunctions.relu },
      { size: 1, activation: neuralNetworkActivationFunctions.sigmoid },
    ],
    savedGeneration: localStorage.getItem("red")
      ? JSON.parse(localStorage.getItem("red")!)
      : null,
  },
  blue: {
    active: true,
    color: COLOR_BLUE,
    nnDefinition: [
      { size: 7 },
      { size: 9, activation: neuralNetworkActivationFunctions.relu },
      { size: 1, activation: neuralNetworkActivationFunctions.sigmoid },
    ],
    savedGeneration: localStorage.getItem("blue")
      ? JSON.parse(localStorage.getItem("blue")!)
      : null,
  },
  green: {
    active: true,
    color: COLOR_GREEN,
    nnDefinition: [
      { size: 7 },
      { size: 9, activation: neuralNetworkActivationFunctions.relu },
      { size: 9, activation: neuralNetworkActivationFunctions.relu },
      { size: 1, activation: neuralNetworkActivationFunctions.sigmoid },
    ],
    savedGeneration: localStorage.getItem("green")
      ? JSON.parse(localStorage.getItem("green")!)
      : null,
  },
};
