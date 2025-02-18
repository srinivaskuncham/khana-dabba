import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get the base URL dynamically
const getBaseUrl = () => {
  // In development, use the current origin
  if (process.env.NODE_ENV === 'development') {
    return window.location.origin;
  }
  // In production, could be configured via env var
  return process.env.VITE_API_URL || window.location.origin;
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  console.log(`API Request: ${method} ${fullUrl}`);

  const res = await fetch(fullUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      // Add Cache-Control header
      "Cache-Control": "no-cache"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getBaseUrl();
    const fullUrl = (queryKey[0] as string).startsWith('http') 
      ? queryKey[0] as string 
      : `${baseUrl}${queryKey[0]}`;

    console.log(`Query Request: ${fullUrl}`);
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache"
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('Unauthorized request, returning null');
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});