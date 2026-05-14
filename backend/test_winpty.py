import os, sys
import winpty

BUSYBOX_PATH = os.path.join(os.getcwd(), 'bin', 'busybox.exe')
print('Path exists:', os.path.exists(BUSYBOX_PATH))

try:
    process = winpty.PtyProcess.spawn(f'{BUSYBOX_PATH} sh -l', dimensions=(24, 80))
    print('Spawned successfully!')
    import time; time.sleep(1)
    print(repr(process.read(200)))
except Exception as e:
    print('Exception:', e)
