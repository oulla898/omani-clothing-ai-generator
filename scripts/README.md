# Image Converter Scripts

## 🎨 Python Script: `convert-images-to-webp.py`

Converts JPG, JPEG, and PNG images to WebP format with minimal quality loss.

### Prerequisites

```powershell
pip install Pillow
```

Or the script will auto-install it on first run.

### Usage

#### Basic Usage (Converts all images in `../public`)
```powershell
cd scripts
python convert-images-to-webp.py
```

#### Specify Directory
```powershell
python convert-images-to-webp.py ../public
```

#### Custom Quality (1-100, default: 95)
```powershell
python convert-images-to-webp.py ../public 90
```

#### Lossless Mode (for PNG with transparency)
```powershell
python convert-images-to-webp.py ../public 95 lossless
```

### Features

✅ **High Quality**: Uses quality=95 by default (minimal loss)  
✅ **Safe**: Preserves original files  
✅ **Smart**: Skips files that already have WebP versions  
✅ **Detailed**: Shows size before/after for each file  
✅ **Summary**: Total savings report at the end  

### What It Does

1. Finds all `.jpg`, `.jpeg`, `.png` files
2. Converts to `.webp` format
3. Shows file size comparison
4. Reports total savings

### Expected Results

- **PNG** (3.2 MB) → WebP (~500 KB) = **84% smaller**
- **JPG** (100 KB) → WebP (~35 KB) = **65% smaller**

### Output Example

```
🖼️  Found 6 image(s) to convert
📁 Directory: c:\Users\...\public
🎯 Quality: 95%
==================================================

✅ night man moon.png
   Original: 3172.9 KB
   WebP: 487.3 KB
   Reduction: 84.6%

✅ old in office 2.jpg
   Original: 105.1 KB
   WebP: 38.2 KB
   Reduction: 63.6%

==================================================
📊 CONVERSION SUMMARY
==================================================
✅ Successful: 6
❌ Failed: 0
📦 Total Original Size: 3848.2 KB
📦 Total WebP Size: 891.4 KB
💾 Total Savings: 2956.8 KB (76.8%)
```

### After Conversion

1. **Test the WebP images** - verify they look good
2. **Update code** if needed - some images might need filename updates in HTML
3. **Delete originals** (optional) - keep them as backup or remove to save space
4. **Deploy** - push changes to Vercel

### Troubleshooting

**Error: Pillow not found**
```powershell
pip install Pillow
```

**Permission denied**
```powershell
# Run PowerShell as Administrator
```

**Python not found**
```powershell
# Install Python from python.org
# Or use: python3 instead of python
```
