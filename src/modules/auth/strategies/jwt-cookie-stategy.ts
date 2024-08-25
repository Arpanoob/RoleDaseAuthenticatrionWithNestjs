import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtCookieStrategy extends PassportStrategy(
  Strategy,
  'jwt-cookie',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          console.log(req.cookies);
          if (req && req.cookies) {
            console.log(req.cookies.token);

            token = req.cookies['token'];
          }

          return token;
        },
      ]),
      ignoreExpiration: false, // Set to false to handle token expiration
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any): Promise<any> {
    console.log(payload);
    if (!payload) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return payload; // Return the payload as-is or process further as needed
  }
}
