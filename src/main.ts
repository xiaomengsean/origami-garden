import { App } from './components/App.ts';

const root = document.getElementById('app')!;
const app = new App(root);
app.mount();
