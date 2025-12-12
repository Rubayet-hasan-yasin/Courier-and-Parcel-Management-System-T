import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export interface CreateUserDto {
    name: string;
    email: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
}

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const user = this.userRepository.create(createUserDto);
        return await this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async findOne(id: number): Promise<User | null> {
        return await this.userRepository.findOneBy({ id });
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
        await this.userRepository.update(id, updateUserDto);
        return await this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.userRepository.delete(id);
    }
}
