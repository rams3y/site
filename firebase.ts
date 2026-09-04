import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5pX0wt83GUnjDRFdZvFbvWiV06n5dTb8",
  authDomain: "rams3y-9c830.firebaseapp.com",
  projectId: "rams3y-9c830",
  storageBucket: "rams3y-9c830.firebasestorage.app",
  messagingSenderId: "1079276062395",
  appId: "1:1079276062395:web:2ffc7aa405d99ffe5f4b9e",
  measurementId: "G-18E9F7N2NE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, app };
