import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; 
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyAdL-uZRcqP9ySdETTlhqFyPtRDNzJsJf4",
  authDomain: "mercado-1218a.firebaseapp.com",
  projectId: "mercado-1218a",
  storageBucket: "mercado-1218a.appspot.com",
  messagingSenderId: "14773311466",
  appId: "1:14773311466:web:3caac2ac03c2e99a25c493",
  measurementId: "G-DT1MLGQ41L"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); 
const auth = getAuth(app); 

export { app, analytics, db, auth };
