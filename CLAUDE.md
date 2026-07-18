# CLAUDE.md

## 核心规则

### Git 自动提交
- **每次代码修改完成后必须自动提交 git**，防止上下文压缩后丢失变更记录
- 提交信息用中文描述修改内容，格式：`type: 简短描述`
- 提交前确保所有相关文件已 staged
- 忽略 build 目录（已在 .gitignore 中）

### 文件编辑
- `index.html` 使用 **LF** 换行符（非 CRLF），已由 `.gitattributes` 锁定
- **Edit 工具不可用于 index.html** — 文件内混合使用 Tab 和空格缩进，Read 输出带行号前缀后无法准确还原原始字符串，每次都匹配失败
- **必须用 Python 脚本编辑 index.html**，这是唯一可靠的方式：
  ```python
  # 读取、替换、写回（保持 newline='' 不变更换行符）
  with open('index.html', 'r', encoding='utf-8') as f:
      content = f.read()
  content = content.replace(old_string, new_string)
  if content.count(old_string) == 1:  # 验证唯一匹配
      with open('index.html', 'w', encoding='utf-8', newline='') as f:
          f.write(content)
  ```
- 小文件（.java, .xml, .md）可以用 Edit 工具

### 不需要的注释和行为
- 不写注释，除非 WHY 不明显
- 不创建 README、CHANGELOG 等文档（除非明确要求）
- 不添加错误处理/fallback 来处理不可能发生的场景

## 项目结构

```
sudoku-pure/
├── index.html          # 主游戏文件（~3700行，单文件HTML）
├── sudoku-pure.apk     # 最终签名的 APK
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── APK-ISSUES.md      # APK 问题记录和修复日志
├── puzzles.json       # 备用题库数据
└── apk-project/       # APK 构建源码
    ├── AndroidManifest.xml
    ├── assets/index.html    # 构建前需从根目录同步
    ├── res/
    │   ├── drawable/        # 图标矢量 (foreground + background)
    │   ├── mipmap-*/        # PNG 图标 (各密度)
    │   ├── mipmap-anydpi-v26/  # 自适应图标 (API 26+)
    │   └── values/
    └── src/com/sudoku/pure/MainActivity.java
```

## 构建环境

- **Java 17**: `C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre`
- **Android SDK**: `D:/workspace/Sudoku/android-sdk/`
- **Build Tools**: 34.0.0
- **Platform**: android-34
- **Keystore**: `apk-project/build2/debug.keystore` (alias: sudoku, password: android)

### APK 构建步骤（快速参考）
```bash
SDK="D:/workspace/Sudoku/android-sdk"; BUILD_TOOLS="$SDK/build-tools/34.0.0"
PLATFORM="$SDK/platforms/android-34"; PROJ="apk-project"; OUTDIR="$PROJ/build"
JAVA_HOME="C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre"
# 1. cp index.html → $OUTDIR/assets/
# 2. aapt2 compile + link + javac + d8 + aapt add + zipalign + apksigner
```
完整命令见 APK-ISSUES.md 末尾。

## 测试环境

- **手机**: 红米 K40, Android 13, MIUI
- **屏幕**: 2400×1080 (20:9), 有前置摄像头挖孔
- **PC 调试**: 浏览器直接打开 index.html 即可预览核心功能
- **WebView 调试**: 手机 USB 连接 → Chrome `chrome://inspect`

## 游戏关键设计

- **闯关模式**: 120 个预置关卡（`LEVEL_PUZZLES` 常量），4 个难度 × 30 关
- **难度**: easy/medium/hard/expert，通过 naked-single 比例分级
- **自动保存**: 每次操作后自动保存到 localStorage，切后台时也触发保存
- **返回键**: 游戏中按返回→回主页，主页按返回→退出（JS bridge `window._onBackPressed()`）
- **一键笔记**: 默认禁用，需在设置中手动开启
- **主题**: 支持跟随系统/浅色/深色三种模式（`data-theme` 属性）
  - `auto`: CSS `prefers-color-scheme` 媒体查询自动切换
  - `light`/`dark`: 手动固定
  - `_applyTheme()` 方法统一处理主题切换并同步状态栏颜色

## 重要模式 & 教训

### 继续游戏
- `goHome()` 必须先 `_save()` 再跳转主页，否则存档丢失，继续按钮不显示
- 存档保存在 `localStorage.sudoku_game`，含 `gameStarted: true` 标记

### 响应式布局
- 桌面 (>500px 宽): 底部 spacer `flex: 0`，九宫格自然居中
- 手机 (≤500px 宽): 底部 spacer `flex: 0.5`，控件组上移靠近九宫格
- 状态栏: `FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS` + JS 接口 `setStatusBarColor()` 同步背景色

### 图标
- 来源: `https://sudoku.com/img/icon-app@2x.png` (128×128 PNG)
- Android: 各密度 mipmap PNG + mipmap-anydpi-v26 自适应图标 (PNG foreground + background)
- 下载后存为 `icon-app.png`，用 PIL resize 到各密度

### APK 构建要点
- `d8` 和 `apksigner` 是 `.bat` 包装，直接用 `java -jar lib/d8.jar` / `java -jar lib/apksigner.jar` 更可靠
- 构建前必须 `cp index.html → $OUTDIR/assets/`
- `aapt2 link` 需要 res.zip 作为位置参数传入
- 需先生成 keystore 再签名 (`keytool -genkey`)

### 文档
- `APK-ISSUES.md`: 问题记录和修复日志
- `IMPROVEMENTS.md`: 改进方向清单（基于 sudoku.com APK 分析），含 checkbox 待用户确认
