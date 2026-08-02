"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./auth-provider";
import { CartProvider } from "./cart-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#ffffff",
                  color: "#111111",
                  border: "1px solid rgba(17, 17, 17, 0.12)",
                  boxShadow: "0 14px 35px rgba(17, 17, 17, 0.12)",
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
