import { bird } from "./bird";
import { ffnet } from "./ffnet";
import { pipe } from "./pipe";
import { population } from "./population";
import {
  IBird,
  IKeys,
  INeuronShape,
  IPipe,
  IPopulation,
  IPopulationParams,
} from "./interfaces";
import { Game } from "phaser";
import {
  _AMOUT_OF_PIPES_FOR_INPUTS,
  _BIRD_POS_X,
  _CONFIG_HEIGHT,
  _CONFIG_WIDTH,
  _GRAVITY,
  _GROUND_Y,
  _MAX_UPWARDS_VELOCITY,
  _PIPE_SPACING_X,
  _PIPE_SPACING_Y,
  _TERMINAL_VELOCITY,
  _TREADMILL_SPEED,
  _UPWARDS_ACCELERATION,
  // defaultStartingBehaviours,
} from "./constants";

// . CLASS DEFINITION
class FlappyBirdGame {
  _game: Phaser.Game;
  _previousFrame: number | null;
  _gameOver: boolean;
  _scene: Phaser.Scene | undefined;
  _stats:
    | {
        alive: number;
        score: number;
      }
    | undefined;

  _statsText1: Phaser.GameObjects.Text | null;
  _statsText2: Phaser.GameObjects.Text | null;
  _gameOverText: Phaser.GameObjects.Text | null;
  _pipes: IPipe[];
  _birds: IBird[];
  _populations: IPopulation[] | undefined;

  _keys: IKeys | undefined;

  // _ CONSTRUCTOR _
  constructor() {
    this._game = this._CreateGame();
    this._previousFrame = null;
    this._gameOver = true;

    this._statsText1 = null;
    this._statsText2 = null;
    this._gameOverText = null;
    this._pipes = [];
    this._birds = [];

    this._InitPopulations();
  }

  _InitPopulations() {
    const NN_DEF1: INeuronShape[] = [
      { size: 7 },
      { size: 5, activation: ffnet.relu },
      { size: 1, activation: ffnet.sigmoid },
    ];

    const NN_DEF2: INeuronShape[] = [
      { size: 7 },
      { size: 9, activation: ffnet.relu },
      { size: 1, activation: ffnet.sigmoid },
    ];

    const NN_DEF3: INeuronShape[] = [
      { size: 7 },
      { size: 9, activation: ffnet.relu },
      { size: 9, activation: ffnet.relu },
      { size: 1, activation: ffnet.sigmoid },
    ];

    this._populations = [
      this._CreatePopulation(100, NN_DEF1, 0xff0000),
      this._CreatePopulation(100, NN_DEF2, 0x0000ff),
      this._CreatePopulation(100, NN_DEF3, 0x00ff00),
    ];
  }

  _CreatePopulation(size: number, shapes: INeuronShape[], colour: number) {
    const t = new ffnet.FFNeuralNetwork(shapes);

    const params: IPopulationParams = {
      population_size: size,
      genotype: {
        size: t.toArray().length,
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
      // defaultGenotype: defaultStartingBehaviours.bouncy,
    };

    return new population.Population(params);
  }

  _Destroy() {
    for (let b of this._birds) {
      b.Destroy();
    }
    for (let p of this._pipes) {
      p.Destroy();
    }
    this._statsText1?.destroy();
    this._statsText2?.destroy();
    if (this._gameOverText !== null) {
      this._gameOverText.destroy();
    }
    this._birds = [];
    this._pipes = [];
    this._previousFrame = null;
  }

  _Init() {
    for (let i = 0; i < 5; i += 1) {
      this._pipes.push(
        new pipe.PipePairObject({
          scene: this._scene,
          x: 500 + i * _PIPE_SPACING_X,
          spacing: _PIPE_SPACING_Y,
          speed: _TREADMILL_SPEED,
          config_height: _CONFIG_HEIGHT,
        }) as unknown as IPipe
      );
    }

    this._gameOver = false;
    this._stats = {
      alive: 0,
      score: 0,
    };

    const style = {
      font: "40px Roboto",
      fill: "#FFFFFF",
      align: "right",
      fixedWidth: 210,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: "#000",
        blur: 2,
        fill: true,
      },
    };
    if (this._scene) this._statsText1 = this._scene.add.text(0, 0, "", style);

    style.align = "left";
    if (this._scene && this._statsText1)
      this._statsText2 = this._scene.add.text(
        this._statsText1.width + 10,
        0,
        "",
        style
      );

    this._birds = [];
    if (this._populations && this._scene) {
      for (let curPop of this._populations) {
        curPop.Step();

        this._birds.push(
          ...curPop._population.map(
            (p) =>
              new bird.FlappyBird_NeuralNet({
                scene: this._scene!,
                pop_entity: p,
                pop_params: curPop._params,
                x: _BIRD_POS_X,
                config_width: _CONFIG_WIDTH,
                config_height: _CONFIG_HEIGHT,
                max_upwards_velocity: _MAX_UPWARDS_VELOCITY,
                terminal_velocity: _TERMINAL_VELOCITY,
                treadmill_speed: _TREADMILL_SPEED,
                acceleration: _UPWARDS_ACCELERATION,
                gravity: _GRAVITY,
              }) as unknown as IBird
          )
        );
      }
    }
  }

