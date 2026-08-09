# Sudoku Pure 数独

一个干净、纯粹、无广告的数独游戏。网页版（PWA）+ 原生 Android WebView 封装（APK）。

- 🎮 6 档难度：简单 / 中等 / 困难 / 专家 / 大师 / 极限
- 🧩 关卡模式：每难度内置 99 关，100 关以后种子确定性生成，无尽畅玩
- 📅 每日挑战：按星期轮换难度
- 💡 智能提示引擎：支持 12 种数独技巧（唯一候选、唯余、宫内排除、数对、三链数、隐数对、X-Wing、Swordfish、摩天楼、风筝、单色链、XY-Wing）+ 矛盾试探
- 📝 笔记模式、撤销、自动保存、错误高亮、同数高亮
- 🌗 主题：跟随系统 / 浅色 / 深色
- 📊 战绩统计：通关数、最佳时间、完成率
- 🔇 音效 / 振动（可静音）
- 📴 完全离线：数据仅存本地，无网络、无广告、无数据收集

## 在线试玩

GitHub Pages: https://hook.github.io/sudoku-pure/

> 打开后建议"添加到主屏幕"，可作为 PWA 使用。

## 项目结构

```
sudoku-pure/
├── index.html            # 主游戏文件（单文件 HTML，内置题库 LEVEL_PACK）
├── js/                   # 模块化源码（开发版）
│   ├── core/             # 生成 / 求解 / 校验
│   ├── game/             # 棋盘 / 历史 / 提示 / 计时
│   ├── ui/               # 渲染 / 输入 / 动画 / 音效 / 弹窗
│   └── data/             # 存储 / 统计 / 国际化
├── css/                  # 样式（board / themes / reset）
├── assets/
│   ├── icons/            # PWA 图标
│   └── sounds/           # 游戏音效
├── manifest.json         # PWA manifest
├── sw.js                 # Service Worker（离线缓存）
├── puzzles.json          # 题库（备用）
├── apk-project/          # APK 构建源码
│   ├── AndroidManifest.xml
│   ├── res/              # 图标资源
│   └── src/com/sudoku/pure/MainActivity.java
└── build_apk.sh          # 一键构建 APK 脚本
```

## 本地预览

直接用浏览器打开 `index.html` 即可（无构建步骤）。

## 构建 APK

需要：Android SDK（build-tools 34.0.0、platform android-34）、JDK 17。

```bash
bash build_apk.sh
```

脚本可通过环境变量覆盖本机路径，适配不同构建环境：

```bash
export ANDROID_SDK_ROOT=/path/to/android-sdk
export JAVA_HOME=/path/to/jdk
export JAVA=/path/to/jdk/bin/java
export JAVAC=/path/to/jdk/bin/javac
bash build_apk.sh
```

> **发布签名**：默认使用开发用 `debug.keystore`（仅供本地测试）。正式发布请使用自己的 release keystore：
>
> ```bash
> export KEYSTORE=/path/to/release.keystore
> export KEYSTORE_ALIAS=your-alias
> export KEYSTORE_PASS=your-pass
> export KEY_PASS=your-pass
> bash build_apk.sh
> ```

## 技术栈

- 纯原生 HTML/CSS/JavaScript（零第三方依赖）
- Canvas 渲染数独棋盘
- WebView 封装（`MainActivity.java`）：状态栏配色同步、渲染进程崩溃自愈、原生返回键处理
- PWA：Service Worker 离线缓存

## 开源协议

本项目基于 [GNU GPL v3](LICENSE) 协议开源。

Copyright (C) 2026 hook
