import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const root = document.getElementById("root");
if (!root) throw new Error("No root element found");

createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);