import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// shared firebase instance
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    console.log('[Firebase] Starting signInWithPopup...');
    const result = await signInWithPopup(auth, provider);
    console.log('[Firebase] signInWithPopup succeeded:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('[Firebase] signInWithPopup failed:', error.code, error.message);

    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      // Try redirect as fallback
      console.log('[Firebase] Trying signInWithRedirect as fallback...');
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectErr: any) {
        console.error('[Firebase] signInWithRedirect also failed:', redirectErr);
        alert('Lỗi đăng nhập: ' + redirectErr.message);
        throw redirectErr;
      }
    } else if (error.code === 'auth/unauthorized-domain') {
      alert(`Lỗi: Domain "${window.location.hostname}" chưa được thêm vào Firebase Console.\n\nVào Firebase Console > Authentication > Settings > Authorized domains và thêm "localhost".`);
      throw error;
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.warn('[Firebase] Popup request cancelled by user.');
      throw error;
    } else {
      alert('Lỗi đăng nhập: ' + error.message);
      throw error;
    }
  }
};

// Handle redirect result (for fallback flow)
getRedirectResult(auth).then((result) => {
  if (result) {
    console.log('[Firebase] Redirect login succeeded:', result.user.email);
  }
}).catch((err) => {
  if (err.code) {
    console.error('[Firebase] Redirect result error:', err.code, err.message);
  }
});
