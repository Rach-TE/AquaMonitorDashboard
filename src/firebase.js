import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB1g3svomLzsvsOcKGXE2Wl3RmaYu8jxMM",
  authDomain: "aquamonitor-123.firebaseapp.com",
  projectId: "aquamonitor-123",
  storageBucket: "aquamonitor-123.firebasestorage.app",
  messagingSenderId: "951216397750",
  appId: "1:951216397750:web:0f7e00e20e72918264f517", 
  
  databaseURL: "https://aquamonitor-123-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);