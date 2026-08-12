import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAnalytics, isSupported as analyticsIsSupported } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDJA1S-z37ZlSYvib5kmgkghZpLAqJ3aos',
  authDomain: 'personalfinancetools-c8d13.firebaseapp.com',
  projectId: 'personalfinancetools-c8d13',
  storageBucket: 'personalfinancetools-c8d13.firebasestorage.app',
  messagingSenderId: '650127398996',
  appId: '1:650127398996:web:7aa6b68c10b11833fcf5c1',
  measurementId: 'G-DCVFQ7WV5W'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

export const analyticsReady = analyticsIsSupported()
  .then(isSupported => isSupported ? getAnalytics(firebaseApp) : null)
  .catch(() => null);
