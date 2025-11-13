import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {

  apiKey: "AIzaSyBvbwfxMBbnkJW0n8isJRzwJH7V4S-Gto8",

  authDomain: "garchive-4bfc2.firebaseapp.com",

  projectId: "garchive-4bfc2",

  storageBucket: "garchive-4bfc2.firebasestorage.app",

  messagingSenderId: "734449033039",

  appId: "1:734449033039:web:ffdf961186c2afb5b16f3a"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.auth = auth;

// --- Sign up ---
async function signup(email, password, username) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set the username (displayName)
    await updateProfile(user, { displayName: username });

    console.log(`✅ Signed up as: ${user.email} (username: ${username})`);
  } catch (error) {
    console.error("❌ Signup error:", error.message);
  }
}

// --- Log in ---
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Logged in as: ${userCredential.user.email}`);
  } catch (error) {
    console.error("❌ Login error:", error.message);
  }
}

// --- Log out ---
async function logout() {
  try {
    await signOut(auth);
    console.log("👋 Logged out");
  } catch (error) {
    console.error("❌ Logout error:", error.message);
  }
}

// --- Listen for auth state changes ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(`🔒 Logged in as: ${user.email}, username: ${user.displayName || "(no username)"}`);
    window.currentUser = user;
  } else {
    console.log("🚪 Logged out");
  }
});

// Make available globally for HTML to use
window.signup = signup;
window.login = login;
window.logout = logout;