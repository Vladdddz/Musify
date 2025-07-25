import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  getDocs
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

import { db, auth } from "./FirebaseConfig"; 

export const registerUser = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const authUid = userCredential.user.uid;

    const Ref = doc(db, "counters", "userCounter");
    const Snap = await getDoc(counterRef);

    let newUserId = 1;
    if (Snap.exists()) {
      newUserId = Snap.data().lastId + 1;
      await updateDoc(Ref, { lastId: increment(1) });
    } else {
      await setDoc(Ref, { lastId: 1 });
    }

    await setDoc(doc(db, "users", newUserId.toString()), {
      id: newUserId,
      authUid,
      username,
      email,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error registering user", error.message);
  }
};


export const getCurrentUserId = async () => {
  const auth = getAuth();
  const authUid = auth.currentUser?.uid;
    if (!authUid) {
    throw new Error("No authenticated user found.");
  }
  const q = query(collection(db, "users"), where("authUid", "==", authUid));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id; 
  } else {
    throw new Error("User not found in Firestore");
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const authUid = userCredential.user.uid;

    const q = query(collection(db, "users"), where("authUid", "==", authUid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
     
      const newUserRef = doc(collection(db, "users"));
      await setDoc(newUserRef, {
        authUid,
        email,
        username: "",
        createdAt: serverTimestamp(),
      });
      console.log("Firestore user profile was missing. Created new profile.");
    } else {
      console.log("Firestore user profile found:", snapshot.docs[0].id);
    }

    return true;
  } catch (error) {
    console.error("Login error:", error.message);
    return false;
  }
};














