pub mod error;

use std::path::Path;

use librespot::{
    audio::{AudioDecrypt, AudioFile},
    core::{
        audio_key::AudioKey,
        session::Session,
        spotify_id::{FileId, SpotifyId},
    },
    metadata::{Metadata, Track},
};

use self::error::StreamingClientError;

pub type FileFormat = librespot::metadata::FileFormat;

pub struct StreamingClient {
    pub session: Session,
}

impl StreamingClient {
    pub async fn new(
        username: &str,
        password: &str,
        credentials_cache: &str,
    ) -> Result<Self, StreamingClientError> {
        let cache = librespot::core::cache::Cache::new(
            Some(Path::new(credentials_cache)),
            None,
            None,
            None,
        )?;

        let credentials = cache.credentials().unwrap_or_else(|| {
            librespot::core::authentication::Credentials::with_password(username, password)
        });

        let (session, _) = Session::connect(
            librespot::core::config::SessionConfig::default(),
            credentials,
            Some(cache),
            true,
        )
        .await?;

        Ok(Self { session })
    }

    pub async fn track(&self, id: SpotifyId) -> Result<Track, StreamingClientError> {
        let track = Track::get(&self.session, id)
            .await
            .map_err(StreamingClientError::MercuryError)?;
        Ok(track)
    }

    pub async fn audio_key(
        &self,
        track_id: SpotifyId,
        file_id: FileId,
    ) -> Result<AudioKey, StreamingClientError> {
        let key = self
            .session
            .audio_key()
            .request(track_id, file_id)
            .await
            .map_err(StreamingClientError::AudioKeyError)?;
        Ok(key)
    }

    pub async fn audio_file(
        &self,
        file_id: FileId,
        bytes_per_second: usize,
        play_from_beginning: bool,
    ) -> Result<AudioFile, StreamingClientError> {
        let audio_file = AudioFile::open(
            &self.session,
            file_id,
            bytes_per_second,
            play_from_beginning,
        )
        .await
        .map_err(StreamingClientError::ChannelError)?;
        Ok(audio_file)
    }

    pub fn audio_decrypt<T: std::io::Read>(key: AudioKey, reader: T) -> AudioDecrypt<T> {
        AudioDecrypt::new(key, reader)
    }
}
