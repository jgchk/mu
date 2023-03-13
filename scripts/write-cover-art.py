import mediafile
import sys

file_path = sys.argv[1]
cover_data = sys.stdin.buffer.read()

cover = mediafile.Image(data=cover_data, desc=u'album cover', type=mediafile.ImageType.front)

f = mediafile.MediaFile(file_path)
f.images = [cover]
f.save()
