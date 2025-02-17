import React from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useForm } from "react-hook-form";

export default function AuthPage() {
  const loginForm = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleLogin = async (data: { username: string; password: string }) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const user = await response.json();
      console.log('Login successful:', user);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
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
            >
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}