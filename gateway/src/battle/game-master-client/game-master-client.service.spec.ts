import { Test, TestingModule } from '@nestjs/testing';
import { GameMasterClient } from './game-master-client.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

describe('GameMasterClient', () => {
  let service: GameMasterClient;

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameMasterClient,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<GameMasterClient>(GameMasterClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startGame', () => {
    it('should return data when the request is successful', async () => {
      const result: AxiosResponse = {
        data: { status: 'ok' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      mockHttpService.post.mockReturnValue(of(result));

      const response = await service.startGame();

      expect(response).toEqual({ status: 'ok' });
      expect(mockHttpService.post).toHaveBeenCalled();
    });
  });
});
