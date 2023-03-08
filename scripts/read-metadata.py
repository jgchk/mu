import mutagen
import sys

file_path = sys.argv[1]

metadata = mutagen.File(file_path)

if metadata:
    print(metadata.pprint())
else:
    print("No metadata found")
