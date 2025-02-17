import React from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useForm } from "react-hook-form";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();

  const loginForm = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Show a success message if logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-primary">
              Login Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Welcome, {user.name}!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-primary">
            Khana Dabba Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={loginForm.handleSubmit((data) =>
              loginMutation.mutate(data)
            )}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...loginForm.register("username")}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...loginForm.register("password")}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}