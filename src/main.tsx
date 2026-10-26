import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import '@fontsource/noto-sans-bengali/index.css';
import '@fontsource/noto-sans-bengali/500.css';
import '@fontsource/noto-sans-bengali/700.css';

createRoot(document.getElementById('root')!).render(<App />);
