import React, { useState, useEffect } from 'react';

export default function SpotifySCMPlayer({ accessToken }) {
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);

  function loadSpotifySDK() {
    return new Promise((resolve) => {
      const existingScript = document.getElementById('spotify-player');
      if (existingScript) return resolve(); // Already loaded
      const script = document.createElement('script');
      script.id = 'spotify-player';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  useEffect(() => {
    loadSpotifySDK().then(() => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const spotifyPlayer = new window.Spotify.Player({
          name: 'Solara Spotify Player',
          getOAuthToken: cb => cb(accessToken),
          volume: 0.8
        });

        spotifyPlayer.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
        });

        spotifyPlayer.addListener('player_state_changed', (state) => {
          setIsPlaying(state && !state.paused);
        });

        spotifyPlayer.connect();
        setPlayer(spotifyPlayer);
      };
    });
  }, [accessToken]);

  const fetchPlaylists = async () => {
    try {
      let results = [];
      let url = 'https://api.spotify.com/v1/me/playlists?limit=50';

      while (url) {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();

        // ✅ Filter playlists that start with "SCM"
        const scmPlaylists = data.items.filter(p =>
          p.name && p.name.trim().toUpperCase().startsWith('SCM')
        );

        results = [...results, ...scmPlaylists];
        url = data.next;
      }

      setPlaylists(results);
      if (results.length > 0) {
        selectRandomPlaylist(results);
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchPlaylists();
  }, [accessToken]);

  const selectRandomPlaylist = (list = playlists) => {
    if (!list.length) return;
    const random = list[Math.floor(Math.random() * list.length)];
    setCurrentPlaylist(random);
    if (deviceId) playPlaylist(random.uri);
  };

  const handlePlaylistSelect = (playlist) => {
    setCurrentPlaylist(playlist);
    if (deviceId) playPlaylist(playlist.uri);
  };

  const playPlaylist = async (playlistUri) => {
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ context_uri: playlistUri })
    });
  };

  const togglePlay = async () => {
    if (player) await player.togglePlay();
  };

  const skipNext = async () => {
    if (player) await player.nextTrack();
  };

  const skipPrevious = async () => {
    if (player) await player.previousTrack();
  };

  const changeVolume = async (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (player) await player.setVolume(newVolume);
  };

  if (loading) return <div>Loading SCM playlists...</div>;
  if (playlists.length === 0) return <div>No SCM playlists found in your Spotify account.</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 text-gray-900">
      <h2 className="text-2xl font-bold mb-4">SCM Spotify Player</h2>

      <div className="bg-white shadow rounded-xl p-4">
        <h3 className="text-xl font-semibold mb-2">Available SCM Playlists</h3>
        <ul className="space-y-2">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <button
                onClick={() => handlePlaylistSelect(playlist)}
                className={`p-2 w-full text-left rounded ${
                  currentPlaylist?.id === playlist.id ? 'bg-green-600 text-white' : 'bg-gray-100'
                }`}
              >
                {playlist.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <button
          onClick={selectRandomPlaylist}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🎲 Play a Random SCM Playlist
        </button>
      </div>

      {currentPlaylist && (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Now Playing:</h3>
          <p className="mb-2">{currentPlaylist.name}</p>

          <div className="space-x-4">
            <button onClick={skipPrevious} className="px-3 py-1 bg-gray-300 rounded">⏮️</button>
            <button onClick={togglePlay} className="px-4 py-2 bg-green-600 text-white rounded">
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button onClick={skipNext} className="px-3 py-1 bg-gray-300 rounded">⏭️</button>
          </div>

          <div className="mt-4">
            <label htmlFor="volume" className="mr-2">Volume:</label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={changeVolume}
            />
          </div>
        </div>
      )}
    </div>
  );
}

