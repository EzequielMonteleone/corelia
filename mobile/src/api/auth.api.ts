import {apiClient} from '@/api/client';
import type {LoginFormValues} from '@/schemas/auth';
import type {UserData} from '@/types/user';

export interface AuthResponse {
  token: string;
  user: UserData;
}

export async function loginRequest(values: LoginFormValues): Promise<AuthResponse> {
  const {data} = await apiClient.post<AuthResponse>('/auth/login', values);
  return data;
}
