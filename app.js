const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const { getPlaylists, getAccessToken } = require('./spotify');
const app = express();

app.get('/search', async (req, res) => {
    const songsQuery = req.query.songs;

    // Check if songsQuery is defined, otherwise return an error response
    if (!songsQuery) {
        return res.status(400).json({ error: 'Missing "songs" query parameter' });
    }
    // Ensure it's a string before calling split
    const songs = typeof songsQuery === 'string' ? songsQuery.split(',').map(song => song.trim()) : [];

    try {
        const accessToken = await getAccessToken(); // Get a fresh access token
        const playlists = await getPlaylists(songs, accessToken); // Pass token into function
        res.json(playlists);
    } catch (error) {
        console.error('Error fetching playlists:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});