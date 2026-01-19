export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(500).json({ error: 'Dropbox OAuth env vars not configured' });
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  });

  try {
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(500).json({ error: data?.error_description || data?.error || 'Failed to refresh Dropbox token' });
    }

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to refresh Dropbox token' });
  }
}
