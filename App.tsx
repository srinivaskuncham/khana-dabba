import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import KidsScreen from './src/screens/KidsScreen';
import LunchSelectionScreen from './src/screens/LunchSelectionScreen';
import AdminScreen from './src/screens/AdminScreen';
import { AuthProvider } from './src/hooks/useAuth';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <PaperProvider>
        <AuthProvider>
          <Stack.Navigator 
            initialRouteName="Auth"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6366f1', // primary color
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'Khana Dabba' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen 
              name="Kids" 
              component={KidsScreen}
              options={{ title: 'Kids' }}
            />
            <Stack.Screen 
              name="LunchSelection" 
              component={LunchSelectionScreen}
              options={{ title: 'Lunch Selection' }}
            />
            <Stack.Screen 
              name="Admin" 
              component={AdminScreen}
              options={{ title: 'Admin Dashboard' }}
            />
          </Stack.Navigator>
        </AuthProvider>
      </PaperProvider>
    </NavigationContainer>
  );
}

export default App;