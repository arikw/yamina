#!/usr/bin/env python3
"""Draws the toolbar icons (icons/icon{16,32,48,128}.png): a blue rounded
square with white right-aligned lines. Standard library only.

    python3 tools/make-icons.py
"""
import os
import struct
import zlib

BG = (31, 111, 235)
FG = (255, 255, 255)
# (y center, left edge) of each line; all end at x = 0.80. Unit square coords.
LINES = [(0.30, 0.22), (0.43, 0.42), (0.57, 0.30), (0.70, 0.50)]
THICK = 0.085
SAMPLES = 4  # per axis, for anti-aliasing


def inside_rounded(x, y, inset=0.03, r=0.22):
    lo, hi = inset, 1 - inset
    if not (lo <= x <= hi and lo <= y <= hi):
        return False
    cx = min(max(x, lo + r), hi - r)
    cy = min(max(y, lo + r), hi - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def on_line(x, y):
    return any(left <= x <= 0.80 and abs(y - yc) <= THICK / 2 for yc, left in LINES)


def pixel(px, py, size):
    bg = fg = 0
    for sy in range(SAMPLES):
        for sx in range(SAMPLES):
            x = (px + (sx + 0.5) / SAMPLES) / size
            y = (py + (sy + 0.5) / SAMPLES) / size
            if inside_rounded(x, y):
                if on_line(x, y):
                    fg += 1
                else:
                    bg += 1
    total = SAMPLES * SAMPLES
    alpha = (bg + fg) / total
    if not alpha:
        return (0, 0, 0, 0)
    mix = fg / (bg + fg)
    rgb = tuple(round(b + (f - b) * mix) for b, f in zip(BG, FG))
    return (*rgb, round(alpha * 255))


def png(size):
    raw = b''.join(
        b'\x00' + bytes(c for px in range(size) for c in pixel(px, py, size))
        for py in range(size))

    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF)

    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9))
            + chunk(b'IEND', b''))


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', 'icons')
    for size in (16, 32, 48, 128):
        with open(os.path.join(out, f'icon{size}.png'), 'wb') as f:
            f.write(png(size))
        print(f'icons/icon{size}.png')
