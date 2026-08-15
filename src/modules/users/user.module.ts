import { AppDataSource } from "../../config/database";
import { User } from "../users/user.entity";
import { UserService } from "../users/user.service";

const userRepository = AppDataSource.getRepository(User);

export const userService = new UserService(userRepository);
