export enum BattleEventType {
  GAME_STARTED = 'GAME_STARTED',
  GAME_OVER = 'GAME_OVER',
  POD_ADDED = 'POD_ADDED',
  WARRIOR_READY = 'WARRIOR_READY',
  WARRIOR_DIED = 'WARRIOR_DIED',
  WARRIOR_ATTACK = 'WARRIOR_ATTACK',
}

export interface WarriorPayload {
  podName: string;
  team: string;
  status: string;
}

export interface WarriorAttackPayload {
  attacker: string;
  attackerTeam: string;
  target: string;
  targetTeam: string;
  damage: number;
  remainingHealth: number;
}

export interface GameOverPayload {
  winner: string;
  score: {
    red: number;
    blue: number;
  };
}

export interface GameStartedPayload {
  message: string;
}

export type BattleEvent =
  | {
      type: BattleEventType.GAME_STARTED;
      payload: GameStartedPayload;
      timestamp: number;
    }
  | {
      type: BattleEventType.GAME_OVER;
      payload: GameOverPayload;
      timestamp: number;
    }
  | {
      type: BattleEventType.POD_ADDED;
      payload: WarriorPayload;
      timestamp: number;
    }
  | {
      type: BattleEventType.WARRIOR_READY;
      payload: WarriorPayload;
      timestamp: number;
    }
  | {
      type: BattleEventType.WARRIOR_DIED;
      payload: WarriorPayload;
      timestamp: number;
    }
  | {
      type: BattleEventType.WARRIOR_ATTACK;
      payload: WarriorAttackPayload;
      timestamp: number;
    };

export type Team = 'red' | 'blue';

export interface Warrior {
  podName: string;
  team: Team;
  status: 'pending' | 'ready' | 'alive' | 'dead' | 'respawning';
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  attackTarget?: string;
  lastDamageReceived?: number;
}

export type GamePhase = 'idle' | 'setup' | 'ready' | 'battle' | 'gameover';

export interface GameState {
  phase: GamePhase;
  warriors: Map<string, Warrior>;
  battleLogs: BattleLogEntry[];
  winner?: string;
  score?: { red: number; blue: number };
}

export interface BattleLogEntry {
  id: string;
  type: BattleEventType;
  message: string;
  timestamp: number;
  team?: Team;
}
