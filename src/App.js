// --- App.js (for Solara Spotify Radio App in iframe) ---
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SpotifySCMPlayer from './SpotifySCMPlayer';
import PopupLogin from './PopupLogin';

export default function App() {
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    // Step 1: Check if token is already in localStorage
    const existingToken = localStorage.getItem('spotify_access_token');
    if (existingToken) {
      setAccessToken(existingToken);
    }

    // Step 2: Listen for token via postMessage from dashboard
    const listener = (event) => {
      console.log('[Iframe App] Received message from parent:', event);

      // Validate message origin and structure
      const isFromTrustedOrigin = event.origin === 'https://solararadio.netlify.app';
      const isSpotifyToken = event.data?.type === 'SPOTIFY_TOKEN';

      if (isFromTrustedOrigin && isSpotifyToken && event.data.token) {
        console.log('[Iframe App] Setting Spotify access token:', event.data.token);
        localStorage.setItem('spotify_access_token', event.data.token);
        setAccessToken(event.data.token);
      } else {
        console.warn('[Iframe App] Ignored message from origin:', event.origin);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            accessToken ? (
              <SpotifySCMPlayer accessToken={accessToken} />
            ) : (
              <div className="text-center p-6 text-lg text-gray-700">
                Waiting for Spotify authorization...
              </div>
            )
          }
        />
        <Route path="/popup-login" element={<PopupLogin />} />
      </Routes>
    </Router>
  );
}

