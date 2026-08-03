import {
  acknowledgeRabbitMqMessage,
  requeueRabbitMqMessage,
} from './rabbitmq-ack.util';
import type {
  RabbitMqChannel,
  RabbitMqMessage,
} from './interfaces/rabbitmq-channel.interface';

describe('RabbitMQ acknowledgement helpers', () => {
  function createChannel() {
    const ack = jest.fn();
    const nack = jest.fn();
    const channel = { ack, nack } as unknown as RabbitMqChannel;
    return { ack, channel, nack };
  }

  function createMessage(): RabbitMqMessage {
    return { content: Buffer.from('event'), properties: {} };
  }

  it('acknowledges the same delivery at most once', () => {
    const { ack, channel } = createChannel();
    const message = createMessage();

    expect(acknowledgeRabbitMqMessage(channel, message)).toBe(true);
    expect(acknowledgeRabbitMqMessage(channel, message)).toBe(false);
    expect(ack).toHaveBeenCalledTimes(1);
  });

  it('does not requeue an already acknowledged delivery', () => {
    const { channel, nack } = createChannel();
    const message = createMessage();

    acknowledgeRabbitMqMessage(channel, message);

    expect(requeueRabbitMqMessage(channel, message)).toBe(false);
    expect(nack).not.toHaveBeenCalled();
  });
});
