import os
import numpy as np
from PIL import Image, ImageFilter

input_path = r'C:/Users/msuna/.gemini/antigravity/brain/9a1f9fb5-a41c-4fae-bfb7-7e4a68c726ce/.user_uploaded/media_1795156723776_7dd22e90.jpg'
output_dir = r'public/signatures'
os.makedirs(output_dir, exist_ok=True)

img = Image.open(input_path).convert('RGB')
arr = np.array(img, dtype=np.float32)
h, w, _ = arr.shape

# 1. Background Paper Baseline
border_pixels = np.concatenate([
    arr[:30, :, :].reshape(-1, 3),
    arr[-30:, :, :].reshape(-1, 3),
    arr[:, :30, :].reshape(-1, 3),
    arr[:, -30:, :].reshape(-1, 3)
])
bg_color = np.median(border_pixels, axis=0)
bg_lum = 0.299 * bg_color[0] + 0.587 * bg_color[1] + 0.114 * bg_color[2]

# 2. Luminance & Darkness
lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
darkness = np.clip((bg_lum - lum) / bg_lum, 0.0, 1.0)

# 3. Blue Chroma: In blue pen ink, Blue channel is significantly higher than (Red+Green)/2
# Paper fibers are neutral/grayish (chroma ~ 0), whereas blue ink has strong positive chroma
blue_chroma = np.clip((arr[:, :, 2] - 0.5 * (arr[:, :, 0] + arr[:, :, 1])) / 100.0, 0.0, 1.0)

# 4. Filter out paper grain using color-aware combination:
# Genuine ink has both darkness AND blue chroma, or high darkness (>0.3)
# Combine: ink_signal = darkness * (0.6 + 0.8 * blue_chroma)
ink_signal = darkness * 0.7 + blue_chroma * 0.5

# Noise floor: paper grain is around 0.06 - 0.11
noise_floor = 0.11
core_ink_threshold = 0.38

# Smoothstep alpha interpolation for crisp, silky-smooth antialiased edges
alpha_norm = np.clip((ink_signal - noise_floor) / (core_ink_threshold - noise_floor), 0.0, 1.0)
alpha_smooth = alpha_norm * alpha_norm * (3.0 - 2.0 * alpha_norm)

# Convert to uint8 alpha
alpha_arr = (alpha_smooth * 255.0).astype(np.uint8)

# Morphological clean-up: apply a slight guided median or Gaussian filter on alpha to remove isolated speckles
alpha_img = Image.fromarray(alpha_arr, mode='L')
# Median filter radius 1 removes isolated 1-pixel paper grain specks without thinning strokes
alpha_clean = alpha_img.filter(ImageFilter.MedianFilter(size=3))
alpha_final = np.array(alpha_clean, dtype=np.uint8)

# 5. Executive Royal Blue ink matching Dr. Sandeep Bhoyar's signature
# Deep royal blue: RGB(20, 48, 138) modulated by pen pressure/depth
target_ink_rgb = np.array([20.0, 48.0, 138.0], dtype=np.float32)
depth = np.clip(darkness / 0.75, 0.0, 1.0)[:, :, np.newaxis]
ink_rendered = target_ink_rgb * (0.75 + 0.35 * depth)
ink_rendered = np.clip(ink_rendered, 0, 255).astype(np.uint8)

# Combine into RGBA
rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, :3] = ink_rendered
rgba[:, :, 3] = alpha_final

out_img = Image.fromarray(rgba, mode='RGBA')

# Auto-crop to exact signature bounding box
bbox = out_img.getbbox()
print('Bounding box:', bbox)
cropped = out_img.crop(bbox)

# Add 16px comfortable padding around signature
pad = 16
padded_w = cropped.width + pad * 2
padded_h = cropped.height + pad * 2
final_img = Image.new('RGBA', (padded_w, padded_h), (0, 0, 0, 0))
final_img.paste(cropped, (pad, pad))

out_path = os.path.join(output_dir, 'dr_deepak_selokar_signature.png')
final_img.save(out_path, format='PNG', optimize=True)
print(f"Saved processed signature to: {out_path}")
print(f"Dimensions: {final_img.size[0]} x {final_img.size[1]} pixels (Aspect Ratio: {final_img.size[0] / final_img.size[1]:.2f})")

# Copy to brain artifact directory for preview artifact
artifact_copy = r'C:/Users/msuna/.gemini/antigravity/brain/9a1f9fb5-a41c-4fae-bfb7-7e4a68c726ce/dr_deepak_selokar_signature.png'
final_img.save(artifact_copy, format='PNG', optimize=True)
print(f"Copied to artifact dir: {artifact_copy}")
