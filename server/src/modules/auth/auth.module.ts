import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { JwtGuard } from './jwt.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-change-me'),
        signOptions: {
          // ✅ Cast through `any`: newer @nestjs/jwt types `expiresIn` as
          // `number | ms.StringValue` (a template-literal type), which a
          // plain `string` from ConfigService can't satisfy nominally.
          // The runtime accepts any valid `ms` string ("7d", "1h", "30m").
          expiresIn: (config.get<string>('JWT_EXPIRES_IN', '7d') as any),
          issuer: 'dcq',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [UserRepository, AuthService, JwtGuard],
  exports: [AuthService, JwtGuard, UserRepository],
})
export class AuthModule {}