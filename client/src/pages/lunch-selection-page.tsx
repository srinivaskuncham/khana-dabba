import { useAuth } from "@/hooks/use-auth";
import { Kid, MonthlyMenuItem, LunchSelection } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSunday, isAfter, addDays, isSameDay, subMonths, addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function LunchSelectionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [step, setStep] = useState<"dates" | "menu">("dates");
  const [selectedKidId, setSelectedKidId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: kids = [] } = useQuery<Kid[]>({
    queryKey: ["/api/kids"],
  });

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

  const updateSelectionMutation = useMutation({
    mutationFn: async ({ id, menuItemId }: { id: number; menuItemId: number }) => {
      if (!selectedKidId) throw new Error("No kid selected");
      const res = await apiRequest(
        "PUT",
        `/api/kids/${selectedKidId}/lunch-selections/${id}`,
        { menuItemId }
      );
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
        description: "Lunch selection updated successfully",
      });
    },
  });

  const handleSaveSelections = async (menuItemId: number) => {
    try {
      await Promise.all(
        selectedDates.map(async (date) => {
          const existingSelection = getSelectionForDate(date);
          if (existingSelection) {
            // Update existing selection
            await updateSelectionMutation.mutate({
              id: existingSelection.id,
              menuItemId,
            });
          } else {
            // Create new selection
            await createSelectionMutation.mutate({ date, menuItemId });
          }
        })
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

  const vegOptions = menuItems.filter((item) => item.isVegetarian);
  const nonVegOptions = menuItems.filter((item) => !item.isVegetarian);

  const tomorrow = addDays(new Date(), 1);

  const handleDateSelect = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  };

  const getSelectionForDate = (date: Date) => {
    return existingSelections.find((selection) =>
      isSameDay(new Date(selection.date), date)
    );
  };

  // Add CSS classes for veg and non-veg selections
  const getSelectionClass = (date: Date) => {
    const selection = getSelectionForDate(date);
    if (!selection) return "";
    const menuItem = menuItems.find(item => item.id === selection.menuItemId);
    return menuItem?.isVegetarian ? "veg-selected" : "non-veg-selected";
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
                <CardTitle className="flex justify-between items-center">
                  <span>{step === "dates" ? "Select Dates" : "Choose Menu Items"}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-2 text-sm">
                      {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {step === "dates" ? (
                  <>
                    <style>
                      {`
                        .rdp {
                          margin: 0;
                          width: 100%;
                        }
                        .rdp-month {
                          background-color: white;
                          padding: 1.5rem;
                          border-radius: 0.5rem;
                          width: 100%;
                        }
                        .rdp-cell {
                          padding: 0.5rem;
                          text-align: center;
                        }
                        .rdp-day {
                          width: 2.5rem;
                          height: 2.5rem;
                          border-radius: 9999px;
                          font-size: 0.875rem;
                          margin: 0 auto;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        }
                        .rdp-day_selected {
                          background-color: hsl(var(--primary));
                          color: white;
                          outline: 2px solid hsl(var(--primary));
                          outline-offset: 2px;
                        }
                        .rdp-day_selected:hover {
                          background-color: hsl(var(--primary));
                        }
                        .veg-selected {
                          background-color: hsl(142.1 70.2% 29.3%);
                          color: white;
                        }
                        .veg-selected.rdp-day_selected {
                          outline: 2px solid hsl(142.1 70.2% 29.3%);
                          outline-offset: 2px;
                        }
                        .veg-selected:hover {
                          background-color: hsl(142.1 70.2% 29.3%);
                        }
                        .non-veg-selected {
                          background-color: hsl(0 72.2% 50.6%);
                          color: white;
                        }
                        .non-veg-selected.rdp-day_selected {
                          outline: 2px solid hsl(0 72.2% 50.6%);
                          outline-offset: 2px;
                        }
                        .non-veg-selected:hover {
                          background-color: hsl(0 72.2% 50.6%);
                        }
                        .rdp-head_cell {
                          font-weight: 500;
                          font-size: 0.875rem;
                          color: hsl(var(--muted-foreground));
                        }
                        .rdp-nav {
                          display: none;
                        }
                      `}
                    </style>
                    <DayPicker
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={handleDateSelect}
                      disabled={disabledDays}
                      month={currentMonth}
                      modifiers={{
                        selected: selectedDates,
                        vegSelected: existingSelections
                          .filter(s => menuItems.find(m => m.id === s.menuItemId)?.isVegetarian)
                          .map(s => new Date(s.date)),
                        nonVegSelected: existingSelections
                          .filter(s => !menuItems.find(m => m.id === s.menuItemId)?.isVegetarian)
                          .map(s => new Date(s.date)),
                      }}
                      modifiersClassNames={{
                        selected: "rdp-day_selected",
                        vegSelected: "veg-selected",
                        nonVegSelected: "non-veg-selected",
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
                                !existingSelection && "bg-gray-50 border border-gray-200",
                                existingSelection && existingSelection.menuItem.isVegetarian && "bg-green-100 border border-green-300",
                                existingSelection && !existingSelection.menuItem.isVegetarian && "bg-red-50 border border-red-200"
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