import { useAuth } from "@/hooks/use-auth";
import { Kid, MonthlyMenuItem, LunchSelection } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSunday, isAfter, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function LunchSelectionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [step, setStep] = useState<"dates" | "menu">("dates");
  const [selectedKidId, setSelectedKidId] = useState<number | null>(null);

  const { data: kids = [] } = useQuery<Kid[]>({
    queryKey: ["/api/kids"],
  });

  const currentMonth = new Date();
  const { data: menuItems = [] } = useQuery<MonthlyMenuItem[]>({
    queryKey: [
      `/api/menu/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`,
    ],
  });

  const createSelectionMutation = useMutation({
    mutationFn: async (data: { date: Date; menuItemId: number }) => {
      if (!selectedKidId) throw new Error("No kid selected");
      const res = await apiRequest("POST", `/api/kids/${selectedKidId}/lunch-selections`, {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [
          `/api/kids/${selectedKidId}/lunch-selections/${currentMonth.getFullYear()}/${
            currentMonth.getMonth() + 1
          }`,
        ],
      });
      toast({
        title: "Success",
        description: "Lunch selections saved successfully",
      });
    },
  });

  const vegOptions = menuItems.filter((item) => item.isVegetarian);
  const nonVegOptions = menuItems.filter((item) => !item.isVegetarian);

  const tomorrow = addDays(new Date(), 1);

  const handleDateSelect = (date: Date) => {
    setSelectedDates((current) => {
      const dateExists = current.some(
        (d) => d.toDateString() === date.toDateString()
      );
      if (dateExists) {
        return current.filter((d) => d.toDateString() !== date.toDateString());
      }
      return [...current, date];
    });
  };

  const handleSaveSelections = async (menuItemId: number) => {
    try {
      await Promise.all(
        selectedDates.map((date) =>
          createSelectionMutation.mutate({ date, menuItemId })
        )
      );
      setSelectedDates([]);
      setStep("dates");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save lunch selections",
        variant: "destructive",
      });
    }
  };

  const disabledDays = {
    before: tomorrow,
    after: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
    filter: (date: Date) => isSunday(date),
  };

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
        <div className="mb-8 flex gap-4">
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

        {selectedKidId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === "dates" ? "Select Dates" : "Choose Menu Items"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {step === "dates" ? (
                  <>
                    <DayPicker
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => setSelectedDates(dates || [])}
                      disabled={disabledDays}
                      modifiers={{
                        selected: selectedDates,
                      }}
                      modifiersStyles={{
                        selected: {
                          backgroundColor: "hsl(var(--primary))",
                          color: "white",
                        },
                      }}
                    />
                    <Button
                      className="w-full mt-4"
                      disabled={selectedDates.length === 0}
                      onClick={() => setStep("menu")}
                    >
                      Continue to Menu Selection
                    </Button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-4">Selected Dates:</h3>
                      <div className="space-y-2">
                        {selectedDates.map((date) => (
                          <div
                            key={date.toISOString()}
                            className="text-sm text-gray-600"
                          >
                            {format(date, "EEEE, MMMM d, yyyy")}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setStep("dates")}
                    >
                      Back to Date Selection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {step === "menu" && (
              <div className="space-y-6">
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
                          <p className="text-sm font-medium mt-1">
                            ₹{item.price}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleSaveSelections(item.id)}
                          className="flex gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Select
                        </Button>
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
                          <p className="text-sm font-medium mt-1">
                            ₹{item.price}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleSaveSelections(item.id)}
                          className="flex gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Select
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
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