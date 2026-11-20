import './css/base.css';
import './css/start.css';
import './css/mission.css';
import { initRouter } from './js/state.js';

const app = document.querySelector('#app');
if (!app) throw new Error('The application root element #app is missing.');

initRouter(app);
