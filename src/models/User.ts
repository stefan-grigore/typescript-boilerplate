import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().describe('User id'),
  email: z.string().email().describe('Email'),
  name: z.string().min(2).describe('Full name'),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.pick({ email: true, name: true });
export type CreateUser = z.infer<typeof CreateUserSchema>;
