import { Buffer } from 'buffer';

let accessToken = null;


export const fetchImageFromApiLink = async (apiLink) => {
  const token = await getAccessToken(); 
  try {
    const response = await fetch(apiLink, {
      method:'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch song data');
    }

    const songData = await response.json();
    return songData.album?.images?.[0]?.url || '';
  } catch (err) {
    console.error("Error fetching image from apiLink:", err);
    return '';
  }
};



export const getAccessToken = async () => {
  

  const CLIENT_ID = '';
  const CLIENT_SECRET = '';

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }).toString(),
    });

    const data = await response.json();

    if (!data.access_token) {
      console.error("Error getting access token:", data);
      return null;
    }

  
    accessToken = data.access_token;
 
    return accessToken;
  } catch (error) {
    console.error("Network Error:", error);
    return null;
  }
};


export const searchSongs = async (query) => {
    if (!query) return [];
  
    const token = await getAccessToken();
  
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  
    const data = await response.json();
    const UniqueTracks=[];
    const TrackKeys=[];
    for(const track of data.tracks.items)
    {
      const TrackAndArtist=`${track.name.toLowerCase()}+${track.artists[0].name.toLowerCase()}`;
     if(!TrackKeys.includes(TrackAndArtist))
        {
          TrackKeys.push(TrackAndArtist);       
          UniqueTracks.push(track);
        }
    }

    return UniqueTracks;
  };
  
