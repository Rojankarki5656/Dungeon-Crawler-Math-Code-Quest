import { Global, Logger, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { BrokerService } from './broker.service';
import { BROKER_TRANSPORT } from './broker.types';
import type { BrokerTransport } from './broker.types';
import { MemoryTransport } from './transports/memory.transport';
import { RedisStreamsTransport } from './transports/redis-streams.transport';
import { RabbitMqTransport } from './transports/rabbitmq.transport';

const transportProvider: Provider = {
  provide: BROKER_TRANSPORT,
  inject: [ConfigService, RedisService],
  useFactory: (config: ConfigService, redis: RedisService): BrokerTransport => {
    const kind = config.get<string>('broker.transport', 'redis-streams');
    const logger = new Logger('BrokerTransportFactory');
    switch (kind) {
      case 'memory':
        logger.warn('Using in-memory broker (dev/test only)');
        return new MemoryTransport();
      case 'rabbitmq':
        return new RabbitMqTransport(config.get<string>('broker.rabbitUrl')!);
      case 'redis-streams':
      default:
        return new RedisStreamsTransport(redis);
    }
  },
};

@Global()
@Module({
  providers: [transportProvider, BrokerService],
  exports: [BrokerService, BROKER_TRANSPORT],
})
export class BrokerModule {}