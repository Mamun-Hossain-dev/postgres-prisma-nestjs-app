import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AppException } from '../../../common/exceptions/app.exception';
import { GOOGLE_TOKEN_VERIFIER } from '../constants/auth.tokens';
import type {
  GoogleIdentity,
  GoogleTokenVerifier,
} from '../interfaces/google-token-verifier.interface';

class GoogleIdTokenVerifier implements GoogleTokenVerifier {
  private readonly client = new OAuth2Client();

  constructor(private readonly clientId: string) {}

  async verify(idToken: string): Promise<GoogleIdentity> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new Error('The Google account email is not verified');
      }

      return {
        subject: payload.sub,
        email: payload.email,
        name: payload.name?.trim() || payload.email.split('@')[0],
      };
    } catch {
      throw new AppException('Google authentication failed', {
        code: 'INVALID_GOOGLE_TOKEN',
        status: 401,
      });
    }
  }
}

export const googleTokenVerifierProvider = {
  provide: GOOGLE_TOKEN_VERIFIER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): GoogleTokenVerifier =>
    new GoogleIdTokenVerifier(
      configService.getOrThrow<string>('auth.googleClientId'),
    ),
};
