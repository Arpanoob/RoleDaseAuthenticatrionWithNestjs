import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Req,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';
import { Roles } from 'src/enum/roles.enum';
import { JWT_COOKIE_GAURD } from '../auth/gaurds/jwt.gaurds';
import { Role } from 'src/decorator/roles.decorator';
import { RolesGauard } from '../auth/gaurds/roles.gaurd';
import { RoleInterceptor } from 'src/interceptors/role.interceptor';
import { MailService } from '../mail/mail.service';
import { Template } from 'src/enum/template.enum';
import { JWT_GAURD } from '../auth/gaurds/jwt-cookie.gaurd';
import {
  generatePaginationMeta,
  PaginationMeta,
} from 'src/utils/meta-pagination';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  @Role(Roles.ADMIN, Roles.MANAGER, Roles.Lead)
  @UseInterceptors(RoleInterceptor)
  @UseGuards(RolesGauard)
  @UseGuards(JWT_COOKIE_GAURD)
  @Post()
  async create(
    @Req() req: Request,
    //@Res({ passthrough: true }) res: Response,
    @Body() createUserDto: CreateUserDto,
  ) {
    //console.log('Profile', req.user, createUserDto.role);
    if (createUserDto.role === Roles.ADMIN) throw new BadRequestException();

    const user = await this.userService.create(
      createUserDto,
      (req.user as any)._id,
    );
    const t = await this.authService.getJwtToken(
      user._id as any,
      user.email,
      user.role,
    );
    this.mailService
      .sendMail(Template.INVITE_USER, user.username, t)
      .then(() => console.log('Email sended Successfully'))
      .catch((e) => console.error(e));

    const token = await this.authService.getJwtToken(
      user._id as string,
      user.email,
      user.role,
    );
    //no need
    // res.cookie('token', `${token}`, {
    //   httpOnly: true,
    // });

    return { ...user.toObject(), token };
  }

  @UseGuards(JWT_GAURD)
  @Post('reset')
  async resetPassword(@Req() req: Request, @Body() body: { password: string }) {
    const reqUser = req.user as { _id: string; email: string; role: string };
    const isExist = await this.userService.findUserByEmail(reqUser.email);
    //console.log(isExist, reqUser);
    if (!isExist)
      throw new HttpException('User Not Found', HttpStatus.NOT_ACCEPTABLE);

    const updatedUser = await this.userService.update(
      reqUser._id,
      body.password,
    );
    this.mailService
      .sendMail(Template.WELCOME, isExist.username, null)
      .then(() => console.log('Email sended Successfully'))
      .catch((e) => console.error(e));
    console.log('Here The Updated User :', updatedUser);
    return {
      status: HttpStatus.OK,
      message: 'user successfully updated',
    };
  }

  @Role(Roles.ADMIN, Roles.MANAGER, Roles.Lead)
  @UseInterceptors(RoleInterceptor)
  @UseGuards(JWT_COOKIE_GAURD)
  @Post('update-salary')
  async updateSalary(
    @Req() req: Request,
    @Body('salary') salary: string,
    @Body('userId') userId: string,
  ) {
    console.log('kl');

    const isExist = await this.userService.findUserById(userId);
    if (!isExist) throw new BadRequestException();

    const user = req.user as { _id: string; role: string; email: string };
    if (user.role === Roles.ADMIN) {
      await this.userService.finalyUpdateSalary(
        userId,
        salary,
        isExist.Approvals as unknown as string,
      );
    }
    if (user.role === Roles.MANAGER) {
      await this.userService.UpdateApprovalForMangerAndWaitForAdmin(
        userId,
        salary,
        isExist.Approvals as unknown as string,
      );
    }
    console.log('Roles', user.role);

    if (user.role === Roles.Lead) {
      await this.userService.UpdateApprovalForLeadAndWaitForManager(
        userId,
        salary,
        isExist.Approvals as unknown as string,
      );
    }
    return {
      status: HttpStatus.OK,
      message: 'Salary Approved By You',
    };
  }
  @UseGuards(JWT_COOKIE_GAURD)
  @Get('approvals/:role')
  async getApprovalsList(
    @Param('role') role: Roles,
    @Req() req: Request,
    @Query() query: any,
  ): Promise<{
    status: HttpStatus;
    message: string;
    data: {
      users: any;
      meta: PaginationMeta;
    };
  }> {
    const { page, limit } = query;
    console.log(role);
    let users, count;

    if ((req.user as any).role === Roles.ADMIN) {
      // If the user's role is ADMIN, fetch approvals based on roles
      ({ users, count } = await this.userService.findApprovalsByRoles(
        role,
        page,
        limit,
      ));
    } else {
      // If the user's role is not ADMIN, fetch approvals based on roles and reporting manager
      ({ users, count } = await this.userService.findApprovalsByRolesAndRM(
        role,
        page,
        limit,
        (req.user as any)._id,
      ));
    }
    const meta = generatePaginationMeta(limit, page, count);

    return {
      status: HttpStatus.OK,
      message: 'User Want Approval',
      data: {
        users,
        meta,
      },
    };
  }
  //list of user seen by that perticular for
  @UseGuards(JWT_COOKIE_GAURD)
  @Get()
  async getUsers(@Req() req: Request, @Query() query: any) {
    const { page, limit } = query;
    console.log(req.cookies);
    let users: any[] = [];
    let count: number = 0;

    if ((req.user as any).role === Roles.ADMIN) {
      const result = await this.userService.findAllUsersWithRole(
        (req.user as any).role,
        page,
        limit,
        (req.user as any)._id,
      );
      users = result.users;
      count = result.count;
    } else {
      const result = await this.userService.asyncfindAllUsersForPerticularRm(
        (req.user as any)._id,
        page,
        limit,
      );
      users = result.users;
      count = result.count;
    }

    const meta = generatePaginationMeta(limit, page, count);

    return {
      status: HttpStatus.OK,
      message: `Users for ${(req.user as any)._id} are successfully fetched`,
      data: { users, meta },
    };
  }
}
