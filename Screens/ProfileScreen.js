//css
import { useLayoutEffect, View, ActivityIndicator, Text, Button, TouchableOpacity, Pressable, StyleSheet, Image, FlatList, Modal, Linking, TextInput, } from 'react-native';
import * as Device from 'expo-device';
import React, { useState, useEffect } from 'react';

//database
import { db } from "../FirebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getCurrentUserId } from "../FirebaseUtilities";
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { signOut } from 'firebase/auth';
//etc
//images
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

//songs

import { searchSongs } from '../api/SpotifyApi';

//countries
import countries from 'world-countries';
import DropDownPicker from 'react-native-dropdown-picker';
import { flexDirection, maxWidth } from '@mui/system';
import { useIsFocused } from '@react-navigation/native';
const getFlagEmoji = (countryCode) =>
  countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
const generatedItems = countries.map((country) => ({
  label: `${getFlagEmoji(country.cca2)} ${country.name.common}`,
  value: country.cca2,
}));
const ProfileScreen = ({ navigation }) => {
  //modal
  //profile pic
  const [profilePicture, setprofilePicture] = useState(null);
  const [isLoading, setIsLoading] = useState(null);
  const [id, setid] = useState(0);

  //age
  const [age, setAge] = useState(null);
  const [isEditingAge, setIsEditingAge] = useState(false);

  //country
  const [country, setCountry] = useState(null);
  const [openCountry, setOpenCountry] = useState(false);
  const [items, setItems] = useState(generatedItems);
  const [isEditingCountry, setIsEditingCountry] = useState(false);

  //gender
  const [gender, setGender] = useState(null);
  const [genders, setGenders] = useState([{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Other', value: 'Other' }]);
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [openGender, setOpenGender] = useState(false);

  //bio
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);

  const [username, setUsername] = useState(null);
  //songs
  const [searchQuery, setSearchQuery] = useState([''], [''], [''], [''], ['']);
  const [profileSongs, setProfileSongs] = useState([null, null, null, null, null]);
  const feelings = ['Sad', 'Bored', 'Happy', 'Lonely', 'Nostalgic'];
  const [results, setResults] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [userDocRef, setUserDocRef] = useState(null);
  const [songText, setSongText] = useState(['Search for a song...']);

  //report a problem
  const [reportModalVisible, setReportModalVisible] = useState(null);
  const [email, setEmail] = useState(null);
  const defaultProfilePicPath = '../defaultprofilepic.png';


  const isFocused = useIsFocused();
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user && isFocused) {

        fetchUserData(user.uid);
      }
    });

    return unsubscribe;
  }, [isFocused]);


  const fetchUserData = async (userId) => {
    setIsLoading(true);

    try {

      const q = query(collection(db, "users"), where("authUid", "==", userId));
      const snap = await getDocs(q);

      if (snap.empty) {
        console.error("No user document found.");
        return;
      }

      const userDoc = snap.docs[0];
      const data = userDoc.data();

      if (data) {
        const DocRef = doc(db, "users", userDoc.id);
        setUserDocRef(DocRef);
        if (!data.id) { console.log("cannot fetch user"); return; }
        setid(data.id);
        setprofilePicture(data.profilePicture);

        setEmail(data.email || " ");
        if (data.age) setAge(data.age.toString());
        setCountry(data.country || '');
        setGender(data.gender || '');
        setUsername(data.username);
        if (data.bio) { setBio(data.bio); }


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





  const saveImageToFirestore = async (profilePicture) => {
    try {

      await updateDoc(userDocRef, {
        profilePicture: profilePicture,
      });
    } catch (error) {
      console.error("Error saving profile picture:", error);
    }
  };


  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    console.log("pana aici a mers");
    console.log(result);
    if (!result.canceled) {
      console.log(result.assets[0].uri);
      uploadImageToCloudinary(id, result.assets[0].uri, (url) => {
        setprofilePicture(url);
        console.log("URL:", url);
        saveImageToFirestore(url);
      }, (error) => {
        console.log("error uploading picture", error);
      })
    };

  };

  const uploadImageToCloudinary = async (id, imageUri, onSuccess, onError) => {
    const cloudName = 'drw5oxio0';
    const uploadPreset = 'default';
    if (!imageUri) return;

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${id}.jpg`,
    });
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.secure_url) {
        onSuccess(response.data.secure_url);
      }
    } catch (error) {

      onError(error);
    }
  };


  //songs
  const saveSongsToFirestore = async (userId, selectedSongs) => {


    const simplifiedSongs = selectedSongs.map((song) => {
      if (!song) return null;
      return {
        name: song.name,
        artist: Array.isArray(song.artists)
          ? song.artists.map((a) => a.name).join(', ')
          : song.artist || '',
        album: {
          name: song.album?.name || '',
          image: song.album?.image || '',
        },
        apiLink: song.apiLink || song.href || '',
      };
    });

    await updateDoc(userDocRef, {
      profileSongs: simplifiedSongs,
    });

    console.log("✅ Songs saved successfully");
  };
  const handleSearch = async (index) => {

    setSongText("Search for a song...");
    const query = searchQuery[index];
    if (!query.trim()) return;

    setActiveSearchIndex(index);
    const data = await searchSongs(query);
    setResults(data);
  };
  const handleSongSelect = (song) => {
    if (activeSearchIndex === null) return;

    const updated = [...profileSongs];
    updated[activeSearchIndex] = {
      ...song,
      album: {
        ...song.album,
        image: song.album?.images?.[0]?.url || '',
      },
    };
    setProfileSongs(updated);
    setResults([]);

  };
  const updateQuery = (index, value) => {
    const updated = [...searchQuery];
    updated[index] = value;
    setSearchQuery(updated);
  };

  useEffect(() => {
    const save = async () => {
      const userId = await getCurrentUserId();
      console.log("Current user ID:", userId);
      await saveSongsToFirestore(userId, profileSongs);
    };

    if (profileSongs.some((song) => song)) {
      save();
    }
  }, [profileSongs]);


  const saveAge = async () => {
    if (!userDocRef) {
      console.log("error userdocref")
      return;
    }
    if (age < 5 || age > 100) {
      setAge(null);
      alert("enter your real age.");
      return;
    }

    try {

      await updateDoc(userDocRef, { age: age });
      setIsEditingAge(false);
      checkPersonalInfo();
    }
    catch (err) {
      console.error("couldnt save age:", err);

    }
  }


  //countries





  const saveCountry = async (selectedCountry) => {

    if (!userDocRef) {
      console.log("error country")
      return;
    }
    try {

      await updateDoc(userDocRef, { country: selectedCountry });
      setCountry(selectedCountry);
      setIsEditingCountry(false);
      checkPersonalInfo();

    }
    catch (err) {
      console.error("couldnt save country:", err);

    }
  }



  //gender


  const saveGender = async (selectedGender) => {
    if (!userDocRef) {
      console.log("error userdocref")
      return;
    }

    try {

      await updateDoc(userDocRef, { gender: selectedGender });
      setIsEditingGender(false);
      setGender(selectedGender);
      checkPersonalInfo();
    }
    catch (err) {
      console.error("couldnt save gender:", err);

    }
  }

  //bio

  const saveBio = async () => {
    if (!userDocRef) {
      console.log("error userdocref")
      return;
    }
    setIsEditingBio(false);
    try {

      await updateDoc(userDocRef, { bio: bio });
      setBio(bio);
      checkPersonalInfo();
    }
    catch (err) {
      console.error("couldnt save bio:", err);

    }
  }


  const checkPersonalInfo = () => {

    if (bio && gender && country && age) {

      alert("Personal information saved.");
    }
  }

  //logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      await AsyncStorage.removeItem("userId");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  //report a problem
  const handleReportSubmit = () => {
    const receiverEmail = 'dobrevlad32@gmail.com';
    const senderEmail = email;
    const subject = 'Report a problem';
    const body = 'Describe your problem here...';

    const url = `mailto:${receiverEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url).catch(err => console.error('Email error:', err));
    setReportModalVisible(false);
  };

  return (
    <View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={{
          alignItems: 'center', justifyContent: 'center'
        }} />
      ) : (
        <>
          <FlatList
            data={feelings}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.container}
            ListHeaderComponent={
              <View style={{ display: 'flex' }}>
                <View style={{ flexDirection: 'row', marginLeft: 0, }}>

                  {/*Profile*/}
                  <View style={{ display: 'flex', maxWidth: 100 }}>
                    <Image source={profilePicture ? { uri: profilePicture } : require(`${defaultProfilePicPath}`)} style={{ width: 100, height: 100, marginBottom: 10, marginRight: 30 }} />

                    <Button
                      title="Edit Profile Picture"
                      onPress={handlePickImage}

                    />
                  </View>

                  {/*Personal info*/}
                  <View style={{ marginLeft: 20, marginTop: 20, }}>

                    {/*age*/}
                    <View style={{ marginBottom: 16, maxWidth: 200, flexDirection: 'row', maxHeight: 50 }}>
                      {!age || isEditingAge ? (
                        <>
                          <TextInput
                            placeholder="Enter your age"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                            style={styles.input}

                          />
                          <TouchableOpacity onPress={saveAge} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ marginLeft: 8, fontSize: 16 }}>✅</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity onPress={() => setIsEditingAge(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.infoText}>Age: {age}</Text>
                          <Text style={{ marginLeft: 8, fontSize: 16 }}>✏️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {/*Country*/}
                    {!country || isEditingCountry ? (
                      <>
                        <View style={{ zIndex: 1000, position: 'relative', marginBottom: openCountry ? 250 : 16, marginRight: 180 }}>
                          <DropDownPicker
                            open={openCountry}
                            value={country}
                            items={items}
                            setOpen={setOpenCountry}
                            setValue={setCountry}
                            setItems={setItems}
                            onClose={() => {
                              if (isEditingCountry)
                                setIsEditingCountry(false);
                            }}
                            placeholder="Choose a country"
                            searchable={true}
                            searchPlaceholder="Search your country..."
                            listMode="SCROLLVIEW"
                            style={styles.dropdown}
                            onSelectItem={(country) => {

                              saveCountry(country.value);
                            }}
                            dropDownContainerStyle={{ zIndex: 1000, elevation: 1000, backgroundColor: 'white', maxHeight: 250, }}
                          />
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setIsEditingCountry(true)}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text style={styles.infoText}>
                          Country: {items.find(item => item.value === country)?.label}
                        </Text>
                        <Text style={{ marginLeft: 8, fontSize: 16 }}>✏️</Text>
                      </TouchableOpacity>
                    )}
                    {/*gender*/}
                    {!gender || isEditingGender ? (
                      <>
                        <View style={{ zIndex: 1000, marginRight: 180 }}>
                          <DropDownPicker
                            open={openGender}
                            value={gender}
                            items={genders}
                            setOpen={setOpenGender}
                            setValue={setGender}
                            setItems={setGenders}
                            onClose={() => {
                              if (isEditingGender)
                                setIsEditingGender(false);
                            }}
                            placeholder="Choose a gender"
                            searchable={false}
                            style={styles.dropdown}
                            onSelectItem={(gender) => {

                              saveGender(gender.value);
                            }}
                            dropDownContainerStyle={{ zIndex: 1000, elevation: 1000, backgroundColor: 'white', }}
                          />
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setIsEditingGender(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}
                      >
                        <Text style={styles.infoText}>
                          Gender:{gender}
                        </Text>
                        <Text style={{ marginLeft: 8, fontSize: 16 }}>✏️</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                </View>
                {!bio || isEditingBio ? (
                  <View style={styles.bioBox}>
                    <TextInput
                      value={bio || ''}
                      onChangeText={setBio}
                      multiline

                      style={styles.bioInput}
                      placeholder={bio || `Tell us about ${username}! Hobbies, passions, fun stories.`}
                    />
                    <Button title="Save" onPress={() => saveBio()} />
                  </View>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => setIsEditingBio(true)}>
                      <View style={styles.bioBox}>
                        <Text>{bio}</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>

            }

            ListFooterComponent={
              <View style={styles.rowBlock}>
                <View style={styles.footerSection}>
                  <Button title="Log out" color='crimson' onPress={handleLogout} />
                </View>
                <View style={styles.footerSection}>
                  <Button title="Report a Problem" color="crimson" onPress={() => setReportModalVisible(true)} />

                  <Modal
                    animationType="fade"
                    transparent
                    visible={reportModalVisible}
                    onRequestClose={() => setReportModalVisible(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Report a Problem</Text>
                        <Text style={styles.modalText}>
                          Confirm to report a problem. This will open your email app.
                          Make sure to provide proof, such as screenshots, of the issue you are facing.
                        </Text>

                        <View style={styles.buttonRow}>
                          <Pressable onPress={() => setReportModalVisible(false)} style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancel</Text>
                          </Pressable>

                          <Pressable onPress={handleReportSubmit} style={styles.confirmButton}>
                            <Text style={styles.confirmText}>Confirm</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Modal>
                </View>
              </View>
            }
            renderItem={({ item, index }) => (
              <>
                <View style={styles.rowBlock}>

                  {/* LEFT: Text + input + button */}
                  <View style={styles.leftBlock}>
                    <Text style={styles.label}>
                      When I feel {item.toLowerCase()}, I listen to:
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        placeholder="Search a song..."
                        value={searchQuery[index]}
                        onChangeText={(text) => { updateQuery(index, text); }}
                        onSubmitEditing={() => handleSearch(index)}
                        style={styles.searchBar}
                      />

                      <Button title="Search" onPress={() => { handleSearch(index); }} />
                    </View>
                  </View>
                  {/* RIGHT: Placeholder */}
                  <View style={styles.rightBlock}>
                    <View style={styles.box}>
                      {profileSongs[index] ? (
                        <>
                          <Image
                            source={{
                              uri:
                                profileSongs[index].album?.image ||
                                'https://via.placeholder.com/50',
                            }}
                            style={{ width: 50, height: 50, borderRadius: 5 }}
                          />
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => {
                              const updated = [...profileSongs];
                              updated[index] = null;
                              setProfileSongs(updated);
                            }}
                          >
                            <Text style={styles.removeText}>−</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <Text style={styles.plus}>+</Text>
                      )}
                    </View>

                    {profileSongs[index] && (
                      <View style={styles.songTextBlock}>
                        <Text style={styles.songTitle} numberOfLines={1}>
                          {profileSongs[index].name}
                        </Text>
                        <Text style={styles.artistName}>
                          {Array.isArray(profileSongs[index].artists)
                            ? profileSongs[index].artists.map((a) => a.name).join(', ')
                            : profileSongs[index].artist}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* search result list */}
                {activeSearchIndex === index && results.length > 0 && (
                  <FlatList
                    contentContainerStyle={{ zIndex: 1 }}
                    data={results}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    renderItem={({ item }) => (
                      <TouchableOpacity onPress={() => { handleSongSelect(item); updateQuery(index, ""); }}>
                        <View style={styles.songItem}>
                          <Image
                            source={{ uri: item.album.images[0]?.url }}
                            style={styles.image}
                          />
                          <View style={styles.songInfoBlock}>
                            <Text style={styles.songTitle}>{item.name}</Text>
                            <Text style={styles.songArtist}>
                              {item.artists.map((a) => a.name).join(', ')}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </>
            )}

          />

        </>
      )}
    </View>
  );
}
export default ProfileScreen;
const styles = StyleSheet.create({
  rowBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 5,
    width: '100%',
    zIndex: -1,
  },

  leftBlock: {
    flex: 1,
    marginRight: 12,
  },

  rightBlock: {
    alignSelf: 'flex-start',
    marginTop: 30,
    width: 60,
    alignItems: 'center',
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
  },
  bioBox: {
    marginTop: 20,
    marginRight: 20,
    marginLeft: 20,
    marginBottom: 20,
    minWidth: 200,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    maxWidth: 270,
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

