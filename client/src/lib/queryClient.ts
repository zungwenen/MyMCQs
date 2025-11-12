import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

let handle401Timeout: ReturnType<typeof setTimeout> | null = null;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        const url = res.url;
        const isAuthEndpoint = url.includes('/api/auth/me') || url.includes('/api/admin/me');
        
        if (isAuthEndpoint) {
          if (handle401Timeout) {
            clearTimeout(handle401Timeout);
          }
          handle401Timeout = setTimeout(async () => {
            const { useAuthStore } = await import('@/store/auth');
            const store = useAuthStore.getState();
            
            store.clearAuth();
            queryClient.clear();
            
            if (store.user || store.admin || store.isHydrated) {
              window.location.href = '/';
              toast({
                title: "Session Expired",
                description: "Please log in again",
                variant: "destructive",
              });
            }
            
            handle401Timeout = null;
          }, 100);
        }
      }
    }
    
    const text = (await res.text()) || res.statusText;
    let errorMessage = text;
    
    try {
      const json = JSON.parse(text);
      errorMessage = json.message || json.error || text;
    } catch {
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
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
      refetchOnWindowFocus: true,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        const message = error?.message || "An unexpected error occurred";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      },
    },
  },
  mutationCache: undefined,
  queryCache: undefined,
});
