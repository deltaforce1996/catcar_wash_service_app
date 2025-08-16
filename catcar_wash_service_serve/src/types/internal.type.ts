export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  permission: {
    id: string;
    name: string;
  };
  status: 'ACTIVE' | 'INACTIVE';
};

export type JwtPayload = AuthenticatedUser & {
  iat?: number;
  exp?: number;
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
