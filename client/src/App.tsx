import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import AuthPage from "./pages/auth-page";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthPage />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;