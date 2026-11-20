import './css/base.css';
import './css/start.css';
import { renderStartScreen } from './js/start-screen.js';

const app = document.querySelector('#app');
if (!app) throw new Error('The application root element #app is missing.');

renderStartScreen(app);
