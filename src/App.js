import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SpotifyLogin from './SpotifyLogin';
import SpotifyCallback from './SpotifyCallback';
import SpotifySCMPlayer from './SpotifySCMPlayer';

export default function App() {
  const accessToken = localStorage.getItem('spotify_access_token');

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            accessToken ? (
              <SpotifySCMPlayer accessToken={accessToken} />
            ) : (
              <SpotifyLogin />
            )
          }
        />
        <Route path="/" element={<SpotifySCMPlayer />} />   
        <Route path="/popup-login" element={<PopupLogin />} />
        <Route path="/callback" element={<SpotifyCallback />} />
      </Routes>
    </Router>
  );
}

