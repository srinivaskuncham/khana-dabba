import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Switch,
  useTheme,
  Appbar,
} from 'react-native-paper';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MonthlyMenuItem, insertMonthlyMenuItemSchema } from '../../shared/schema';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../lib/queryClient';

export default function AdminScreen({ navigation }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    isVegetarian: false,
    price: '',
    imageUrl: '',
  });

  const { data: menuItems = [], isLoading } = useQuery<MonthlyMenuItem[]>({
    queryKey: ['/api/admin/menu-items'],
  });

  const createItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const response = await fetch('/api/admin/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          price: parseInt(item.price),
          month: new Date(),
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
        price: '',
        imageUrl: '',
      });
    },
  });

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
        <Appbar.Content title="Admin Dashboard" />
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
              label="Price (₹)"
              value={newItem.price}
              onChangeText={(text) => setNewItem({ ...newItem, price: text })}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Image URL"
              value={newItem.imageUrl}
              onChangeText={(text) => setNewItem({ ...newItem, imageUrl: text })}
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
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={createItemMutation.isPending}
              style={styles.button}
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
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDescription}>
                    {item.description}
                  </Text>
                  <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                  <Text style={styles.menuItemType}>
                    {item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
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
  button: {
    marginTop: 8,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    color: '#6b7280',
    marginTop: 4,
  },
  menuItemPrice: {
    fontWeight: '500',
    marginTop: 4,
  },
  menuItemType: {
    color: '#059669',
    marginTop: 4,
  },
});
