// Netlify serverless function — keeps the YouTube API key out of the git
// repository entirely (YouTube Developer Policies III.D.1.d forbids embedding
// API credentials in open source projects), and out of client-side code.

exports.handler = async (event) => {
  const query = event.queryStringParameters && event.queryStringParameters.query;
  if (!query) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing query parameter' }) };
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'YouTube key not configured on the server' }) };
  }

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(query)}&key=${key}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      return { statusCode: searchRes.status, body: JSON.stringify({ error: 'YouTube API error', details: searchData }) };
    }

    const ids = (searchData.items || []).map(i => i.id.videoId).filter(Boolean).join(',');
    let durationMap = {};

    if (ids) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${key}`;
      const detailsRes = await fetch(detailsUrl);
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        detailsData.items.forEach(d => { durationMap[d.id] = d.contentDetails.duration; });
      }
    }

    const results = (searchData.items || []).map(item => ({
      id: `yt_${item.id.videoId}`,
      platform: 'youtube',
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: durationMap[item.id.videoId] || null,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}?autoplay=1`
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Proxy request failed', message: err.message }) };
  }
};
