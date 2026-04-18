import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import all screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Splash" 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#ffffff' }, 
        headerShadowVisible: false, // removes the border line for cleaner look
        headerTintColor: '#1E293B', 
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        headerTitleAlign: 'center'
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      
      {/* Appended Logout Button explicitly to the right of ChatList */}
      <Stack.Screen 
        name="ChatList" 
        component={ChatListScreen} 
        options={({ navigation }) => ({ 
          title: 'User List',
          headerLeft: () => null, // Removes accidental back arrows
          headerRight: () => (
            <TouchableOpacity onPress={async () => {
               // Perform Logout Logic by resetting persistent save
               await AsyncStorage.removeItem('currentUser');
               navigation.replace('Login');
            }} style={{ marginRight: 10 }}>
              <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 16 }}>Logout</Text>
            </TouchableOpacity>
          )
        })} 
      />
      
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={({ route, navigation }) => ({ 
          headerStyle: { backgroundColor: '#075E54' }, // Real WhatsApp Green color
          headerTintColor: '#fff',
          headerTitleAlign: 'left',
          headerBackVisible: false, // Hides default to build a tight UI
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 2, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginLeft: 4 }}>
                <Text style={{ color: '#075E54', fontSize: 18, fontWeight: 'bold' }}>
                  {(route.params?.username || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }} numberOfLines={1}>
                {route.params?.username || 'User'}
              </Text>
              <Text style={{ fontSize: 13, color: '#E0F2F1', fontWeight: '500', marginTop: -2 }}>online</Text>
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: -5 }}>
              <TouchableOpacity style={{ marginRight: 20 }}>
                <Ionicons name="videocam" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 15 }}>
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )
        })} 
      />
    </Stack.Navigator>
  );
}
