import mutagen
import sys

file_path = sys.argv[1]

file = mutagen.File(file_path, None, True)

if file:
    print(file.pprint())
else:
    print("No metadata found")
