const axios = require('axios');
const qs = require('querystring');

// Spotify API credentials from the .env file
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

// Get the access token from Spotify
const getAccessToken = async () => {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
        grant_type: 'client_credentials',
    }), {
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    }).catch(error => {
        console.log("Error:", error.response ? error.response.data : error.message);
    });
    return response.data.access_token;
};

// API Request
const getPlaylists = async (song) => {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
            q: song,
            type: 'playlist',
            limit: 10,
        },
        headers: {
        'Authorization': `Bearer ${token}`,
        },
    });
    return response.data.playlists.items;
};

module.exports = { getPlaylists };