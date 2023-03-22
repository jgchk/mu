import mutagen
import sys
import json

file_path = sys.argv[1]

file = mutagen.File(file_path, None, True)

if file is None:
    print("No metadata found")
    exit(1)

if file.tags is None:
    file.add_tags()

if isinstance(file, mutagen.aiff.AIFF):
    title = file.tags.get("TIT2")
    artists = file.tags.getall("TPE1")
    album = file.tags.get("TALB")
    album_artists = file.tags.getall("TPE2")
    track_number = file.tags.get("TRCK")

    metadata = {
        "title": None if title is None else title._pprint(),
        "artists": list(map(lambda artist: artist._pprint(), artists)),
        "album": None if album is None else album._pprint(),
        "albumArtists": list(map(lambda album_artist: album_artist._pprint(), album_artists)),
        "trackNumber": None if track_number is None else track_number._pprint()
    }

    print(json.dumps(metadata))
    exit(0)

if isinstance(file, mutagen.easymp4.EasyMP4):
    title = file.tags["title"]
    artist = file.tags["artist"]
    album = file.tags["album"]
    album_artist = file.tags["albumartist"]
    track_number = file.tags["tracknumber"]

    metadata = {
        "title": None if title is None else title[0],
        "artists": [] if artist is None else artist,
        "album": None if album is None else album[0],
        "albumArtists": [] if album_artist is None else album_artist,
        "trackNumber": None if track_number is None else track_number[0]
    }

    print(json.dumps(metadata))
    exit(0)


title = file.tags.get("title")
artists = file.tags.get("artist")
album = file.tags.get("album")
album_artists = file.tags.get("albumartist")
track_number = file.tags.get("tracknumber")

metadata = {
    "title": None if title is None else title[0],
    "artists": list(artists),
    "album": None if album is None else album[0],
    "albumArtists": list(album_artists),
    "trackNumber": None if track_number is None else track_number[0]
}

print(json.dumps(metadata))
