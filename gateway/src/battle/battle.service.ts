import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { BattleConfig } from './domain/battle-config.model';
import { BattleResponse } from './battle.controller';
import { GameMasterClient } from './game-master-client/game-master-client.service';
import { BattleEvent, BattleEventType } from './domain/battle-events.model';

@Injectable()
export class BattleService implements OnModuleInit {
  private readonly logger = new Logger(BattleService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly gmClient: GameMasterClient,
  ) {}

  async onModuleInit() {
    await this.listenToBattleEvents();
  }

  async initializeNewBattle(config: BattleConfig): Promise<BattleResponse> {
    this.logger.log(
      `Initializing battle "${config.name}" with ${config.redTeamSize + config.blueTeamSize} total pods.`,
    );

    await this.gmClient.createBattlefield(config);
    return { status: 'created' };
  }

  async start(): Promise<BattleResponse> {
    this.logger.log('Requesting Game-Master to start the engine...');
    const result = await this.gmClient.startGame();
    return { status: 'started', data: result };
  }

  private async listenToBattleEvents() {
    const sub = this.redisService.getSubscriber();

    try {
      await sub.subscribe('battle:events');
      this.logger.log('Successfully subscribed to battle:events channel');
    } catch (err) {
      this.logger.error('Failed to subscribe to Redis battle channel', err);
    }

    sub.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message) as Record<string, unknown>;
        this.handleEvent(event);
      } catch {
        this.logger.warn('Received invalid JSON from Redis');
      }
    });
  }

  private handleEvent(rawEvent: unknown) {
    if (!rawEvent || typeof rawEvent !== 'object' || !('type' in rawEvent)) {
      return;
    }

    const event = rawEvent as BattleEvent;
    const ts = new Date(event.timestamp).toISOString();

    switch (event.type) {
      case BattleEventType.GAME_STARTED: {
        this.logger.debug(`[${ts}] ${event.type}: ⚔️ ${event.payload.message}`);
        break;
      }

      case BattleEventType.GAME_OVER: {
        const { winner, score } = event.payload;
        this.logger.debug(
          `[${ts}] 🏆 WINNER: ${winner} (Red: ${score.red} | Blue: ${score.blue})`,
        );
        break;
      }

      case BattleEventType.WARRIOR_DIED:
      case BattleEventType.WARRIOR_READY:
      case BattleEventType.POD_ADDED: {
        const { podName, team, status } = event.payload;
        this.logger.debug(
          `[${ts}] ${event.type}: ${podName} [${team}] -> ${status}`,
        );
        break;
      }

      default: {
        this.logger.warn(`Unhandled event type`);
      }
    }
  }
}
