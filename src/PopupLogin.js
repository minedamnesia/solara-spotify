import React, { useEffect } from 'react';
import { generateCodeVerifier, generateCodeChallenge } from './pkceUtils';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = window.location.origin + '/popup-login';
const allowedReturnOrigin = 'https://solararadio.netlify.app';

const scope = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

export default function PopupLogin() {
  useEffect(() => {
    const runAuthFlow = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        // Step 1: Start OAuth flow
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        localStorage.setItem('spotify_code_verifier', verifier);

        const authParams = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          scope: scope,
          redirect_uri: redirectUri,
          code_challenge_method: 'S256',
          code_challenge: challenge
        });

        const authUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;
        console.log('Redirecting to Spotify login:', authUrl);
        window.location.href = authUrl;
        return;
      }

      // Step 2: Exchange code for access token
      try {
        const verifier = localStorage.getItem('spotify_code_verifier');
        if (!verifier) throw new Error('Missing code verifier');

        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: verifier
          })
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          throw new Error(`Token request failed: ${tokenResponse.status} - ${errText}`);
        }

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          if (window.opener && typeof window.opener.postMessage === 'function') {
            console.log('[Popup] Received access token from Spotify:', tokenData.access_token);

            window.opener.postMessage(
              {
                type: 'SPOTIFY_TOKEN',
                token: tokenData.access_token
              },
              allowedReturnOrigin
            );

            window.close();
          } else {
            console.warn('[Popup] No opener window — cannot send token back');
            document.body.innerText =
              'Login succeeded, but the main app window is missing.';
          }
        } else {
          console.error('[Popup] No access token in Spotify response:', tokenData);
          throw new Error('Access token missing in response');
        }
      } catch (error) {
        console.error('OAuth error:', error);
        document.body.innerText = `Spotify authorization failed: ${error.message}`;
      }
    };

    runAuthFlow();
  }, []);

  return (
    <div className="text-center p-8 text-lg">
      Logging in with Spotify...
    </div>
  );
}

