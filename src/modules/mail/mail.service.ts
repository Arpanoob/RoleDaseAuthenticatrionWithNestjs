import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as path from 'node:path';
import { Template } from 'src/enum/template.enum';
@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}

  async sendMail(template: string, name: string, token: string) {
    const message = `Forgot your password? If you didn't forget your password, please ignore this email!`;
    const templatePath = path.join(
      __dirname,
      '../../../',
      'src',
      'templates',
      'views',
      `${template}.ejs`,
    );
    console.log(templatePath, name);
    let ejsRenderTemplate: string;
    if (template === Template.INVITE_USER) {
      ejsRenderTemplate = await new Promise((resolve, reject) => {
        ejs.renderFile(
          templatePath,
          {
            user_firstname: name,
            confirm_link: `http://localhost:3000/invite-user?token=${token}`,
          },
          (error, data) => (error ? reject(error) : resolve(data)),
        );
      });
    }

    if (template === Template.OTP_TEMPLATE) {
      ejsRenderTemplate = await new Promise((resolve, reject) => {
        ejs.renderFile(
          templatePath,
          {
            user_firstname: name,
            otp_code: token,
          },
          (error, data) => (error ? reject(error) : resolve(data)),
        );
      });
    }
    if (template === Template.WELCOME) {
      ejsRenderTemplate = await new Promise((resolve, reject) => {
        ejs.renderFile(
          templatePath,
          {
            user_firstname: name,
          },
          (error, data) => (error ? reject(error) : resolve(data)),
        );
      });
    }

    await this.mailService.sendMail({
      from: 'arpan.gupta@xcelore.com',
      to: 'arpanguptaastro@gmail.com',
      subject: this.getMessage(template as Template, name),
      text: message,
      html: ejsRenderTemplate,
    });
  }

  getMessage(template: Template, name: string): string {
    return template === Template.INVITE_USER
      ? `Welcome to Xcelore ${name}`
      : template === Template.OTP_TEMPLATE
        ? 'This is your OTP'
        : '';
  }
}
