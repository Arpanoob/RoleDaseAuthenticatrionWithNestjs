import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Roles } from 'src/enum/roles.enum';
import { Approval } from './approval.enity';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      console.log('Transforming :', ret);
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: { virtuals: true },
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  username: string;

  @Prop({ select: false })
  password: string;

  @Prop({ type: String, enum: Roles, required: true })
  role: Roles;

  @Prop({ type: Boolean, default: false, required: true })
  isActive: boolean;

  @Prop({ type: String })
  salary: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  rm: MongooseSchema.Types.ObjectId | User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Approval',
  })
  Approvals: MongooseSchema.Types.ObjectId | Approval;
}

export const UserEntitySchema = SchemaFactory.createForClass(User);

UserEntitySchema.pre<User>('save', async function (next) {
  if (this.password)
    this.password = await hash(this.password, +process.env.SALT);
  next();
});
