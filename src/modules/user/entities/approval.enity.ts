import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);
