import {
  IGenotype,
  IPopulationParams,
  TGenerationColors,
  TSavedGeneration,
} from "../interfaces";
import { rand_normalish } from "../math";
import { getColorStringFromColorNumber } from "../utils";

export class Population {
  _params: IPopulationParams;
  _population: IGenotype[];
  _generations: number;
  _lastGeneration: { parents: IGenotype[] } | null;
  _initialized: boolean;
  updateStatsGeneration: (
    color: TGenerationColors,
    generationCount: number
  ) => void;

  constructor(
    params: IPopulationParams,
    updateStatsGeneration: (
      color: TGenerationColors,
      generationCount: number
    ) => void
  ) {
    this._params = params;
    this._initialized = false;
    this._population = [...Array(this._params.population_size)].map((_) => ({
      fitness: 1,
      genotype:
        this._params.savedGeneration?.winningGenotype?.genotype ||
        this._CreateRandomGenotype(),
    }));
    this._lastGeneration = null;
    this._generations = params.savedGeneration?.generationCount || 0;
    this.updateStatsGeneration = updateStatsGeneration;
  }

  _CreateRandomGenotype() {
    return [...Array(this._params.genotype.size)].map(
      (_) => Math.random() * 2 - 1
    );
  }

  Fittest() {
    return this._lastGeneration?.parents[0];
  }

  Step(
    generationColor: TGenerationColors,
    generationDetails?: {
      alive: number;
      highScore: number;
      generationCount: number;
    }
  ) {
    const parents = this._population.sort((a, b) => b.fitness - a.fitness);

    this._lastGeneration = { parents: parents };
    this._generations += 1;
    this.updateStatsGeneration(
      getColorStringFromColorNumber(this._params.tint),
      this._generations
    );
    this._SaveGenomeIfBetterThanLocalStorage(
      generationColor,
      generationDetails
    );

    this._population = this._BreedNewPopulation(parents);
  }

  _SaveGenomeIfBetterThanLocalStorage(
    generationColor: TGenerationColors,
    generationDetails?: {
      alive: number;
      highScore: number;
      generationCount: number;
    }
  ) {
    const fittest = this.Fittest();

    if (fittest) {
      const currentlySavedString = localStorage.getItem(generationColor);
      const currentlySaved = currentlySavedString
        ? JSON.parse(currentlySavedString)
        : { alive: 0, highScore: 0, generationCount: 0 };
      const copiedGenotype = this._CopyGenotype(this.Fittest()!, true);

      const saveGeneration = (itemToSave: TSavedGeneration) => {
        localStorage.setItem(generationColor, JSON.stringify(itemToSave));
      };

      const itemToSave: TSavedGeneration = {
        ...currentlySaved,
        generationCount: generationDetails?.generationCount,
      };

      if (currentlySaved) {
        const savedGenome = currentlySaved.winningGenotype;
        if ((savedGenome?.fitness || 0) < fittest.fitness) {
          itemToSave.highScore = generationDetails?.highScore || 0;
          itemToSave.winningGenotype = copiedGenotype;
        }
        saveGeneration(itemToSave);
      } else {
        saveGeneration(itemToSave);
      }
    }
  }

  _CopyGenotype(g: IGenotype, keepFitness: boolean = false) {
    return {
      fitness: keepFitness ? g.fitness : 1,
      genotype: [...g.genotype],
    };
  }

  _BreedNewPopulation(parents: IGenotype[]) {
    function _RandomParent(sortedParents: IGenotype[], totalFitness: number) {
      const roll = Math.random() * totalFitness;
      let sum = 0;
      for (let p of sortedParents) {
        sum += p.fitness;
        if (roll < sum) {
          return p;
        }
      }
      return sortedParents[sortedParents.length - 1];
    }

    const newPopulation: IGenotype[] = [];
    const totalFitness = parents.reduce((t, p) => t + p.fitness, 0);
    const numChildren = Math.ceil(
      parents.length * this._params.breed.childrenPercentage
    );

    // Group the top "selectionCutoff"% (20% by default) of the population
    const top = [
      ...parents.slice(
        0,
        Math.ceil(parents.length * this._params.breed.selectionCutoff)
      ),
    ];

    // . Merge
    // We fill the new population up to "numChildren"% (50% by default)
    // with children of the top X% of the population
    // that have been merged with a random parent
    for (let j = 0; j < numChildren; j++) {
      const i = j % top.length;
      const parent1 = top[i];
      const parent2 = _RandomParent(parents, totalFitness);

      const index = Math.round(Math.random() * parent1.genotype.length);

      const mergedGenotype = parent1.genotype
        .slice(0, index)
        .concat(parent2.genotype.slice(index));

      newPopulation.push(
        this._CopyGenotype({ fitness: 1, genotype: mergedGenotype })
      );
    }

    // We group the top "immortalityCutoff"% (5% by default) of the population
    const topX = [
      ...parents.slice(
        0,
        Math.ceil(parents.length * this._params.breed.immortalityCutoff)
      ),
    ];

    // . Mutate
    // We mutate the new population
    for (let p of newPopulation) {
      // const genotypeLength = p.genotype.length;
      const mutationOdds = this._params.mutation.odds;
      const mutationMagnitude = this._params.mutation.magnitude;
      function _Mutate(x: number) {
        const roll = Math.random();

        if (roll < mutationOdds) {
          const magnitude = mutationMagnitude * rand_normalish();
          return x + magnitude;
        }
        return x;
      }

      p.genotype = p.genotype.map((g) => _Mutate(g));
    }

    // . Winners
    // We fill the new population with the top "immortalityCutoff"% (5% by default)
    // Immortality granted to the winners from the last life.
    // May the odds be forever in your favour.
    newPopulation.push(...topX.map((x) => this._CopyGenotype(x)));

    // Create a bunch of random crap to fill out the rest.
    while (newPopulation.length < parents.length) {
      newPopulation.push({
        fitness: 1,
        genotype: this._CreateRandomGenotype(),
      });
    }

    return newPopulation;
  }
}
