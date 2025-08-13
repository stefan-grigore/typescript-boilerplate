import { UserDao } from '../dao/UserDao';
import type { CreateUser, User } from '../models/User';

export const UserService = {
  list(): User[] {
    return UserDao.list();
  },
  get(id: string): User | undefined {
    return UserDao.get(id);
  },
  create(input: CreateUser): User {
    return UserDao.create(input);
  },
};

export {};
