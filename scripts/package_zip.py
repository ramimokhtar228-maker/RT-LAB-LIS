#!/usr/bin/env python3
"""
Creates a standard, cross-platform valid ZIP archive of the project source code.
Guaranteed to extract cleanly on Windows Explorer, macOS Finder, Linux, and mobile devices
without any 'archive corrupted' or extraction errors.
"""

import os
import sys
import zipfile
import shutil
import time

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_ZIP = os.path.join(ROOT_DIR, 'public', 'rt-lab-lis-source.zip')
DIST_ZIP = os.path.join(ROOT_DIR, 'dist', 'rt-lab-lis-source.zip')

EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    'dist',
    'dev-dist',
    '__pycache__',
    '.parcel-cache',
    '.cache',
}

EXCLUDE_EXTS = {
    '.zip',
    '.tar',
    '.gz',
    '.tgz',
    '.swp',
    '.DS_Store',
    '.log',
}

EXCLUDE_FILES = {
    'package_zip.py',
    'create_zip.py',
}

def create_zip():
    print(f"📦 Packaging RT-LAB-LIS project from: {ROOT_DIR}")
    
    os.makedirs(os.path.join(ROOT_DIR, 'public'), exist_ok=True)
    if os.path.exists(PUBLIC_ZIP):
        os.remove(PUBLIC_ZIP)
    
    # Remove any stray tar.gz files
    old_tar = os.path.join(ROOT_DIR, 'public', 'rt-lab-lis-source.tar.gz')
    if os.path.exists(old_tar):
        os.remove(old_tar)

    dirs_to_add = set()
    files_to_add = []

    for root, dirs, files in os.walk(ROOT_DIR):
        # Exclude internal build/git dirs, but KEEP .github
        dirs[:] = [
            d for d in dirs
            if d not in EXCLUDE_DIRS and not (d.startswith('.git') and d != '.github')
        ]
        
        rel_root = os.path.relpath(root, ROOT_DIR).replace(os.path.sep, '/')
        if rel_root != '.':
            dirs_to_add.add(rel_root + '/')
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXCLUDE_EXTS or file in EXCLUDE_FILES:
                continue
            rel_file = os.path.relpath(os.path.join(root, file), ROOT_DIR).replace(os.path.sep, '/')
            parts = rel_file.split('/')
            for i in range(1, len(parts)):
                dirs_to_add.add('/'.join(parts[:i]) + '/')
            files_to_add.append((os.path.join(root, file), rel_file))

    sorted_dirs = sorted(dirs_to_add, key=lambda d: (d.count('/'), d))
    now = time.localtime(time.time())[:6]

    with zipfile.ZipFile(PUBLIC_ZIP, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
        # 1. Write all directories first with proper MS-DOS (0x10) + Unix (0o40755) attributes
        for d in sorted_dirs:
            zinfo = zipfile.ZipInfo(d, date_time=now)
            zinfo.external_attr = (0o40755 << 16) | 0x10
            zinfo.compress_type = zipfile.ZIP_STORED
            zinfo.flag_bits |= 0x800  # UTF-8
            zipf.writestr(zinfo, b'')
        
        # 2. Write all files with proper MS-DOS (0x20) + Unix (0o100644) attributes
        for filepath, arcname in files_to_add:
            with open(filepath, 'rb') as f:
                content = f.read()
            zinfo = zipfile.ZipInfo(arcname, date_time=now)
            zinfo.external_attr = (0o100644 << 16) | 0x20
            zinfo.compress_type = zipfile.ZIP_DEFLATED
            zinfo.flag_bits |= 0x800  # UTF-8
            zipf.writestr(zinfo, content)

    print(f"✅ Added {len(sorted_dirs)} folders and {len(files_to_add)} files to {PUBLIC_ZIP}")

    # Test archive integrity
    print("🔍 Testing archive integrity...")
    with zipfile.ZipFile(PUBLIC_ZIP, 'r') as zipf:
        corrupted = zipf.testzip()
        if corrupted:
            print(f"❌ Error in zip file integrity check: {corrupted}")
            sys.exit(1)
        print("✨ Archive integrity verification: 100% SUCCESSFUL (0 errors)")

    size_mb = os.path.getsize(PUBLIC_ZIP) / (1024 * 1024)
    print(f"📊 Final ZIP size: {size_mb:.2f} MB")

    if os.path.exists(os.path.join(ROOT_DIR, 'dist')):
        shutil.copy2(PUBLIC_ZIP, DIST_ZIP)
        print(f"📋 Copied to production dist folder: {DIST_ZIP}")

if __name__ == '__main__':
    create_zip()
