import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

@Injectable()
export class GameMasterClient {
  private readonly logger = new Logger(GameMasterClient.name);
  private readonly GAME_MASTER_URL =
    process.env.GAME_MASTER_URL || 'http://game-master-service';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.GAME_MASTER_URL = this.configService.get<string>(
      'GM_URL',
      'http://game-master-service',
    );
  }
  async createBattlefield(config: Record<string, any>): Promise<any> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.GAME_MASTER_URL}/setup`, config),
      );
      return response.data;
    } catch (err) {
      this.handleError(err, 'createBattlefield');
      throw err;
    }
  }

  async startGame(): Promise<Record<string, any>> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.GAME_MASTER_URL}/start`, {}),
      );
      return response.data as Record<string, any>;
    } catch (err) {
      this.handleError(err, 'startGame');
      throw err;
    }
  }

  private handleError(err: unknown, context: string): void {
    if (err instanceof AxiosError) {
      this.logger.error(
        `[${context}] Game-Master error: ${err.response?.status} - ${err.message}`,
      );
    } else {
      this.logger.error(`[${context}] Unexpected error: ${String(err)}`);
    }
  }
}
