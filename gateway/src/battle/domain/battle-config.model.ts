export interface TeamConfig {
  replicas: number;
  health: number;
  attack: number;
}

export class BattleConfig {
  constructor(
    public readonly name: string,
    public readonly red: TeamConfig,
    public readonly blue: TeamConfig,
    public readonly createdAt: Date = new Date(),
  ) {}
}
