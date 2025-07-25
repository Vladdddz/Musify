console.log("🟢 AuthCheck Mounted");
//generat cu chatgpt

import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../FirebaseConfig";

export default function AuthCheck({ navigation }) {
  useEffect(() => {
        console.log("AuthCheck mounted");

    if (!auth) {
      console.log("Auth not initialized");
      return;
    }
    const checkLoginStatus = async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");

        if (storedId) {
         
          navigation.replace("Main"); 
        } else {
          navigation.replace("Login"); 
        }
      } catch (error) {
        navigation.replace("Login");
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
