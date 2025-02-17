import { useAuth } from "@/hooks/use-auth";
import { Kid, MonthlyMenuItem, LunchSelection } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, CalendarCheck } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSunday, isAfter, addDays, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

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

  const { data: existingSelections = [] } = useQuery<(LunchSelection & { menuItem: MonthlyMenuItem })[]>({
    queryKey: [
      `/api/kids/${selectedKidId}/lunch-selections/${currentMonth.getFullYear()}/${
        currentMonth.getMonth() + 1
      }`,
    ],
    enabled: !!selectedKidId,
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

  const handleDateSelect = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
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

  const getSelectionForDate = (date: Date) => {
    return existingSelections.find((selection) =>
      isSameDay(new Date(selection.date), date)
    );
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
                    <style>
                      {`
                        .rdp {
                          margin: 0;
                        }
                        .rdp-month {
                          background-color: white;
                          padding: 1rem;
                          border-radius: 0.5rem;
                        }
                        .rdp-cell {
                          padding: 0.5rem;
                        }
                        .rdp-day {
                          width: 2.5rem;
                          height: 2.5rem;
                          border-radius: 9999px;
                        }
                        .rdp-day_selected {
                          background-color: hsl(var(--primary));
                        }
                        .rdp-day_selected:hover {
                          background-color: hsl(var(--primary));
                        }
                        .lunch-selected {
                          background-color: hsl(142.1 76.2% 36.3%);
                          color: white;
                        }
                        .lunch-selected:hover {
                          background-color: hsl(142.1 76.2% 36.3%);
                        }
                      `}
                    </style>
                    <DayPicker
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={handleDateSelect}
                      disabled={disabledDays}
                      modifiers={{
                        selected: selectedDates,
                        lunchSelected: existingSelections.map(s => new Date(s.date)),
                      }}
                      modifiersClassNames={{
                        selected: "rdp-day_selected",
                        lunchSelected: "lunch-selected",
                      }}
                      className="border rounded-lg p-4"
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
                        {selectedDates.map((date) => {
                          const existingSelection = getSelectionForDate(date);
                          return (
                            <div
                              key={date.toISOString()}
                              className={cn(
                                "p-3 rounded-lg",
                                existingSelection ? "bg-green-50 border border-green-200" : "border"
                              )}
                            >
                              <div className="font-medium">
                                {format(date, "EEEE, MMMM d, yyyy")}
                              </div>
                              {existingSelection && (
                                <div className="text-sm text-green-600 mt-1">
                                  Current choice: {existingSelection.menuItem.name}
                                </div>
                              )}
                            </div>
                          );
                        })}
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