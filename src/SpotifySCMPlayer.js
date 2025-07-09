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
      if (window.Spotify) return resolve();
      window.onSpotifyWebPlaybackSDKReady = () => resolve();

      const script = document.createElement('script');
      script.id = 'spotify-player';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    });
  }

  useEffect(() => {
    loadSpotifySDK().then(() => {
      const player = new window.Spotify.Player({
        name: 'Solara Spotify Player',
        getOAuthToken: cb => cb(accessToken),
        volume: 0.8
      });

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
      });

      player.addListener('player_state_changed', state => {
        setIsPlaying(!state.paused);
      });

      player.connect();
      setPlayer(player);
    });
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) fetchPlaylists();
  }, [accessToken]);

  useEffect(() => {
    if (deviceId && currentPlaylist) {
      playPlaylist(currentPlaylist.uri);
    }
  }, [deviceId, currentPlaylist]);

  const fetchPlaylists = async () => {
    try {
      let results = [];
      let url = 'https://api.spotify.com/v1/me/playlists?limit=50';

      while (url) {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        const scmPlaylists = data.items.filter(p =>
          p.name && p.name.trim().toUpperCase().startsWith('SCM')
        );
        results = [...results, ...scmPlaylists];
        url = data.next;
      }

      setPlaylists(results);
      if (results.length > 0) {
        setCurrentPlaylist(results[0]);
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
    } finally {
      setLoading(false);
    }
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

  const handleSelectChange = (e) => {
    const selected = playlists.find(p => p.id === e.target.value);
    if (selected) setCurrentPlaylist(selected);
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

  if (loading) return <div className="text-center text-gray-800">Loading SCM playlists...</div>;
  if (playlists.length === 0) return <div className="text-center text-gray-800">No SCM playlists found.</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 text-gray-900">
      <h2 className="text-2xl font-bold mb-4 text-[#B7410E]">SCM Spotify Player</h2>

      <div className="bg-[#D9C7A1] shadow rounded-xl p-4 space-y-4">
        <label htmlFor="playlist" className="block font-semibold mb-1 text-[#9CAF88]">
          Select a Playlist
        </label>
        <select
          id="playlist"
          onChange={handleSelectChange}
          value={currentPlaylist?.id}
          className="w-full p-2 border border-[#9CAF88] rounded bg-white text-gray-900"
        >
          {playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name.replace(/^SCM:\\s*/i, '')}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            const random = playlists[Math.floor(Math.random() * playlists.length)];
            setCurrentPlaylist(random);
          }}
          className="w-full p-2 bg-[#B7410E] text-white rounded hover:bg-[#9C360C]"
        >
          🎲 Play a Random Playlist
        </button>
      </div>

      {currentPlaylist && (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-[#9CAF88]">Now Playing:</h3>
          <p className="mb-2 text-[#333]">{currentPlaylist.name.replace(/^SCM:\\s*/i, '')}</p>

          <div className="space-x-4">
            <button onClick={skipPrevious} className="px-3 py-1 bg-[#D9C7A1] text-black rounded">⏮️</button>
            <button onClick={togglePlay} className="px-4 py-2 bg-[#9CAF88] text-white rounded hover:bg-[#88A074]">
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button onClick={skipNext} className="px-3 py-1 bg-[#D9C7A1] text-black rounded">⏭️</button>
          </div>

          <div className="mt-4 text-sm">
            <label htmlFor="volume" className="mr-2 text-[#9CAF88]">Volume:</label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={changeVolume}
              className="accent-[#B7410E]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

