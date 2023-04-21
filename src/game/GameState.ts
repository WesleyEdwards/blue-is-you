import {
  CANVAS_BORDER,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  initialKeyStatus,
} from "./helpers/constants";
import { addEventListeners } from "./helpers/utils";
import { Player } from "./Player";
import { Keys } from "./helpers/types";
import { colorPalette } from "./helpers/drawingHelpers";
import { UpdateUiFunctions } from "../components/Types";
import { OpponentManager } from "./opponents/OpponentManager";
import { PlayerBulletManager } from "./bullets/PlayerBulletManager";
import { OpponentBulletManager } from "./bullets/OpponentBulletManager";
import { WaveManager } from "./waves/WaveManager";
import { ParticleManager } from "./particles/ParticleManager";
import { displayWords, drawBackground } from "../utils/images";

export class GameState {
  private keys: Keys = initialKeyStatus;
  private player: Player;
  private playerBulletManager: PlayerBulletManager;
  private opponentBulletManager: OpponentBulletManager;
  private opponentManager: OpponentManager;
  private waveManager: WaveManager;
  private particleManager: ParticleManager;
  private context: CanvasRenderingContext2D;
  private state: "playing" | "gameOver" = "playing";

  constructor(context: CanvasRenderingContext2D, attract: boolean) {
    if (!attract) addEventListeners(this.keys);

    this.player = new Player(context, attract);
    this.playerBulletManager = new PlayerBulletManager(context, attract);
    this.opponentBulletManager = new OpponentBulletManager(context);
    this.opponentManager = new OpponentManager(context, this.opponentBulletManager, this.player);
    this.waveManager = new WaveManager(this.opponentManager, this.opponentBulletManager);
    this.particleManager = new ParticleManager(context);
    this.context = context;
  }

  updateAll(
    elapsedTime: number,
    paused: boolean,
    uiFunctions: UpdateUiFunctions
  ) {
    if (this.keys.escape) {
      uiFunctions.toggleModal();
      this.keys.escape = false;
    }
    if (paused) return;

    
    this.playerBulletManager.update(elapsedTime, this.keys, this.player.centerX);
    this.opponentManager.update(elapsedTime);
    this.waveManager.update(elapsedTime);
    this.particleManager.update(elapsedTime);
    
    if (this.state === "gameOver") return;

    const opponentsHit = this.playerBulletManager.checkOpponentCollision(
      this.opponentManager.opponents
    );
    if (opponentsHit.length > 0) {
      opponentsHit.forEach((opp) => {
        uiFunctions.incrementScore(opp.score)
        this.particleManager.opponentDeath(opp);
        this.opponentManager.handleHit(opp);
      });
    }
    const playerHitByBullet = this.opponentBulletManager.checkPlayerCollision(this.player);
    const playerHitByOpponent = this.opponentManager.checkPlayerCollision(this.player);
    const justDied = playerHitByBullet || playerHitByOpponent

    if (justDied) {
      this.particleManager.playerDeath(this.player.centerX!)
      uiFunctions.playerDeath();
    }
    this.player.update(this.keys, elapsedTime, justDied);
    
    if (this.player.endGame) {
      this.state = "gameOver";
    }
  }

  drawAll() {
    drawBackground(this.context);
    this.player.draw();
    this.playerBulletManager.draw();
    this.opponentBulletManager.draw();
    this.opponentManager.draw();
    this.particleManager.draw();

    if (this.waveManager.displayStageNumber) {
      displayWords(`Stage ${this.waveManager.stageIndex + 1}`, this.context);
    }
  }

}
