use std::io::{Read, Write};

use anyhow::anyhow;
use async_stream::try_stream;
use clap::{Parser, Subcommand};
use futures_util::{pin_mut, StreamExt};
use librespot::core::spotify_id::SpotifyId;

use crate::streaming_client::{FileFormat, StreamingClient};

mod streaming_client;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    CheckLogin {
        #[arg(short, long)]
        username: String,
        #[arg(short, long)]
        password: String,
        #[arg(long)]
        credentials_cache: String,
    },
    Download {
        #[arg(short, long)]
        username: String,
        #[arg(short, long)]
        password: String,
        #[arg(long)]
        credentials_cache: String,
        track_id: String,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match &cli.command {
        Commands::CheckLogin {
            username,
            password,
            credentials_cache,
        } => {
            let result =
                streaming_client::StreamingClient::new(username, password, credentials_cache).await;
            match result {
                Ok(_) => println!("Login successful"),
                Err(e) => eprintln!("{}", e),
            }
        }
        Commands::Download {
            username,
            password,
            credentials_cache,
            track_id,
        } => {
            let id = SpotifyId::from_base62(track_id).map_err(|_| anyhow!("Invalid track id"))?;

            let streaming_client =
                streaming_client::StreamingClient::new(username, password, credentials_cache)
                    .await?;
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
                .ok_or_else(|| anyhow!("No file id for format {:?}", format))?;
            let key = streaming_client.audio_key(id, *file_id).await?;
            let audio_file = streaming_client
                .audio_file(*file_id, 1024 * 1024, true)
                .await?;

            let size = audio_file.get_stream_loader_controller().len() as u64;
            std::io::stdout().write_all(&size.to_le_bytes())?;

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
        }
    }

    Ok(())
}
