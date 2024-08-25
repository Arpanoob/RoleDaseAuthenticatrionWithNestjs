import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as moment from 'moment';

export enum OtpType {
  FORGOT_PASSWORD = 'Forgot password',
}

@Schema()
export class OTP extends Document {
  @Prop()
  otp: string;
  @Prop()
  otpType: OtpType;
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: MongooseSchema.Types.ObjectId;
  @Prop({ required: true, default: false })
  isVerified: boolean;

  @Prop()
  expiredAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ type: Date, default: null })
  createdAt?: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy?: MongooseSchema.Types.ObjectId;

  @Prop()
  deletedAt?: Date;
}

export const OtpSchema = SchemaFactory.createForClass(OTP);

OtpSchema.pre<OTP>('save', function (next) {
  if (!this.expiredAt) {
    this.expiredAt = moment().add(15, 'm').toDate();
  }
  next();
});
