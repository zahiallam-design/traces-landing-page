export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.DROPBOX_APP_KEY;
  if (!clientId) {
    return res.status(500).json({ error: 'DROPBOX_APP_KEY not configured' });
  }

  const redirectUri =
    process.env.DROPBOX_REDIRECT_URI ||
    `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/dropbox-oauth-callback`;

  const scope =
    process.env.DROPBOX_SCOPES ||
    'files.content.write files.metadata.write sharing.write';

  const url = new URL('https://www.dropbox.com/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('token_access_type', 'offline');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scope);

  return res.status(200).json({ url: url.toString(), redirect_uri: redirectUri });
}
