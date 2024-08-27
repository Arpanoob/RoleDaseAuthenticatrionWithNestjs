import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Res,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { Request, Response } from 'express';
import { MailService } from '../mail/mail.service';
import { Template } from 'src/enum/template.enum';
import { JWT_COOKIE_GAURD } from './gaurds/jwt.gaurds';
// import { JWT_COOKIE_GAURD } from './gaurds/jwt.gaurds';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  @Post('login')
  async create(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ) {
    //  console.log('ioio', loginDto);

    const { email, password } = loginDto;

    if (!(email && password))
      throw new HttpException('Incomplete credentials', HttpStatus.BAD_REQUEST);

    const user = await this.userService.findUserByEmail(email);
    // console.log(user, 'ioio');

    if (!user) {
      // console.log(user, 'ioio');
      throw new HttpException(
        'No user found with this email',
        HttpStatus.BAD_REQUEST,
      );
    }

    //   console.log(user, password, 'UP');
    const currUser = await this.authService.validateUser(user, password);
    //console.log(user, password, 'UP');

    if (!currUser) throw new UnauthorizedException();
    if (!user.isActive)
      throw new HttpException('User is inActive', HttpStatus.FORBIDDEN);

    const token = await this.authService.getJwtToken(
      user._id as string,
      email,
      user.role,
    );

    // res.cookie('token', `${token}`, {
    //   // httpOnly: true,
    //   // secure: true,
    //   sameSite: 'none',
    // });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
    });

    return {
      status: HttpStatus.OK,
      message: 'Login Successfull',
      user: { name: user.username, email: user.email, role: user.role },
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) throw new HttpException('Invalid Email', HttpStatus.NOT_FOUND);

    const otp = await this.authService.createOtp(user._id);

    this.mailService
      .sendMail(Template.OTP_TEMPLATE, user.username, otp)
      .then(() => console.log('mail sended successfully'))
      .catch((e) => console.error(e));

    return {
      status: HttpStatus.OK,
      message: 'Successfully OTP generated',
      otp,
    };
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body('token') token: string,
    @Body('email') email: string,
    @Body('newPassword') password: string,
  ) {
    const user = await this.userService.findUserByEmail(email);
    console.log('1234567890', user);

    if (!user)
      throw new HttpException('Email is invalid', HttpStatus.NOT_FOUND);

    const valid = await this.authService.verifyOtp(user._id, token);
    console.log('1234567890', valid);

    if (!valid)
      return {
        status: HttpStatus.BAD_GATEWAY,
        message: 'not valid',
      };
    console.log(password);
    user.password = password;
    await user.save();
    return {
      status: HttpStatus.OK,
      message: 'validate and updated',
    };
  }

  @Post('forgot-password/resend')
  async resendOtp(@Body('email') email: any) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) throw new HttpException('INVAALID EMAIL', HttpStatus.OK);

    const otp = await this.authService.resendOtp(user._id);
    this.mailService
      .sendMail(Template.OTP_TEMPLATE, user.username, otp)
      .then(() => console.log('mail sended successfully'))
      .catch((e) => console.error(e));
    return {
      status: HttpStatus.OK,
      message: 'Otp sended to your mail ID',
      data: { otp },
    };
  }
  @UseGuards(JWT_COOKIE_GAURD)
  @Get('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // res.cookie('token', '', {
    //   maxAge: 1,
    //   httpOnly: true,
    //   sameSite: 'none',
    //   secure: false,
    // });
    res.cookie('token', '', {
      maxAge: 1,
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
    return {
      status: HttpStatus.OK,
      message: 'User is Logout',
    };
  }
}
