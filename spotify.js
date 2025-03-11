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

const getTrackId = async (song, token) => {
    try {
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(song)}&type=track&limit=1`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const tracks = response.data.tracks.items;
        if (!tracks.length) {
            console.warn(`No track found for: ${song}`);
            return null;
        }

        return tracks[0].id;
    } catch (error) {
        console.error('Error fetching track ID:', error.message);
        return null;
    }
};

const getPlaylistsContainingTrack = async (trackId, token) => {
    try {
        console.log(`Searching for playlists that contain track ID: ${trackId}`);
        const playlistsUrl = `https://api.spotify.com/v1/browse/featured-playlists?limit=10`;
        const playlistsResponse = await axios.get(playlistsUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!playlistsResponse.data.playlists || !playlistsResponse.data.playlists.items) {
            console.warn(`No playlists found for track ID: ${trackId}`);
            return [];
        }

        const playlists = playlistsResponse.data.playlists.items;

        console.log(`Found ${playlists.length} public playlists. Checking their tracks...`);

        const matchingPlaylists = [];

        // Check each playlist's tracks
        for (const playlist of playlists) {
            console.log(`Fetching tracks for playlist: ${playlist.id} - ${playlist.name}`);

            try {
                const tracksUrl = `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`;
                const tracksResponse = await axios.get(tracksUrl, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const trackIdsInPlaylist = tracksResponse.data.items.map(item => item.track.id);

                if (trackIdsInPlaylist.includes(trackId)) {
                    console.log(`Match found in: ${playlist.name}`);
                    matchingPlaylists.push({
                        id: playlist.id,
                        name: playlist.name,
                        url: playlist.external_urls.spotify
                    });
                }
            } catch (trackError) {
                console.error(`Failed to fetch tracks for playlist ${playlist.id}:`, trackError.message);
            }
        }

        console.log(`Playlists that contain the track:`, matchingPlaylists);
        return matchingPlaylists;
    } catch (error) {
        console.error(`Error fetching playlists:`, error.message);
        return [];
    }
};

const getPlaylistsForSongs = async (songs, token) => {
    try {
        // Convert all song names into Spotify track IDs
        const trackIds = await Promise.all(songs.map(song => getTrackId(song, token)));
        console.log(`Track ID for "${songs}":`, trackIds);
        const validTrackIds = trackIds.filter(id => id !== null); // Remove failed lookups

        if (validTrackIds.length === 0) {
            console.warn(`No valid track IDs found, returning empty result.`);
            return [];
        }

        // Fetch playlists for each track ID
        const allPlaylists = [];
        for (const trackId of validTrackIds) {
            const playlistsForTrack = await getPlaylistsContainingTrack(trackId, token);
            allPlaylists.push(...playlistsForTrack);
        }

        // Remove duplicate playlists and count matches
        const uniquePlaylists = {};
        allPlaylists.flat().forEach(playlist => {
            if (!uniquePlaylists[playlist.id]) {
                uniquePlaylists[playlist.id] = { ...playlist, matchCount: 0 };
            }
            uniquePlaylists[playlist.id].matchCount++;
        });

        // Convert to array, sort by match count, and return
        return Object.values(uniquePlaylists).sort((a, b) => b.matchCount - a.matchCount);
    } catch (error) {
        console.error('Error in getPlaylistsForSongs:', error.message);
        return [];
    }
};

module.exports = { getPlaylistsForSongs, getAccessToken };