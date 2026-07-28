export interface RabbitMqMessage {
  content: Buffer;
  properties?: {
    headers?: Record<string, unknown>;
  };
}

export interface RabbitMqChannel {
  assertQueue(
    queue: string,
    options: {
      durable: boolean;
      arguments?: Record<string, string | number>;
    },
  ): Promise<unknown>;
  sendToQueue(
    queue: string,
    content: Buffer,
    options: {
      persistent: boolean;
      headers: Record<string, unknown>;
    },
  ): Promise<boolean>;
  ack(message: RabbitMqMessage): void;
  nack(message: RabbitMqMessage, allUpTo: boolean, requeue: boolean): void;
}
