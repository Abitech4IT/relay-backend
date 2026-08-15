import { Request, Response } from "express";

import { LoginInput, RefreshTokenInput, RegisterInput } from "./auth.types";
import { AuthService } from "./auth.service";
import { userService } from "../users/user.module";
import { UnauthorizedError } from "../../common/errors";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response) {
    const input = req.body as RegisterInput;

    const result = await this.authService.register(input);

    return res.status(201).json({
      success: true,
      data: result,
    });
  }

  async login(req: Request, res: Response) {
    const input = req.body as LoginInput;

    const result = await this.authService.login(input);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async refresh(req: Request, res: Response) {
    const input = req.body as RefreshTokenInput;

    const result = await this.authService.refresh(input.refreshToken);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async me(req: Request, res: Response) {
    const user = await userService.findById(req.user!.id);

    if (!user) {
      throw new UnauthorizedError(
        "User account no longer exists",
        "USER_NOT_FOUND",
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
    });
  }

  async logout(req: Request, res: Response) {
    const input = req.body as RefreshTokenInput;

    await this.authService.logout(input.refreshToken);

    return res.status(204).send();
  }
}
