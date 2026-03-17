export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, score, verdict, timestamp } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/app9wJBmLdjRmXWHx/tblDElY7JgwjIOOJK`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              fld9itFWDPHfgwPOT: email,
              fldX6XO1fVF8HnfHb: String(score || ''),
              fldt9jmEWLZmt4Akw: verdict || '',
              fldMMfgiUIIPsIweo: timestamp || new Date().toISOString()
            }
          }]
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Airtable error:', err);
      return res.status(500).json({ error: 'Airtable write failed' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
