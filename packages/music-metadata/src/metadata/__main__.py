import sys
import argparse
import json
from .mediafile import MediaFile, Image, ImageType


def read_mediafile(file):
    title = file.title
    artists = file.artists
    if artists is None:
        artist = file.artist
        if artist is not None:
            artists = [artist]
        else:
            artists = []
    album = file.album
    album_artists = file.albumartists
    if album_artists is None:
        album_artist = file.albumartist
        if album_artist is not None:
            album_artists = [album_artist]
        else:
            album_artists = []
    track = file.track

    metadata = {
        "title": title,
        "artists": artists,
        "album": album,
        "albumArtists": album_artists,
        "track": track,
        "length": round(file.length * 1000),
    }

    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="metadata", description="Read and write metadata from audio files"
    )
    subparsers = parser.add_subparsers(dest="operation")
    subparsers.required = True

    parser_read = subparsers.add_parser("read", help="Read metadata from a file")
    parser_read.add_argument("file", help="The file to read metadata from")

    parser_write = subparsers.add_parser("write", help="Write metadata to a file")
    parser_write.add_argument("file", help="The file to write metadata to")
    parser_write.add_argument("--title", help="The title of the track", default=None)
    parser_write.add_argument(
        "--artists", help="The artists of the track", nargs="+", default=[]
    )
    parser_write.add_argument("--album", help="The album of the track", default=None)
    parser_write.add_argument(
        "--album-artists", help="The album artists of the track", nargs="+", default=[]
    )
    parser_write.add_argument(
        "--track", help="The track number of the track", default=None
    )

    parser_read_cover = subparsers.add_parser(
        "read-cover", help="Read cover art from a file"
    )
    parser_read_cover.add_argument("file", help="The file to read cover art from")

    parser_write_cover = subparsers.add_parser(
        "write-cover", help="Write cover art to a file"
    )
    parser_write_cover.add_argument("file", help="The file to write cover art to")

    args = parser.parse_args()
    if args.operation == "read":
        file_path = args.file
        file = MediaFile(file_path)
        metadata = read_mediafile(file)
        print(json.dumps(metadata))
    elif args.operation == "write":
        file_path = args.file

        title = args.title
        artists = args.artists
        album = args.album
        album_artists = args.album_artists
        track = args.track

        file = MediaFile(file_path)
        if title is None:
            del file.title
        else:
            file.title = title
        file.artists = artists
        if album is None:
            del file.album
        else:
            file.album = album
        file.albumartists = album_artists
        if track is None:
            del file.track
        else:
            file.track = track
        file.save()

        metadata = read_mediafile(file)
        print(json.dumps(metadata))
    elif args.operation == "read-cover":
        file_path = args.file
        file = MediaFile(file_path)
        if file.images is None:
            print("No cover art found")
        else:
            cover = None
            for image in file.images:
                if image.type == ImageType.front:
                    cover = image
                    break
                cover = image
            if cover is not None:
                sys.stdout.buffer.write(cover.data)
            else:
                print("No cover art found")
    elif args.operation == "write-cover":
        file_path = args.file
        cover_data = sys.stdin.buffer.read()
        cover = Image(data=cover_data, desc="album cover", type=ImageType.front)
        file = MediaFile(file_path)
        file.images = [cover]
        file.save()
    else:
        print("Unhandled operation: %s" % args.operation)
        exit(1)
