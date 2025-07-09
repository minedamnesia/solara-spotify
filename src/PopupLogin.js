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
      const code = urlPa

