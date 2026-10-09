import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCSHOLNWq42erfPMVngTGx_wBxeInyn96M",
  authDomain: "aquawatch-c96c1.firebaseapp.com",
  databaseURL: "https://aquawatch-c96c1-default-rtdb.firebaseio.com",
  projectId: "aquawatch-c96c1",
  storageBucket: "aquawatch-c96c1.firebasestorage.app",
  messagingSenderId: "890776818842",
  appId: "1:890776818842:web:836c464eb6d6c1c8b07b23",
  measurementId: "G-T9JJ4942H0"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);