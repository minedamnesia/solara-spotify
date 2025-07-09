import { generateCodeVerifier, generateCodeChallenge } from './pkceUtils';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = window.location.origin + '/popup-login';
const scope = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

// Step 1: If no "code", redirect to Spotify
if (!window.location.search.includes('code=')) {
  const verifier = generateCodeVerifier();
  generateCodeChallenge(verifier).then((challenge) => {
    localStorage.setItem('spotify_code_verifier', verifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: challenge
    });

    window.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  });
} else {
  // Step 2: Exchange code for token
  const code = new URLSearchParams(window.location.search).get('code');
  const verifier = localStorage.getItem('spotify_code_verifier');

  fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.access_token) {
        // ✅ Send token back to opener
        if (window.opener && typeof window.opener.postMessage === 'function') {
          window.opener.postMessage({
            type: 'SPOTIFY_TOKEN',
            token: data.access_token
          }, '*');
        } else {
          console.warn('No opener window — cannot send token back');
          // Optional fallback: show token or ask user to reload iframe
          document.body.innerText = 'Authorization failed';
      }
    });
}

export default function PopupLogin() {
  return (
    <div className="text-center p-8">
      Logging in with Spotify...
    </div>
  );
}

