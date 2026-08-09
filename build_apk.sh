#!/bin/bash
# Sudoku Pure - APK 一键构建脚本
# 用法: bash build_apk.sh
# 可通过环境变量覆盖（适配不同机器 / CI）：
#   ANDROID_SDK_ROOT / ANDROID_HOME / SDK   Android SDK 路径
#   BUILD_TOOLS                             build-tools 目录
#   ANDROID_PLATFORM / PLATFORM             android.jar 所在平台目录
#   JAVA / JAVAC                            JDK 可执行文件路径
#   OUTDIR                                  构建输出目录（默认 apk-project/build2）
#   签名：KEYSTORE / KEYSTORE_ALIAS / KEYSTORE_PASS / KEY_PASS（默认 debug keystore，仅供开发）
set -e

cd "$(dirname "$0")"

SDK="${SDK:-${ANDROID_SDK_ROOT:-${ANDROID_HOME:-D:/workspace/Sudoku/android-sdk}}}"
BUILD_TOOLS="${BUILD_TOOLS:-$SDK/build-tools/34.0.0}"
PLATFORM="${PLATFORM:-$SDK/platforms/android-34}"
PROJ="apk-project"
OUTDIR="${OUTDIR:-$PROJ/build2}"
JAVA="${JAVA:-C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre/bin/java}"
JAVAC="${JAVAC:-C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre/bin/javac}"

# 签名配置：默认使用 debug keystore（仅开发测试）；正式发布请通过环境变量指定 release keystore
KEYSTORE="${KEYSTORE:-$OUTDIR/debug.keystore}"
KEYSTORE_ALIAS="${KEYSTORE_ALIAS:-sudoku}"
KEYSTORE_PASS="${KEYSTORE_PASS:-android}"
KEY_PASS="${KEY_PASS:-android}"

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
  --ks "$KEYSTORE" \
  --ks-key-alias "$KEYSTORE_ALIAS" \
  --ks-pass pass:"$KEYSTORE_PASS" \
  --key-pass pass:"$KEY_PASS" \
  --out "$OUTDIR/sudoku-pure.apk" \
  "$OUTDIR/aligned.apk"

echo "==> Copy to root"
cp "$OUTDIR/sudoku-pure.apk" sudoku-pure.apk

echo "==> Done: sudoku-pure.apk"
ls -lh sudoku-pure.apk
