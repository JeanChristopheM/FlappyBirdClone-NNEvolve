import {
  GENERATIONS_COLORS,
  settings,
  defaultSavedGenerationObject,
  _CONFIG_WIDTH,
  _CONFIG_HEIGHT,
} from "./constants";
import {
  IBird,
  IFFNeuralNetwork,
  IKeyInColors,
  INeuronShape,
  TGameStats,
  TGenerationColors,
  TSavedGeneration,
} from "./interfaces";

export const preloadAssets = (scene: Phaser.Scene) => {
  scene.load.image("sky", "assets/sky.png");
  scene.load.image("bird", "assets/bird.png");
  scene.load.image("bird-colour", "assets/bird-colour.png");
  scene.load.image("pipe", "assets/pipe.png");
};

export const loadSky = (scene: Phaser.Scene) => {
  const s = scene.add.image(0, 0, "sky");
  s.displayOriginX = 0;
  s.displayOriginY = 0;
  s.displayWidth = _CONFIG_WIDTH;
  s.displayHeight = _CONFIG_HEIGHT;
};

export const generateSavingData: (
  generationColors: TGenerationColors[],
  currentStats?: TGameStats
) => IKeyInColors<TSavedGeneration> = (generationColors, currentStats) =>
  generationColors.reduce((acc, k) => {
    acc[k] = {
      alive: currentStats?.generations[k].alive || 0,
      highScore: currentStats?.generations[k].highScore || 0,
      generationCount: currentStats?.generations[k].generationCount || 0,
      winningGenotype: currentStats?.generations[k].winningGenotype,
    };
    return acc;
  }, defaultSavedGenerationObject);

export const generateInitStats = (
  previousGenerations?: IKeyInColors<TSavedGeneration>
) => ({
  score: 0,
  generations:
    GENERATIONS_COLORS.reduce((acc, k) => {
      acc[k] = {
        alive: 0,
        highScore: previousGenerations
          ? previousGenerations[k].highScore
          : settings[k].savedGeneration?.highScore
          ? Number(settings[k].savedGeneration?.highScore)
          : 0,
        generationCount: previousGenerations
          ? previousGenerations[k].generationCount
          : settings[k].savedGeneration?.generationCount
          ? Number(settings[k].savedGeneration?.generationCount)
          : 0,
        winningGenotype: previousGenerations
          ? previousGenerations[k].winningGenotype
          : settings[k].savedGeneration?.winningGenotype,
      };
      return acc;
    }, defaultSavedGenerationObject) || [],
});

export const getColorStringFromColorNumber = (tint: number) => {
  return GENERATIONS_COLORS.find((color) => settings[color].color === tint)!;
};

export const handleResetLocalStorageCallback = (
  colors: TGenerationColors[]
) => {
  colors.forEach((gc) => {
    localStorage.removeItem(gc);
  });
};

export const getPopulationInitializationParams = (
  neuron: IFFNeuralNetwork,
  size: number,
  shapes: INeuronShape[],
  colour: number
) => ({
  population_size: size,
  genotype: {
    size: neuron.toArray().length,
  },
  mutation: {
    magnitude: 0.1,
    odds: 0.1,
    decay: 0,
  },
  breed: {
    selectionCutoff: 0.2,
    immortalityCutoff: 0.05,
    childrenPercentage: 0.5,
  },
  shapes: shapes,
  tint: colour,
});

export const getBirdsSortedByColors = (
  birds: IBird[]
): IKeyInColors<IBird[]> => {
  return birds.reduce(
    (acc: { [key in TGenerationColors]: IBird[] }, cur) => {
      const color = getColorStringFromColorNumber(cur._config.pop_params.tint);
      acc[color].push(cur);
      return acc;
    },
    { red: [], green: [], blue: [] }
  );
};
