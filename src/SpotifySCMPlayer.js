import React, { useState, useEffect } from 'react';
import './SpotifySCMPlayer.css';

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

  if (loading) return <div className="text-center text-gray-800">Loading Space Cowgirl Radio...</div>;
  if (playlists.length === 0) return <div className="text-center text-gray-800">No Space Cowgirl playlists found.</div>;

  return (
    <div className="player-wrapper">
      <h2>Space Cowgirl Mixes</h2>

      <div className="select-section">
        <label htmlFor="playlist">Select a Playlist</label>
        <select
          id="playlist"
          onChange={handleSelectChange}
          value={currentPlaylist?.id}
          className="playlist-select"
        >
          {playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name.replace(/^SCM:\s*/i, '')}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            const random = playlists[Math.floor(Math.random() * playlists.length)];
            setCurrentPlaylist(random);
          }}
          className="button"
        >
          🎲 Play a Random Playlist
        </button>
      </div>

      {currentPlaylist && (
        <div className="now-playing">
          <h3>Now Playing:</h3>
          <p>
            {currentPlaylist.name.replace(/^SCM:\s*/i, '')}
          </p>

          <div className="play-controls">
            <button onClick={skipPrevious} className="button">⏮️</button>
            <button onClick={togglePlay} className="button">
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button onClick={skipNext} className="button">⏭️</button>
          </div>

          <div className="volume-control">
            <label htmlFor="volume">Volume:</label>
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

