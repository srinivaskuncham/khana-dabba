import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";

export default function ProfilePage() {
  const { user, updateProfileMutation } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    resolver: zodResolver(
      insertUserSchema.omit({ username: true, password: true }).partial()
    ),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const onSubmit = (data: { name: string; email: string }) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => setIsEditing(false),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-8 flex gap-2">
            <ArrowLeft size={18} />
            Back to Menu
          </Button>
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Profile</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={18} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              {isEditing ? (
                <Input id="name" {...form.register("name")} />
              ) : (
                <p className="text-lg">{user?.name}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                />
              ) : (
                <p className="text-lg">{user?.email}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <p className="text-lg">{user?.username}</p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={updateProfileMutation.isPending}
              >
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}