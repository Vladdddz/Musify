import React, { useState, useEffect } from 'react';
import { useLayoutEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  TextInput,
  Button,
  Alert,
} from 'react-native';
import { searchSongs } from '../api/SpotifyApi';
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { fetchImageFromApiLink } from '../api/SpotifyApi';
import { getAuth } from 'firebase/auth';
import { getCurrentUserId } from "../FirebaseUtilities";
import { Keyboard } from 'react-native';
import { Dimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
const SearchScreen = ({ navigation }) => {

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: 'lightblue',
      },
    });
  }, [navigation]);

  const [selectedSongs, setSelectedSongs] = useState([null, null, null, null, null]);
  const [SearchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showList, setShowList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedGenres, setSelectedGenres] = useState([]);
  const screenHeight = Dimensions.get('window').height;

  const isFocused = useIsFocused();
  useEffect(() => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    setIsLoading(true);
    const loadSavedSongs = async () => {


      if (!userId) {
        console.error("No user logged in.");
        return;
      }

      try {
        const q = query(collection(db, "users"), where("authUid", "==", userId));
        const snap = await getDocs(q);

        if (snap.empty) {
          console.error("No user document found.");
          return;
        }

        const userDoc = snap.docs[0];
        const savedSongs = userDoc.data()?.songs || [];
        while (savedSongs.length < 5)
          savedSongs.push(null);
        setSelectedSongs(savedSongs);

      } catch (error) {
        console.error("Error loading saved songs:", error);
      }
    };


    const loadSavedGenres = async () => {
      try {
        const q = query(collection(db, "users"), where("authUid", "==", userId));
        const snap = await getDocs(q);
        const userDoc = snap.docs[0];
        const savedGenres = userDoc.data()?.genres || [];
        setSelectedGenres(savedGenres);
      }
      catch (err) { console.log(err); }
    }
    setIsLoading(false);
    loadSavedSongs();
    loadSavedGenres();

  }, []);





  const saveSongs = async (userId, selectedSongs) => {

    const userRef = doc(db, "users", userId.toString());

    const simplifiedSongs = selectedSongs.map((song) => {
      if (!song) return null;
      return {
        name: song.name,
        artist: Array.isArray(song.artists) ? song.artists.map((a) => a.name).join(', ') : song.artist || '',
        album: {
          name: song.album?.name || '',
          image: song.album?.image || '',
        },
        apiLink: song.apiLink || song.href || '',
      };
    });

    await updateDoc(userRef, {
      songs: simplifiedSongs,
    });

    console.log("Songs saved successfully");
  };



  useEffect(() => {
    const save = async () => {
      const userId = await getCurrentUserId();
      console.log("Current user ID:", userId);
      await saveSongs(userId, selectedSongs);
    };

    if (selectedSongs.some((song) => song)) {
      save();
    }
  }, [selectedSongs]);


  const handleCancel = () => {
    setSearchQuery('');
    setResults([]);
    setShowList(false);
    Keyboard.dismiss();
  };



  const handleSearch = async () => {
    console.log("Search button pressed.");
    try {
      if (!SearchQuery.trim()) { console.log("search query empty."); return; }

      const data = await searchSongs(SearchQuery);
      console.log(data);
      setResults(data);


      setShowList(true);
      Keyboard.dismiss();
    } catch (error) { console.log(error); }
  };

  const handleSongPress = async (song) => {
    console.log('Selected songs:');
    selectedSongs.forEach((s) =>
      console.log('→', s?.name, '-', s?.artist)
    );
    const normalize = (text) => (text ? text.trim().toLowerCase() : '');
    const isDuplicate = await selectedSongs.some((item) => {
      const nameMatch = normalize(item?.name) === normalize(song?.name);
      const artistMatch = normalize(item?.artist) === normalize(song?.artist);
      return nameMatch && artistMatch;
    });

    if (isDuplicate) {
      Alert.alert('Duplicate', 'This song is already added.');
      return;
    }

    const firstEmptyIndex = selectedSongs.findIndex((s) => s === null);
    if (firstEmptyIndex === -1) {
      Alert.alert('Limit reached', 'You can only add 5 songs.');
      return;
    }

    const insertedSong = {
      ...song,
      album: {
        ...song.album,
        image: song.album?.images?.[0]?.url || '',
      },
      id: song.id,
    };

    const updatedSongs = [...selectedSongs];
    updatedSongs[firstEmptyIndex] = insertedSong;
    setSelectedSongs(updatedSongs);

    try {
      const userId = await getCurrentUserId();
      await saveSongs(userId, updatedSongs);
      setResults([]);
      Keyboard.dismiss();
      setShowList(false);

    } catch (err) {
      console.error("Error saving songs:", err);
    }

    setSearchQuery('');
    Keyboard.dismiss();
  }


  const handleRemoveSong = async (index) => {
    const updated = [...selectedSongs];
    updated[index] = null;
    setSelectedSongs(updated);
    const userId = await getCurrentUserId();
    await saveSongs(userId, updated);

  };




  //genres  
  const groupedGenres = {
    Popular: [
      'Pop',
      'Dance Pop',
      'Teen Pop',
      'Electropop',
      'Synthpop'
    ],

    Rock: [
      'Classic Rock',
      'Alternative Rock',
      'Indie Rock',
      'Punk Rock',
      'Hard Rock',
      'Progressive Rock',
    ],

    Metal: [
      'Heavy Metal',
      'Death Metal',
      'Black Metal',
      'Metalcore',
      'Symphonic Metal'
    ],

    Rap: [
      'Hip Hop',
      'Rap',
      'Trap',
    ],

    Electronic: [
      'EDM',
      'House',
      'Techno',
      'Drum & Bass',
      'Trance',
      'Dubstep',
      'Ambient',
      'Lo-fi'
    ],

    Jazz_Blues: [
      'Jazz',
      'Smooth Jazz',
      'Bebop',
      'Swing',
      'Blues',
      'Delta Blues',
      'Jazz Fusion'
    ],

    Classical: [
      'Classical',
      'Baroque',
      'Romantic',
      'Modern Classical',
      'Opera',
      'Choral',
      'Symphonic'
    ],

    RnB: [
      'R&B',
      'Neo Soul',
      'Soul',
      'Motown',
      'Funk'
    ],

    World: [
      'Reggae',
      'Latin',
      'Salsa',
      'Cumbia',
      'K-Pop',
      'J-Pop',
      'Bossa Nova',
      'Flamenco'
    ],

    Country_Folk: [
      'Country',
      'Bluegrass',
      'Americana',
      'Alt-Country',
      'Folk',

    ],

    Indie_Alternative: [
      'Indie Pop',
      'Dream Pop',
      'Alternative'
    ],



    Soundtracks: [
      'Film SoundTracks',
      'Video Game Music',
      'Anime OST',
      'Broadway/Musicals'
    ]
  };




  const toggleGenre = async (genre) => {

    const updatedGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];

    setSelectedGenres(updatedGenres);
    try {
      const userId = await getCurrentUserId();
      const userRef = doc(db, "users", userId.toString());
      await updateDoc(userRef, {
        genres: updatedGenres,
      });
    } catch (err) { console.log(err); }
  };




  return (
    <View style={{ flex: 1 }}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={{
          alignItems: 'center', justifyContent: 'center'
        }} />
      ) : (
        <>
          <View style={styles.container}>
            <Text style={styles.title}>Add Your Top 5 Songs</Text>

            {/*Placeholdere */}
            <View style={styles.placeholderContainer}>
              {selectedSongs.map((song, index) => (
                <View key={index} style={styles.placeholderBox}>
                  <View style={styles.box}>
                    {song ? (
                      <>
                        <Image
                          source={{ uri: song.album?.image || 'https://via.placeholder.com/50' }}
                          style={{ width: 50, height: 50, borderRadius: 5 }}
                        />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveSong(index)}
                        >
                          <Text style={styles.removeText}>−</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.plus}>+</Text>
                    )}
                  </View>

                  {song && (
                    <View style={styles.songTextBlock}>
                      <Text style={styles.songTitle} numberOfLines={1} ellipsizeMode="tail">
                        {song.name}
                      </Text>
                      <Text style={styles.artistName}>
                        {Array.isArray(song.artists)
                          ? song.artists.map((a) => a.name).join(', ')
                          : song.artist || ''}
                      </Text>
                    </View>

                  )}
                </View>

              ))}
            </View>

            {/*Search bar*/}
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Search for a song..."
                value={SearchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchBar}


              />
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <View style={{ marginTop: 10 }}>
                <Button title="Search" onPress={handleSearch} />
              </View>

            </View>
            {/*genres*/}
            {!showList && (
              <View style={styles.genreContainer}>
                <Text style={styles.title}>Select your favorite genres:</Text>
                <ScrollView contentContainerStyle={styles.chipContainer}>
                  {Object.entries(groupedGenres).map(([group, genres]) => (
                    <View key={group} style={styles.genreGroup}>
                      <Text style={styles.groupTitle}>{group.replace(/_/g, ' & ')}</Text>
                      <FlatList
                        data={genres}
                        horizontal
                        keyExtractor={(item) => item}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            onPress={() => toggleGenre(item)}
                            style={[
                              styles.chip,
                              selectedGenres.includes(item)
                                ? styles.chipSelected
                                : styles.chipUnselected
                            ]}
                          >
                            <Text
                              style={
                                selectedGenres.includes(item)
                                  ? styles.chipTextSelected
                                  : styles.chipTextUnselected
                              }
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            {/*result list*/}
            {showList && (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSongPress(item)}>
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
          </View>
        </>)}
    </View>


  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
    backgroundColor: '#fff',

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    width: '100%',

  },

  searchBar: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  list: {
    width: '95%',
    zIndex: 1,

    backgroundColor: '#fff',
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



  },
  removeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 18,
  },
  searchContainer: {
    width: '90%',
    marginBottom: 0,

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


  genreContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ccc',
    marginBottom: 210,
  },
  chipContainer: {
    gap: 10,
    paddingVertical: 10,
  },
  genreGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#4fc3f7',
    borderColor: '#4fc3f7',
  },
  chipUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#aaa',
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  chipTextUnselected: {
    color: '#444',
  },

});
