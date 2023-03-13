import mediafile
import sys

file_path = sys.argv[1]
image_path = sys.argv[2]

with open(image_path, 'rb') as f:
    cover = f.read()
    cover = mediafile.Image(data=cover, desc=u'album cover', type=mediafile.ImageType.front)

f = mediafile.MediaFile(file_path)
f.images = [cover]
f.save()
