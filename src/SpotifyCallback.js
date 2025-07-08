import React, { useEffect } from 'react';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = 'https://solara-spotify.vercel.app/callback';

export default function SpotifyCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const codeVerifier = localStorage.getItem('spotify_code_verifier');

    if (code) {
      exchangeToken(code, codeVerifier);
    } else {
      console.error('No authorization code found.');
    }
  }, []);

  const exchangeToken = async (code, codeVerifier) => {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });

      const data = await response.json();

      if (data.access_token) {
        const expiryTime = new Date().getTime() + (data.expires_in * 1000);

        // Store tokens and expiry
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
        localStorage.setItem('spotify_token_expiry', expiryTime);

        // Redirect to the app home
        window.location.href = '/';
      } else {
        console.error('Token exchange failed:', data);
      }
    } catch (error) {
      console.error('Error exchanging token:', error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Authenticating with Spotify...</p>
    </div>
  );
}

