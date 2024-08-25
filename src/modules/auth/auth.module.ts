import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtSetupModule } from './jwtSetup.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.stategy';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { OTP, OtpSchema } from './entities/otp.schema';
import { MailModule } from '../mail/mail.module';
import { JwtCookieStrategy } from './strategies/jwt-cookie-stategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OTP.name, schema: OtpSchema }]),
    MailModule,
    JwtSetupModule,
    PassportModule.register({ session: true }),
    forwardRef(() => UserModule),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtCookieStrategy, ConfigService],
  exports: [AuthService],
})
export class AuthModule {}
