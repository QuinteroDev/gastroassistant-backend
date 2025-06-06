import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

console.log('INDEX.JS - appName:', appName);
console.log('INDEX.JS - App:', App);
console.log('INDEX.JS - typeof App:', typeof App);

AppRegistry.registerComponent(appName, () => App);

console.log('INDEX.JS - Registro completado');