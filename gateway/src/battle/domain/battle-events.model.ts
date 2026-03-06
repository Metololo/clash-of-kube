export enum BattleEventType {
  GAME_STARTED = 'GAME_STARTED',
  GAME_OVER = 'GAME_OVER',
  WARRIOR_READY = 'WARRIOR_READY',
  WARRIOR_DIED = 'WARRIOR_DIED',
  POD_ADDED = 'POD_ADDED',
}

export interface BaseBattleEvent {
  type: string;
  timestamp: number;
}

export interface WarriorPayload {
  podName: string;
  team: string;
  status: string;
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
      type: BattleEventType.POD_ADDED;
      payload: WarriorPayload;
      timestamp: number;
    };
