use rspotify::{model::IdError, ClientError};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WebClientError {
    #[error("Invalid URI: {0}")]
    InvalidUri(String),
    #[error("Unsupported URI: {0}")]
    UnsupportedUri(String),
    #[error(transparent)]
    InvalidId(#[from] IdError),
    #[error(transparent)]
    ClientError(#[from] ClientError),
}
