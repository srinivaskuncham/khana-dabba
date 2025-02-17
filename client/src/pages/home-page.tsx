import { useQuery } from "@tanstack/react-query";
import { MonthlyMenuItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, User, UsersRound, CalendarCheck } from "lucide-react";

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
          <h1 className="text-2xl font-bold text-white">LunchDabba.in</h1>
          <div className="flex gap-4">
            <Link href="/lunch-selection">
              <Button variant="secondary" className="flex gap-2">
                <CalendarCheck size={18} />
                Lunch Selection
              </Button>
            </Link>
            <Link href="/kids">
              <Button variant="secondary" className="flex gap-2">
                <UsersRound size={18} />
                Kids
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="secondary" className="flex gap-2">
                <User size={18} />
                Profile
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => logoutMutation.mutate()}
              className="flex gap-2"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </div>
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