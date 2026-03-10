import zipfile
import os

z = zipfile.ZipFile('/tmp/strix-repo.zip')
for info in z.infolist():
    info.filename = info.filename.replace('\\', '/')
    z.extract(info, os.path.expanduser('~/strix-repo'))
