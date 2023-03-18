use librespot::core::{
    audio_key::AudioKeyError, channel::ChannelError, mercury::MercuryError, session::SessionError,
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum StreamingClientError {
    #[error(transparent)]
    SessionError(#[from] SessionError),
    #[error("{0:?}")]
    MercuryError(MercuryError),
    #[error("{0:?}")]
    AudioKeyError(AudioKeyError),
    #[error("{0:?}")]
    ChannelError(ChannelError),
}
