const API_BASE = 'https://api.dropboxapi.com/2';
const CONTENT_BASE = 'https://content.dropboxapi.com/2';
const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB

let cachedToken = null;
let cachedTokenExpiry = 0;

const getAccessToken = async () => {
  const staticToken = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;
  if (staticToken) {
    return staticToken;
  }

  const now = Date.now();
  if (cachedToken && cachedTokenExpiry > now) {
    return cachedToken;
  }

  const response = await fetch('/api/dropbox-access-token');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || 'Failed to fetch Dropbox access token');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  cachedTokenExpiry = now + (data.expires_in || 0) * 1000 - 30000;

  return cachedToken;
};

const dropboxApiRequest = async (endpoint, body) => {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error_summary || errorData?.error?.tag || 'Dropbox API request failed');
  }

  return response.json();
};

export const ensureFolder = async (path) => {
  try {
    await dropboxApiRequest('/files/create_folder_v2', {
      path,
      autorename: false
    });
  } catch (error) {
    if (!String(error.message || '').includes('path/conflict')) {
      throw error;
    }
  }
};

export const getOrCreateSharedLink = async (path) => {
  try {
    const result = await dropboxApiRequest('/sharing/create_shared_link_with_settings', {
      path,
      settings: { requested_visibility: 'public' }
    });
    return result?.url;
  } catch (error) {
    if (!String(error.message || '').includes('shared_link_already_exists')) {
      throw error;
    }
  }

  const existing = await dropboxApiRequest('/sharing/list_shared_links', {
    path,
    direct_only: true
  });
  return existing?.links?.[0]?.url || null;
};

const uploadSmallFile = async (file, path) => {
  const token = await getAccessToken();
  const response = await fetch(`${CONTENT_BASE}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path,
        mode: 'add',
        autorename: true,
        mute: false,
        strict_conflict: false
      })
    },
    body: file
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error_summary || errorData?.error?.tag || 'Dropbox upload failed');
  }

  return response.json();
};

export const uploadFileResumable = async (file, path, onProgress, chunkSize = DEFAULT_CHUNK_SIZE) => {
  if (file.size <= chunkSize) {
    const result = await uploadSmallFile(file, path);
    if (onProgress) {
      onProgress(file.size, file.size);
    }
    return result;
  }

  const token = await getAccessToken();
  let offset = 0;
  let sessionId = null;

  const startChunk = file.slice(0, chunkSize);
  const startResponse = await fetch(`${CONTENT_BASE}/files/upload_session/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ close: false })
    },
    body: startChunk
  });

  if (!startResponse.ok) {
    const errorData = await startResponse.json().catch(() => ({}));
    throw new Error(errorData?.error_summary || errorData?.error?.tag || 'Dropbox upload session start failed');
  }

  const startData = await startResponse.json();
  sessionId = startData.session_id;
  offset += startChunk.size;
  if (onProgress) {
    onProgress(offset, file.size);
  }

  while (offset < file.size) {
    const nextOffset = Math.min(offset + chunkSize, file.size);
    const chunk = file.slice(offset, nextOffset);
    const isLast = nextOffset >= file.size;
    const endpoint = isLast ? '/files/upload_session/finish' : '/files/upload_session/append_v2';
    const args = isLast
      ? {
          cursor: { session_id: sessionId, offset },
          commit: {
            path,
            mode: 'add',
            autorename: true,
            mute: false,
            strict_conflict: false
          }
        }
      : {
          cursor: { session_id: sessionId, offset },
          close: false
        };

    const response = await fetch(`${CONTENT_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify(args)
      },
      body: chunk
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error_summary || errorData?.error?.tag || 'Dropbox upload failed');
    }

    offset = nextOffset;
    if (onProgress) {
      onProgress(offset, file.size);
    }
  }

  return { success: true };
};
