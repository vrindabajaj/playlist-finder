const axios = require('axios');
const { response } = require('express');
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
const getPlaylists = async (songs) => {
    const token = await getAccessToken();
    console.log('Songs being searched:', songs);
    console.log('Spotify API URL:', `https://api.spotify.com/v1/search?q=${encodeURIComponent(songs.join(','))}&type=playlist`);

    const query = songs.map(song => `"${song}"`).join(' OR '); // Formats it correctly for Spotify
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist`;
    console.log('Formatted Spotify Query:', query);

    try {
        const response = await axios.get(url, {
            params: {
                q: songs,
                type: 'playlist',
                limit: 10,
            },
            headers: {
            'Authorization': `Bearer ${token}`,
            },
        }).catch (error => {
            console.error('Error fetching playlists:', error);
        });
        return response.data;
    } catch (error) {
        console.error('Error making request:', error.response ? error.response.data : error.message);
    }
};

module.exports = { getPlaylists };