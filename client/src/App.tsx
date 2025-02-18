import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { Redirect } from "wouter";

// Landing page with proper styling
function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Khana Dabba</h1>
        <p className="text-xl text-muted-foreground mb-8">Your one-stop platform for school meal management</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-card rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Easy Menu Selection</h2>
            <p className="text-muted-foreground">Choose from a variety of healthy and delicious meal options for your children.</p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Manage Multiple Kids</h2>
            <p className="text-muted-foreground">Effortlessly handle meal preferences for all your children in one place.</p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Schedule Ahead</h2>
            <p className="text-muted-foreground">Plan meals in advance and never worry about last-minute decisions.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  console.log("App rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <ProtectedRoute path="/" component={HomePage} />
            <Route>
              <Redirect to="/auth" />
            </Route>
          </Switch>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}