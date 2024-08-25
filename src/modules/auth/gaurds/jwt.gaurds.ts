import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

export class JWT_COOKIE_GAURD extends AuthGuard('jwt-cookie') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('Inside JWTcookie Gaurd');
    return super.canActivate(context);
  }
}
