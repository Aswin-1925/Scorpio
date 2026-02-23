import admin from 'firebase-admin';

// 1. INITIALIZE SECURE ADMIN NODE
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (e) {
    console.error("FATAL_AUTH_INIT_FAILURE:", e.message);
  }
}

const db = admin.firestore();
const appId = "scorpio-enterprise-core";

export default async function handler(req, res) {
  // Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST_ONLY' });

  // 2. VERIFY IDENTITY (BEARER PROTOCOL)
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'UNAUTHORIZED_ACCESS' });
  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // 3. SERVER-SIDE USAGE ENFORCEMENT
    const userRef = db.collection('artifacts').doc(appId).collection('users').doc(uid).collection('profile').doc('data');
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : { tier: 'GHOST', usageCount: 0 };

    if (userData.tier === 'GHOST' && userData.usageCount >= 5) {
      return res.status(403).json({ error: 'QUOTA_EXCEEDED', message: 'Node requires Spectre upgrade for further cycles.' });
    }

    // 4. AI EXECUTION (Using Secure Environment Key)
    const { message, nodePrompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // Pulled from Vault

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: `${nodePrompt}\nKeep responses professional, data-dense, and formatted for 2026 standards.` }] }
      })
    });

    const result = await aiResponse.json();
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || "NO_UPLINK_DATA";

    // 5. ATOMIC USAGE INCREMENT (Immutable)
    await userRef.set({ 
      usageCount: admin.firestore.FieldValue.increment(1),
      lastActive: Date.now()
    }, { merge: true });

    return res.status(200).json({ result: textOutput });

  } catch (err) {
    console.error("NEURAL_FAULT:", err.message);
    return res.status(500).json({ error: 'NEURAL_FAULT', details: err.message });
  }
}