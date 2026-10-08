import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../../infra/redis/redis.service';
import { BrokerService } from '../../infra/broker/broker.service';

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    private readonly redis: RedisService,
    private readonly broker: BrokerService,
  ) {}

  @Get()
  async check() {
    const [redisOk, brokerOk] = await Promise.all([
      this.redis.health().catch(() => false),
      this.broker.health().catch(() => false),
    ]);
    const healthy = redisOk && brokerOk;
    return {
      status: healthy ? 'ok' : 'degraded',
      uptimeMs: Date.now() - this.startedAt,
      dependencies: { redis: redisOk ? 'up' : 'down', broker: brokerOk ? 'up' : 'down' },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  live() { return { status: 'ok' }; }
}