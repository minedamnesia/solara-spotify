import React, { useEffect } from 'react';
import { generateCodeChallenge, generateCodeVerifier } from './pkceUtils';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = window.location.origin + '/callback';
const scope = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

export default function SpotifyLogin() {
  useEffect(() => {
    const codeVerifier = generateCodeVerifier();
    generateCodeChallenge(codeVerifier).then((codeChallenge) => {
      localStorage.setItem('spotify_code_verifier', codeVerifier);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
      });

      window.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
    });
  }, []);

  return <div className="text-center p-8 text-gray-800">Redirecting to Spotify...</div>;
}
