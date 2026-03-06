import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { BattleConfig } from './domain/battle-config.model';
import { BattleResponse } from './battle.controller';
import { GameMasterClient } from './game-master-client/game-master-client.service';

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

  private handleEvent(event: Record<string, unknown>) {
    const type =
      typeof event.type === 'string' ? event.type.toUpperCase() : 'UNKNOWN';
    const podId = typeof event.podId === 'string' ? event.podId : 'unknown-pod';
    const action =
      typeof event.action === 'string' ? event.action : 'no-action';

    this.logger.debug(`[BATTLE EVENT] ${type}: Pod ${podId} -> ${action}`);
  }
}
