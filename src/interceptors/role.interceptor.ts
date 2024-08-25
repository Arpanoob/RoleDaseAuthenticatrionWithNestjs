import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Roles } from 'src/enum/roles.enum';

@Injectable()
export class RoleInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const currUser = req.user as { _id: string; role: Roles; email: string };
    const reqBody = req.body;

    const currUserRole = currUser.role;
    const newUserRole = reqBody.role;
    //console.log(reqBody.role);

    //Admin can add the Manager , Lead , Employee

    if (
      currUserRole === Roles.ADMIN &&
      [Roles.EMPLOYEE, Roles.MANAGER, Roles.Lead].some(
        (exRole) => exRole === newUserRole,
      )
    ) {
      return next.handle();
    }

    //Manager can add the Lead , Employee
    console.log(currUserRole, newUserRole);
    if (
      currUserRole === Roles.MANAGER &&
      [Roles.EMPLOYEE, Roles.Lead].some((exRole) => exRole === newUserRole)
    ) {
      return next.handle();
    }

    //Lead can add the Employee

    if (
      currUserRole === Roles.Lead &&
      [Roles.EMPLOYEE].some((exRole) => exRole === newUserRole)
    ) {
      //console.log(reqBody.role, 'kl');

      return next.handle();
    }

    throw new ForbiddenException();
  }
}
