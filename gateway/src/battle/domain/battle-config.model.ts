export class BattleConfig {
  constructor(
    public readonly name: string,
    public readonly redTeamSize: number,
    public readonly blueTeamSize: number,
    public readonly createdAt: Date = new Date(),
  ) {}
}
