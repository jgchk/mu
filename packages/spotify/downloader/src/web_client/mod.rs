pub mod error;

use rspotify::{
    model::{
        AlbumId, ArtistId, FullAlbum, FullArtist, FullPlaylist, FullTrack, PlaylistId, TrackId,
    },
    prelude::BaseClient,
    ClientCredsSpotify,
};
use url::Url;

use self::error::WebClientError;

pub struct WebClient {
    pub client: ClientCredsSpotify,
}

impl WebClient {
    pub async fn new(client_id: &str, client_secret: &str) -> Result<Self, WebClientError> {
        let credentials = rspotify::Credentials {
            id: client_id.to_string(),
            secret: Some(client_secret.to_string()),
        };
        let client = ClientCredsSpotify::new(credentials);

        client.request_token().await?;

        Ok(Self { client })
    }

    pub fn parse_uri(uri: &str) -> Result<String, WebClientError> {
        // Already URI
        if uri.starts_with("spotify:") {
            if uri.split(':').count() < 3 {
                return Err(WebClientError::InvalidUri(uri.to_string()));
            }
            return Ok(uri.to_string());
        }

        // Parse URL
        let url = Url::parse(uri).or(Err(WebClientError::InvalidUri(uri.to_string())))?;
        // Spotify Web Player URL
        if url.host_str() == Some("open.spotify.com") {
            let path = url
                .path_segments()
                .ok_or_else(|| WebClientError::InvalidUri(uri.to_string()))?
                .collect::<Vec<&str>>();
            if path.len() < 2 {
                return Err(WebClientError::InvalidUri(uri.to_string()));
            }
            return Ok(format!("spotify:{}:{}", path[0], path[1]));
        }
        Err(WebClientError::InvalidUri(uri.to_string()))
    }

    pub async fn resolve_uri(&self, uri: &str) -> Result<SpotifyItem, WebClientError> {
        let parts = uri.split(':').skip(1).collect::<Vec<&str>>();
        let id = parts[1];
        match parts[0] {
            "track" => {
                let track_id = TrackId::from_id(id)?;
                let track = self.client.track(track_id).await?;
                Ok(SpotifyItem::Track(track))
            }
            "playlist" => {
                let playlist_id = PlaylistId::from_id(id)?;
                let playlist = self.client.playlist(playlist_id, None, None).await?;
                Ok(SpotifyItem::Playlist(playlist))
            }
            "album" => {
                let album_id = AlbumId::from_id(id)?;
                let album = self.client.album(album_id).await?;
                Ok(SpotifyItem::Album(album))
            }
            "artist" => {
                let artist_id = ArtistId::from_id(id)?;
                let artist = self.client.artist(artist_id).await?;
                Ok(SpotifyItem::Artist(artist))
            }
            _ => Err(WebClientError::UnsupportedUri(uri.to_string())),
        }
    }
}

#[derive(Debug, Clone)]
pub enum SpotifyItem {
    Track(FullTrack),
    Playlist(FullPlaylist),
    Album(FullAlbum),
    Artist(FullArtist),
}
