import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [EventsGateway],
  exports: [EventsGateway], // Exportar para usarlo en otros módulos
})
export class WebsocketModule {}
