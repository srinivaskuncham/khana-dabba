import { createContext, ReactNode, useContext } from 'react';
import {
  useQuery,
  useMutation,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, InsertUser } from '../../shared/schema';

const API_URL = 'http://localhost:5000'; // We'll need to update this with the actual server URL

export const queryClient = new QueryClient();

type LoginData = Pick<InsertUser, 'username' | 'password'>;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

async function apiRequest(method: string, path: string, body?: any) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('GET', '/api/user'),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginData) =>
      apiRequest('POST', '/api/login', credentials),
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/user'], user);
      AsyncStorage.setItem('user', JSON.stringify(user));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: InsertUser) =>
      apiRequest('POST', '/api/register', credentials),
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/user'], user);
      AsyncStorage.setItem('user', JSON.stringify(user));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      AsyncStorage.removeItem('user');
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
