import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  where,
  serverTimestamp,
  getDoc,
 
} from "firebase/firestore";
import { useIsFocused } from '@react-navigation/native';
import { onAuthStateChanged,getAuth } from 'firebase/auth';
import { db } from "../FirebaseConfig";
import { useLayoutEffect } from 'react';
function ConversationsScreen({ navigation }) {


   useLayoutEffect(() => {
    navigation.setOptions({
      title:"Messages",
       headerTitleAlign:'center', 
      headerStyle: {
        backgroundColor: 'lightblue',      
      }, 
    });
  }, [navigation]);


  const defaultProfilePicPath='../defaultprofilepic.png';
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const hasRun = useRef(false);
  const [isLoading,setIsLoading]=useState(false);

  useEffect(() => {
  setIsLoading(true);
  let unsubscribe = () => {};
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const fetchConversations = async () => {
    try {
      const que = query(collection(db, "users"), where("authUid", "==", userId));
      const snap = await getDocs(que);
      const userDoc = snap.docs[0];
      const currentUserId = userDoc.id;

      if (!currentUserId) {
        console.error("User ID is undefined. Cannot fetch conversations.");
        return;
      }

      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUserId)
      );

      unsubscribe = onSnapshot(q, async (snapshot) => {
        const existingConversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const ids = existingConversations.flatMap((conv) =>
          conv.participants.filter((id) => id !== currentUserId)
        );

        const uniqueIds = [...new Set(ids)];

        const conversationsInfo = [];

        for (const uid of uniqueIds) {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const conversationId = [String(currentUserId), String(userData.id)].sort().join("_");

            try {
              const convDoc = doc(db, "conversations", conversationId);
              const docSnap = await getDoc(convDoc);
              const data = docSnap.data();

              if (!data) continue;

              const lastMessage = data.lastMessage;
              const lastUpdated = data.lastUpdated;
              const date = new Date(lastUpdated.seconds * 1000);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              const lastMessageTime = `${hours}:${minutes}`;

              conversationsInfo.push({
                conversationid: conversationId,
                id: userData.id || null,
                username: userData.username || null,
                profilePicture: userData.profilePicture || '',
                lastMessage: lastMessage || '',
                lastUpdated: lastMessageTime || ' '
              });

            } catch (error) {
              console.log("Couldn't fetch conversation data:", error);
            }
          }
        }

        
        const unique = Array.from(
          new Map(conversationsInfo.map(item => [item.conversationid, item])).values()
        );

        setConversations(unique);
        setCurrentUserId(currentUserId);
        setIsLoading(false);
      });

    } catch (error) {
      console.error("Error fetching conversations:", error.message);
    }
  };

  fetchConversations();
  return () => unsubscribe();
}, [currentUserId]);
 //conv create cu fiecare user -> de modificat ulterior doar pt compatibilitati
  const GetConversation = async (receiverId) => {
  const conversationId = [String(currentUserId), String(receiverId)].sort().join("_");
  const conversationRef = doc(db, "conversations", conversationId);

  const docSnap = await getDoc(conversationRef);

  

return [String(currentUserId), String(receiverId)].sort().join("_");
};

  const handleUserPress = async (receiverId,receiverUsername,receiverPhoto) => {
    if (!currentUserId || !receiverId) {
      Alert.alert("Error", "User IDs are missing.");
      return;
    }

    console.log("Pressed user:", receiverId); 
    const conversationId = await GetConversation(receiverId);
    console.log("Navigating to conversation:", conversationId); 
  
    navigation.push("Messages", {
      conversationId,
      receiverId,
      senderId:currentUserId,
      username:receiverUsername,
      profilePicture:receiverPhoto,
    });
  };
  

    return (
      
      <View style={styles.container}>
        {isLoading ? (
    <ActivityIndicator size="large" color="#000" style={{alignItems:'center',justifyContent:'center'}} />
  ) : (
    <>
        <Text style={styles.title}>Start a Conversation</Text>

        {conversations.length === 0 ? (
          <Text style={{ textAlign: "center"}}>No other users available.</Text>
        ) : (
          <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationid.toString()}
          renderItem={({ item }) => (
            
            <TouchableOpacity onPress={() => handleUserPress(item.id,item.username,item.profilePicture)}>
              <View style={styles.itemContainer}>
                <View style={styles.imageWrapper}>
                <Image style={styles.itemImage}   source={item.profilePicture? { uri:item.profilePicture } : require(`${defaultProfilePicPath}`)}/>
              </View>
        <Text style={styles.itemText} >{item.username}</Text>
        <View style={styles.messageWrapper}>
        <Text style={styles.itemMessage} numberOfLines={1} ellipsizeMode="tail">{item.lastMessage}</Text>
        </View>
        <Text style={styles.itemText}>{item.lastUpdated}</Text>
      
      </View>
            </TouchableOpacity>
          
          )}
        />
        
        )}
        </>
  )}

      </View>
      
    );
  }

export default ConversationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
   
  },
  title: {
   fontSize: 22,
  fontWeight: "bold",
  marginBottom: 12,
  textAlign: "center",
  },
  userContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    width: "100%",
  },
  username: {
    fontSize: 16,
  },
   itemContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 0, 
    justifyContent:'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width:'100%',
    height: '75',
    overflow:'hidden',
  },
  itemText: {
    marginHorizontal: 10, 
    fontSize: 16,
       
  },
  itemMessage: {
     flex: 1, 
      textAlignVertical: 'center',    
  },
  messageWrapper:
  {
     flex: 1,
     
  },
   imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 10,
  },
  itemImage: {
      width: '100%',
    height: '100%',
   borderRadius: 30 ,

  }
});
