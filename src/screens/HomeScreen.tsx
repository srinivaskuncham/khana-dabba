import React from 'react';
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
  SegmentedButtons,
} from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { MonthlyMenuItem } from '../../shared/schema';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Profile: undefined;
  Kids: undefined;
  LunchSelection: { kidId?: number };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, logoutMutation } = useAuth();
  const theme = useTheme();
  const [menuType, setMenuType] = React.useState('veg');

  const { data: menuItems = [] } = useQuery<MonthlyMenuItem[]>({
    queryKey: [`/api/menu/${new Date().getFullYear()}/${new Date().getMonth() + 1}`],
  });

  const vegItems = menuItems.filter(item => item.isVegetarian);
  const nonVegItems = menuItems.filter(item => !item.isVegetarian);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Action 
          icon="menu" 
          onPress={() => navigation.navigate('Profile')} 
        />
        <Appbar.Content title="Khana Dabba" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.welcomeText}>
            Welcome back, {user?.name}!
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Here are this month's lunch options
          </Text>
        </View>

        <SegmentedButtons
          value={menuType}
          onValueChange={setMenuType}
          buttons={[
            { value: 'veg', label: 'Vegetarian' },
            { value: 'non-veg', label: 'Non-Vegetarian' },
          ]}
          style={styles.segmentedButton}
        />

        <View style={styles.menuGrid}>
          {(menuType === 'veg' ? vegItems : nonVegItems).map((item) => (
            <Card key={item.id} style={styles.card}>
              <Card.Cover source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <Card.Title
                title={item.name}
                subtitle={`₹${item.price}`}
                titleNumberOfLines={1}
                subtitleNumberOfLines={1}
              />
              <Card.Content>
                <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
                  {item.description}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
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
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    color: '#4b5563',
    marginTop: 4,
  },
  segmentedButton: {
    marginBottom: 24,
  },
  menuGrid: {
    gap: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardImage: {
    height: 200,
  },
  description: {
    color: '#6b7280',
  },
});