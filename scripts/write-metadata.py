import mutagen
import sys
import json
from mutagen.mp3 import MP3

file_path = sys.argv[1]
metadata_json = json.loads(sys.argv[2])

file = mutagen.File(file_path, None, True)

if file is None:
    print("No metadata found")
    exit(1)

file.tags['title'] = metadata_json['title']
file.tags['artist'] = metadata_json['artists']
file.tags['album'] = metadata_json['album']
file.tags['albumartist'] = metadata_json['albumArtists']

file.save()
