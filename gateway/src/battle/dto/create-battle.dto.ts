import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TeamSettingsDto {
  @ApiProperty({ example: 300 })
  @IsNumber()
  @Min(1)
  @Max(500)
  replicas: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  health: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  attack: number;
}

export class CreateBattleDto {
  @ApiProperty({ example: 'Battle of Thermopylae' })
  @IsString()
  battleName: string;

  @ApiProperty({ type: TeamSettingsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => TeamSettingsDto)
  red: TeamSettingsDto;

  @ApiProperty({ type: TeamSettingsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => TeamSettingsDto)
  blue: TeamSettingsDto;
}
