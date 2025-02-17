import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();

export async function apiRequest(method: string, path: string, body?: any) {
  const response = await fetch(path, {
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
