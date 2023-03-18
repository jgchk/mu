use std::io::{Read, Write};

use anyhow::anyhow;
use async_stream::try_stream;
use clap::Parser;
use futures_util::{pin_mut, StreamExt};
use librespot::core::spotify_id::SpotifyId;
use rspotify::prelude::Id;

use crate::{
    streaming_client::{FileFormat, StreamingClient},
    web_client::{SpotifyItem, WebClient},
};

mod streaming_client;
mod web_client;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(long)]
    client_id: String,
    #[arg(long)]
    client_secret: String,
    #[arg(short, long)]
    username: String,
    #[arg(short, long)]
    password: String,
    #[arg(long)]
    credentials_cache: String,
    url: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let Args {
        client_id,
        client_secret,
        username,
        password,
        credentials_cache,
        url,
    } = Args::parse();

    let uri = WebClient::parse_uri(&url)?;

    let web_client = WebClient::new(&client_id, &client_secret).await?;
    let item = web_client.resolve_uri(&uri).await?;
    let track = match item {
        SpotifyItem::Track(track) => track,
        _ => return Err(anyhow!("Not a track")),
    };

    let track_id = track.id.ok_or(anyhow!("No track id"))?;
    let id = SpotifyId::from_base62(track_id.id()).or(Err(anyhow!("Invalid track id")))?;

    let streaming_client =
        streaming_client::StreamingClient::new(&username, &password, &credentials_cache).await?;
    let streaming_track = 'outer: {
        let track = streaming_client.track(id).await?;
        if track.available {
            break 'outer track;
        }

        for alt in &track.alternatives {
            let t = streaming_client.track(*alt).await?;
            if t.available {
                break 'outer t;
            }
        }

        return Err(anyhow!("No available track"));
    };
    let format = FileFormat::OGG_VORBIS_320;
    let file_id = streaming_track
        .files
        .get(&format)
        .ok_or(anyhow!("No file id for format {:?}", format))?;
    let key = streaming_client.audio_key(id, *file_id).await?;
    let audio_file = streaming_client
        .audio_file(*file_id, 1024 * 1024, true)
        .await?;

    let s = try_stream! {
        let mut decrypted = StreamingClient::audio_decrypt(key, audio_file);
        // Skip (i guess encrypted shit)
        let mut skip: [u8; 0xa7] = [0; 0xa7];
        let mut decrypted = tokio::task::spawn_blocking(move || {
            match decrypted.read_exact(&mut skip) {
                Ok(_) => Ok(decrypted),
                Err(e) => Err(e)
            }
        }).await??;
        // Custom reader loop for decrypting
        loop {
            // Blocking reader
            let (d, read, buf) = tokio::task::spawn_blocking(move || {
                let mut buf = vec![0; 1024 * 64];
                // let mut buf = BytesMut::with_capacity(1024 * 64);
                match decrypted.read(&mut buf) {
                    Ok(r) => Ok((decrypted, r, buf)),
                    Err(e) => Err(e)
                }
            }).await??;
            decrypted = d;
            if read == 0 {
                break;
            }

            let data = &buf[0..read];
            let data = data.to_vec();
            yield data
        }
    };
    pin_mut!(s);

    while let Some(result) = s.next().await {
        match result {
            Ok(bytes) => std::io::stdout().write_all(&bytes)?,
            Err(e) => return Err(e),
        }
    }

    Ok(())
}
