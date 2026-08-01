import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../users/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthSessionService } from './auth-session.service';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { googleTokenVerifierProvider } from './providers/google-token-verifier.provider';

@Module({
  imports: [
    UserModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.getOrThrow('jwt.expiresIn'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthSessionService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    googleTokenVerifierProvider,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
