import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  prefetchCount: Number(process.env.RABBITMQ_PREFETCH_COUNT ?? 10),
  rpcTimeoutMs: Number(process.env.RABBITMQ_RPC_TIMEOUT_MS ?? 10_000),
}));
