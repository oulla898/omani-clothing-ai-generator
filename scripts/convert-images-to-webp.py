#!/usr/bin/env python3
"""
Image to WebP Converter
Converts JPG, JPEG, and PNG images to WebP format with minimal quality loss.
Preserves original files and creates .webp versions.
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("❌ Error: Pillow library not found!")
    print("📦 Installing Pillow...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def convert_to_webp(input_path, output_path=None, quality=95, lossless=False):
    """
    Convert an image to WebP format.
    
    Args:
        input_path: Path to input image (JPG, PNG, etc.)
        output_path: Path for output WebP file (optional)
        quality: Quality setting 0-100 (default: 95 for minimal loss)
        lossless: Use lossless compression (default: False)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Open the image
        img = Image.open(input_path)
        
        # Smart quality adjustment based on source format
        input_ext = Path(input_path).suffix.lower()
        if input_ext in ['.jpg', '.jpeg'] and quality > 85:
            # JPG is already compressed, use lower quality for better size
            quality = 85
            print(f"   ℹ️  Adjusted quality to 85 for JPG source")
        
        # Preserve transparency for PNG, convert to RGB for JPG
        if img.mode == 'P':
            img = img.convert('RGBA')
        
        # Only convert to RGB if it's not already RGB/RGBA (preserve alpha channel)
        # WebP supports transparency, so we keep RGBA for PNGs
        if img.mode not in ('RGB', 'RGBA'):
            if 'A' in img.mode or img.mode == 'LA':
                img = img.convert('RGBA')
            else:
                img = img.convert('RGB')
        
        # Generate output path if not provided
        if output_path is None:
            input_file = Path(input_path)
            output_path = input_file.parent / f"{input_file.stem}.webp"
        
        # Save as WebP
        if lossless:
            img.save(output_path, 'WEBP', lossless=True)
        else:
            img.save(output_path, 'WEBP', quality=quality, method=6)
        
        # Get file sizes
        original_size = os.path.getsize(input_path)
        webp_size = os.path.getsize(output_path)
        reduction = ((original_size - webp_size) / original_size) * 100
        
        print(f"✅ {Path(input_path).name}")
        print(f"   Original: {original_size / 1024:.1f} KB")
        print(f"   WebP: {webp_size / 1024:.1f} KB")
        print(f"   Reduction: {reduction:.1f}%")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error converting {input_path}: {str(e)}")
        return False

def batch_convert_directory(directory, quality=95, lossless=False, extensions=None):
    """
    Convert all images in a directory to WebP.
    
    Args:
        directory: Directory containing images
        quality: Quality setting 0-100 (default: 95)
        lossless: Use lossless compression (default: False)
        extensions: List of file extensions to convert (default: ['.jpg', '.jpeg', '.png'])
    """
    if extensions is None:
        extensions = ['.jpg', '.jpeg', '.png']
    
    directory = Path(directory)
    
    if not directory.exists():
        print(f"❌ Directory not found: {directory}")
        return
    
    # Find all images
    image_files = []
    for ext in extensions:
        image_files.extend(directory.glob(f"*{ext}"))
        image_files.extend(directory.glob(f"*{ext.upper()}"))
    
    if not image_files:
        print(f"ℹ️  No images found in {directory}")
        return
    
    print(f"🖼️  Found {len(image_files)} image(s) to convert")
    print(f"📁 Directory: {directory}")
    print(f"🎯 Quality: {quality}% {'(Lossless)' if lossless else ''}")
    print("=" * 50)
    print()
    
    successful = 0
    failed = 0
    total_original = 0
    total_webp = 0
    
    for img_path in image_files:
        # Skip if WebP already exists
        webp_path = img_path.parent / f"{img_path.stem}.webp"
        if webp_path.exists():
            print(f"⏭️  Skipping {img_path.name} (WebP already exists)")
            continue
        
        original_size = os.path.getsize(img_path)
        total_original += original_size
        
        if convert_to_webp(img_path, quality=quality, lossless=lossless):
            successful += 1
            total_webp += os.path.getsize(webp_path)
        else:
            failed += 1
    
    # Summary
    print("=" * 50)
    print("📊 CONVERSION SUMMARY")
    print("=" * 50)
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"📦 Total Original Size: {total_original / 1024:.1f} KB")
    print(f"📦 Total WebP Size: {total_webp / 1024:.1f} KB")
    if total_original > 0:
        total_reduction = ((total_original - total_webp) / total_original) * 100
        print(f"💾 Total Savings: {(total_original - total_webp) / 1024:.1f} KB ({total_reduction:.1f}%)")
    print()
    print("ℹ️  Original files were preserved. You can delete them after verifying WebP quality.")

def main():
    """Main entry point for the script."""
    print("=" * 50)
    print("🎨 IMAGE TO WEBP CONVERTER")
    print("=" * 50)
    print()
    
    # Default to ../public directory (relative to script location)
    script_dir = Path(__file__).parent
    default_dir = script_dir.parent / "public"
    
    if len(sys.argv) > 1:
        target_dir = Path(sys.argv[1])
    else:
        target_dir = default_dir
    
    # Quality setting (95 = minimal quality loss)
    quality = 95
    if len(sys.argv) > 2:
        try:
            quality = int(sys.argv[2])
            quality = max(1, min(100, quality))  # Clamp between 1-100
        except ValueError:
            print("⚠️  Invalid quality value, using default: 95")
    
    # Lossless mode (for PNG with transparency)
    lossless = False
    if len(sys.argv) > 3 and sys.argv[3].lower() in ['lossless', 'true', '1']:
        lossless = True
    
    print(f"📁 Target Directory: {target_dir.absolute()}")
    print()
    
    if not target_dir.exists():
        print(f"❌ Directory not found: {target_dir}")
        print()
        print("Usage:")
        print(f"  python {Path(__file__).name} [directory] [quality] [lossless]")
        print()
        print("Examples:")
        print(f"  python {Path(__file__).name}")
        print(f"  python {Path(__file__).name} ../public")
        print(f"  python {Path(__file__).name} ../public 90")
        print(f"  python {Path(__file__).name} ../public 95 lossless")
        sys.exit(1)
    
    batch_convert_directory(target_dir, quality=quality, lossless=lossless)

if __name__ == "__main__":
    main()
