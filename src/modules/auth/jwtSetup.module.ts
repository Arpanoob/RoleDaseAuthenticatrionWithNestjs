import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use process.env.JWT_SECRET directly
      signOptions: {
        expiresIn: '30m',
      },
    }),
  ],
  exports: [JwtModule], // Export JwtModule to be used in other modules
})
export class JwtSetupModule {}
