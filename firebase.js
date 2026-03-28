import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  query,
  orderBy,
  serverTimestamp,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/*
  SADECE BURAYI DEĞİŞTİR:
  Firebase Console > Project settings > Your apps > SDK setup and configuration
*/
const firebaseConfig = {
  apiKey: "AIzaSyAE5a-0MmLW0zkuS3ya1veQZvTnyNIbzV4",
  authDomain: "hive-c5d27.firebaseapp.com",
  projectId: "hive-c5d27",
  storageBucket: "hive-c5d27.firebasestorage.app",
  messagingSenderId: "1015325344229",
  appId: "1:1015325344229:web:803734ef6a386169cbaf0c",
  measurementId: "G-TGBFWY2LNY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  app, auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  query,
  orderBy,
  serverTimestamp,
  where,
  onSnapshot
};
