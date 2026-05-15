// Single source of truth for Firebase — delegates to src/firebase.ts
// This prevents double initializeApp() which can cause auth state bugs
export { auth, signInWithGoogle } from '../firebase';
