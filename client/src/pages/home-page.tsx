import { useQuery } from "@tanstack/react-query";
import { MonthlyMenuItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, User, UsersRound, CalendarCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { AnimatedHamburger } from "@/components/ui/animated-hamburger";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { data: menuItems, isLoading } = useQuery<MonthlyMenuItem[]>({
    queryKey: [`/api/menu/${new Date().getFullYear()}/${new Date().getMonth() + 1}`],
  });

  const vegItems = menuItems?.filter(item => item.isVegetarian) || [];
  const nonVegItems = menuItems?.filter(item => !item.isVegetarian) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Khana Dabba</h1>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <AnimatedHamburger isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
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

      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-600">Here are this month's lunch options</p>
        </div>

        <Tabs defaultValue="veg" className="space-y-6">
          <TabsList className="w-full justify-start border-b">
            <TabsTrigger value="veg" className="flex-1 sm:flex-none">Vegetarian</TabsTrigger>
            <TabsTrigger value="non-veg" className="flex-1 sm:flex-none">Non-Vegetarian</TabsTrigger>
          </TabsList>

          <TabsContent value="veg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vegItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between text-base sm:text-lg">
                      <span className="truncate mr-4">{item.name}</span>
                      <span className="flex-shrink-0">₹{item.price}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="non-veg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nonVegItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between text-base sm:text-lg">
                      <span className="truncate mr-4">{item.name}</span>
                      <span className="flex-shrink-0">₹{item.price}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
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