import os
import shutil


def create_dirs(path):
    if not os.path.exists(path):
        os.makedirs(path)

def remove_dirs(path):
    if os.path.exists(path):
        shutil.rmtree(path)
