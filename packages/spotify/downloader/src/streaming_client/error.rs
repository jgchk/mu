use librespot::core::{
    audio_key::AudioKeyError, channel::ChannelError, mercury::MercuryError, session::SessionError,
};
use thiserror::Error;

#[derive(Error, Debug)]
#[allow(clippy::enum_variant_names)]
pub enum StreamingClientError {
    #[error("{0:?}")]
    CacheError(#[from] std::io::Error),
    #[error(transparent)]
    SessionError(#[from] SessionError),
    #[error("{0:?}")]
    MercuryError(MercuryError),
    #[error("{0:?}")]
    AudioKeyError(AudioKeyError),
    #[error("{0:?}")]
    ChannelError(ChannelError),
}
