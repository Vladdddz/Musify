import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet, Text } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth,db } from "../FirebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLayoutEffect } from 'react';
function LoginScreen({ navigation }) {


    useLayoutEffect(() => {
    navigation.setOptions({
       headerTitleAlign:'center', 
      headerStyle: {
        backgroundColor: 'lightblue',      
      }, 
    });
  }, [navigation]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
  
    const handleLogin = async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const authUid = userCredential.user.uid;
        const q = query(collection(db, "users"), where("authUid", "==", authUid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Error", "User not found in Firestore!");
      } else {
        Alert.alert("Success", "User logged in successfully!");
        navigation.replace("Main"); 
        await AsyncStorage.setItem("userId", authUid);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }; 

    const handleSignInNavigation = () => {
        navigation.navigate("SignIn"); 
      };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => setPassword(text)}
      />

      <Button title="Login" onPress={handleLogin} />
      <View style={styles.signUpContainer}>
        <Text>Don't have an account?</Text>
        <Button title="Sign In" onPress={handleSignInNavigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
      backgroundColor: "#f8f8f8",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 24,
    },
    input: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#ccc",
      padding: 12,
         color: 'black', 
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: "#fff",
    },
    signInContainer: {
      marginTop: 16,
      alignItems: "center",
    },
  });

export default LoginScreen;