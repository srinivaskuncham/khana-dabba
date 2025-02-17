import { useAuth } from "@/hooks/use-auth";
import { Kid, insertKidSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function KidsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingKid, setEditingKid] = useState<Kid | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: kids = [], isLoading } = useQuery<Kid[]>({
    queryKey: ["/api/kids"],
  });

  const form = useForm({
    resolver: zodResolver(insertKidSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      grade: "",
      school: "",
      rollNumber: "",
      gender: "",
      profilePicture: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Kid, "id" | "userId">) => {
      const res = await apiRequest("POST", "/api/kids", {
        ...data,
        userId: user?.id,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create kid profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kids"] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Kid profile created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create kid profile",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Kid> }) => {
      const res = await apiRequest("PUT", `/api/kids/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update kid profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kids"] });
      setEditingKid(null);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Kid profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update kid profile",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/kids/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete kid profile");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kids"] });
      toast({
        title: "Success",
        description: "Kid profile deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete kid profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingKid) {
        await updateMutation.mutateAsync({ id: editingKid.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleOpenDialog = (kid?: Kid) => {
    if (kid) {
      setEditingKid(kid);
      form.reset({
        name: kid.name,
        grade: kid.grade,
        school: kid.school,
        rollNumber: kid.rollNumber,
        gender: kid.gender || "",
        profilePicture: kid.profilePicture || "",
      });
    } else {
      setEditingKid(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKid(null);
    form.reset();
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

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kids Profiles</h1>
          <Button className="flex gap-2" onClick={() => handleOpenDialog()}>
            <Plus size={18} />
            Add Kid
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingKid ? "Edit Kid Profile" : "Add New Kid"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" {...form.register("grade")} />
                {form.formState.errors.grade && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.grade.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="school">School</Label>
                <Input id="school" {...form.register("school")} />
                {form.formState.errors.school && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.school.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input id="rollNumber" {...form.register("rollNumber")} />
                {form.formState.errors.rollNumber && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.rollNumber.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  {...form.register("gender")}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {form.formState.errors.gender && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.gender.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingKid ? "Update" : "Add"} Kid
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kids.map((kid) => (
            <Card key={kid.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={kid.profilePicture || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${kid.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                      alt={kid.name}
                    />
                    <AvatarFallback>
                      {kid.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span>{kid.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(kid)}
                    >
                      <Pencil size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(kid.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Grade:</span> {kid.grade}
                  </p>
                  <p>
                    <span className="font-medium">School:</span> {kid.school}
                  </p>
                  <p>
                    <span className="font-medium">Roll Number:</span>{" "}
                    {kid.rollNumber}
                  </p>
                  <p>
                    <span className="font-medium">Gender:</span> {kid.gender}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}