  _CreateGame() {
    const self = this;
    const config = {
      type: Phaser.AUTO,
      scene: {
        preload: function () {
          // @ts-ignore
          self._OnPreload(this);
        },
        create: function () {
          self._OnCreate();
        },
        update: function () {
          // @ts-ignore
          self._OnUpdate(this);
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        treadmill_speed: _TREADMILL_SPEED,
        width: _CONFIG_WIDTH,
        height: _CONFIG_HEIGHT,
      },
    };

    return new Game(config);
  }

  _OnPreload(scene: Phaser.Scene) {
    this._scene = scene;
    this._scene.load.image("sky", "assets/sky.png");
    this._scene.load.image("bird", "assets/bird.png");
    this._scene.load.image("bird-colour", "assets/bird-colour.png");
    this._scene.load.image("pipe", "assets/pipe.png");
  }

  _OnCreate() {
    if (!this._scene) return;
    const s = this._scene.add.image(0, 0, "sky");
    s.displayOriginX = 0;
    s.displayOriginY = 0;
    s.displayWidth = _CONFIG_WIDTH;
    s.displayHeight = _CONFIG_HEIGHT;

    this._keys = {
      up: this._scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      f: this._scene.input.keyboard!.addKey("F"),
      r: this._scene.input.keyboard!.addKey("R"),
    };

    this._keys.f.on(
      "down",
      function () {
        // @ts-ignore
        if (this._scene.scale.isFullscreen) {
          // @ts-ignore
          this._scene.scale.stopFullscreen();
        } else {
          // @ts-ignore
          this._scene.scale.startFullscreen();
        }
      },
      this
    );

    this._keys.r.on(
      "down",
      function () {
        // @ts-ignore
        this._Destroy();
        // @ts-ignore
        this._Init();
      },
      this
    );

    this._Init();
  }

  _OnUpdate(scene: Phaser.Scene) {
    if (this._gameOver) {
      this._DrawStats();
      return;
    }

    const currentFrame = scene.time.now;
    if (this._previousFrame == null) {
      this._previousFrame = currentFrame;
    }

    const timeElapsedInS = Math.min(
      (currentFrame - (this._previousFrame || 0)) / 1000.0,
      1.0 / 30.0
    );

    this._UpdateBirds(timeElapsedInS);
    this._UpdatePipes(timeElapsedInS);
    this._CheckGameOver();
    this._DrawStats();

    this._previousFrame = currentFrame;
  }

  _CheckGameOver() {
    const results = this._birds.map((b) => this._IsBirdOutOfBounds(b));

    if (this._stats)
      this._stats.alive = results.reduce((t, r) => (r ? t : t + 1), 0);

    if (results.every((b) => b)) {
      this._GameOver();
    }
  }

  _IsBirdOutOfBounds(bird: IBird) {
    const birdAABB = bird.Bounds;
    birdAABB.top += 10;
    birdAABB.bottom -= 10;
    birdAABB.left += 10;
    birdAABB.right -= 10;

    if (bird.Dead) {
      return true;
    }

    if (birdAABB.bottom >= _GROUND_Y || birdAABB.top <= 0) {
      bird.Dead = true;
      return true;
    }

    for (const p of this._pipes) {
      if (p.Intersects(birdAABB)) {
        bird.Dead = true;
        return true;
      }
    }
    return false;
  }

  _GetNearestPipes() {
    let index = 0;
    if (this._pipes[0].X + this._pipes[0].Width <= _BIRD_POS_X) {
      index = 1;
    }
    return this._pipes.slice(index, _AMOUT_OF_PIPES_FOR_INPUTS);
  }

  _UpdateBirds(timeElapsed: number) {
    if (this._keys) {
      const params = {
        timeElapsed: timeElapsed,
        keys: { up: Phaser.Input.Keyboard.JustDown(this._keys.up) },
        nearestPipes: this._GetNearestPipes(),
      };

      for (let b of this._birds) {
        b.Update(params);
      }
    }
  }

  _UpdatePipes(timeElapsed: number) {
    const oldPipeX = this._pipes[0].X + this._pipes[0].Width;

    for (const p of this._pipes) {
      p.Update(timeElapsed);
    }

    const newPipeX = this._pipes[0].X + this._pipes[0].Width;

    if (oldPipeX > _BIRD_POS_X && newPipeX <= _BIRD_POS_X) {
      if (this._stats) this._stats.score += 1;
    }

    if (this._pipes[0].X + this._pipes[0].Width <= 0) {
      const p = this._pipes.shift();
      if (p) {
        p.Reset(this._pipes[this._pipes.length - 1].X + _PIPE_SPACING_X);
        this._pipes.push(p);
      }
    }
  }

  _GameOver() {
    const text = "GAME OVER";
    const style = {
      font: "100px Roboto",
      fill: "#FFFFFF",
      align: "center",
      fixedWidth: _CONFIG_WIDTH,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: "#000",
        blur: 2,
        fill: true,
      },
    };

    if (this._scene) {
      this._gameOverText = this._scene.add.text(
        0,
        _CONFIG_HEIGHT * 0.25,
        text,
        style
      );
    }
    this._gameOver = true;

    setTimeout(() => {
      this._Destroy();
      this._Init();
    }, 2000);
  }

  _DrawStats() {
    const text1 = "Generation:\n" + "Score:\n" + "Alive:\n";
    if (this._statsText1) this._statsText1.text = text1;

    if (this._populations && this._stats && this._statsText2) {
      const text2 =
        this._populations[0]._generations +
        "\n" +
        this._stats.score +
        "\n" +
        this._stats.alive +
        "\n";
      this._statsText2.text = text2;
    }
  }
}

new FlappyBirdGame();
