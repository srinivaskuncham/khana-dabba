import { useQuery } from "@tanstack/react-query";
import { MonthlyMenuItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, LogOut, User, UsersRound, CalendarCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { data: menuItems, isLoading } = useQuery<MonthlyMenuItem[]>({
    queryKey: [`/api/menu/${new Date().getFullYear()}/${new Date().getMonth() + 1}`],
  });

  const vegItems = menuItems?.filter(item => item.isVegetarian) || [];
  const nonVegItems = menuItems?.filter(item => !item.isVegetarian) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Khana Dabba</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href="/lunch-selection">
                <DropdownMenuItem className="cursor-pointer">
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Lunch Selection
                </DropdownMenuItem>
              </Link>
              <Link href="/kids">
                <DropdownMenuItem className="cursor-pointer">
                  <UsersRound className="mr-2 h-4 w-4" />
                  Kids
                </DropdownMenuItem>
              </Link>
              <Link href="/profile">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-600">Here are this month's lunch options</p>
        </div>

        <Tabs defaultValue="veg">
          <TabsList>
            <TabsTrigger value="veg">Vegetarian</TabsTrigger>
            <TabsTrigger value="non-veg">Non-Vegetarian</TabsTrigger>
          </TabsList>

          <TabsContent value="veg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vegItems.map((item) => (
                <Card key={item.id}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>{item.name}</span>
                      <span>₹{item.price}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="non-veg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nonVegItems.map((item) => (
                <Card key={item.id}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>{item.name}</span>
                      <span>₹{item.price}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}