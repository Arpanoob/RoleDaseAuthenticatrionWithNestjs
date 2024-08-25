import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from 'src/decorator/roles.decorator';
import { Roles } from 'src/enum/roles.enum';

@Injectable()
export class RolesGauard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const Req = context.switchToHttp().getRequest();

    console.log('hi inside RolesGaurd');
    const metaRoles = this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const user = Req.user;
    console.log(metaRoles, user.role);
    return metaRoles.some((role) => role === user.role);
  }
}
