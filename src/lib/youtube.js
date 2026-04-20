export function normalizeYouTubeEmbed(url) {
  if (!url) return '';

  const raw = String(url).trim();

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace('www.', '');

    let videoId = '';
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1].split('/')[0];
      } else if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1].split('/')[0];
      }
    }

    if (host === 'youtu.be') {
      videoId = parsed.pathname.replace('/', '').split('/')[0];
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    }
  } catch {
    return raw;
  }

  return raw;
}
