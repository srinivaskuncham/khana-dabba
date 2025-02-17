import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  FAB,
  Card,
  Avatar,
  Button,
  Portal,
  Modal,
  TextInput,
  Appbar,
} from 'react-native-paper';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Kid } from '../../shared/schema';
import { queryClient } from '../lib/queryClient';

export default function KidsScreen({ navigation }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    school: '',
    dietaryPreferences: '',
  });

  const { data: kids = [] } = useQuery<Kid[]>({
    queryKey: ['/api/kids'],
  });

  const createKidMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/kids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create kid profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kids'] });
      setIsModalVisible(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      school: '',
      dietaryPreferences: '',
    });
    setSelectedKid(null);
  };

  const handleSave = () => {
    createKidMutation.mutateAsync(formData);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Kids" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {kids.map((kid) => (
            <Card key={kid.id} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Avatar.Image
                  size={80}
                  source={{
                    uri: kid.profilePicture ||
                      `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${kid.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
                  }}
                />
                <View style={styles.kidInfo}>
                  <Text variant="titleMedium">{kid.name}</Text>
                  <Text variant="bodySmall">Grade: {kid.grade}</Text>
                  <Text variant="bodySmall" numberOfLines={1}>
                    {kid.school}
                  </Text>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('LunchSelection', { kidId: kid.id })}
                >
                  Lunch Selection
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => {
            setIsModalVisible(false);
            resetForm();
          }}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {selectedKid ? 'Edit Kid Profile' : 'Add Kid Profile'}
          </Text>
          
          <TextInput
            mode="outlined"
            label="Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Grade"
            value={formData.grade}
            onChangeText={(text) => setFormData({ ...formData, grade: text })}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="School"
            value={formData.school}
            onChangeText={(text) => setFormData({ ...formData, school: text })}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Dietary Preferences"
            value={formData.dietaryPreferences}
            onChangeText={(text) =>
              setFormData({ ...formData, dietaryPreferences: text })
            }
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setIsModalVisible(false);
                resetForm();
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={createKidMutation.isPending}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      />
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
  grid: {
    gap: 16,
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  kidInfo: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 100,
  },
});
