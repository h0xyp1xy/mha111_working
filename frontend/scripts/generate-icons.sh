#!/bin/bash

# Script to generate mobile app icons from butterfly.svg
# All icons will be generated from the same source to ensure consistency
# Requires ImageMagick: sudo apt-get install imagemagick (Ubuntu/Debian) or brew install imagemagick (macOS)

set -e

INPUT="public/butterfly.svg"
OUTPUT_DIR="public"

if [ ! -f "$INPUT" ]; then
    echo "Error: $INPUT not found!"
    exit 1
fi

echo "🦋 Generating icons from $INPUT..."
echo "   All icons will be generated from the same source (butterfly.svg) for consistency"
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick (convert) is not installed!"
    echo "Install with: sudo apt-get install imagemagick (Ubuntu/Debian) or brew install imagemagick (macOS)"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Standard favicon sizes
echo "📱 Generating standard favicon sizes..."
for size in 16 32 96; do
    echo "   ✓ icon-${size}x${size}.png"
    convert -background none -resize ${size}x${size} "$INPUT" "${OUTPUT_DIR}/icon-${size}x${size}.png"
done

# iOS/Apple Touch Icon sizes (all from same source)
echo ""
echo "🍎 Generating iOS/Apple Touch Icon sizes..."
for size in 57 60 72 76 114 120 144 152 180; do
    echo "   ✓ icon-${size}x${size}.png"
    convert -background none -resize ${size}x${size} "$INPUT" "${OUTPUT_DIR}/icon-${size}x${size}.png"
done

# Primary Apple Touch Icon (180x180) - this is the main one iOS uses
echo "   ✓ apple-touch-icon.png (180x180)"
convert -background none -resize 180x180 "$INPUT" "${OUTPUT_DIR}/apple-touch-icon.png"

# Android/Chrome PWA sizes
echo ""
echo "🤖 Generating Android/Chrome PWA sizes..."
for size in 128 192 384 512; do
    echo "   ✓ icon-${size}x${size}.png"
    convert -background none -resize ${size}x${size} "$INPUT" "${OUTPUT_DIR}/icon-${size}x${size}.png"
done

# Generate maskable icon variants (with padding for Android adaptive icons)
# 80% of the image size, centered
# Note: This is optional - regular icons will work fine too
echo ""
echo "🎨 Generating maskable icon variants (for Android adaptive icons)..."
for size in 192 512; do
    # Create maskable version with 20% padding (icon takes 80% of canvas)
    # Use awk for floating point calculation (more portable than bc)
    icon_size=$(awk "BEGIN {printf \"%.0f\", $size * 0.8}")
    
    if convert -background white -size ${size}x${size} xc:none \
            \( "$INPUT" -resize ${icon_size}x${icon_size} \) \
            -gravity center -composite \
            "${OUTPUT_DIR}/icon-${size}x${size}-maskable.png" 2>/dev/null; then
        echo "   ✓ icon-${size}x${size}-maskable.png (with padding)"
    else
        echo "   ⚠ Skipping maskable variant (optional, not critical)"
    fi
done

echo ""
echo "✅ All icons generated successfully in $OUTPUT_DIR/"
echo ""
echo "📋 Generated files:"
echo "   - Favicons: 16x16, 32x32, 96x96"
echo "   - iOS/Apple: 57x57, 60x60, 72x72, 76x76, 114x114, 120x120, 144x144, 152x152, 180x180"
echo "   - Apple Touch Icon: apple-touch-icon.png (180x180)"
echo "   - Android/PWA: 128x128, 192x192, 384x384, 512x512"
echo "   - Maskable: 192x192-maskable, 512x512-maskable (for Android adaptive icons)"
echo ""
echo "🎯 All icons are generated from the same source (butterfly.svg) for consistency!"
