import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Divider,
  useTheme,
  SegmentedButtons,
  Appbar,
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Kid, MonthlyMenuItem, LunchSelection, Holiday } from '../../shared/schema';
import { format, isSunday, isAfter, addDays, isSameDay } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LunchSelectionScreen({ navigation }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [selectedDates, setSelectedDates] = useState([]);
  const [step, setStep] = useState('dates');
  const [selectedKidId, setSelectedKidId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: kids = [] } = useQuery({
    queryKey: ['/api/kids'],
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: [
      `/api/menu/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`,
    ],
  });

  const { data: existingSelections = [] } = useQuery({
    queryKey: [
      `/api/kids/${selectedKidId}/lunch-selections/${currentMonth.getFullYear()}/${
        currentMonth.getMonth() + 1
      }`,
    ],
    enabled: !!selectedKidId,
  });

  const { data: holidays = [] } = useQuery({
    queryKey: [
      `/api/holidays/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`,
    ],
    enabled: true,
  });

  const createSelectionMutation = useMutation({
    mutationFn: async (data) => {
      if (!selectedKidId) throw new Error('No kid selected');
      const res = await fetch(`${API_URL}/api/kids/${selectedKidId}/lunch-selections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: format(data.date, 'yyyy-MM-dd'),
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create selection');
      return res.json();
    },
  });

  const updateSelectionMutation = useMutation({
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
      if (!res.ok) throw new Error('Failed to update selection');
      return res.json();
    },
  });

  const clearSelectionMutation = useMutation({
    mutationFn: async ({ id }) => {
      if (!selectedKidId) throw new Error('No kid selected');
      const res = await fetch(
        `${API_URL}/api/kids/${selectedKidId}/lunch-selections/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to delete selection');
    },
  });

  const handleSaveSelections = async (menuItemId) => {
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

  const vegOptions = menuItems.filter((item) => item.isVegetarian);
  const nonVegOptions = menuItems.filter((item) => !item.isVegetarian);
  const tomorrow = addDays(new Date(), 1);

  const getSelectionForDate = (date) => {
    return existingSelections.find((selection) =>
      isSameDay(new Date(selection.date), date),
    );
  };

  // Format dates for the calendar
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
        selectedColor: selection.menuItem.isVegetarian
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
        <View style={styles.kidsGrid}>
          {kids.map((kid) => (
            <Button
              key={kid.id}
              mode={selectedKidId === kid.id ? 'contained' : 'outlined'}
              onPress={() => setSelectedKidId(kid.id)}
              style={styles.kidButton}
              contentStyle={styles.kidButtonContent}
            >
              <Avatar.Image
                size={48}
                source={{
                  uri: kid.profilePicture ||
                    `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${kid.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
                }}
              />
              <Text style={styles.kidName} numberOfLines={1}>
                {kid.name}
              </Text>
            </Button>
          ))}
        </View>

        {selectedKidId ? (
          <View style={styles.selectionContainer}>
            {step === 'dates' ? (
              <Card style={styles.card}>
                <Card.Title title="Select Dates" />
                <Card.Content>
                  <Calendar
                    current={currentMonth.toISOString()}
                    minDate={tomorrow.toISOString()}
                    maxDate={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString()}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    disableAllTouchEventsForDisabledDays
                    theme={{
                      selectedDayBackgroundColor: theme.colors.primary,
                      todayTextColor: theme.colors.primary,
                      arrowColor: theme.colors.primary,
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
                  <Card.Title title="Selected Dates" />
                  <Card.Content>
                    {selectedDates.map((date) => {
                      const existingSelection = getSelectionForDate(date);
                      return (
                        <View
                          key={date.toISOString()}
                          style={[
                            styles.dateCard,
                            existingSelection?.menuItem.isVegetarian
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
                              Current choice: {existingSelection.menuItem.name}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                    <View style={styles.buttonContainer}>
                      <Button
                        mode="outlined"
                        onPress={() => setStep('dates')}
                        style={styles.actionButton}
                      >
                        Back
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleClearSelections}
                        disabled={selectedDates.every(
                          (date) => !getSelectionForDate(date),
                        )}
                        style={[styles.actionButton, styles.resetButton]}
                      >
                        Reset
                      </Button>
                    </View>
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
                Please select a kid to view and manage their lunch selections
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
  kidsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  kidButton: {
    flex: 1,
    minWidth: 100,
    maxWidth: 150,
    marginBottom: 8,
  },
  kidButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 8,
  },
  kidName: {
    marginTop: 8,
    textAlign: 'center',
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  resetButton: {
    backgroundColor: '#ef4444',
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
