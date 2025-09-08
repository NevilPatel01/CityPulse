// Simple User type export
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
