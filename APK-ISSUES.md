# APK 问题记录 & 修复日志

> 测试设备: 红米K40, Android 13
> 最新APK: sudoku-pure.apk v1.1 (2026-07-18)

---

## 修复历史

### v1.1 (当前版本)
| 问题 | 修复方式 |
|------|---------|
| 数字键/功能栏在屏幕最下方 | 底部 spacer (flex:0.5) 将控件组上推，九宫格保持居中 |
| 顶部黑边(刘海屏) | cutout mode + safe-area-inset-top + notch meta |
| 返回键直接退出 | JS bridge 拦截：游戏中→主页，主页→退出 |
| App 图标太丑 | 仿 sudoku.com 风格重设计：双色蓝底+完整3x3网格+已填格子+高亮格 |
| 后台切回后进度丢失 | visibilitychange/pagehide 事件自动保存游戏状态 |
| 屏幕比例适配 | bottom-spacer flex 比例自适应不同屏幕 |

### v1.0 (803b9b8)
- 自适应图标 + FrameLayout 全屏
- targetSdkVersion=34
- 通关弹窗优化

---

## 布局说明

九宫格保持 `board-container` 内垂直居中，新增 `#bottom-spacer`（flex: 0.5）
将控件组整体上推。移动量与屏幕高度成正比：
- 短屏 (16:9): 控件组上移约 80-120px
- 长屏 (20:9, K40): 控件组上移约 150-200px

---

## PC 端模拟调试 APK

### 方法 1: 浏览器直接打开（最快）
在浏览器打开 `index.html` 即可预览游戏逻辑和 UI。
布局可能略有差异（宽屏 vs 竖屏），但核心功能一致。

### 方法 2: Chrome DevTools 远程调试
1. 手机 USB 连接电脑，开启 USB 调试
2. 手机打开 App
3. Chrome 访问 `chrome://inspect`
4. 找到 WebView → inspect → 实时调试 HTML/CSS/JS

### 方法 3: 第三方 Android 模拟器
- BlueStacks: https://www.bluestacks.com/
- MuMu Player: https://mumu.163.com/
- 安装后拖拽 APK 即可安装运行

### 方法 4: Android 官方模拟器（需硬件加速）
```bash
# 需要先安装 HAXM 或启用 Hyper-V
sdkmanager "system-images;android-34;google_apis;x86_64"
avdmanager create avd -n test -k "system-images;android-34;google_apis;x86_64"
emulator -avd test
adb install sudoku-pure.apk
```
⚠ 此电脑缺少硬件加速驱动，模拟器暂时无法启动。
