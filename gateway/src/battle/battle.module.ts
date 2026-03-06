import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Import this!
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';
import { RedisModule } from '../redis/redis.module';
import { GameMasterClient } from './game-master-client/game-master-client.service';
@Module({
  imports: [HttpModule, RedisModule],
  providers: [GameMasterClient, BattleService],
  controllers: [BattleController],
})
export class BattleModule {}
