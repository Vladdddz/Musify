
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  appId: ""
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
