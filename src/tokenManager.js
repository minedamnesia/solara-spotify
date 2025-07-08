const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;

export async function getValidAccessToken() {
  const accessToken = localStorage.getItem('spotify_access_token');
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  const expiryTime = parseInt(localStorage.getItem('spotify_token_expiry'), 10);
  const now = new Date().getTime();

  if (now < expiryTime - 60000) { // Token valid, with 60-second buffer
    return accessToken;
  }

  // Token expired, attempt refresh
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    const data = await response.json();

    if (data.access_token) {
      const newExpiryTime = new Date().getTime() + (data.expires_in * 1000);

      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_token_expiry', newExpiryTime);

      console.log('Token refreshed successfully.');
      return data.access_token;
    } else {
      console.error('Token refresh failed:', data);
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

