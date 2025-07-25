import { initializeApp,setLogLevel } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getAuth } from 'firebase/auth';

import { getStorage } from 'firebase/storage';



const firebaseConfig = {
  apiKey: "AIzaSyA29s6zDjURn0KHX4Qo7Ny60F1DMoyqFgU",
  authDomain: "musify-9d2ec.firebaseapp.com",
  projectId: "musify-9d2ec",
  storageBucket: "musify-9d2ec.appspot.com",
  appId: "1:1012357029172:android:4703537bad1629b0041961"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app); 
const storage=getStorage(app);
const storageLink='https://console.firebase.google.com/project/musify-9d2ec/storage/musify-9d2ec.firebasestorage.app/files/~2F'
export { auth, db, storage,storageLink };
