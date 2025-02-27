const express = require('express');
const dotenv = require('dotenv');
const { getPlaylists } = require('./spotify');

dotenv.config();

const app = express();

app.get('/', (req, res) => {
    res.send('Hello, world! The server is working.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});