import React, { useCallback, useState, useEffect, useRef, useLayoutEffect } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,Text,
  Image,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from "react-native-vector-icons/Ionicons"; 
import { db } from "../FirebaseConfig"; 
import { Dimensions } from 'react-native';
import defaultProfilePic from '../defaultprofilepic.png';
import { useNavigation } from '@react-navigation/native';
 import {getCurrentUserId} from "../FirebaseUtilities";

function MessagesScreen({ route }) {

const flatListRef = useRef(); 
  const [messageStatus,setMessageStatus]=useState(null);
  const conversationId = route?.params?.conversationId;
  const receiverId = route?.params?.receiverId;
const [senderId,setSenderId]=useState(null);
  const username=route?.params?.username;
  const profilePicture=route?.params?.profilePicture;
  console.log(profilePicture,typeof profilePicture);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
const [receiverUsername,setReceiverUsername]= useState(null);
const [receiverProfilePhoto,setReceiverProfilePhoto]= useState(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
const screenWidth = Dimensions.get('window').width;

  const defaultProfilePicPath='../defaultprofilepic.png';

const navigation = useNavigation();
const viewProfile=() => {
   navigation.push("UserProfile", {
     userId:receiverId,
    });
}
 useLayoutEffect(() => {
    navigation.setOptions({
       headerLeft: () => (
      <TouchableOpacity onPress={() => navigation.navigate('Conversations')}>
        <Icon name="arrow-back" size={24} color="black" style={{ marginLeft: 10 }} />
      </TouchableOpacity>
    ),
       headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: 'lightblue',  
        
        
        
      }, 
      headerTitle: () => (
        <View style={{flex:1,alignItems:"center",marginRight:40}}>
            <TouchableOpacity onPress={viewProfile}>
          <View style={styles.imageWrapper}>
                       <Image style={styles.itemImage}   source={profilePicture ? { uri:profilePicture  } : defaultProfilePic}/>
          </View>
          <View><Text style={{marginLeft:10}}>{username}</Text></View>
        </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);



 useEffect(() => {
  const getId = async() => {
const id= await getCurrentUserId();
setSenderId(id);
  }
    const fetchUsername = async() =>{
      console.log(receiverId, "ASLSDA");
      try{
    const userDoc = doc(db, "users", receiverId);
      const docSnap = await getDoc(userDoc);
          const data = docSnap.data();
          if(data)
            {setReceiverUsername(data.username);
              setReceiverProfilePhoto(data.profilePhoto);
              console.log(data.username);
            }
          }
            catch(err){console.log(err); return;}
     
    };
    getId();
  fetchUsername();
  }, [receiverId]);

//display messages
useEffect(() => {
  if (!conversationId) {console.log("no convo id");return;}

  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("timestamp", "desc") 
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMessages(messages); 
  });

  return () => unsubscribe();
}, [conversationId]);









  

 
useEffect(() => {
  setTimeout(() => {
   
      flatListRef.current?.scrollToOffset({ animated: true, offset:0, });
    },1000);
  }, []);

 const handleSeen = async (conversationId, receiverId) => {
 try{
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  
  const querySnapshot = await getDocs(messagesRef);
  querySnapshot.forEach(async (docSnapshot) => {
    const messageData = docSnapshot.data();

    if(messageData.receiverId === receiverId && messageData.status !=='seen')
      await updateDoc(docSnapshot.ref, {status:'seen'});

  });
  }catch(error){console.log("couldn't mark messages as seen.",error);}
};


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !senderId) return;
  const messageToSend=newMessage;
  setNewMessage('');
    try {
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        senderId: String(senderId),
        receiverId: String(receiverId),
        message: messageToSend.trim(),
        timestamp: serverTimestamp(),
        status: "sent",
      });
  
      await setDoc(
        doc(db, "conversations", conversationId),
        {
          lastMessage: newMessage.trim(),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
  
     
      console.log("Message sent to:", conversationId);
    } catch (error) {
      console.error("Firestore write error:", error);
    }
  
  };
  
useFocusEffect(
  useCallback(() => {
  handleSeen(conversationId,receiverId);
  },[conversationId,receiverId])
);

    useEffect(() => {
  const setStatus= async() =>{
      const userRef = doc(db, "conversations", conversationId, "messages");
    const docSnap = await getDoc(userRef);
            const data = docSnap.data();
            setStatus(data.status); 
        }
  setStatus();
    }, []);

    const formatTimestamp = (ts) => {
  if (!ts?.toDate) return '';
  const date = ts.toDate();
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
  return (
   
    <View style={styles.container}>
<FlatList
 ref={flatListRef}
inverted
  data={messages}
  keyExtractor={(item) => item.id.toString()}
  style={{marginBottom:10}}  
  ListEmptyComponent={<Text style={{ color: "#aaa", textAlign: "center" }}>No messages yet</Text>}
  renderItem={({ item }) => (
    <View 
      style={[
        styles.inputBox,{maxWidth: screenWidth * 0.7},
        item.senderId === senderId
          ? [styles.myMessage,]
          
          : [styles.otherMessage,]
      ]}
    >
      
    
      <Text>
  {item.message} <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
</Text>
      {item.senderId === senderId && (
        <View style={styles.statusIcon}>
        <MaterialIcon
      name="check-all"
      size={16}
      color={item.status === 'seen' ? '#4fc3f7' : '#888'}
      />
      
  </View>
  )}
      </View>
  )}
/>

  <View style={[styles.inputBox]}>
  
<TouchableOpacity  style={styles.mediaButton}>
    <Icon name="image-outline" size={24} color="#555" />
    </TouchableOpacity>

  <TextInput
    value={newMessage}
    onChangeText={setNewMessage}
    placeholder="Type your message..."
    style={{flex: 1,textAlign:'left'}}
     multiline
    
  />
  <TouchableOpacity onPress={handleSendMessage}>
  <Icon name="send" size={24} color="#007AFF" />
</TouchableOpacity>
 </View>
 
    </View>
    
  );
}

export default MessagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: "70%",
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
    
  },
  otherMessage: {
    backgroundColor: "#ECECEC",
    alignSelf: "flex-start",
     statusIcon: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  },
  timestamp: {
    marginTop:10,
    marginLeft:10,
     justifyContent: "flex-end",
     fontSize: 11,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    borderColor: "#ccc",
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inputBox: {
    flex: 1,
    textAlign:'left',
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical:5,
    backgroundColor: "#f9f9f9",
    minHeight: 50,     
    maxHeight: 50, 
    marginBottom:10,
     justifyContent: "space-between",

  },
  mediaButton: {
    padding: 1,
    marginRight: 6,
    backgroundColor: "#eee",
    borderRadius: 5,
  },
  
  

  
  iconWrapper: {
    marginRight: 6,
  },
imageWrapper: {
    width: 45,
    height: 45,
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
