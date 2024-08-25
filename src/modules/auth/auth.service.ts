import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { OTP, OtpType } from './entities/otp.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

//Auth will do validate and sign JWT Token...

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(OTP.name) private otpModel: Model<OTP>,
    private readonly configService: ConfigService,
  ) {}
  async validateUser(loginDto: LoginDto, PlainPassword: string) {
    console.log(
      loginDto.password,
      PlainPassword,
      'loginDto.password',
      await bcrypt.compare(loginDto.password, PlainPassword),
    );
    if (loginDto && (await bcrypt.compare(PlainPassword, loginDto.password))) {
      return loginDto;
    }
    return null;
  }
  getJwtToken(_id: string, email: string, role: string) {
    if (email && _id) {
      const payload = {
        email,
        _id,
        role,
      };
      const token = this.jwtService.sign(payload);
      return token;
    }
    throw new BadRequestException(
      'Email Or Id not forund to generate access token',
    );
  }
  async verifyOtp(userId: any, token: string) {
    //throw new Error('Method not implemented.');
    console.log(userId, token);
    const otpMeta = await this.otpModel.findOne({
      userId,
      otp: token,
      otpType: OtpType.FORGOT_PASSWORD,
      deletedAt: null,
    });
    console.log(userId, token, otpMeta);

    if (!otpMeta)
      throw new HttpException('Not Aurthorized', HttpStatus.FORBIDDEN);

    const createdAt = moment(
      otpMeta.updatedAt ? otpMeta.updatedAt : otpMeta.createdAt,
    );
    const current = moment();

    const durationInMinutes = current.diff(createdAt, 'minutes');
    // console.log(
    //   durationInMinutes,
    //   durationInMinutes < this.configService.get('OTP_RELAXATION_TIME'),
    //   otpMeta.updatedAt,
    //   otpMeta.createdAt,
    // );
    if (durationInMinutes < this.configService.get('OTP_RELAXATION_TIME')) {
      otpMeta.isVerified = true;
      otpMeta.deletedAt = moment().toDate();
      otpMeta.save();
      return true;
    }
    otpMeta.isVerified = false;
    otpMeta.save();
    //console.log(token + 'hi' + otpMeta.otp);
    return false;
  }

  async resendOtp(userId) {
    const otpMeta = await this.otpModel.findOne({
      userId,
      otpType: OtpType.FORGOT_PASSWORD,
      deletedAt: null,
    });
    if (otpMeta) {
      const createdAt = moment(
        otpMeta.updatedAt ? otpMeta.updatedAt : otpMeta.createdAt,
      );
      const current = moment();

      const durationInMinutes = current.diff(createdAt, 'minutes');
      if (durationInMinutes < this.configService.get('OTP_RELAXATION_TIME')) {
        return otpMeta.otp;
      }
    }
    otpMeta.otp = this.generateSixDigitNumber().toString();
    otpMeta.updatedAt = moment().toDate();
    // const otp = new this.otpModel({
    //   userId,
    //   otp: this.generateSixDigitNumber(),
    //   updatedAt: moment().toDate(),
    //   deletedAt: null,
    //   otpType: OtpType.FORGOT_PASSWORD,
    //   passwordResetToken: uuidv4(),
    // });
    await otpMeta.save();
    return otpMeta.otp;
  }
  async createOtp(userId: any): Promise<string> {
    // console.log(this.configService.get('OTP_RELAXATION_TIME'));
    await this.otpModel
      .updateMany(
        { userId: userId, otpType: OtpType.FORGOT_PASSWORD, deletedAt: null },
        { deletedAt: moment().toDate() },
      )
      .exec();

    const otp = new this.otpModel({
      userId,
      otp: this.generateSixDigitNumber(),
      createdAt: moment().toDate(),
      deletedAt: null,
      otpType: OtpType.FORGOT_PASSWORD,
      passwordResetToken: uuidv4(),
    });

    await otp.save();
    // console.log(otp);
    return otp.otp;
  }

  generateSixDigitNumber = () => {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
}
