# AGENTS.md

## 项目概览

这是一个基于 Vite + TypeScript 的网页 falling blocks 游戏，项目名为 `russian-brick`。
当前只有前端，没有后端服务。构建产物输出到 `dist/`，依赖安装在 `node_modules/`。

当前支持两种模式：

- 单人模式：经典单棋盘玩法
- 双人对战：同机双人限时对战，按消行数决定胜负

近期新增功能：

- Combo 连消加分：连续消行或一次消多行时触发 Combo，未消行则重置
- 可选 Hold 保存方块：开始弹窗中勾选 `Hold Piece` 后启用，否则不显示也不响应保存按键
- 流动渐变背景：保留原背景图，同时叠加缓慢流动的渐变光晕
- 玩家面板玻璃质感：面板更透明，方便看到背景模糊效果

## 工作约束

- 禁止批量删除文件或目录。
- 不要使用：
  - `del /s`
  - `rd /s`
  - `rmdir /s`
  - `Remove-Item -Recurse`
  - `rm -rf`
- 需要删除文件时，只能一次删除一个明确路径的文件。
- 推荐在 Windows PowerShell 中使用 `npm.cmd`，不要直接运行 `npm.ps1`。

## 主要文件

- `index.html`：页面结构入口，包含顶部状态栏、单/双人棋盘区域、玩家统计卡、开始弹窗、帮助弹窗，并加载 `/src/main.ts`
- `src/main.ts`：游戏主逻辑，负责模式切换、玩家状态、掉落循环、消行、Combo、Hold、计时、胜负判定、输入处理和弹窗交互
- `src/style.css`：全部页面样式，负责整体布局、棋盘尺寸约束、按钮、预览区、流动背景、玻璃面板、弹窗和响应式布局
- `package.json`：项目脚本和依赖配置
- `tsconfig.json`：TypeScript 配置，开启了 `strict`
- `README.md`：简短项目说明和运行方法

## 运行命令

- 安装依赖：`npm.cmd install`
- 启动开发服务：`npm.cmd run dev`
- 指定端口启动：`npm.cmd run dev -- --port 4173`
- 构建验证：`npm.cmd run build`
- 预览构建产物：`npm.cmd run preview`

开发服务默认绑定 `127.0.0.1`。这个项目依赖 Vite 对 `src/main.ts` 的模块处理，不要直接双击 `index.html` 打开，否则脚本可能不会运行。

## 当前玩法

### 公共规则

- 棋盘宽度：10 格
- 棋盘高度：20 格
- 自动下落间隔：650ms
- 方块类型：I、J、L、O、S、T、Z
- 基础计分：每消一行加 `100`
- Combo 加分：每次连续消行时 `combo + 1`，额外加 `combo * 50` 分；某次方块锁定后没有消行则 `combo = 0`

### 单人模式

- 经典单棋盘玩法
- 堆满后结束，顶部状态显示 `Game Over`
- 开始前可选择是否启用 Hold 保存方块

### 双人对战模式

- 两个玩家共用同一页面
- 开始前可以输入对战时长，默认 `120` 秒，允许范围 `30-300`
- 时间结束时按双方消行数决定胜负
- 若一方提前堆满，则立即判另一方获胜
- 开始前可选择是否启用 Hold 保存方块；启用后两个玩家都可使用

## Hold 保存方块

- 开始弹窗中的 `Hold Piece` 复选框控制是否启用该功能，默认不启用。
- 未启用时：
  - `Hold` 面板隐藏
  - 帮助弹窗里的 Hold 按键说明隐藏
  - `C` / `M` 不触发保存逻辑
- 启用时：
  - 玩家面板显示 `Score` / `Hold` / `Next` 三个卡片
  - 保存当前方块后会立即切换到下一块
  - 每个方块落地前只能保存一次，下一块生成后才允许再次保存
  - 单人和玩家 1 使用 `C`，玩家 2 使用 `M`

## 当前按键

### 单人模式

- `←`：左移
- `→`：右移
- `↓`：下落一格
- `↑`：旋转
- `Space`：直接落到底部
- `C`：保存当前方块，仅在启用 Hold 时生效

### 双人模式

- 玩家 1：
  - `A`：左移
  - `D`：右移
  - `S`：下落一格
  - `W`：旋转
  - `Shift`：直接落到底部
  - `C`：保存当前方块，仅在启用 Hold 时生效
- 玩家 2：
  - `←`：左移
  - `→`：右移
  - `↓`：下落一格
  - `↑`：旋转
  - `Space`：直接落到底部
  - `M`：保存当前方块，仅在启用 Hold 时生效

### 全局

- `R`：重开当前模式
- `Escape`：关闭帮助弹窗

## 关键状态与结构

`src/main.ts` 当前核心类型和状态：

