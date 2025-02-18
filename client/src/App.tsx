import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { Redirect } from "wouter";

// Landing page that redirects to auth if not logged in
function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to Khana Dabba</h1>
      <p className="mt-4">Your lunch selection platform</p>
    </div>
  );
}

export default function App() {
  console.log("App rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/" component={HomePage} />
          <Route>
            <Redirect to="/auth" />
          </Route>
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}