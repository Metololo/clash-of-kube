import { IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BattleConfig } from '../domain/battle-config.model';

export class CreateBattleDto {
  @ApiProperty({
    example: 'Battle of Thermopylae',
    description: 'The unique name for this simulation',
  })
  @IsString()
  battleName: string;

  @ApiProperty({ example: 300, description: 'Number of pods for the Red Team' })
  @IsNumber()
  @Min(1)
  @Max(500)
  redReplicas: number;

  @ApiProperty({
    example: 300,
    description: 'Number of pods for the Blue Team',
  })
  @IsNumber()
  @Min(1)
  @Max(500)
  blueReplicas: number;

  static toDomain(dto: CreateBattleDto): BattleConfig {
    return new BattleConfig(dto.battleName, dto.redReplicas, dto.blueReplicas);
  }
}
