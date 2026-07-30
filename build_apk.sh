#!/bin/bash
set -e

cd D:/workspace/Sudoku/sudoku-pure

SDK="D:/workspace/Sudoku/android-sdk"
BUILD_TOOLS="$SDK/build-tools/34.0.0"
PLATFORM="$SDK/platforms/android-34"
PROJ="apk-project"
OUTDIR="$PROJ/build2"
JAVA="C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre/bin/java"
JAVAC="C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre/bin/javac"

echo "==> Sync assets"
mkdir -p "$OUTDIR/assets"
cp index.html "$OUTDIR/assets/"

echo "==> Compile resources"
"$BUILD_TOOLS/aapt2" compile --dir "$PROJ/res" -o "$OUTDIR/res.zip"

echo "==> Link APK"
"$BUILD_TOOLS/aapt2" link -o "$OUTDIR/base.apk" -I "$PLATFORM/android.jar" --manifest "$PROJ/AndroidManifest.xml" "$OUTDIR/res.zip" -A "$OUTDIR/assets"

echo "==> Compile Java"
find "$OUTDIR" -name "*.class" -delete
"$JAVAC" -d "$OUTDIR" -classpath "$PLATFORM/android.jar" "$PROJ/src/com/sudoku/pure/MainActivity.java"

echo "==> Dex"
CLASS_FILES=$(find "$OUTDIR" -name "*.class" | tr '\n' ' ')
"$JAVA" -cp "$BUILD_TOOLS/lib/d8.jar" com.android.tools.r8.D8 $CLASS_FILES --output "$OUTDIR"

echo "==> Package dex"
(
  cd "$OUTDIR"
  "$BUILD_TOOLS/aapt" add base.apk classes.dex
)

echo "==> Align"
"$BUILD_TOOLS/zipalign" -f 4 "$OUTDIR/base.apk" "$OUTDIR/aligned.apk"

echo "==> Sign"
"$JAVA" -jar "$BUILD_TOOLS/lib/apksigner.jar" sign \
  --ks "$OUTDIR/debug.keystore" \
  --ks-key-alias sudoku \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "$OUTDIR/sudoku-pure.apk" \
  "$OUTDIR/aligned.apk"

echo "==> Copy to root"
cp "$OUTDIR/sudoku-pure.apk" sudoku-pure.apk

echo "==> Done: sudoku-pure.apk"
ls -lh sudoku-pure.apk
