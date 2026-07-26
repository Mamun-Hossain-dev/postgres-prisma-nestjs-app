import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  type AmqpConnectionManager,
  type Channel,
  type ChannelWrapper,
} from 'amqp-connection-manager';
import type { ConsumeMessage } from 'amqplib';
import { RABBITMQ_USER_EXCHANGE } from './constants/rabbitmq.constants';

type MessageHandler<T> = (payload: T) => Promise<void> | void;

@Injectable()
export class RabbitMqService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection!: AmqpConnectionManager;
  private channel!: ChannelWrapper;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.connection = connect([
      this.configService.getOrThrow<string>('rabbitmq.url'),
    ]);
    this.connection.on('connect', () => this.logger.log('Connected'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.error(`Disconnected: ${err.message}`),
    );

    this.channel = this.connection.createChannel({
      name: 'application-events',
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertExchange(RABBITMQ_USER_EXCHANGE, 'topic', {
          durable: true,
        });
        await channel.prefetch(
          this.configService.getOrThrow<number>('rabbitmq.prefetchCount'),
        );
      },
    });

    await this.connection.connect();
    await this.channel.waitForConnect();
  }

  async publish<T>(routingKey: string, payload: T): Promise<void> {
    await this.channel.publish(RABBITMQ_USER_EXCHANGE, routingKey, payload, {
      persistent: true,
    });
  }

  async consume<T>(
    queue: string,
    routingKey: string,
    handler: MessageHandler<T>,
  ): Promise<void> {
    await this.channel.addSetup(async (channel: Channel) => {
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, RABBITMQ_USER_EXCHANGE, routingKey);
    });

    await this.channel.consume(
      queue,
      (message) => void this.handleMessage(message, queue, handler),
      { noAck: false },
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }

  private async handleMessage<T>(
    message: ConsumeMessage,
    queue: string,
    handler: MessageHandler<T>,
  ): Promise<void> {
    try {
      const payload = JSON.parse(message.content.toString()) as T;
      await handler(payload);
      this.channel.ack(message);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Message processing failed in ${queue}: ${messageText}`,
      );
      this.channel.nack(message, false, true);
    }
  }
}
