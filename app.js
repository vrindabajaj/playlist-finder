const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const { getPlaylists } = require('./spotify');
const app = express();

app.get('/search', async (req, res) => {
    const song = req.query.song;
    const playlists = await getPlaylists(song);
    res.json(playlists);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});