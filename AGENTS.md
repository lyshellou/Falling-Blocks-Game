# AGENTS.md

## 项目概览

这是一个基于 Vite + TypeScript 的网页 falling blocks 游戏，项目名是 `russian-brick`。
当前支持两种模式：

- 单人模式：经典单棋盘玩法
- 双人对战：同机双人限时对战，比较消行数决定胜负

项目是纯前端应用，没有后端服务。构建产物输出到 `dist/`，依赖安装在 `node_modules/`。

## 主要文件

- `index.html`：页面结构入口，包含顶部状态区、单/双人棋盘区域、开始弹窗、帮助弹窗，并加载 `/src/main.ts`
- `src/main.ts`：游戏主逻辑，负责模式切换、玩家状态、掉落循环、消行、计时、胜负判定、输入处理和弹窗交互
- `src/style.css`：全部页面样式，负责整体布局、棋盘尺寸约束、按钮、预览区、弹窗和响应式布局
- `package.json`：项目脚本和依赖配置
- `tsconfig.json`：TypeScript 配置，开启了 `strict`
- `README.md`：简短项目说明

## 运行命令

推荐在 Windows PowerShell 中使用 `npm.cmd`，不要直接运行 `npm.ps1`。

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

### 单人模式

- 经典单棋盘玩法
- 计分规则：每消一行加 `100`
- 堆满后结束，顶部状态显示 `Game Over`

### 双人对战模式

- 两个玩家共用同一页面
- 开始前可以输入对战时长，默认 `120` 秒，允许范围 `30-300`
- 时间结束时按双方消行数决定胜负
- 若一方提前堆满，则立即判另一方获胜

## 当前按键

### 玩家 1

- `←`：左移
- `→`：右移
- `↓`：下落一格
- `↑`：旋转
- `Space`：直接落到底部

### 玩家 2

- `A`：左移
- `D`：右移
- `S`：下落一格
- `W`：旋转
- `Shift`：直接落到底部

### 全局

- `R`：重开当前模式
- `Escape`：关闭帮助弹窗

## 关键状态与结构

`src/main.ts` 当前核心类型和状态：

- `GameMode`：`'single' | 'versus'`
- `PlayerState`：单个玩家的棋盘、当前方块、下一个方块、分数、消行数、是否出局
- `MatchResult`：双人模式胜负结果
- `selectedMode`：开始弹窗里当前选中的模式
- `currentMode`：当前正在运行的模式
- `playerOne` / `playerTwo`：两个玩家的运行时状态
- `remainingSeconds`：双人模式倒计时
- `dropTimer`：自动下落定时器
- `versusTimer`：双人模式倒计时定时器

## 主要函数

- `createPlayerState()`：创建一个新的玩家状态
- `drawGame()`：根据当前模式刷新整页 UI
- `drawPlayer()`：渲染单个玩家面板
- `tick()`：推进当前游戏循环
- `tickPlayer()`：推进单个玩家一步
- `movePiece()`：移动方块
- `rotatePiece()`：旋转方块
- `hardDropPiece()`：硬降并锁定
- `clearLines()`：清空满行并返回消行数
- `spawnNextPiece()`：切换到下一块方块
- `startGame()` / `restartGame()`：开始或重开
- `setSelectedMode()`：切换开始弹窗中的模式
- `handleKeydown()`：统一处理单人和双人输入

## 样式与布局约定

- 整体采用深色玻璃质感 UI
- 棋盘保持 `aspect-ratio: 1 / 2`
- 单人和双人模式都要同时受视口宽度和视口高度约束，避免首屏需要滚动才能看到完整界面
- 双人模式桌面端为双栏布局，窄屏下自动改为纵向堆叠
- 弹窗统一使用 `.modal-overlay` 和 `.modal`
- 颜色类通过 `.cyan`、`.blue`、`.orange`、`.yellow`、`.green`、`.purple`、`.red` 控制

## 开发注意事项

- 修改 DOM 结构时，要同步检查 `src/main.ts` 中的 `requiredElement(...)`
- 修改开始弹窗时，要同时检查模式切换、时长输入、开始按钮和运行时提示文案
- 修改双人输入时，要同时更新 `PLAYER_TWO_KEYS` 和帮助弹窗文案
- 修改布局时，优先保证首屏完整可见，其次再处理滚动
- 运行验证时优先使用 `npm.cmd run build`
- 当前没有自动化测试，功能改动后建议至少手动检查：
  - 开始弹窗是否可点击
  - 单人/双人模式切换
  - 开始游戏和重新开始
  - 单人模式的移动、旋转、硬降
  - 双人模式的双方独立输入
  - 倒计时与胜负判定
  - 帮助弹窗打开和关闭
