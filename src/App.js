import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SpotifySCMPlayer from './SpotifySCMPlayer';
import PopupLogin from './PopupLogin';

function App() {
  const [accessToken, setAccessToken] = useState(null);

  // Load token from localStorage if already present
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Listen for token sent via postMessage (from parent or popup)
  useEffect(() => {
    const listener = (event) => {
      if (
        event.origin === 'https://solararadio.netlify.app/' && // 👈 only accept from trusted site
        event.data?.type === 'SPOTIFY_TOKEN'
      ) {
        localStorage.setItem('spotify_access_token', event.data.token);
        setAccessToken(event.data.token);
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SpotifySCMPlayer accessToken={accessToken} />} />
        <Route path="/popup-login" element={<PopupLogin />} />
      </Routes>
    </Router>
  );
}

export default App;

