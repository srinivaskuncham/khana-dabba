import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Surface,
} from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen({ navigation }) {
  const { loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    gender: '',
  });

  const handleLogin = async () => {
    try {
      await loginMutation.mutateAsync(loginForm);
      navigation.replace('Home');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleRegister = async () => {
    try {
      await registerMutation.mutateAsync(registerForm);
      navigation.replace('Home');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Khana Dabba</Text>
        </View>

        <Surface style={styles.surface}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'login', label: 'Login' },
              { value: 'register', label: 'Register' },
            ]}
            style={styles.segmentedButton}
          />

          {activeTab === 'login' ? (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="Username"
                value={loginForm.username}
                onChangeText={(text) =>
                  setLoginForm({ ...loginForm, username: text })
                }
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Password"
                value={loginForm.password}
                onChangeText={(text) =>
                  setLoginForm({ ...loginForm, password: text })
                }
                secureTextEntry
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loginMutation.isPending}
                style={styles.button}
              >
                Login
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="Full Name"
                value={registerForm.name}
                onChangeText={(text) =>
                  setRegisterForm({ ...registerForm, name: text })
                }
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Email"
                value={registerForm.email}
                onChangeText={(text) =>
                  setRegisterForm({ ...registerForm, email: text })
                }
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Username"
                value={registerForm.username}
                onChangeText={(text) =>
                  setRegisterForm({ ...registerForm, username: text })
                }
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Password"
                value={registerForm.password}
                onChangeText={(text) =>
                  setRegisterForm({ ...registerForm, password: text })
                }
                secureTextEntry
                style={styles.input}
              />
              <SegmentedButtons
                value={registerForm.gender}
                onValueChange={(value) =>
                  setRegisterForm({ ...registerForm, gender: value })
                }
                buttons={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                style={styles.genderSelect}
              />
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={registerMutation.isPending}
                style={styles.button}
              >
                Register
              </Button>
            </View>
          )}
        </Surface>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your one-stop destination for delicious homestyle Indian meals,
            delivered right to your doorstep.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  surface: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  segmentedButton: {
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  genderSelect: {
    marginVertical: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
});
