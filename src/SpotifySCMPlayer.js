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
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  useEffect(() => {
    loadSpotifySDK().then(() => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'Solara Spotify Player',
          getOAuthToken: cb => cb(accessToken),
          volume: 0.8
        });

        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
        });

        player.addListener('player_state_changed', state => {
          setIsPlaying(!state.paused);
        });

        player.connect();
        setPlayer(player);
      };
    });
  }, [accessToken]);

  // The rest of your fetchPlaylists, selectRandomPlaylist, handlePlaylistSelect, and playPlaylist functions stay the same

  // New Playback Controls
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

  if (loading) return <div>Loading playlists...</div>;
  if (playlists.length === 0) return <div>No SCM playlists found.</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">SCM Spotify Player</h2>

      {/* Playlist Options */}
      <div className="bg-white shadow rounded-xl p-4">
          <h3 className="text-xl font-semibold mb-2">Available SCM Playlists</h3>
          <ul className="space-y-2">
            {playlists.map((playlist) => (
              <li key={playlist.id}>
                <button onClick={() => handlePlaylistSelect(playlist)} variant={currentPlaylist?.id === playlist.id ? "default" : "outline"}>
                  {playlist.name}
                </button>
              </li>
            ))}
          </ul>
      </div>

      {/* Random Selector */}
      <div className="text-center">
        <button onClick={selectRandomPlaylist} className="mb-4">Play a Random Playlist</button>
      </div>

      {/* Now Playing and Controls */}
      {currentPlaylist && (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold mb-2">Now Playing:</h3>
          <p className="mb-4">{currentPlaylist.name}</p>

          <div className="space-x-4">
            <button onClick={skipPrevious}>⏮️ Previous<Button>
            <button onClick={togglePlay}>{isPlaying ? '⏸️ Pause' : '▶️ Pl'y<}b/Button>
            <button onClick={skipNext}>⏭️ Next<Button>
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

