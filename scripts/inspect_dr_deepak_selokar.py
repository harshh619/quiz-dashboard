import os
import numpy as np
from PIL import Image, ImageFilter

input_path = r'C:/Users/msuna/.gemini/antigravity/brain/9a1f9fb5-a41c-4fae-bfb7-7e4a68c726ce/.user_uploaded/media_1795156723776_7dd22e90.jpg'
output_dir = r'public/signatures'
os.makedirs(output_dir, exist_ok=True)

img = Image.open(input_path).convert('RGB')
arr = np.array(img, dtype=np.float32)

h, w, _ = arr.shape
print(f"Image shape: {w}x{h}")

# Sample border corners for background paper
border_pixels = np.concatenate([
    arr[:30, :, :].reshape(-1, 3),
    arr[-30:, :, :].reshape(-1, 3),
    arr[:, :30, :].reshape(-1, 3),
    arr[:, -30:, :].reshape(-1, 3)
])
bg_color = np.median(border_pixels, axis=0)
bg_std = np.std(border_pixels, axis=0)
print('Estimated paper background color (median):', bg_color)
print('Paper grain noise std:', bg_std)

# Compute luminance
lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
bg_lum = 0.299 * bg_color[0] + 0.587 * bg_color[1] + 0.114 * bg_color[2]

# Compute darkness relative to background
darkness = (bg_lum - lum) / bg_lum
print(f"Darkness min: {darkness.min():.4f}, max: {darkness.max():.4f}, mean: {darkness.mean():.4f}")

# Also check blue-difference: paper has R~=G~=B, but blue ink has B > R and G
# Blue chroma: B - (R + G)/2
blue_chroma = arr[:, :, 2] - 0.5 * (arr[:, :, 0] + arr[:, :, 1])
print(f"Blue chroma min: {blue_chroma.min():.1f}, max: {blue_chroma.max():.1f}, mean: {blue_chroma.mean():.1f}")

# Inspect pixels that are clearly ink
core_mask = (darkness > 0.25) | (blue_chroma > 20)
print(f"Core ink pixels count: {np.sum(core_mask)}")
if np.sum(core_mask) > 0:
    print("Core ink mean RGB:", arr[core_mask].mean(axis=0))
