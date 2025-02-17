import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, User, UsersRound } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const categories = [...new Set(menuItems?.map(item => item.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">LunchDabba.in</h1>
          <div className="flex gap-4">
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
          <p className="text-gray-600">What would you like to eat today?</p>
        </div>

        <Tabs defaultValue={categories[0]}>
          <TabsList>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems
                  ?.filter(item => item.category === category)
                  .map(item => (
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
                        <Button className="mt-4 w-full">Add to Cart</Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}