# CLAUDE.md

## 核心规则

### Git 自动提交
- **每次代码修改完成后必须自动提交 git**，防止上下文压缩后丢失变更记录
- 提交信息用中文描述修改内容，格式：`type: 简短描述`
- 提交前确保所有相关文件已 staged
- 忽略 build 目录（已在 .gitignore 中）

### 文件编辑
- `index.html` 使用 **CRLF** 换行符（Windows 格式）
- Edit 工具经常因 CRLF 匹配失败，**优先使用 Python 脚本进行文本替换**
- 示例：`python -c "with open('index.html','r',encoding='utf-8') as f: content=f.read(); content=content.replace(old,new); ..."`

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
- **主题**: 支持亮色/暗色切换（`data-theme` 属性）
