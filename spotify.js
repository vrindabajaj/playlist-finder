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
const fetchPlaylists = async (songs, token) => {
    const query = songs.map(song => `"${song}"`).join(' OR '); // Formats it correctly for Spotify
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist`;

    console.log('Songs being searched:', songs);

    try {
        const response = await axios.get(url, {
            params: { q: songs, type: 'playlist', limit: 50 },
            headers: { Authorization: `Bearer ${token}`},
        })

        if (!response.data.playlists || !response.data.playlists.items) {
            throw new Error('No playlists found in response');
        }

        return response.data.playlists.items.filter(p => p && p.id); // Remove null playlists

        } catch (error) {
            console.error('Error fetching playlists:', error.response ? error.response.data : error.message);
            return [];
        }
};

const filterPlaylistsByTracks = async (playlists, songs, token) => {
    try {
        const playlistMatches = await Promise.all(playlists.map(async (playlist) => {
            try {
                const trackResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
                    headers: { Authorization: `Bearer ${token}`},
                });

                // Extract track names
                const trackNames = trackResponse.data.items.map(item => item.track.name.toLowerCase());
                console.log(`Tracks in playlist ${playlist.name}:`, trackNames);

                // Count matches
                const matchCount = songs.filter(song => {
                    console.log(`Checking if '${song.toLowerCase()}' exists in:`, trackNames);
                    return trackNames.some(track => track.includes(song.toLowerCase()))
                }).length;

                return { 
                    name: playlist.name,
                    url: playlist.external_urls.spotify,
                    matchCount: matchCount 
                };
            } catch (trackError) {
                console.error('Error fetching tracks:', trackError.message);
                return null; // Skip failed playlists
            }
        }));
        console.log('All retrieved playlists:', playlistMatches);

        // Remove null results, sort by match count, and filter out 0-match playlists
        return playlistMatches
            .filter(p => p && p.matchCount > 0)
            .sort((a, b) => b.matchCount - a.matchCount);
        // return playlistMatches.filter(p => p).sort((a, b) => b.matchCount - a.matchCount);

    } catch (error) {
        console.error('Error filtering playlists:', error.message);
        return [];
    }
};

const getPlaylists = async (songs, token) => {
    const playlists = await fetchPlaylists(songs, token);
    return await filterPlaylistsByTracks(playlists, songs, token);
};

module.exports = { getPlaylists, getAccessToken };