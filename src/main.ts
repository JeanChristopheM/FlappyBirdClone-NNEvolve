import { bird } from "./bird";
import { ffnet } from "./ffnet";
import { pipe } from "./pipe";
import { population } from "./population";
import {
  IBird,
  IGenerationChoice,
  IKeyInColors,
  IKeys,
  INeuronShape,
  IPipe,
  IPopulation,
  IPopulationParams,
  TGenerationColors,
  TSavedGeneration,
} from "./interfaces";
import { Game } from "phaser";
import {
  COLOR_BLUE,
  COLOR_GREEN,
  COLOR_RED,
  GENERATIONS_COLORS,
  GENERATION_BIRD_AMOUNT,
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
  settings,
  defaultSavedGenerationObject,
  // defaultStartingBehaviours,
} from "./constants";
import { generateInitStats } from "./utils";

// . CLASS DEFINITION
class FlappyBirdGame {
  _game: Phaser.Game;
  _previousFrame: number | null;
  _gameOver: boolean;
  _settings: IGenerationChoice;
  _generationsColors: TGenerationColors[];
  _scene: Phaser.Scene | undefined;
  _stats:
    | {
        score: number;
        generations: IKeyInColors<TSavedGeneration>;
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
    this._settings = settings;
    this._generationsColors = GENERATIONS_COLORS;

    this._statsText1 = null;
    this._statsText2 = null;
    this._gameOverText = null;
    this._pipes = [];
    this._birds = [];

    this._InitPopulations();
  }

  _InitPopulations() {
    this._populations = [];
    this._generationsColors.forEach((color) => {
      if (this._settings[color].active && this._populations)
        this._populations.push(
          this._CreatePopulation(
            GENERATION_BIRD_AMOUNT,
            this._settings[color].nnDefinition,
            this._settings[color].color,
            this._settings[color].savedGeneration
          )
        );
    });

    let handleResetLocalStorageCallback = () => {
      this._generationsColors.forEach((gc) => {
        localStorage.removeItem(gc);
      });
    };
    const resetBtn: HTMLButtonElement | null =
      document.querySelector("#reset_btn");
    if (resetBtn) resetBtn.onclick = handleResetLocalStorageCallback;
  }

  _CreatePopulation(
    size: number,
    shapes: INeuronShape[],
    colour: number,
    savedGeneration?: TSavedGeneration | null
  ) {
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
    };
    if (savedGeneration) params.savedGeneration = savedGeneration;

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

  _GetPopulationByColor(color: TGenerationColors) {
    return this._populations?.find(
      (p) => this._settings[color].color === p._params.tint
    );
  }

  _GetStatsPerGen(color: TGenerationColors) {
    const result = {
      alive: this._stats?.generations[color].alive || 0,
      highScore: this._stats?.generations[color].highScore || 0,
      generationCount: this._GetPopulationByColor(color)?._generations || 0,
    };
    return result;
  }

  _Init(previousGenerations?: IKeyInColors<TSavedGeneration>) {
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
    this._stats = generateInitStats(previousGenerations);

    const style = {
      font: "20px Roboto",
      fill: "#FFFFFF",
      align: "right",
      fixedWidth: 150,
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
        { ...style, fixedWidth: 0 }
      );

    this._birds = [];
    if (this._populations && this._scene) {
      for (let curPop of this._populations) {
        const color = this._generationsColors.find((key) => {
          return this._settings[key].color === curPop._params.tint;
        })!;
        curPop.Step(color, this._GetStatsPerGen(color));

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
    const birdSortedByTeam: IKeyInColors<IBird[]> = this._birds.reduce(
      (acc: { [key in TGenerationColors]: IBird[] }, cur) => {
        const color = cur._config.pop_params.tint;
        acc[
          color == COLOR_RED
            ? "red"
            : color == COLOR_BLUE
            ? "blue"
            : color == COLOR_GREEN
            ? "green"
            : "green"
        ].push(cur);
        return acc;
      },
      { red: [], green: [], blue: [] }
    );

    const results = this._generationsColors.reduce(
      (acc: { [key in TGenerationColors]: number }, k) => {
        acc[k] = birdSortedByTeam[k]
          .map((b) => this._IsBirdOutOfBounds(b))
          .reduce((t, r) => (r ? t : t + 1), 0);
        return acc;
      },
      { red: 0, blue: 0, green: 0 }
    );

    if (this._stats) {
      this._generationsColors.forEach((k) => {
        if (this._stats)
          this._stats.generations[k].alive = birdSortedByTeam[k]
            .map((b) => this._IsBirdOutOfBounds(b))
            .reduce((t, r) => (r ? t : t + 1), 0);
      });
    }

    if (this._generationsColors.every((k) => results[k] === 0)) {
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

    // If we progressed passed the last pipe
    if (oldPipeX > _BIRD_POS_X && newPipeX <= _BIRD_POS_X) {
      // Update general score
      if (this._stats) this._stats.score += 1;
      // Update highscore of each generation if needed
      this._generationsColors.forEach((k) => {
        if (
          this._stats &&
          this._stats.score > this._stats.generations[k].highScore &&
          this._stats.generations[k].alive > 0
        ) {
          this._stats.generations[k].highScore = this._stats.score;
        }
      });
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
      this._Init(
        this._generationsColors.reduce((acc, k) => {
          acc[k] = {
            alive: this._stats?.generations[k].alive || 0,
            generationCount: this._stats?.generations[k].generationCount || 0,
            highScore: this._stats?.generations[k].highScore || 0,
            winningGenotype: this._stats?.generations[k].winningGenotype,
          };
          return acc;
        }, defaultSavedGenerationObject)
      );
    }, 2000);
  }

  _DrawStats() {
    const text1 = "Score:\n" + "Generation:\n" + "Alives:\n" + "Highscores:\n";
    if (this._statsText1) this._statsText1.text = text1;

    if (this._populations && this._stats && this._statsText2) {
      const text2 =
        this._stats.score +
        "\n" +
        this._generationsColors.reduce((acc, cur) => {
          return acc
            .concat(cur)
            .concat(`: ${this._GetPopulationByColor(cur)?._generations} `);
        }, "") +
        "\n" +
        this._generationsColors.reduce((acc, cur) => {
          return acc
            .concat(cur)
            .concat(`: ${this._stats?.generations[cur].alive} `);
        }, "") +
        "\n" +
        this._generationsColors.reduce((acc, cur) => {
          return acc
            .concat(cur)
            .concat(`: ${this._stats?.generations[cur].highScore} `);
        }, "") +
        "\n";
      this._statsText2.text = text2;
    }
  }
}

const game = new FlappyBirdGame();
//@ts-ignore
window.finishGame = () => game._GameOver();
