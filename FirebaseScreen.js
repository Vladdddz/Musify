
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA29s6zDjURn0KHX4Qo7Ny60F1DMoyqFgU",
  authDomain: "musify-9d2ec.firebaseapp.com",
  projectId: "musify-9d2ec",
  storageBucket: "gs://musify-9d2ec.firebasestorage.app/",
  appId: "1:1012357029172:android:4703537bad1629b0041961"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const FirebaseScreen = () => {
  useEffect(() => {
    console.log("🟢 FirebaseScreen Mounted");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ User authenticated:", user.email);
      } else {
        console.log("❌ No user found");
      }
    });

    return () => unsubscribe();
  }, []);


};

export default FirebaseScreen;