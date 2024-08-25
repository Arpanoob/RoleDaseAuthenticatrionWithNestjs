import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RoleInterceptor } from 'src/interceptors/role.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RoleInterceptor,
    },
  ],
})
export class RoleInterceptorModule {}
