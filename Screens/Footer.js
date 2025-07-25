import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
import ProfileScreen from './ProfileScreen';
import ConversationsScreen from './ConversationsScreen';
const Tab = createBottomTabNavigator();

export default function Footer( navigation ) {
  return (
 
      <Tab.Navigator
        initialRouteName="Profile"
        screenOptions={({ route }) => ({
          tabBarIcon: ({  size ,color}) => {
            let iconName;
            if (route.name === 'Compatibility') {
          iconName = 'musical-notes-sharp'; 
            } else if (route.name === 'Search') {
              iconName = 'search-outline';
            } else if (route.name === 'Messages') {
              iconName = 'chatbubble-outline';
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
            }

            return <Ionicons name={iconName} color={color} size={size} />;
          },
        })}
      >
        <Tab.Screen name="Compatibility" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Messages" component={ConversationsScreen} />
      </Tab.Navigator>
   
  );
}
