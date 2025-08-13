import type { User } from '../models/User';

const usersDb: Record<string, User> = {
  'a12f5bd2-...': { id: 'a12f5bd2-...', email: 'mona.lisa@example.com', name: 'Mona Lisa' },
};

export const UserDao = {
  list(): User[] {
    return Object.values(usersDb);
  },
  get(id: string): User | undefined {
    return usersDb[id];
  },
  create(u: Omit<User, 'id'>): User {
    const id = `id-${Math.random().toString(36).slice(2, 10)}`;
    const user: User = { id, ...u };
    usersDb[id] = user;
    return user;
  },
};
