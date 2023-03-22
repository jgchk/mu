import mutagen
import sys
import json
from mutagen.mp3 import MP3

file_path = sys.argv[1]
metadata_json = json.loads(sys.argv[2])

title = metadata_json['title']
artists = metadata_json['artists']
album = metadata_json['album']
album_artists = metadata_json['albumArtists']
track_number = metadata_json['trackNumber']

file = mutagen.File(file_path, None, True)


def id3(tag, value):
    return mutagen.id3.Frames[tag](encoding=3, text=value)


def id3_arr(tag, value):
    if value is None:
        return []
    elif isinstance(value, list):
        return list(map(lambda v: id3(tag, v), value))
    else:
        return [id3(tag, value)]


if file is None:
    print("No metadata found")
    exit(1)

if file.tags is None:
    file.add_tags()

if isinstance(file, mutagen.aiff.AIFF):
    file.tags.setall('TIT2', id3_arr("TIT2", title))
    file.tags.setall('TPE1', id3_arr('TPE1', artists))
    file.tags.setall('TALB', id3_arr("TALB", album))
    file.tags.setall('TPE2', id3_arr("TPE2", album_artists))
    file.tags.setall('TRCK', id3_arr("TRCK", track_number))

    file.save()
    exit(0)

file.tags['title'] = metadata_json['title']
file.tags['artist'] = metadata_json['artists']
file.tags['album'] = metadata_json['album']
file.tags['albumartist'] = metadata_json['albumArtists']
file.tags['tracknumber'] = metadata_json['trackNumber']

file.save()
