import 'dotenv/config';
import appJson from './app.json';

/** @type {import('expo/config').ExpoConfig} */
export default {
  ...appJson.expo,
};
