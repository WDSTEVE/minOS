import time
from sys import stdin
from PIL import Image

import RPi.GPIO as GPIO
GPIO.setwarnings(False)
from luma.lcd.device import st7735
from luma.core.interface.serial import spi

class st7735Fast(st7735):
    def fastDisplay(self, image):
        left, top, right, bottom = self.apply_offsets((0, 19, 160, 128))

        self.command(0x2A, left >> 8, left & 0xFF,
                     (right - 1) >> 8, (right - 1) & 0xFF)
        self.command(0x2B, top >> 8, top & 0xFF,
                     (bottom - 1) >> 8, (bottom - 1) & 0xFF)
        self.command(0x2C)

        self.data(list(image))


lumaSerial = spi(port=0, device=1, gpio_DC=23, gpio_RST=24, bus_speed_hz=32000000)
lumaDevice = st7735Fast(lumaSerial, rotate=2, h_offset=1, v_offset=2)
lumaDevice.backlight(False)

screenBMP = open("/tmp/tmpfs/minOStmp/screen.bin", "rb")

def readScreen():
    global screenBMP
    screenBMP.flush()
    screenBMP.seek(0)
    return screenBMP.read(160 * 128 * 3)


def main():
    while True:
        lumaDevice.fastDisplay(readScreen())

main()