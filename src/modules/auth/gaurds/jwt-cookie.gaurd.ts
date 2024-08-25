import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

export class JWT_GAURD extends AuthGuard('jwt-authorization') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('Inside JWT Gaurd');
    return super.canActivate(context);
  }
}
