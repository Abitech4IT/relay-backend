import { UserRole } from "../../common/constants/roles";

export interface RegisterInput {
  email: string;
  fullName: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  type: "refresh";
};

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}
