const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const { getPlaylistsForSongs, getAccessToken } = require('./spotify');
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
        console.log("Fetching access token...");
        const accessToken = await getAccessToken(); // Get a fresh access token
        console.log("Access token received:", accessToken ? "Valid token" : "Failed to get token");
        console.log(accessToken);

        console.log("Fetching playlists for songs:", songs);
        const playlists = await getPlaylistsForSongs(songs, accessToken); // Pass token into function
        console.log("Playlists found:", playlists.length, "playlists");

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