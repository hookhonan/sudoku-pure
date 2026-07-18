# APK 已知问题列表

> 测试设备: 红米K40, Android 13
> APK版本: sudoku-pure.apk (640a512) — **已修复**
>
> **状态更新 (2026-07-18)**: 三个问题均已在 commit `640a512` 中修复，等待手机端验证。

---

## 问题 1: 应用图标缺失

**现象**: 安装后桌面图标为透明/空白，无应用图标显示。

**原因**: APK使用了简单的 `@drawable/ic_launcher` 作为图标（纯色蓝色矩形shape），但drawable资源可能未正确编译进APK或Android 13的自适应图标机制未正确处理。

**解决方案**:
- 创建真正的自适应图标（`ic_launcher.xml` + `ic_launcher_round.xml`），包含前景和背景层
- 或使用 mipmap 资源目录放置 PNG 图标（192×192 和 512×512）
- 需在 AndroidManifest.xml 中同时声明 `android:icon` 和 `android:roundIcon`

---

## 问题 2: 屏幕仅左上角1/9显示，其余黑色

**现象**: 打开App后，游戏内容仅在屏幕左上角约1/9区域显示，其余区域全黑。

**原因**: WebView 的布局问题。MainActivity 中直接 `setContentView(webView)` 但没有设置合适的布局参数。WebView 可能使用了默认的 `wrap_content` 大小，导致只显示了 HTML 内容的实际大小而非充满屏幕。

**解决方案**:
- 使用 `FrameLayout` 作为根布局，WebView 设置为 `MATCH_PARENT`
- 或在 WebView 上明确设置 `LayoutParams(MATCH_PARENT, MATCH_PARENT)`
- 检查 HTML 中的 viewport meta 标签和 CSS 尺寸设置
- CSS中使用了 `100dvh` / `100vh` 但 WebView 可能无法正确计算
- 可能需要移除 `FLAG_FULLSCREEN` 并改用 `SYSTEM_UI_FLAG_FULLSCREEN`

---

## 问题 3: Android版本兼容警告

**现象**: 安装/打开时系统弹出"是为较旧版本Android操作系统构建的，可能无法正常工作"。

**原因**: APK 的 `targetSdkVersion` 未明确设置或设置过低。当前 APK 使用 `build-tools 34.0.0` 编译但 AndroidManifest.xml 中未指定 `targetSdkVersion`（默认为1），Google Play 和 Android 13 要求 `targetSdkVersion >= 33`。

**解决方案**:
- 在 AndroidManifest.xml 的 `<uses-sdk>` 标签中设置:
  ```xml
  <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34"/>
  ```
- 或使用 aapt2 link 时的 `--min-sdk-version` 和 `--target-sdk-version` 参数

---

## 备注

- 问题1和3相对简单，主要是构建配置问题
- 问题2可能需要调试 WebView 布局 + HTML CSS viewport 适配
- 建议先修复问题1和3，再排查问题2
