# APK 问题记录 & 修复日志

> 测试设备: 红米K40, Android 13
> 最新APK: sudoku-pure.apk (2026-07-18)

---

## 修复历史

### 第一批修复 (commit 640a512)
| 问题 | 修复 |
|------|------|
| 图标缺失 | 添加自适应图标 mipmap-anydpi-v26 + 各密度 PNG 回退 |
| 屏幕 1/9 显示 | FrameLayout + MATCH_PARENT 包裹 WebView |
| 版本警告 | uses-sdk targetSdkVersion=34 |

### 第二批修复 (当前版本)
| 问题 | 修复 |
|------|------|
| 九宫格+控件太靠下 | board-container 改为 flex-start + bottom-spacer 分流底部空间 |
| 顶部黑边(刘海屏) | cutout mode + safe-area-inset-top + notch meta |
| 返回键直接退出 | JS bridge 拦截返回键，游戏中回到主页，主页时退出 |
| 图标太丑 | 完整 3x3 网格前景+双色背景，含已填格子和高亮格 |
| 屏幕比例适配 | bottom-spacer flex 比例自适应，长屏手机效果更明显 |

---

## 布局调整说明

九宫格从 board-container 垂直居中改为顶部对齐（6px 上边距），
底部新增 `#bottom-spacer`（flex: 0.5）将控件组整体上推。

实际移动量随屏幕高度变化：
- 短屏 (16:9): 上移约 60-80px
- 长屏 (20:9, K40): 上移约 120-200px
- 控件（功能键+数字键）跟随九宫格整体上移

---

## PC 端模拟运行 APK 的方法

### 方法 1: Android 官方模拟器（需要硬件加速）
```bash
# 安装 HAXM 或启用 Hyper-V
# 下载 system image
sdkmanager "system-images;android-34;google_apis;x86_64"
# 创建 AVD
avdmanager create avd -n test -k "system-images;android-34;google_apis;x86_64" -d pixel_6
# 启动
emulator -avd test
# 安装 APK
adb install sudoku-pure.apk
```
⚠ 此电脑缺少硬件加速驱动，模拟器暂时无法启动。

### 方法 2: Chrome DevTools 调试 WebView（推荐）
1. 手机开启 USB 调试，连接到电脑
2. 手机打开 App
3. Chrome 访问 `chrome://inspect`
4. 找到 WebView → 点击 "inspect"
5. 可以实时调试 HTML/CSS/JS

### 方法 3: 直接在浏览器打开（最快）
直接在电脑浏览器打开 `index.html` 即可预览和调试游戏逻辑。
布局可能略有差异（宽屏 vs 竖屏），但核心功能完全一致。

### 方法 4: 第三方模拟器
- BlueStacks: https://www.bluestacks.com/
- MuMu Player: https://mumu.163.com/
- 安装后拖拽 APK 到模拟器窗口即可安装

---

## 构建命令备忘

构建环境：
- Java 17: Eclipse 自带 JRE
- Android SDK: `D:/workspace/Sudoku/android-sdk/`
- Build tools: 34.0.0
- Platform: android-34

```bash
# 设置环境变量
SDK="D:/workspace/Sudoku/android-sdk"
BUILD_TOOLS="$SDK/build-tools/34.0.0"
PLATFORM="$SDK/platforms/android-34"
JAVA_HOME="C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre"
PROJ="apk-project"
OUTDIR="$PROJ/build"

# 1. 编译资源
"$BUILD_TOOLS/aapt2" compile --dir "$PROJ/res" -o "$OUTDIR/res.zip"
# 2. 链接
"$BUILD_TOOLS/aapt2" link --manifest "$PROJ/AndroidManifest.xml" -I "$PLATFORM/android.jar" --java "$OUTDIR/gen" -o "$OUTDIR/base.apk" --min-sdk-version 21 --target-sdk-version 34 "$OUTDIR/res.zip"
# 3. 编译 Java
"$JAVA_HOME/bin/javac" -source 1.8 -target 1.8 -encoding UTF-8 -cp "$PLATFORM/android.jar" -d "$OUTDIR/obj" "$PROJ/src/com/sudoku/pure/MainActivity.java" $(find "$OUTDIR/gen" -name "*.java")
# 4. dex
JAVA_HOME="$JAVA_HOME" "$BUILD_TOOLS/d8.bat" --lib "$PLATFORM/android.jar" --output "$OUTDIR" $(find "$OUTDIR/obj" -name "*.class")
# 5. 添加 assets & dex
cd "$OUTDIR" && "$BUILD_TOOLS/aapt" add base.apk assets/index.html && "$BUILD_TOOLS/aapt" add base.apk classes.dex && cd ../..
# 6. 对齐
"$BUILD_TOOLS/zipalign" -f -p 4 "$OUTDIR/base.apk" "$OUTDIR/aligned.apk"
# 7. 签名
java -jar "$BUILD_TOOLS/lib/apksigner.jar" sign --ks keystore --ks-pass pass:android --out sudoku-pure.apk "$OUTDIR/aligned.apk"
```
