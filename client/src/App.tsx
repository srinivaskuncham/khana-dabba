import { Switch, Route } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </AuthProvider>
  );
}