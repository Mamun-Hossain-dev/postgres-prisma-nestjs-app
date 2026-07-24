import appConfig from './app.config';

describe('appConfig', () => {
  it('returns a default CORS configuration', () => {
    const config = appConfig();

    expect(config.cors).toEqual({
      origin: true,
      credentials: true,
    });
  });
});
