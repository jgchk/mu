import mutagen
import sys

file_path = sys.argv[1]

file = mutagen.File(file_path, None, True)

if file is None:
    print("No metadata found")
    exit(1)

print(file.pprint())
