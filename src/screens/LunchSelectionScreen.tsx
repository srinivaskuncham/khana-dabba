import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  Appbar,
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MonthlyMenuItem, LunchSelection, Holiday } from '../../shared/schema';
import { format, isSameDay, addDays } from 'date-fns';
import { API_URL } from '../lib/config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { queryClient } from '../lib/queryClient';

type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Profile: undefined;
  Kids: undefined;
  LunchSelection: { kidId?: number };
};

type Props = NativeStackScreenProps<RootStackParamList, 'LunchSelection'>;

export default function LunchSelectionScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const theme = useTheme();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [step, setStep] = useState('dates');
  const [selectedKidId] = useState(route.params?.kidId);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Query for menu items
  const { data: menuItems = [] } = useQuery<MonthlyMenuItem[]>({
    queryKey: [
      `/api/menu/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`,
    ],
  });

  // Query for existing selections
  const { data: existingSelections = [] } = useQuery<(LunchSelection & { menuItem: MonthlyMenuItem })[]>({
    queryKey: [
      `/api/kids/${selectedKidId}/lunch-selections/${currentMonth.getFullYear()}/${
        currentMonth.getMonth() + 1
      }`,
    ],
    enabled: !!selectedKidId,
  });

  // Query for holidays
  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: [
      `/api/holidays/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`,
    ],
  });

  const createSelectionMutation = useMutation<LunchSelection, Error, { date: Date; menuItemId: number }>({
    mutationFn: async ({ date, menuItemId }) => {
      if (!selectedKidId) throw new Error('No kid selected');
      const res = await fetch(`${API_URL}/api/kids/${selectedKidId}/lunch-selections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(date, 'yyyy-MM-dd'),
          menuItemId,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to create selection');
      }

      return res.json();
    },
    onError: (error) => {
      console.error('Create selection error:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/kids/${selectedKidId}/lunch-selections/${currentMonth.getFullYear()}/${
            currentMonth.getMonth() + 1
          }`,
        ],
      });
    },
  });

  const updateSelectionMutation = useMutation<LunchSelection, Error, { id: number; menuItemId: number }>({
    mutationFn: async ({ id, menuItemId }) => {
      if (!selectedKidId) throw new Error('No kid selected');
      const res = await fetch(
        `${API_URL}/api/kids/${selectedKidId}/lunch-selections/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ menuItemId }),
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update selection');
      }

      return res.json();
    },
    onError: (error) => {
      console.error('Update selection error:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/kids/${selectedKidId}/lunch-selections/${currentMonth.getFullYear()}/${
            currentMonth.getMonth() + 1
          }`,
        ],
      });
    },
  });

  const clearSelectionMutation = useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      if (!selectedKidId) throw new Error('No kid selected');
      const res = await fetch(
        `${API_URL}/api/kids/${selectedKidId}/lunch-selections/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to delete selection');
      }
    },
    onError: (error) => {
      console.error('Clear selection error:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/kids/${selectedKidId}/lunch-selections/${currentMonth.getFullYear()}/${
            currentMonth.getMonth() + 1
          }`,
        ],
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
            menuItemId,
          });
        }
      }

      setSelectedDates([]);
      setStep('dates');
    } catch (error) {
      console.error('Error saving selections:', error);
    }
  };

  const handleClearSelections = async () => {
    try {
      for (const date of selectedDates) {
        const existingSelection = getSelectionForDate(date);
        if (existingSelection) {
          await clearSelectionMutation.mutateAsync({
            id: existingSelection.id,
          });
        }
      }
      setSelectedDates([]);
      setStep('dates');
    } catch (error) {
      console.error('Error clearing selections:', error);
    }
  };

  const vegOptions = menuItems.filter((item) => item.isVegetarian);
  const nonVegOptions = menuItems.filter((item) => !item.isVegetarian);

  const getSelectionForDate = (date: Date) => {
    return existingSelections.find((selection) =>
      isSameDay(new Date(selection.date), date),
    );
  };

  const markedDates = {
    ...selectedDates.reduce((acc, date) => {
      acc[format(date, 'yyyy-MM-dd')] = {
        selected: true,
        selectedColor: theme.colors.primary,
      };
      return acc;
    }, {}),
    ...existingSelections.reduce((acc, selection) => {
      const date = format(new Date(selection.date), 'yyyy-MM-dd');
      acc[date] = {
        selected: true,
        selectedColor: selection.menuItem?.isVegetarian
          ? '#15803d'  // green-700
          : '#dc2626', // red-600
      };
      return acc;
    }, {}),
    ...holidays.reduce((acc, holiday) => {
      const date = format(new Date(holiday.date), 'yyyy-MM-dd');
      acc[date] = {
        disabled: true,
        disableTouchEvent: true,
        selectedColor: theme.colors.surfaceDisabled,
      };
      return acc;
    }, {}),
  };

  const handleDayPress = (day) => {
    const date = new Date(day.dateString);
    if (selectedDates.some(d => isSameDay(d, date))) {
      setSelectedDates(selectedDates.filter(d => !isSameDay(d, date)));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  // Reset selected dates when kid changes
  useEffect(() => {
    setSelectedDates([]);
    setStep('dates');
  }, [selectedKidId]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Lunch Selection" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {selectedKidId ? (
          <View style={styles.selectionContainer}>
            {step === 'dates' ? (
              <Card style={styles.card}>
                <Card.Title title="Select Dates" />
                <Card.Content>
                  <Calendar
                    current={currentMonth.toISOString()}
                    minDate={addDays(new Date(), 1).toISOString()}
                    maxDate={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString()}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    disableAllTouchEventsForDisabledDays
                    hideExtraDays
                    theme={{
                      selectedDayBackgroundColor: theme.colors.primary,
                      todayTextColor: theme.colors.primary,
                      arrowColor: theme.colors.primary,
                      monthTextColor: 'transparent',
                      textMonthFontSize: 0,
                    }}
                  />
                  <Button
                    mode="contained"
                    onPress={() => setStep('menu')}
                    disabled={selectedDates.length === 0}
                    style={styles.continueButton}
                  >
                    Continue to Menu Selection
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <View style={styles.menuContainer}>
                <Card style={styles.card}>
                  <Card.Title title="Choose Menu Items" />
                  <Card.Content>
                    <View style={styles.buttonContainer}>
                      <Button
                        mode="outlined"
                        onPress={() => setStep('dates')}
                        style={styles.actionButton}
                      >
                        Back to Dates
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleClearSelections}
                        disabled={selectedDates.every(
                          (date) => !getSelectionForDate(date),
                        )}
                        style={[styles.actionButton, styles.resetButton]}
                      >
                        Reset Selections
                      </Button>
                    </View>
                  </Card.Content>
                </Card>

                <Card style={styles.card}>
                  <Card.Title title="Selected Dates" />
                  <Card.Content>
                    {selectedDates.map((date) => {
                      const existingSelection = getSelectionForDate(date);
                      return (
                        <View
                          key={date.toISOString()}
                          style={[
                            styles.dateCard,
                            existingSelection?.menuItem?.isVegetarian
                              ? styles.vegSelected
                              : existingSelection
                              ? styles.nonVegSelected
                              : styles.noSelection,
                          ]}
                        >
                          <Text style={styles.dateText}>
                            {format(date, 'EEEE, MMMM d, yyyy')}
                          </Text>
                          {existingSelection && (
                            <Text style={styles.selectionText}>
                              Current choice: {existingSelection.menuItem?.name}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </Card.Content>
                </Card>

                <Card style={styles.card}>
                  <Card.Title title="Vegetarian Options" />
                  <Card.Content>
                    {vegOptions.map((item) => (
                      <View key={item.id} style={styles.menuItem}>
                        <View style={styles.menuItemContent}>
                          <Text style={styles.menuItemName}>{item.name}</Text>
                          <Text style={styles.menuItemDescription} numberOfLines={2}>
                            {item.description}
                          </Text>
                          <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                        </View>
                        <Button
                          mode="outlined"
                          onPress={() => handleSaveSelections(item.id)}
                          icon="check"
                        >
                          Select
                        </Button>
                      </View>
                    ))}
                  </Card.Content>
                </Card>

                <Card style={styles.card}>
                  <Card.Title title="Non-Vegetarian Options" />
                  <Card.Content>
                    {nonVegOptions.map((item) => (
                      <View key={item.id} style={styles.menuItem}>
                        <View style={styles.menuItemContent}>
                          <Text style={styles.menuItemName}>{item.name}</Text>
                          <Text style={styles.menuItemDescription} numberOfLines={2}>
                            {item.description}
                          </Text>
                          <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                        </View>
                        <Button
                          mode="outlined"
                          onPress={() => handleSaveSelections(item.id)}
                          icon="check"
                        >
                          Select
                        </Button>
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              </View>
            )}
          </View>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.placeholderText}>
                Please go back and select a kid to manage their lunch selections
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectionContainer: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  continueButton: {
    marginTop: 16,
  },
  menuContainer: {
    gap: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  resetButton: {
    backgroundColor: '#ef4444',
  },
  dateCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noSelection: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  vegSelected: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  nonVegSelected: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  dateText: {
    fontWeight: '500',
  },
  selectionText: {
    marginTop: 4,
    color: '#059669',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemContent: {
    flex: 1,
    marginRight: 12,
  },
  menuItemName: {
    fontWeight: '500',
  },
  menuItemDescription: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  menuItemPrice: {
    fontWeight: '500',
    marginTop: 4,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#6b7280',
  },
});