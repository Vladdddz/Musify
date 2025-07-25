import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, Image, ActivityIndicator,StyleSheet } from 'react-native';
import { searchSongs } from './SpotifyApi';
import { TouchableOpacity } from 'react-native';
const SpotifySearch = ({onSongPress}) => {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    const results = await searchSongs(query);
    setSongs(results);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search for a song..."
        value={query}
        onChangeText={setQuery}
        style={styles.searchBar}
        
      />
      <Button title="Search" onPress={handleSearch} />

      {loading && <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 10 }} />}

      <FlatList
      style={styles.list}
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: '100%' }}>
            <TouchableOpacity onPress={() => onSongPress(item)}>
              <View style={styles.songItem}>
                <Image style={styles.image} source={{ uri: item.album.images[0]?.url }} />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.name}</Text>
                  <Text style={styles.songArtist}>{item.artists.map(artist => artist.name).join(', ')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default SpotifySearch;
const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    alignItems: 'center', 
  },
  searchBar:{
    width:300, 
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    textAlign: 'center',
    alignItems:'left'
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  list: {
    width: '100%',
    marginTop: 10,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  songInfo: {
    marginLeft: 10,
    flexShrink: 1,
  },
  songTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  songArtist: {
    color: 'gray',
    fontSize: 12,
  },
});