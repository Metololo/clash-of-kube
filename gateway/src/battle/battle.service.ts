import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { BattleConfig } from './domain/battle-config.model';
import { BattleResponse } from './battle.controller';
import { GameMasterClient } from './game-master-client/game-master-client.service';
import {
  BattleEvent,
  BattleEventType,
  GameOverPayload,
  GameStartedPayload,
  WarriorAttackPayload,
  WarriorPayload,
} from './domain/battle-events.model';
import { EventsGateway } from 'src/events/events/events.gateway';

@Injectable()
export class BattleService implements OnModuleInit {
  private readonly logger = new Logger(BattleService.name);
  private isBattleOver = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly gmClient: GameMasterClient,
    private readonly eventsGateway: EventsGateway,
  ) {
    this.isBattleOver = false;
  }

  async onModuleInit() {
    await this.listenToBattleEvents();
  }

  async initializeNewBattle(config: BattleConfig): Promise<BattleResponse> {
    this.logger.log(
      `Initializing battle "${config.name}" with ${config.redTeamSize + config.blueTeamSize} total pods.`,
    );
    this.isBattleOver = false;

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
    if (this.isBattleOver) {
      return;
    }
    if (!rawEvent || typeof rawEvent !== 'object' || !('type' in rawEvent)) {
      return;
    }

    const event = rawEvent as BattleEvent;
    this.eventsGateway.broadcastBattleEvent(event);

    this.logEvent(event);
  }

  private logEvent(event: BattleEvent) {
    switch (event.type) {
      case BattleEventType.GAME_STARTED:
        this.handleGameStarted(event.payload, event.timestamp);
        break;

      case BattleEventType.GAME_OVER:
        this.isBattleOver = true;
        this.handleGameOver(event.payload, event.timestamp);
        break;

      case BattleEventType.WARRIOR_ATTACK:
        this.handleWarriorAttack(event.payload, event.timestamp);
        break;

      case BattleEventType.WARRIOR_DIED:
      case BattleEventType.WARRIOR_READY:
      case BattleEventType.POD_ADDED:
        this.handleWarriorStatus(event.type, event.payload, event.timestamp);
        break;

      default: {
        this.logger.warn(`Unhandled event type`);
      }
    }
  }

  private handleGameStarted(payload: GameStartedPayload, ts: number) {
    const time = new Date(ts).toISOString();
    this.logger.log(`[${time}] ⚔️ BATTLE START: ${payload.message}`);
  }

  private handleGameOver(payload: GameOverPayload, ts: number) {
    const time = new Date(ts).toISOString();
    const { winner, score } = payload;
    this.logger.log(
      `[${time}] 🏆 WINNER: ${winner} (Red: ${score.red} | Blue: ${score.blue})`,
    );
  }

  private handleWarriorStatus(
    type: BattleEventType,
    payload: WarriorPayload,
    ts: number,
  ) {
    const time = new Date(ts).toISOString();
    this.logger.log(
      `[${time}] ${type}: ${payload.podName} [${payload.team}] -> ${payload.status}`,
    );
  }

  private handleWarriorAttack(payload: WarriorAttackPayload, ts: number) {
    const time = new Date(ts).toISOString();
    const { attacker, target, damage, remainingHealth } = payload;
    this.logger.log(
      `[${time}] ATTACK: ${attacker} 👊 ${target} | -${damage} HP (Remaining: ${remainingHealth})`,
    );
  }
}
