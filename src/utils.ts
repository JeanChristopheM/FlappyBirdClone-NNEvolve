import {
  GENERATIONS_COLORS,
  settings,
  defaultSavedGenerationObject,
} from "./constants";
import { IKeyInColors, TSavedGeneration } from "./interfaces";

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
