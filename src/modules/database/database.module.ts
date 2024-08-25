import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        console.log('mongodb uri :', process.env.MONGODB_URI);
        return {
          uri: process.env.MONGODB_URI,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
