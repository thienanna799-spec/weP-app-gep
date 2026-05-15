import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve serviceAccount.json relative to project root
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'server', 'serviceAccount.json');

function initFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  if (existsSync(SERVICE_ACCOUNT_PATH)) {
    try {
      const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
      console.log('✅ Firebase Admin initialized with serviceAccount.json');
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (err) {
      console.warn('⚠️  serviceAccount.json found but failed to parse:', err);
    }
  } else {
    console.warn(
      '⚠️  serviceAccount.json not found at:', SERVICE_ACCOUNT_PATH,
      '\n   Firebase token verification disabled. Dev fallback mode active.'
    );
  }

  // Fallback: no credentials (token verification will be skipped in verifyFirebaseToken)
  return admin.initializeApp({ projectId: 'gen-lang-client-0267172098' });
}

const firebaseApp = initFirebaseAdmin();

export { admin, firebaseApp };

/**
 * Verify a Firebase ID token and return the decoded token.
 * Returns null if firebase-admin is not properly configured.
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  // Check if we have proper credentials (not just projectId fallback)
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    return null; // Trigger fallback auth in auth.controller.ts
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    console.error('[Firebase Admin] Token verification failed:', err);
    return null;
  }
}
