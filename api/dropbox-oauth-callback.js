export default async function handler(req, res) {
  const code = req.query?.code;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Dropbox app credentials not configured' });
  }

  const redirectUri =
    process.env.DROPBOX_REDIRECT_URI ||
    `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/dropbox-oauth-callback`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri
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
      return res.status(500).json({ error: data?.error_description || data?.error || 'Failed to exchange code' });
    }

    return res.status(200).json({
      refresh_token: data.refresh_token,
      access_token: data.access_token,
      expires_in: data.expires_in
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to exchange code' });
  }
}
