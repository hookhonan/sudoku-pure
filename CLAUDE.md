# CLAUDE.md

## 核心规则

### Git 自动提交
- **每次代码修改完成后必须自动提交 git**，防止上下文压缩后丢失变更记录
- 提交信息用中文描述修改内容，格式：`type: 简短描述`
- 提交前确保所有相关文件已 staged
- 忽略 build 目录（已在 .gitignore 中）

### 文件编辑
- `index.html` 使用 **LF** 换行符（非 CRLF），已由 `.gitattributes` 锁定
- **缩进情况（实测）**: SudokuGame 类方法为 4 空格缩进，HintEngine 类为 4 空格缩进；不要假设 tab
- **Edit 工具在 index.html 上可以工作**（2026-08 实测多次成功），前提是 old_string 与文件字节完全一致——遇到失败先用 `python -c` 读字节定位确切缩进，不要凭 Read 输出猜测
- Python 脚本编辑要点：
  - 读写必须 `encoding='utf-8'`，写回 `newline=''` 保持 LF
  - **绝对不要用 raw string（`r'''...'''`）包含 JS 代码**——`\n` 会变成字面字符导致 JS 语法错误
  - 替换前 `assert content.count(old) == 1` 验证唯一
  - 用切片重排内容时（如替换整个类），**所有索引必须在原 content 上先算好再操作**，任何一步修改后再用旧索引都会错位
  - 改完必须跑 `node --check`（提取 `<script>` 块：`re.findall(r'<script>([\s\S]*?)</script>', html)`）
- 破坏性修复时可用 `git checkout HEAD -- index.html` 恢复（先确认工作区没有别的未提交改动）
- 小文件（.java, .xml, .md）可以用 Edit 工具

### 不需要的注释和行为
- 不写注释，除非 WHY 不明显
- 不创建 README、CHANGELOG 等文档（除非明确要求）
- 不添加错误处理/fallback 来处理不可能发生的场景

## 项目结构

```
sudoku-pure/
├── index.html          # 主游戏文件（~5000行，单文件HTML，含 LEVEL_PACK）
├── sudoku-pure.apk     # 最终签名的 APK
├── build_apk.sh        # 一键构建 APK 脚本（bash build_apk.sh）
├── SUDOKU_TECHNIQUES.md # 数独技巧汉化参考文档（28 项，HoDoKu 分类）
├── gen_levels.js       # Node 重新生成内置题库（输出 level_pack.js）
├── gen_icon.py         # 重新生成全部图标资源
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── APK-ISSUES.md      # APK 问题记录和修复日志
├── IMPROVEMENTS.md    # 改进方向清单（含 checkbox 待用户确认）
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
# 一键构建（同步 assets → aapt2 → javac → d8 → aapt add → zipalign → apksigner → 拷贝到根目录）
bash build_apk.sh
```
手动分步路径变量（已在 build_apk.sh 内写死，如无特殊需要直接用脚本）：
```bash
SDK="D:/workspace/Sudoku/android-sdk"; BUILD_TOOLS="$SDK/build-tools/34.0.0"
PLATFORM="$SDK/platforms/android-34"; PROJ="apk-project"; OUTDIR="$PROJ/build2"
JAVA="C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre/bin/java"
JAVAC="C:/Users/Administrator/Downloads/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_17.0.7.v20230425-1502/jre/bin/javac"
```
完整要点见下方"APK 构建要点"。

## 测试环境

- **手机**: 红米 K40, Android 13, MIUI
- **屏幕**: 2400×1080 (20:9), 有前置摄像头挖孔
- **PC 调试**: 浏览器直接打开 index.html 即可预览核心功能
- **WebView 调试**: 手机 USB 连接 → Chrome `chrome://inspect`

## 游戏关键设计

- **主页结构**: 底部4Tab（主页/当日挑战/选关/战绩统计）+ 关卡网格页，`_showTab()` 切换
- **关卡模式**: 无尽关卡，每难度内置99关（`LEVEL_PACK`），100关以后种子确定性生成
  - 渐进解锁：顺序过关解锁下一关；过99关显示到199，过199显示到299
  - `LevelManager.getDisplayedMax()` / `getPuzzle()` 是核心入口
