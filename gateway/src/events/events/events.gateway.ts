import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { BattleEvent } from 'src/battle/domain/battle-events.model';

@WebSocketGateway({
  cors: { origin: '*' }, // Allow frontend access
  namespace: 'battle',
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Dispatches events to all connected frontend clients
   */
  broadcastBattleEvent(event: BattleEvent) {
    this.server.emit('battle_update', event);
  }
}
