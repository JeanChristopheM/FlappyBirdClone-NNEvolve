import { GameObjects, Scene } from "phaser";
import { IBirdsParams, IGenotype, IUpdateBirdsParams } from "./interfaces.js";
import { _UPWARDS_ACCELERATION } from "./constants.js";
import { FFNeuralNetwork } from "./ffnet.js";
import { _PipePairObject } from "./pipe.js";
const _BIRD_POS_X = 50;

export class _FlappyBirdObject {
  _scene: Scene | undefined;
  _config: IBirdsParams;
  _sprite: GameObjects.Image;
  _spriteTint: GameObjects.Image;
  _velocity: number;
  _dead: boolean;
  _frameInputs: unknown[];
  _model: unknown;
  _populationEntity: unknown;

  constructor(scene: Scene) {
    this._scene = scene;
    // This is just an empty random config I threw together to satisfy TS
    this._config = {
      scene: this._scene,
      pop_entity: {
        fitness: 0,
        genotype: [0],
      },
      pop_params: {
        population_size: 0,
        genotype: {
          size: 0,
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
        shapes: [],
        tint: 1,
      },
      x: _BIRD_POS_X,
      config_width: 0,
      config_height: 0,
      max_upwards_velocity: 0,
      terminal_velocity: 0,
      treadmill_speed: 0,
      acceleration: _UPWARDS_ACCELERATION,
      gravity: 0,
    };
    this._frameInputs = [];
    this._sprite = scene.add.sprite(_BIRD_POS_X, 100, "bird");
    this._spriteTint = scene.add.sprite(_BIRD_POS_X, 100, "bird-colour");
    this._velocity = 0;
    this._dead = false;
  }

  Destroy() {
    this._sprite.destroy();
    this._spriteTint.destroy();
  }

  Update(params: IUpdateBirdsParams) {
    if (this._dead) {
      return;
    }

    this._ApplyGravity(params.timeElapsed);
    this._velocity = Math.min(
      Math.max(this._velocity, this._config.max_upwards_velocity),
      this._config.terminal_velocity
    );
    this._sprite.y += this._velocity * params.timeElapsed;
    this._spriteTint.y += this._velocity * params.timeElapsed;

    const v = new Phaser.Math.Vector2(
      -1 * this._config.treadmill_speed * params.timeElapsed,
      0
    );
    v.add(new Phaser.Math.Vector2(0, this._velocity));
    v.normalize();

    const rad = Math.atan2(v.y, v.x);
    const deg = (180.0 / Math.PI) * rad;

    this._sprite.angle = deg * 0.75;
    this._spriteTint.angle = deg * 0.75;
  }

  get Dead() {
    return this._dead;
  }

  set Dead(d) {
    this._dead = d;

    this._scene?.tweens.add({
      targets: this._sprite,
      props: {
        alpha: { value: 0.0, duration: 500, ease: "Sine.easeInOut" },
      },
    });
    this._scene?.tweens.add({
      targets: this._spriteTint,
      props: {
        alpha: { value: 0.0, duration: 500, ease: "Sine.easeInOut" },
      },
    });
  }

  set Alpha(a: number) {
    this._sprite.alpha = a;
    this._spriteTint.alpha = a;
  }

  get Bounds() {
    return this._sprite.getBounds();
  }

  _ApplyGravity(timeElapsed: number) {
    this._velocity += this._config.gravity * timeElapsed;
  }
}

export class FlappyBird_NeuralNet extends _FlappyBirdObject {
  _populationEntity: IGenotype;
  _model: {
    fromArray(values: number[]): void;
    predict(inputs: number[]): number[];
  };
  constructor(config: IBirdsParams) {
    super(config.scene);

    this._model = new FFNeuralNetwork(config.pop_params.shapes);
    this._model.fromArray(config.pop_entity.genotype);
    this._populationEntity = config.pop_entity;
    this._spriteTint.setTint(config.pop_params.tint);
    this._config = config;
  }

  Update(params: IUpdateBirdsParams) {
    function _PipeParams(bird: _FlappyBirdObject, pipe: _PipePairObject) {
      const distToPipe =
        (pipe.X + pipe.Width - bird.Bounds.left) / bird._config.config_width;
      const distToPipeB =
        ((pipe._sprite1.y - bird.Bounds.bottom) / bird._config.config_height) *
          0.5 +
        0.5;
      const distToPipeT =
        ((pipe._sprite2.y - bird.Bounds.top) / bird._config.config_height) *
          0.5 +
        0.5;
      return [distToPipe, distToPipeB, distToPipeT];
    }

    function _Params(bird: _FlappyBirdObject, pipes: _PipePairObject[]) {
      // Initializing inputs with the distances to the nearest pipes (2 pipes -> 6 inputs)
      const inputs = pipes.map((p) => _PipeParams(bird, p)).flat();

      // Adding the velocity as an input
      inputs.push((bird._velocity / bird._config.gravity) * 0.5 + 0.5);

      // Total of 7 inputs
      return inputs;
    }

    const inputs = _Params(this, params.nearestPipes);
    const decision = this._model.predict(inputs);

    // If the output of the model is greater than 0.5, the bird jumps
    if (decision[0] > 0.5) {
      this._velocity += this._config.acceleration;
    }

    super.Update(params);

    if (!this.Dead) {
      this._populationEntity.fitness += params.timeElapsed;
    }
  }
}
