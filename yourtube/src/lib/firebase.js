// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCARDDG4QuGdCLkvgt3-lGzUHZJbWSP0G8",
  authDomain: "nxtgen-f34ce.firebaseapp.com",
  projectId: "nxtgen-f34ce",
  storageBucket: "nxtgen-f34ce.firebasestorage.app",
  messagingSenderId: "986377416412",
  appId: "1:986377416412:web:d7dbf54144205a7c420e19"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
