// order-service/src/modules/events/events.module.ts
import { Module } from '@nestjs/common';
import { OrderEventsService } from './order-events.service';

@Module({
  providers: [OrderEventsService],
  exports: [OrderEventsService],
})
export class EventsModule {}
