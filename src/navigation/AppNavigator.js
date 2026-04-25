import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import InAppNotification from '../components/InAppNotification';

// Import all screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import UserSelectionScreen from '../screens/UserSelectionScreen';
import NewGroupScreen from '../screens/NewGroupScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import GroupInfoScreen from '../screens/GroupInfoScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [currentNotification, setCurrentNotification] = useState(null);

  // Set global function to show notification
  global.showNotification = (msg) => {
    setCurrentNotification(msg);
  };

  return (
    <>
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
          title: 'My Chat',
          headerStyle: { backgroundColor: '#4A90E2' },
          headerTintColor: '#FFF',
          headerLeft: () => null, 
        })} 
      />
      
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={({ route, navigation }) => ({ 
          headerStyle: { backgroundColor: '#4A90E2' },
          headerTintColor: '#fff',
          headerTitleAlign: 'left',
          headerBackVisible: false, 
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 2, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginLeft: 4 }}>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>
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
      <Stack.Screen 
        name="UserSelection" 
        component={UserSelectionScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="NewGroup" 
        component={NewGroupScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="GroupDetails" 
        component={GroupDetailsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="GroupInfo" 
        component={GroupInfoScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
    <InAppNotification 
        message={currentNotification} 
        onHide={() => setCurrentNotification(null)} 
    />
    </>
  );
}
