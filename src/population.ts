import { IGenotype, IPopulationParams } from "./interfaces.js";
import { math } from "./math.js";

export const population = (function () {
  return {
    Population: class {
      _params: IPopulationParams;
      _population: IGenotype[];
      _generations: number;
      _lastGeneration: { parents: IGenotype[] } | null;
      _initialized: boolean;

      constructor(params: IPopulationParams) {
        this._params = params;
        this._initialized = false;
        this._population = [...Array(this._params.population_size)].map(
          (_) => ({
            fitness: 1,
            genotype:
              this._params.defaultGenotype || this._CreateRandomGenotype(),
          })
        );
        this._lastGeneration = null;
        this._generations = 0;
      }

      _CreateRandomGenotype() {
        return [...Array(this._params.genotype.size)].map(
          (_) => Math.random() * 2 - 1
        );
      }

      Fittest() {
        return this._lastGeneration?.parents[0];
      }

      Step(_tgtImgData?: number) {
        const parents = this._population.sort((a, b) => b.fitness - a.fitness);

        this._lastGeneration = { parents: parents };
        this._generations += 1;

        this._population = this._BreedNewPopulation(parents);
        console.log(this._population[0]);
      }

      _BreedNewPopulation(parents: IGenotype[]) {
        function _RouletteSelection(
          sortedParents: IGenotype[],
          totalFitness: number
        ) {
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

        function _RandomParent(
          sortedParents: IGenotype[],
          _otherParent: IGenotype,
          totalFitness: number
        ) {
          const p = _RouletteSelection(sortedParents, totalFitness);
          return p;
        }

        function _CopyGenotype(g: IGenotype) {
          return {
            fitness: g.fitness,
            genotype: [...g.genotype],
          };
        }

        const newPopulation: IGenotype[] = [];
        const totalFitness = parents.reduce((t, p) => t + p.fitness, 0);
        const numChildren = Math.ceil(
          parents.length * this._params.breed.childrenPercentage
        );

        const top = [
          ...parents.slice(
            0,
            Math.ceil(parents.length * this._params.breed.selectionCutoff)
          ),
        ];
        for (let j = 0; j < numChildren; j++) {
          const i = j % top.length;
          const p1 = top[i];
          const p2 = _RandomParent(parents, p1, totalFitness);

          const index = Math.round(Math.random() * p1.genotype.length);

          const g = p1.genotype
            .slice(0, index)
            .concat(p2.genotype.slice(index));

          newPopulation.push(_CopyGenotype({ fitness: 1, genotype: g }));
        }

        // Let's say keep top X% go through, but with mutations
        const topX = [
          ...parents.slice(
            0,
            Math.ceil(parents.length * this._params.breed.immortalityCutoff)
          ),
        ];

        newPopulation.push(...topX.map((x) => _CopyGenotype(x)));

        // Mutations!
        for (let p of newPopulation) {
          // const genotypeLength = p.genotype.length;
          const mutationOdds = this._params.mutation.odds;
          const mutationMagnitude = this._params.mutation.magnitude;
          function _Mutate(x: number) {
            const roll = Math.random();

            if (roll < mutationOdds) {
              const magnitude = mutationMagnitude * math.rand_normalish();
              return x + magnitude;
            }
            return x;
          }

          p.genotype = p.genotype.map((g) => _Mutate(g));
        }

        // Immortality granted to the winners from the last life.
        // May the odds be forever in your favour.
        newPopulation.push(...topX.map((x) => _CopyGenotype(x)));

        // Create a bunch of random crap to fill out the rest.
        while (newPopulation.length < parents.length) {
          newPopulation.push({
            fitness: 1,
            genotype: this._CreateRandomGenotype(),
          });
        }

        return newPopulation;
      }
    },
  };
})();