- `GameMode`：`'single' | 'versus'`
- `PlayerState`：单个玩家的棋盘、当前方块、下一个方块、保存方块、分数、消行数、Combo、Hold 是否可用、是否出局
- `MatchResult`：双人模式胜负结果
- `selectedMode`：开始弹窗里当前选中的模式
- `currentMode`：当前正在运行的模式
- `isHoldEnabled`：当前局是否启用 Hold 保存方块
- `playerOne` / `playerTwo`：两个玩家的运行时状态
- `remainingSeconds`：双人模式倒计时
- `dropTimer`：自动下落定时器
- `versusTimer`：双人模式倒计时定时器

`PlayerDom` 当前绑定这些字段：

- `panel`
- `title`
- `status`
- `score`
- `holdPreview`
- `board`
- `preview`

说明：对战面板里的 `Lines` 卡片已经从 UI 中移除，但 `clearedLines` 仍保留在状态里，用于双人模式的胜负判定。

## 主要函数

- `createPlayerState()`：创建一个新的玩家状态
- `drawGame()`：根据当前模式刷新整页 UI，并同步 `body.mode-single`、`body.mode-versus`、`body.hold-enabled`
- `drawPlayer()`：渲染单个玩家面板
- `drawPiecePreview()`：渲染 `Hold` 和 `Next` 预览
- `tick()`：推进当前游戏循环
- `tickPlayer()`：推进单个玩家一步
- `movePiece()`：移动方块
- `rotatePiece()`：旋转方块
- `hardDropPiece()`：硬降并锁定
- `holdPiece()`：保存当前方块，或与已保存方块交换
- `resolveLockedPiece()`：锁定方块后统一处理消行、Combo、得分和生成下一块
- `clearLines()`：清空满行并返回消行数
- `spawnNextPiece()`：切换到下一块方块，并重新允许 Hold
- `finishVersusIfNeeded()`：双人模式中根据出局状态结束比赛
- `startGame()` / `restartGame()`：开始或重开，并读取 Hold 开关和对战时长
- `setSelectedMode()`：切换开始弹窗中的模式
- `handleKeydown()`：统一处理单人和双人输入

## 样式与布局约定

- 整体采用深色玻璃质感 UI，顶部状态栏的 `Mode` / `Status` 文案居中显示
- 背景保留 `src/assets/tetris-background.png`，同时通过 `body::before` / `body::after` 叠加流动渐变光晕
- `.modal-overlay::before` 也有光晕层，避免开始弹窗遮罩压暗背景效果
- 玩家面板使用更透明的玻璃背景和 `backdrop-filter`，让背景模糊可见
- 单人模式和双人模式分别通过 `body.mode-single` 和 `body.mode-versus` 做尺寸控制
- Hold 未启用时，玩家统计区为 `Score` / `Next` 两列；Hold 启用时为 `Score` / `Hold` / `Next` 三列
- `Hold` 面板和帮助弹窗中的 Hold 按键说明通过 `body.hold-enabled` 控制显示
- 对战模式没有单独的 `Lines` 展示卡
- 棋盘保持 `aspect-ratio: 1 / 2`
- 单人和双人模式都要同时受视口宽度和视口高度约束，避免首屏需要滚动才能看到完整界面
- 双人模式桌面端为双栏布局，窄屏下自动改为纵向堆叠
- 弹窗统一使用 `.modal-overlay` 和 `.modal`
- 颜色类通过 `.cyan`、`.blue`、`.orange`、`.yellow`、`.green`、`.purple`、`.red` 控制

## 开发注意事项

- 修改 DOM 结构时，要同步检查 `src/main.ts` 中的 `requiredElement(...)`
- 修改开始弹窗时，要同时检查模式切换、Hold 开关、时长输入、开始按钮和运行时提示文案
- 修改 Hold 功能时，要同时检查 `isHoldEnabled`、`holdEnabledInput`、`body.hold-enabled`、`.hold-panel`、`.hold-control` 和帮助弹窗文案
- 修改双人输入时，要同时更新 `VERSUS_PLAYER_ONE_KEYS`、`VERSUS_PLAYER_TWO_KEYS` 和帮助弹窗文案
- 修改得分逻辑时，要同时检查 `resolveLockedPiece()` 中的基础分、Combo 和 `clearedLines`
- 修改布局时，优先保证首屏完整可见，其次再处理滚动
- 只调整单人模式或双人模式时，尽量通过 `body.mode-single` / `body.mode-versus` 分开控制，避免互相影响
- 运行验证时优先使用 `npm.cmd run build`
- 当前没有自动化测试，功能改动后建议至少手动检查：
  - 开始弹窗是否可点击
  - 单人/双人模式切换
  - Hold 开关启用和禁用时的 UI 与按键行为
  - 开始游戏和重新开始
  - 单人模式的移动、旋转、硬降、保存方块
  - 双人模式的双方独立输入和保存方块
  - Combo 加分和未消行重置
  - 倒计时与胜负判定
  - 帮助弹窗打开和关闭
