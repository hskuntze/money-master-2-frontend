export type UserResponse = {
  id: number;
  name: string;
  email: string;
  enabled: boolean;
  emailVerified: boolean;
  accountNonLocked: boolean;
  roles: string[];
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  avatarUrl?: string | null;
  avatarUpdatedAt?: string | null;
};

export type RoleResponse = {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
};

export type AuthResponse = {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: UserResponse;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthRegisterRequest = {
  name: string;
  email: string;
  password: string;
};
