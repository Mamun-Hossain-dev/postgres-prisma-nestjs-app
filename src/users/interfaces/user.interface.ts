export interface User {
  id: number;
  email: string;
  name: string;
  age: number;
  password: string;
}

export type PublicUser = Omit<User, 'password'>;
