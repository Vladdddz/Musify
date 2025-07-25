import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Footer from './Screens/Footer';
import LoginScreen from './Screens/LoginScreen';
import SignInScreen from './Screens/SignInScreen';
import ConversationsScreen from './Screens/ConversationsScreen';
import MessagesScreen from './Screens/MessagesScreen';
import HomeScreen from './Screens/HomeScreen';
import AuthCheck from './Screens/AuthCheck';
import UserProfileScreen from './Screens/UserProfileScreen';

const Stack = createStackNavigator();

const App = () => {

  return (

    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthCheck">
        <Stack.Screen name="AuthCheck" component={AuthCheck} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Conversations" component={ConversationsScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />

        <Stack.Screen
          name="Main"
          component={Footer}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
