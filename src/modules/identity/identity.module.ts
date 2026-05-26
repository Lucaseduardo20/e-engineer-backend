import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { SignOptions } from 'jsonwebtoken';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { TOKEN_SERVICE } from './application/ports/token-service';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { JwtTokenService } from './infrastructure/jwt/jwt-token.service';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/typeorm-user.repository';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/user.orm-entity';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.getOrThrow<string>(
          'JWT_EXPIRES_IN',
        ) as SignOptions['expiresIn'];

        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    SharedInfrastructureModule,
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    CreateUserUseCase,
    JwtStrategy,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [CreateUserUseCase, JwtStrategy, TOKEN_SERVICE],
})
export class IdentityModule {}
