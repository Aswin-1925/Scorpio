import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();
const appId = "scorpio-enterprise-core";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST_ONLY' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userRef = db.collection('artifacts').doc(appId).collection('users').doc(uid).collection('profile').doc('data');
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : { tier: 'GHOST', usageCount: 0 };

    if (userData.tier === 'GHOST' && userData.usageCount >= 5) {
      return res.status(403).json({ error: 'QUOTA_EXCEEDED' });
    }

    const { message, nodePrompt } = req.body;
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: `${nodePrompt}\nFormatting: Data-dense, 2026 standards.` }] }
      })
    });

    const result = await aiResponse.json();
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || "NO_UPLINK";

    await userRef.set({ usageCount: admin.firestore.FieldValue.increment(1) }, { merge: true });

    return res.status(200).json({ result: textOutput });
  } catch (err) {
    return res.status(500).json({ error: 'NEURAL_FAULT', details: err.message });
  }
}