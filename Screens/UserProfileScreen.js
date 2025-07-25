//css
import { useLayoutEffect, ActivityIndicator, View, Text, Button, TouchableOpacity, Pressable, StyleSheet, Image, FlatList, Modal, Linking, TextInput, } from 'react-native';
import * as Device from 'expo-device';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
//database
import { db } from "../FirebaseConfig";
import { auth } from '../FirebaseConfig';
import { ref, listAll, getStorage, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storageLink } from "../FirebaseConfig";
import { getCurrentUserId } from "../FirebaseUtilities";
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { signOut } from 'firebase/auth';




//countries
import countries from 'world-countries';


//functie generata cu chatgpt
const getFlagEmoji = (countryCode) =>
  countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
const generatedItems = countries.map((country) => ({
  label: `${getFlagEmoji(country.cca2)} ${country.name.common}`,
  value: country.cca2,
}));
const UserProfileScreen = ({ route }) => {
  const navigation = useNavigation();


  let userId = route?.params?.userId;

  const [profilePicture, setprofilePicture] = useState(null);
  const [isLoading, setIsLoading] = useState(null);


  //age
  const [age, setAge] = useState(null);

  //country
  const [country, setCountry] = useState(null);

  //gender
  const [gender, setGender] = useState(null);
  //bio
  const [bio, setBio] = useState('');

  const [username, setUsername] = useState(null);
  //songs
  const [profileSongs, setProfileSongs] = useState([null, null, null, null, null]);
  const feelings = ['Sad', 'Bored', 'Happy', 'Sad', 'Nostalgic'];

  //report a problem
  const defaultProfilePicPath = '../defaultprofilepic.png';



  useEffect(() => {

    setIsLoading(true);
    const fetchData = async () => {

      console.log("USER ID PASSED THROUGH NAVIGATION:", userId);
      try {

        const userDocRef = doc(db, "users", userId.toString());
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log("User Data:", data);
        } else {
          console.log("No such document!");
          setError("User not found");
        }
        const data = docSnapshot.data();


        if (data) {


          setprofilePicture(data.profilePicture);

          setAge(data.age);
          setCountry(data.country);
          setGender(data.gender);
          setUsername(data.username);
          setBio(data.bio || null);


          const savedSongs = Array.isArray(data.profileSongs)
            ? [...data.profileSongs] : [];

          setProfileSongs(savedSongs);
        }

        navigation.setOptions({
          headerTitle: `${data.username}'s profile`,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: 'lightblue',



          },

        });

        setIsLoading(false);
      } catch (error) {
        console.error("Erroabd", error.message);
        setIsLoading(true);
      }




    }

    fetchData();
  }, []);





  //songs


  const updateQuery = (index, value) => {
    const updated = [...searchQuery];
    updated[index] = value;
    setSearchQuery(updated);
  };




  const filteredSongs = profileSongs.map((value, index) => ({ item1: value, item2: feelings[index] })).filter(pair => pair.item1 !== null);

  console.log(filteredSongs);





  return (

    <View style={{ flex: 1 }} >
      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={{ alignItems: 'center', justifyContent: 'center' }} />
      ) : (
        <>
          <View style={styles.rowBlock}>

            {/*Photo*/}
            <View style={[styles.infoLeftBlock, { maxWidth: 100 }]}>
              <Image source={profilePicture ? { uri: profilePicture } : require(`${defaultProfilePicPath}`)} style={{ width: 100, height: 100, marginBottom: 10, marginRight: 30 }} />
            </View>
            {/*Personal info*/}
            <View style={styles.infoRightBlock}>

              {/*age*/}

              <Text style={styles.infoText}>Age: {age}</Text>

              {/*Country*/}
              <Text style={styles.infoText}>
                Country: {country}
              </Text>

              {/*gender*/}

              <Text style={styles.infoText}>
                Gender:{gender}
              </Text>


            </View>
          </View>

          <View style={styles.bioBox}>
            <TextInput
              value={bio}
              multiline
              editable={false}
              style={styles.bioInput}
            />

          </View>



          <FlatList
            data={filteredSongs}

            contentContainerStyle={styles.container}
            keyExtractor={(item, index) => item.item1.apiLink}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View style={styles.rowBlock}>

                {/* left*/}

                <View style={styles.leftBlock}>
                  <Text style={styles.label}>
                    When I feel {item.item2.toLowerCase()}, I listen to:
                  </Text>
                  <View style={{ position: 'relative' }}>
                  </View>
                </View>
                {/* right */}
                <View style={styles.rightBlock}>
                  <View style={styles.box}>
                    <>
                      <Image
                        source={{
                          uri:
                            item.item1.album?.image ||
                            'https://via.placeholder.com/50',
                        }}
                        style={{ width: 50, height: 50, borderRadius: 5 }}
                      />

                    </>

                  </View>


                  <View style={styles.songTextBlock}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {item.item1.name}
                    </Text>
                    <Text style={styles.artistName}>
                      {Array.isArray(item.item1.artists)
                        ? item.item1.artists.map((a) => a.name).join(', ')
                        : item.item1.artist}
                    </Text>
                  </View>

                </View>
              </View>


            )}


          />

        </>
      )}
    </View>
  );
}
export default UserProfileScreen;
const styles = StyleSheet.create({
  rowBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 5,
    width: '100%',
    position: 'relative',
    zIndex: -1,
  },

  leftBlock: {
    flex: 1,
    marginRight: 12,
    marginLeft: 20,
    marginTop: 40,
  },

  rightBlock: {
    alignSelf: 'flex-start',
    marginTop: 30,
    width: 60,
    alignItems: 'center',
    marginTop: 20,
    marginRight: 20,
  },

  infoLeftBlock: {
    flex: 1,
    marginRight: 12,
    marginLeft: 30,
    marginTop: 30,
  },

  infoRightBlock: {
    alignSelf: 'flex-start',
    width: 90,
    alignItems: 'center',
    marginTop: 50,
    marginRight: 90,
  },
  dropdownWrapper: {
    zIndex: 1000,
    elevation: 1000,
    position: 'relative',
  },
  dropdown: {
    zIndex: 1000,
  },
  dropdownList: {
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: 'white',
  },

  input: {
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },

  label: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },

  infoText: {
    fontSize: 15,

    fontWeight: '600',
  },
  profileInfo: {
    padding: 1,
    borderRadius: 5,
    flex: 1,
  },
  footerSection: {
    padding: 10,
    backgroundColor: "#fdd",
    borderRadius: 5,
    marginTop: 50,
    maxHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feelingBlock: {
    marginBottom: 24,
    alignItems: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 10,
  },
  container: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    display: 'flex'
  },
  bioBox: {
    marginTop: 20,
    marginRight: 20,
    marginLeft: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    alignItems: "center",
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    maxWidth: 300,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  placeholderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '90%',
    marginBottom: 20,
  },
  box: {
    width: 55,
    height: 55,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
  plus: {
    fontSize: 26,
    color: '#888',
  },
  songInfo: {
    fontSize: 12,
    width: 80,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    width: '90%',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    maxHeight: 150,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  songInfoBlock: {
    marginLeft: 10,
    flexShrink: 1,
  },

  songArtist: {
    fontSize: 12,
    color: '#555',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 18,
  },
  searchContainer: {
    width: '90%',
    marginBottom: 10,
  },
  songTextBlock: {
    marginTop: 4,
    alignItems: 'center',
    maxWidth: 80,
  },

  songTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    maxWidth: 60,
  },

  artistName: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    maxWidth: 60,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 6,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',

    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    zIndex: 1,
    elevation: 5,
    marginTop: 3000,
  },
  popupText: {
    color: 'white',
  },
});

