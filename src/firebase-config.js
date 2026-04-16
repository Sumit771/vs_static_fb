import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCadg5JiXGKokpQHRIKYVhlZEGs7gBjm3M",
  authDomain: "viveksuryavanshi-db.firebaseapp.com",
  projectId: "viveksuryavanshi-db",
  storageBucket: "viveksuryavanshi-db.firebasestorage.app",
  messagingSenderId: "123373422859",
  appId: "1:123373422859:web:91854f484b721788f97a0e",
  measurementId: "G-FH0MQDC9E3"
};

const app = initializeApp(firebaseConfig);

window.firebaseDb = getFirestore(app);
window.firebaseAuth = getAuth(app);
window.firebaseFirestoreVars = {
  doc, getDoc, setDoc, addDoc, collection, getDocs, deleteDoc
};
window.firebaseAuthVars = {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
};
