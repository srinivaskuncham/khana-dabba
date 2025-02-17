import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Switch,
  useTheme,
  Appbar,
  HelperText,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MonthlyMenuItem, insertMonthlyMenuItemSchema } from '../../shared/schema';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../lib/queryClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

export default function AdminScreen({ navigation }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    isVegetarian: false,
    isVegan: false,
    calories: '',
    portionSize: '',
    price: '',
    imageUrl: '',
    month: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const { data: menuItems = [], isLoading } = useQuery<MonthlyMenuItem[]>({
    queryKey: ['/api/admin/menu-items'],
  });

  const createItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      // First upload the image if there's a new one
      let imageUrl = item.imageUrl;
      if (imagePreview) {
        const formData = new FormData();
        formData.append('image', {
          uri: imagePreview,
          type: 'image/jpeg',
          name: 'upload.jpg',
        });

        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          credentials: 'include',
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await uploadResponse.json();
        imageUrl = url;
      }

      const response = await fetch('/api/admin/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          imageUrl,
          calories: parseInt(item.calories),
          price: parseInt(item.price),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create menu item');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu-items'] });
      setNewItem({
        name: '',
        description: '',
        isVegetarian: false,
        isVegan: false,
        calories: '',
        portionSize: '',
        price: '',
        imageUrl: '',
        month: new Date(),
      });
      setImagePreview(null);
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      const response = await fetch(`/api/admin/menu-items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update menu item');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu-items'] });
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImagePreview(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    createItemMutation.mutate(newItem);
  };

  if (!user?.isAdmin) {
    return (
      <View style={styles.container}>
        <Text>Access Denied</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Menu Management" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="Add New Menu Item" />
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Name"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Description"
              value={newItem.description}
              onChangeText={(text) => setNewItem({ ...newItem, description: text })}
              style={styles.input}
              multiline
            />
            <TextInput
              mode="outlined"
              label="Calories"
              value={newItem.calories}
              onChangeText={(text) => setNewItem({ ...newItem, calories: text })}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Portion Size"
              value={newItem.portionSize}
              onChangeText={(text) => setNewItem({ ...newItem, portionSize: text })}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Price (₹)"
              value={newItem.price}
              onChangeText={(text) => setNewItem({ ...newItem, price: text })}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.switchContainer}>
              <Text>Vegetarian</Text>
              <Switch
                value={newItem.isVegetarian}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, isVegetarian: value })
                }
              />
            </View>

            <View style={styles.switchContainer}>
              <Text>Vegan</Text>
              <Switch
                value={newItem.isVegan}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, isVegan: value })
                }
              />
            </View>

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              Select Month: {newItem.month.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </Button>

            <Button
              mode="outlined"
              onPress={pickImage}
              style={styles.imageButton}
              icon="camera"
            >
              Upload Image
            </Button>

            {imagePreview && (
              <Image
                source={{ uri: imagePreview }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={createItemMutation.isPending}
              style={styles.submitButton}
            >
              Add Menu Item
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Current Menu Items" />
          <Card.Content>
            {isLoading ? (
              <Text>Loading...</Text>
            ) : (
              menuItems.map((item) => (
                <View key={item.id} style={styles.menuItem}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.menuItemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.menuItemDetails}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemDescription}>
                      {item.description}
                    </Text>
                    <Text style={styles.menuItemInfo}>
                      Calories: {item.calories} • {item.portionSize}
                    </Text>
                    <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                    <View style={styles.tagContainer}>
                      {item.isVegetarian && (
                        <Text style={[styles.tag, styles.vegTag]}>Vegetarian</Text>
                      )}
                      {item.isVegan && (
                        <Text style={[styles.tag, styles.veganTag]}>Vegan</Text>
                      )}
                    </View>
                    <Text style={styles.menuItemMonth}>
                      Available: {new Date(item.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </Text>
                    <Switch
                      value={item.isAvailable}
                      onValueChange={(value) =>
                        toggleAvailabilityMutation.mutate({ id: item.id, isAvailable: value })
                      }
                    />
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={newItem.month}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setNewItem({ ...newItem, month: selectedDate });
            }
          }}
        />
      )}
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
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
  },
  imageButton: {
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  menuItemDetails: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    color: '#6b7280',
    marginTop: 4,
  },
  menuItemInfo: {
    color: '#4b5563',
    marginTop: 4,
  },
  menuItemPrice: {
    fontWeight: '500',
    marginTop: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
  },
  vegTag: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  veganTag: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  menuItemMonth: {
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});