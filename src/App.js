import PopupLogin from './PopupLogin';
import SpotifySCMPlayer from './SpotifySCMPlayer';

function App() {
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) {
      const popup = window.open('/popup-login', 'Spotify Login', '...');
      const listener = (e) => {
        if (e.data.type === 'SPOTIFY_TOKEN') {
          setAccessToken(e.data.token);
          localStorage.setItem('spotify_access_token', e.data.token);
          window.removeEventListener('message', listener);
          popup?.close();
        }
      };
      window.addEventListener('message', listener);
    } else {
      setAccessToken(token);
    }
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

