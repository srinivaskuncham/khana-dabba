import { useAuth } from "@/hooks/use-auth";
import { Kid, MonthlyMenuItem, LunchSelection, Holiday } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSunday, addDays, isSameDay, addMonths, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: [
      `/api/holidays/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`,
    ],
  });

  const createSelectionMutation = useMutation({
    mutationFn: async (data: { date: Date; menuItemId: number }) => {
      if (!selectedKidId) throw new Error("No kid selected");
      return await apiRequest("POST", `/api/kids/${selectedKidId}/lunch-selections`, {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      });
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save lunch selections",
        variant: "destructive",
      });
    },
  });

  const updateSelectionMutation = useMutation({
    mutationFn: async ({ id, menuItemId }: { id: number; menuItemId: number }) => {
      if (!selectedKidId) throw new Error("No kid selected");
      return await apiRequest(
        "PUT",
        `/api/kids/${selectedKidId}/lunch-selections/${id}`,
        { menuItemId }
      );
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lunch selection",
        variant: "destructive",
      });
    },
  });

  const clearSelectionMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      if (!selectedKidId) throw new Error("No kid selected");
      await apiRequest(
        "DELETE",
        `/api/kids/${selectedKidId}/lunch-selections/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/kids/${selectedKidId}/lunch-selections`],
      });
      toast({
        title: "Success",
        description: "Lunch selections cleared successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear lunch selections",
        variant: "destructive",
      });
    },
  });

  const handleSaveSelections = async (menuItemId: number) => {
    try {
      for (const date of selectedDates) {
        const existingSelection = getSelectionForDate(date);
        if (existingSelection) {
          await updateSelectionMutation.mutateAsync({
            id: existingSelection.id,
            menuItemId,
          });
        } else {
          await createSelectionMutation.mutateAsync({ 
            date, 
            menuItemId 
          });
        }
      }
      setSelectedDates([]);
      setStep("dates");
    } catch (error: any) {
      console.error('Error saving selections:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save lunch selections",
        variant: "destructive",
      });
    }
  };

  const vegOptions = menuItems.filter((item) => item.isVegetarian);
  const nonVegOptions = menuItems.filter((item) => !item.isVegetarian);

  const handleDateSelect = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  };

  const getSelectionForDate = (date: Date) => {
    return existingSelections.find((selection) =>
      isSameDay(new Date(selection.date), date)
    );
  };

  const handleClearSelections = async () => {
    try {
      await Promise.all(
        selectedDates.map(async (date) => {
          const existingSelection = getSelectionForDate(date);
          if (existingSelection) {
            await clearSelectionMutation.mutateAsync({ id: existingSelection.id });
          }
        })
      );
      setSelectedDates([]);
      setStep("dates");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear lunch selections",
        variant: "destructive",
      });
    }
  };

  // Reset selected dates when kid changes
  useEffect(() => {
    setSelectedDates([]);
    setStep("dates");
  }, [selectedKidId]);

  // Disabled days logic
  const disabledDays = [
    { before: addDays(new Date(), 1) },
    { after: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0) },
    ...holidays.map(h => new Date(h.date)),
    ...Array.from({ length: 31 }, (_, i) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
      if (date.getMonth() === currentMonth.getMonth() && isSunday(date)) {
        return date;
      }
      return null;
    }).filter((date): date is Date => date !== null)
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary p-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <Link href="/">
            <Button variant="ghost" className="text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Lunch Selection</h1>
        </div>
      </header>

      <main className="container mx-auto py-4 px-4">
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {kids.map((kid) => (
            <Button
              key={kid.id}
              onClick={() => setSelectedKidId(kid.id)}
              variant={selectedKidId === kid.id ? "default" : "ghost"}
              className="h-auto p-2 flex flex-col items-center gap-2"
            >
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                <AvatarImage 
                  src={kid.profilePicture || 
                    `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${kid.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`
                  } 
                  alt={kid.name} 
                />
                <AvatarFallback>
                  {kid.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm font-medium text-center line-clamp-1">
                {kid.name}
              </span>
            </Button>
          ))}
        </div>

        {selectedKidId ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {step === "dates" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Select Dates</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium min-w-[100px] text-center">
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
                  <style>
                    {`
                      .rdp {
                        margin: 0;
                        --rdp-cell-size: min(40px, 6vw);
                        width: 100%;
                      }
                      .rdp-month {
                        background-color: white;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        width: 100%;
                      }
                      .rdp-cell {
                        padding: 0;
                        text-align: center;
                      }
                      .rdp-table {
                        width: 100%;
                        max-width: 100%;
                      }
                      .rdp-day {
                        width: var(--rdp-cell-size);
                        height: var(--rdp-cell-size);
                        border-radius: 9999px;
                        font-size: clamp(0.75rem, 1.5vw, 0.875rem);
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
                      .rdp-day_disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                      }
                      .rdp-day_disabled.holiday,
                      .holiday {
                        background-color: hsl(var(--muted)) !important;
                        color: hsl(var(--muted-foreground)) !important;
                        opacity: 0.9;
                        font-weight: 500;
                        background-image: repeating-linear-gradient(
                          45deg,
                          transparent,
                          transparent 5px,
                          rgba(0,0,0,0.1) 5px,
                          rgba(0,0,0,0.1) 10px
                        );
                      }
                      .holiday:hover:not([disabled]) {
                        background-color: hsl(var(--muted)) !important;
                        color: hsl(var(--muted-foreground)) !important;
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
                      holiday: holidays.map(h => new Date(h.date))
                    }}
                    modifiersClassNames={{
                      selected: "rdp-day_selected",
                      vegSelected: "veg-selected",
                      nonVegSelected: "non-veg-selected",
                      holiday: "holiday"
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
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Menu Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 mb-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep("dates")}
                      >
                        Back to Dates
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleClearSelections}
                        disabled={selectedDates.every(date => !getSelectionForDate(date))}
                      >
                        Reset Selections
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {selectedDates.map((date) => {
                        const existingSelection = getSelectionForDate(date);
                        return (
                          <div
                            key={date.toISOString()}
                            className={cn(
                              "p-3 rounded-lg",
                              !existingSelection && "bg-gray-50 border border-gray-200",
                              existingSelection?.menuItem?.isVegetarian && "bg-green-100 border border-green-300",
                              existingSelection && !existingSelection.menuItem?.isVegetarian && "bg-red-50 border border-red-200"
                            )}
                          >
                            <div className="font-medium">
                              {format(date, "EEEE, MMMM d, yyyy")}
                            </div>
                            {existingSelection && (
                              <div className="text-sm text-green-600 mt-1">
                                Current choice: {existingSelection.menuItem?.name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vegetarian Options</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {vegOptions.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {item.description}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ₹{item.price}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleSaveSelections(item.id)}
                          className="ml-4 flex-shrink-0 flex gap-2 whitespace-nowrap"
                        >
                          <Check className="h-4 w-4" />
                          <span className="hidden sm:inline">Select</span>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Non-Vegetarian Options</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {nonVegOptions.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {item.description}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ₹{item.price}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleSaveSelections(item.id)}
                          className="ml-4 flex-shrink-0 flex gap-2 whitespace-nowrap"
                        >
                          <Check className="h-4 w-4" />
                          <span className="hidden sm:inline">Select</span>
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