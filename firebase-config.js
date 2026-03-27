// Firebase configuration for compat version (v9)
const firebaseConfig = {
  apiKey: "AIzaSyCLXPjz7tFg5x4O75O8ak1PSMTjOuwt4X4",
  authDomain: "library-system-c357d.firebaseapp.com",
  projectId: "library-system-c357d",
  storageBucket: "library-system-c357d.firebasestorage.app",
  messagingSenderId: "440151436433",
  appId: "1:440151436433:web:0e26d1205e89599bf5e330",
  measurementId: "G-4SKB41R5PM"
};

// Initialize Firebase with compat version
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
