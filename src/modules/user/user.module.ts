import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserEntitySchema } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { RoleInterceptor } from 'src/interceptors/role.interceptor';
import { Approval, ApprovalSchema } from './entities/approval.enity';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserEntitySchema },
      {
        name: Approval.name,
        schema: ApprovalSchema,
      },
    ]),
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService, RoleInterceptor],
  exports: [UserService],
})
export class UserModule {}
