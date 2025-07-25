import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet, Text } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../FirebaseConfig";
import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
function SignInScreen({ navigation }) {
    navigation.setOptions({
      headerTitleAlign:'center', 
      headerStyle: {
        backgroundColor: 'lightblue',      
      }, 
    
    }); 
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
  
    const handleSignIn = async () => {
      try {
       
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const authUid = userCredential.user.uid;
  
        const counterRef = doc(db, "counters", "userCounter");
        const counterSnapshot = await getDoc(counterRef);
  
        let newUserId = 1;
        if (counterSnapshot.exists()) {
          newUserId = counterSnapshot.data().lastId + 1;
          await updateDoc(counterRef, { lastId: increment(1) });
        } else {
          await setDoc(counterRef, { lastId: 1 });
        }
  
        await setDoc(doc(db, "users", newUserId.toString()), {
          id: newUserId,
          authUid,
          username,
          email,
          createdAt: serverTimestamp(),
        });
  
        Alert.alert("Success", "User registered!");
        navigation.navigate("Main");
  
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    };

  const handleLoginNavigation = () => {
    navigation.navigate("Login"); 
  };

  return (
   <View style={styles.container}>
    <Text style={styles.title}>Sign in</Text>
      <TextInput
       style={styles.input}
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} />

      <TextInput 
      style={styles.input}
      placeholder="Password" 
      value={password} 
      onChangeText={setPassword} 
      secureTextEntry />
      <TextInput
      style={styles.input}
       placeholder="Username" 
       value={username}
        onChangeText={setUsername} />
      <Button title="Sign In" onPress={handleSignIn} />
       <View style={styles.signInContainer}>
         <Text>Already have an account?</Text>
                <Button title="Login" onPress={handleLoginNavigation} />
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
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: "#fff",
    },
    signInContainer: {
      marginTop: 16,
      alignItems: "center",
    },
  });
export default SignInScreen;