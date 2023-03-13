import mediafile
import sys

file_path = sys.argv[1]

f = mediafile.MediaFile(file_path)

if f.images == None:
    print("No cover art found")
    exit(0) 

for image in f.images:
    if image.type == mediafile.ImageType.front:
        sys.stdout.buffer.write(image.data)
        exit(0)

print("No cover art found")
exit(0)
