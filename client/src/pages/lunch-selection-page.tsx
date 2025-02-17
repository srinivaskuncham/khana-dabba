import { useAuth } from "@/hooks/use-auth";
import { Kid, MonthlyMenuItem, LunchSelection } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format, addMonths, subMonths, isBefore, addDays } from "date-fns";

export default function LunchSelectionPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedKidId, setSelectedKidId] = useState<number | null>(null);

  const { data: kids = [] } = useQuery<Kid[]>({
    queryKey: ["/api/kids"],
  });

  const { data: menuItems = [] } = useQuery<MonthlyMenuItem[]>({
    queryKey: [
      `/api/menu/${selectedMonth.getFullYear()}/${selectedMonth.getMonth() + 1}`,
    ],
  });

  const { data: selections = [] } = useQuery<(LunchSelection & { menuItem: MonthlyMenuItem })[]>({
    queryKey: [
      `/api/kids/${selectedKidId}/lunch-selections/${selectedMonth.getFullYear()}/${
        selectedMonth.getMonth() + 1
      }`,
    ],
    enabled: !!selectedKidId,
  });

  const tomorrow = addDays(new Date(), 1);

  const vegOptions = menuItems.filter((item) => item.isVegetarian);
  const nonVegOptions = menuItems.filter((item) => !item.isVegetarian);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary p-4">
        <div className="container mx-auto">
          <Link href="/">
            <Button variant="ghost" className="text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">
            Lunch Selection
          </h1>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex gap-4">
            {kids.map((kid) => (
              <Button
                key={kid.id}
                onClick={() => setSelectedKidId(kid.id)}
                variant={selectedKidId === kid.id ? "default" : "outline"}
              >
                {kid.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium">
              {format(selectedMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {selectedKidId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vegetarian Options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {vegOptions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                    <Button variant="outline">Select</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Non-Vegetarian Options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {nonVegOptions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                    <Button variant="outline">Select</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Current Selections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selections.map((selection) => {
                    const isLocked = isBefore(
                      new Date(selection.date),
                      tomorrow
                    );
                    return (
                      <div
                        key={selection.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          isLocked ? "opacity-50" : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium">
                            {format(new Date(selection.date), "EEEE, MMMM d")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {selection.menuItem.name}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          disabled={isLocked}
                          className="flex gap-2"
                        >
                          {isLocked ? "Locked" : "Change"}
                          {!isLocked && <ArrowRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Please select a kid to view and manage their lunch selections
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
