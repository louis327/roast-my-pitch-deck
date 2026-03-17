export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { handle } = req.query;
  if (!handle) return res.status(400).json({ error: 'Missing handle' });

  const clean = handle.replace(/^@/, '').trim();
  if (!clean) return res.status(400).json({ error: 'Invalid handle' });

  try {
    const userRes = await fetch(
      `https://api.x.com/2/users/by/username/${encodeURIComponent(clean)}?user.fields=profile_image_url,public_metrics,name`,
      { headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` } }
    );

    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({}));
      console.error('X API error:', userRes.status, err);
      return res.status(userRes.status).json({ error: 'X API error' });
    }

    const userData = await userRes.json();
    if (!userData.data) return res.status(404).json({ error: 'User not found' });

    const { name, username, profile_image_url, public_metrics } = userData.data;

    // Fetch avatar and convert to base64 to avoid CORS
    let avatarBase64 = null;
    if (profile_image_url) {
      const bigUrl = profile_image_url.replace('_normal', '_200x200');
      const imgRes = await fetch(bigUrl);
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        avatarBase64 = 'data:image/jpeg;base64,' + Buffer.from(buf).toString('base64');
      }
    }

    return res.status(200).json({
      name,
      username,
      avatar: avatarBase64,
      followers: public_metrics?.followers_count || 0
    });
  } catch (err) {
    console.error('X profile fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
