import os
import numpy as np
from PIL import Image, ImageFilter, ImageOps

input_path = r'C:/Users/msuna/.gemini/antigravity/brain/9a1f9fb5-a41c-4fae-bfb7-7e4a68c726ce/.user_uploaded/media_1795086113014_e471dc1c.jpg'
output_dir = r'public/signatures'
os.makedirs(output_dir, exist_ok=True)

img = Image.open(input_path).convert('RGB')
arr = np.array(img, dtype=np.float32)

# Estimate background paper color by sampling the border/corners
h, w, _ = arr.shape
border_pixels = np.concatenate([
    arr[:20, :, :].reshape(-1, 3),
    arr[-20:, :, :].reshape(-1, 3),
    arr[:, :20, :].reshape(-1, 3),
    arr[:, -20:, :].reshape(-1, 3)
])
bg_color = np.median(border_pixels, axis=0)
print('Estimated paper background color:', bg_color)

# Compute normalized luminance / brightness relative to background
# Standard perceptual weights: 0.299 R + 0.587 G + 0.114 B
lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
bg_lum = 0.299 * bg_color[0] + 0.587 * bg_color[1] + 0.114 * bg_color[2]

# Compute ink darkness ratio
darkness = (bg_lum - lum) / bg_lum
# Clip noise below paper threshold (small grain/texture on paper)
paper_noise_floor = 0.08
core_ink_threshold = 0.42

# Smoothstep alpha interpolation for silky antialiased edges
alpha_norm = np.clip((darkness - paper_noise_floor) / (core_ink_threshold - paper_noise_floor), 0.0, 1.0)
# Smooth curve
alpha_smooth = alpha_norm * alpha_norm * (3.0 - 2.0 * alpha_norm)
alpha = (alpha_smooth * 255.0).astype(np.uint8)

# Calculate ink hue from the real signature
# The signature is blue ink: let's inspect the average color of core ink pixels
core_mask = darkness > 0.35
core_ink_color = arr[core_mask].mean(axis=0)
print('Actual core ink RGB:', core_ink_color)

# We want high-end executive royal blue ink:
# Deep royal blue: RGB (20, 45, 135) with subtle shading based on stroke density
target_ink_rgb = np.array([20.0, 48.0, 138.0], dtype=np.float32)

# Modulate ink tone slightly with stroke depth for realistic fountain/ballpoint pen texture
depth = np.clip(darkness / 0.7, 0.0, 1.0)[:, :, np.newaxis]
ink_rendered = target_ink_rgb * (0.75 + 0.35 * depth)
ink_rendered = np.clip(ink_rendered, 0, 255).astype(np.uint8)

# Combine into RGBA
rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, :3] = ink_rendered
rgba[:, :, 3] = alpha

out_img = Image.fromarray(rgba, mode='RGBA')

# Auto-crop to exact signature bounding box with a clean 15px padding
bbox = out_img.getbbox()
print('Bounding box:', bbox)
cropped = out_img.crop(bbox)

# Add comfortable padding around signature
pad = 16
padded_w = cropped.width + pad * 2
padded_h = cropped.height + pad * 2
final_img = Image.new('RGBA', (padded_w, padded_h), (0, 0, 0, 0))
final_img.paste(cropped, (pad, pad))

# Save processed signature
out_path = os.path.join(output_dir, 'dr_sandeep_bhoyar_signature.png')
final_img.save(out_path, format='PNG', optimize=True)
print(f'Saved processed signature to: {out_path}')
print(f'Dimensions: {final_img.size[0]} x {final_img.size[1]} pixels (Aspect Ratio: {final_img.size[0] / final_img.size[1]:.2f})')

# Also generate a deep navy/black-blue variant for comparison
navy_ink_rgb = np.array([12.0, 24.0, 68.0], dtype=np.float32)
navy_rendered = np.clip(navy_ink_rgb * (0.8 + 0.3 * depth), 0, 255).astype(np.uint8)
rgba_navy = np.zeros((h, w, 4), dtype=np.uint8)
rgba_navy[:, :, :3] = navy_rendered
rgba_navy[:, :, 3] = alpha
cropped_navy = Image.fromarray(rgba_navy, mode='RGBA').crop(bbox)
final_navy = Image.new('RGBA', (padded_w, padded_h), (0, 0, 0, 0))
final_navy.paste(cropped_navy, (pad, pad))
navy_out_path = os.path.join(output_dir, 'dr_sandeep_bhoyar_signature_navy.png')
final_navy.save(navy_out_path, format='PNG', optimize=True)
print(f'Saved navy variant to: {navy_out_path}')
