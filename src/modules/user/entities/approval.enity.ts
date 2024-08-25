import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Approval extends Document {
  @Prop({ type: Boolean, required: false, default: false })
  approveByAdmin: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  approveByManager: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  approveByLead: boolean;

  @Prop({ type: String })
  salary: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Approval',
  })
  manager: MongooseSchema.Types.ObjectId;
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);
