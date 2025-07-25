import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Alert, Modal, Image, View, Text, Button, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
import { Dimensions } from 'react-native';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../FirebaseConfig";
import { getCurrentUserId } from "../FirebaseUtilities";
import { musicFacts } from "../api/MusicFactsArray";
import { useLayoutEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
const HomeScreen = ({ navigation }) => {

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: 'lightblue',
      },
    });
  }, [navigation]);

  //user info
  const [userRef, setUserRef] = useState(null);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [userInfo, setUserInfo] = useState(true);
  const [userAvailableSongs, setUserAvailableSongs] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userNullSongs, setUserNullSongs] = useState(false);

  //compatibility info
  const [compatibilityId, setCompatibilityId] = useState(null);
  const [compatibilityPhoto, setCompatibilityPhoto] = useState("");
  const [compatibilityUsername, setCompatibilityUsername] = useState(null);
  const [compatibilityAge, setCompatibilityAge] = useState(null);
  const [compatibilityCountry, setCompatibilityCountry] = useState("");
  const [compatibilityGender, setCompatibilityGender] = useState("");
  const [common, setCommon] = useState([]);
  const defaultProfilePicPath = '../defaultprofilepic.png';
  //etc
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [foundMatch, setFoundMatch] = useState(false);
  const [facts, setFacts] = useState(null);

  const screenHeight = Dimensions.get('window').height;
  const isFocused = useIsFocused();

  const fetchUserData = async () => {
    const userId = await getCurrentUserId();
    console.log("Effect ran");

    try {

      if (!userId) {
        console.error("User ID is undefined");
        return;
      }
      const userRef = doc(db, "users", userId);
      const unsubscribe = onSnapshot(userRef, async (docSnap) => {
        const data = docSnap.data();
        setCurrentUserId(userId);
        if (!data) {
          console.log('data doesnt exist');
          return;
        }
        const hasNullSongs = Array.isArray(data?.songs) && data.songs.some(song => song === null);
        if (hasNullSongs)
          setUserNullSongs(true);
        else setUserNullSongs(false);

        if (!data.age || data.age === '' || !data.country || data.country === '' || !data.gender || data.gender === '') { setUserInfo(false); }
        setFavoriteGenres(data.genres);
        const validSongs = data.songs.filter(song => song && song.name)
          .map(song => song.name);
        setFavoriteSongs(validSongs);

        const artistNames = data.songs
          .map((song) => song?.artist)
          .filter(Boolean);
        const uniqueArtists = [...new Set(artistNames)];
        setArtists(uniqueArtists);
        if (validSongs.length < 4) { setUserAvailableSongs(false); }

        if (!userInfo)
          console.log("user info not set");
        if (!userAvailableSongs)
          console.log("user songs not set");
      });

    }
    catch (err) { console.log("eroare aici", err); }
  }




  const createConversation = async (receiverId) => {
    const conversationId = [String(currentUserId), String(receiverId)].sort().join("_");
    console.log("currentuser,receiver:", currentUserId, receiverId);
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnapshot = await getDoc(conversationRef);
    if (!conversationSnapshot.exists()) {
      await setDoc(conversationRef, {
        participants: [String(currentUserId), String(receiverId)],
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      });
    }

  }
  const getConversation = async (receiverId) => {
    const conversationId = [String(currentUserId), String(receiverId)].sort().join("_");
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnapshot = await getDoc(conversationRef);
    if (conversationSnapshot.exists()) {
      return true;
    }
    return false;
  }


  const getBannedConvos = async (receiverId) => {
    const bannedConversationId = [String(currentUserId), String(receiverId)].sort().join("_");
    const conversationRef = doc(db, "banned_conversations", bannedConversationId);
    const conversationSnapshot = await getDoc(conversationRef);
    if (conversationSnapshot.exists())
      return true;

    return false;
  }


  const addBannedConvos = async (receiverId) => {
    const conversationId = [String(currentUserId), String(receiverId)].sort().join("_");
    const conversationRef = doc(db, "banned_conversations", conversationId);
    await setDoc(conversationRef, {
      participants: [String(currentUserId), String(receiverId)],
    });
  }




  const SendMessage = async (receiverId, senderId) => {
    if (!currentUserId || !receiverId) {
      alert("Error", "User IDs are missing.");
      return;
    }
    setVisible(false);
    console.log("Pressed user:", receiverId);
    await createConversation(receiverId);
    const conversationId = [String(currentUserId), String(receiverId)].sort().join("_");
    console.log("Navigating to conversation:", conversationId);

    // navigation.navigate("Conversations");
    navigation.push("Messages", {
      conversationId,
      receiverId,
      senderId: currentUserId,
      username: compatibilityUsername,
      profilePicture: compatibilityPhoto,
    });

  }

  const viewProfile = () => {

    navigation.push("UserProfile", {
      userId: compatibilityId,
    });
  }
  const findScore = async () => {
    let max = 0;

    try {

      const querySnapshot = await getDocs(collection(db, "users"));
      const docs = querySnapshot.docs;
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const userData = doc.data();
        let score = 0;
        const hasNullSongs = Array.isArray(userData.songs) && userData.songs.some(song => song === null);
        console.log("Has null songs length", hasNullSongs);
        if (hasNullSongs) {
          console.log("skipping; found null songs", hasNullSongs.length);
          continue;
        }
        let hasConvo = await getConversation(userData.id);
        let hasBannedConvo = await getBannedConvos(userData.id);
        console.log("For user number", userData.id);
        console.log("hasConvo + hasBannedConvo", hasConvo, hasBannedConvo);
        if (userData.id == currentUserId || hasConvo || hasBannedConvo || !userData.age || !userData.country || !userData.gender) { continue; }

        //songs
        const validSongs = Array.isArray(userData.songs)
          ? userData.songs.filter(song => song && song.name)
          : [];

        const songSet = new Set(validSongs);
        const songNameSet = new Set([...songSet].map(song => song.name));
        console.log("ValidSongs length:", validSongs.length);

        const commonSongs = favoriteSongs.filter(item => songNameSet.has(item));
        score += 5 * commonSongs.length;

        //artists
        const artistNames = Array.isArray(userData.songs)
          ? userData.songs.map(song => song?.artist).filter(Boolean)
          : [];

        const artistSet = new Set(artistNames);
        const commonArtists = artists.filter(item => artistSet.has(item));
        score += 3 * commonArtists.length;


        //genres
        const genreSet = new Set(userData.genres);
        const commonGenres = favoriteGenres.filter(item => genreSet.has(item));
        score += commonGenres.length;
        let selectedCommon = [];
        if (commonSongs.length > 0) {
          selectedCommon = commonSongs;
        } else if (commonArtists.length > 0) {
          selectedCommon = commonArtists;
        } else if (commonGenres.length > 0) {
          selectedCommon = commonGenres;
        }

        console.log("commonSongs:", commonSongs);
        console.log("commonArtists:", commonArtists);
        console.log("commonGenres:", commonGenres);
        console.log("common:", selectedCommon);
        if (score > max) {
          max = score;
          setCompatibilityId(userData.id);
          setCompatibilityPhoto(userData.profilePicture);
          setCompatibilityUsername(userData.username);
          setCompatibilityAge(userData.age);
          setCompatibilityCountry(userData.country);
          setCompatibilityGender(userData.gender);
          setCommon(selectedCommon);


          console.log("user info:", compatibilityAge, compatibilityCountry, compatibilityGender, compatibilityId, compatibilityUsername);

        }

      }
      if (max) {
        setFoundMatch(true);
      }
      else {
        alert("No users are compatible to your music taste.");

      }


      setIsLoading(false);


    } catch (error) {
      console.error("Error fetching users:", error);
    }

    return max;
  }


  const SearchAgain = async (receiverId) => {

    setVisible(false);
    setFoundMatch(false);
    await addBannedConvos(receiverId);
    await SearchCompatibility();


  }

  const SearchCompatibility = async () => {

    setIsLoading(true);

    const randomFact = musicFacts[Math.floor(Math.random() * musicFacts.length)];
    setFacts(randomFact);
    await fetchUserData();
    console.log("SearchCompatibility called");
    setFoundMatch(false);
    console.log("searching for user:", currentUserId);

    if (userNullSongs) {
      alert("make sure to set your favorite songs before searching for a compatibility!");
      setIsLoading(false);
      return;

    }
    else if (!userInfo) {
      alert("make sure to set your personal information before searching for a compatibility!");
      setIsLoading(false);
      return;
    }
    else {

      let maxScore = await findScore();

      if (maxScore > 0) {
        console.log('SCORE:', maxScore);

        setIsLoading(false);
        setVisible(true);
      }

    }
  }

  return (

    <View style={{ display: 'flex' }}>
      {isLoading ? (
        <View>
          <ActivityIndicator size="large" color="#000" style={{ alignItems: 'center', justifyContent: 'center' }} />
          <Text style={styles.title}>Searching for compatibilities... </Text>
          <Text style={styles.subtitle}>Did you Know? </Text>
          <Text style={styles.factTitle}>{facts.title} </Text>
          <Text style={styles.factBody}>{facts.fact} </Text>
        </View>
      ) : (


        <View>
          {!foundMatch || !visible ? (
            <View>
              <TouchableOpacity style={styles.viewButton} onPress={SearchCompatibility}>
                <Text style={styles.viewButtonText}>Find Compatibility</Text>
              </TouchableOpacity>

            </View>
          ) : (

            <Modal style={styles.modalContainer} visible={visible && foundMatch} transparent animationType="slide">
              <TouchableOpacity
                style={{ position: 'absolute', top: 25, right: 40, zIndex: 1, color: "black", }}
                onPress={() => setVisible(false)}
              >
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 130 }}>✕</Text>
              </TouchableOpacity>
              <View style={[styles.overlay, { maxHeight: screenHeight }]}>
                <View style={styles.modalBox}>
                  {/* profile photo + view profile */}
                  <View style={styles.header}>
                    <Image
                      source={compatibilityPhoto ? { uri: compatibilityPhoto } : require(`${defaultProfilePicPath}`)}
                      style={styles.profilePhoto}
                    />
                    <View style={{
                      padding: 10, justifyContent: 'center', marginLeft: 10
                    }}>
                      <Text style={styles.label}>{compatibilityUsername}</Text>
                      <TouchableOpacity style={styles.viewButton} onPress={viewProfile}>
                        <Text style={styles.viewButtonText}>View Profile</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Labels */}
                  <Text style={styles.label}>Age:{compatibilityAge}</Text>
                  <Text style={styles.label}>Country:{compatibilityCountry}</Text>
                  <Text style={styles.label}>Gender:{compatibilityGender}</Text>
                  {/*common taste*/}
                  {common.length > 0 && (
                    <Text style={styles.label}>You both listen to  {common.length > 0 ? common.join(', ') : ''}</Text>
                  )}
                  {/* Bottom Buttons */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => SendMessage(compatibilityId, currentUserId)}>
                      <Text style={styles.buttonText}>Send Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => SearchAgain(compatibilityId)}>
                      <Text style={styles.buttonText}>Search Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>




          )}
        </View>


      )}
    </View>
  );


};
const styles = StyleSheet.create({
  title: {
    marginBottom: 30,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  factTitle: {
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#333',

  },
  factBody: {
    marginLeft: 20,
    marginRight: 20,
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
    marginBottom: 20,
  },


  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "grey",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    height: "60%",
    backgroundColor: "white",
    display: 'flex',
    borderRadius: 10,
    padding: 20,
  },
  header: {
    flexDirection: "row",

  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10,
  },
  viewButton: {
    backgroundColor: "royalblue",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 20,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonText: {
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 30,
    color: "white",
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    marginVertical: 4,
    fontWeight: 'bold',
    marginLeft: 10
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "royalblue",
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default HomeScreen;