- **难度**: 6档 easy/medium/hard/expert/master/extreme（简单/中等/困难/专家/大师/极限）
- **每日挑战**: 按星期轮换难度（周一easy→周日extreme），`DailyManager` 管理，种子按日期 `daily_YYYY-MM-DD`
- **自动保存**: 每次操作后自动保存到 localStorage，切后台时也触发保存
- **返回键**: 游戏中→主页，暂停中→关闭暂停，关卡页→选关Tab，其他Tab→主页Tab，主页→退出
- **主题**: 支持跟随系统/浅色/深色三种模式（`data-theme` 属性）
  - `_applyTheme()` 方法统一处理主题切换并同步状态栏颜色
- **提示引擎 `HintEngine`**（核心类，位于 Solver 之后）:
  - 技巧阶梯（findMove 循环）：唯一候选→唯余法→宫内排除→数对→三链数→隐数对→X-Wing→Swordfish→摩天楼→风筝→单色链→XY-Wing
  - 解释统一带 `【技巧名】` 前缀，措辞用"必须填"，禁用"推荐"
  - 全部技巧找不到时 `findMoveWithContradiction()` 对双候选格做矛盾试探（Nishio），确定"必须填"的值
  - `useHint()` 先用引擎，校验 digit 与解答一致（防止盘面有误导致推导错误），否则回退 `_buildHintReason`（仅裸单/隐单），最后走矛盾试探
  - 冒烟测试脚本模式：提取 script 块 → eval + `({classes})` → 用 LEVEL_PACK 逐关求解验证
- **锁屏/切后台自动暂停**: `visibilitychange` hidden 时 `_save()` + `pause(true)`（静默暂停，不播声音），Timer 用 setInterval 计数
- **数字键盘**: hover 样式必须包在 `@media (hover: hover) and (pointer: fine)` 内，否则触屏点击后蓝框残留（sticky hover）
- **工具脚本**:
  - `gen_levels.js`: Node 重新生成内置题库（输出 level_pack.js，需手动嵌入 index.html 替换 LEVEL_PACK）
  - `gen_icon.py`: 重新生成全部图标资源（矢量 XML + 各密度 PNG）

## 重要模式 & 教训

### 继续游戏
- `goHome()` 必须先 `_save()` 再跳转主页，否则存档丢失，继续按钮不显示
- 存档保存在 `localStorage.sudoku_game`，含 `gameStarted: true` 标记

### 响应式布局
- 桌面 (>500px 宽): 底部 spacer `flex: 0`，九宫格自然居中
- 手机 (≤500px 宽): 底部 spacer `flex: 0.5`，控件组上移靠近九宫格
- 状态栏: `FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS` + JS 接口 `setStatusBarColor()` 同步背景色

### 图标
- 原创设计：靛蓝渐变背景 + 3×3 圆角马赛克（四角白、边半透明、中心琥珀色）
- 自适应图标用 vector drawable（`res/drawable/ic_launcher_*.xml`），各密度 PNG 由 `gen_icon.py` 渲染

### APK 构建要点
- `d8` 和 `apksigner` 是 `.bat` 包装，bash 环境下直接用 `java -cp lib/d8.jar com.android.tools.r8.D8` 更可靠
- d8 必须传入所有 class 文件（含内部类 `MainActivity$SudokuJSInterface.class` 和 `R*.class`），否则报 nest mate 错误
- `java`/`javac` 不在 PATH 中，必须使用完整路径（见上方 JAVA/JAVAC 变量）
- apksigner 用 `java -jar lib/apksigner.jar` 可正常运行
- 构建前必须 `cp index.html → $OUTDIR/assets/`
- `aapt2 link` 需要 res.zip 作为位置参数传入
- OUTDIR 使用 `build2`（`build` 已被 .gitignore 忽略）

### 文档
- `APK-ISSUES.md`: 问题记录和修复日志
- `IMPROVEMENTS.md`: 改进方向清单（基于 sudoku.com APK 分析），含 checkbox 待用户确认
