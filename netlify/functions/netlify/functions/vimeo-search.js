// Netlify serverless function — runs on Netlify's server, never in the browser.
// The Vimeo token lives only here, as an environment variable, so it never
// ships to client-side code (required by Vimeo Developer Addendum section 4.3).

exports.handler = async (event) => {
  const query = event.queryStringParameters && event.queryStringParameters.query;
  if (!query) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing query parameter' }) };
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Vimeo token not configured on the server' }) };
  }

  try {
    const url = `https://api.vimeo.com/videos?query=${encodeURIComponent(query)}&per_page=12`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: 'Vimeo API error', details: data }) };
    }

    // Only pass along the fields the frontend actually needs — keeps the
    // response small and avoids leaking anything extra from Vimeo's payload.
    const results = (data.data || []).map(item => {
      const vid = item.uri.split('/').pop();
      return {
        id: `vi_${vid}`,
        platform: 'vimeo',
        title: item.name,
        channel: item.user ? item.user.name : 'Vimeo',
        thumbnail: item.pictures && item.pictures.sizes.length ? item.pictures.sizes[2].link : '',
        duration: item.duration,
        embedUrl: `https://player.vimeo.com/video/${vid}?autoplay=1`
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Proxy request failed', message: err.message }) };
  }
};
