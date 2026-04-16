const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

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
const auth = getAuth(app);

console.log("Attempting login...");
signInWithEmailAndPassword(auth, "runbyrolles@yahoo.com", "Runby75%36Rolles")
  .then((cred) => {
    console.log("Success! UID:", cred.user.uid);
    process.exit(0);
  })
  .catch((e) => {
    console.error("Login failed:", e.code, e.message);
    process.exit(1);
  });
