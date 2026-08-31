import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBsegzFliUNgtsOw2A0h5uKu_WU85qUX1o",
  authDomain: "storyverse-ee3e8.firebaseapp.com",
  projectId: "storyverse-ee3e8",
  storageBucket: "storyverse-ee3e8.firebasestorage.app",
  messagingSenderId: "182525846004",
  appId: "1:182525846004:web:4809bb49685d8231b4d9a1",
  measurementId: "G-45Q07J9FE0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
