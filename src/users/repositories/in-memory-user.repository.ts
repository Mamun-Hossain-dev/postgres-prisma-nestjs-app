// import { Injectable, NotFoundException } from '@nestjs/common';
// import { UserRepository } from './user.repository';
// import { User } from '../interfaces/user.interface';
// import { CreateUserDto } from '../dto/create-user.dto';
// import { UpdateUserDto } from '../dto/update-user.dto';

// @Injectable()
// export class InMemoryUserRepository extends UserRepository {
//   private users: User[] = [
//     {
//       id: 1,
//       name: 'Mamun',
//       email: 'mamun@gmail.com',
//       age: 30,
//       password: '123456',
//     },
//   ];

//   findAll(): Promise<User[]> {
//     return Promise.resolve(this.users);
//   }

//   findById(id: number): Promise<User | null> {
//     const user = this.users.find((user) => user.id === id);
//     return Promise.resolve(user ?? null);
//   }

//   create(user: CreateUserDto): Promise<User> {
//     const newUser = { ...user, id: Number(Date.now().toString()) };
//     this.users.push(newUser);
//     return Promise.resolve(newUser);
//   }

//   update(id: number, user: UpdateUserDto): Promise<User | null> {
//     const userIndex = this.users.findIndex((u) => u.id === id);
//     if (userIndex === -1) {
//       return Promise.resolve(null);
//     }
//     this.users[userIndex] = { ...this.users[userIndex], ...user };
//     return Promise.resolve(this.users[userIndex]);
//   }

//   delete(id: number): Promise<void> {
//     const userIndex = this.users.findIndex((u) => u.id === id);
//     if (userIndex === -1) {
//       throw new NotFoundException('User not found');
//     }

//     this.users.splice(userIndex, 1);
//     return Promise.resolve();
//   }
// }
