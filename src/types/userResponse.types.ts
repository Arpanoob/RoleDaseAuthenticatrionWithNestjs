import { User } from 'src/modules/user/entities/user.entity';

export type UserResponseType = Omit<User, 'password'> & { token: string };
