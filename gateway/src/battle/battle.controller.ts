// src/battle/battle.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { CreateBattleDto } from './dto/create-battle.dto';
import { BattleConfig } from './domain/battle-config.model';

export interface BattleResponse {
  status: string;
  data?: unknown;
}

@ApiTags('Battle Operations')
@Controller('battle')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Post('setup')
  @ApiOperation({
    summary: 'Initialize battlefield infra',
    description:
      'Triggers the Game-Master to deploy the necessary Kubernetes Pods and Services. This prepares the "Red" and "Blue" teams in the cluster.',
  })
  @ApiBody({ type: CreateBattleDto })
  @ApiResponse({
    status: 201,
    description: 'Infrastructure successfully provisioned in the cluster.',
  })
  @ApiResponse({
    status: 503,
    description: 'Game-Master service is unreachable.',
  })
  async setup(@Body() dto: CreateBattleDto): Promise<BattleResponse> {
    const domainConfig = new BattleConfig(dto.battleName, dto.red, dto.blue);
    return this.battleService.initializeNewBattle(domainConfig);
  }

  @Post('start')
  @ApiOperation({
    summary: 'Start the simulation engine',
    description:
      'Signals all deployed pods to begin combat logic. This should only be called once all pods from the "setup" phase are in a "Running" state.',
  })
  @ApiResponse({
    status: 200,
    description: 'Start signal broadcasted to all battle participants.',
  })
  @ApiResponse({
    status: 400,
    description: 'Battlefield not initialized or pods not ready.',
  })
  async start(): Promise<BattleResponse> {
    return this.battleService.start();
  }
}
