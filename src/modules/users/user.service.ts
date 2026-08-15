import { Repository } from "typeorm";
import { User } from "./user.entity";

export class UserService {
  constructor(private readonly userRepository: Repository<User>) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);

    return this.userRepository.save(user);
  }

  async setActiveStatus(id: string, isActive: boolean): Promise<User | null> {
    await this.userRepository.update({ id }, { isActive });

    return this.findById(id);
  }
}
