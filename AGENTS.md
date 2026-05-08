# AGENTS.md

## 项目概览

这是一个基于 Vite + TypeScript 的网页小游戏项目，项目名是 `russian-brick`。当前实现是一个类似俄罗斯方块的 falling blocks 游戏，主界面包含分数、状态、操作按钮、下一个方块预览、游戏棋盘，以及开始和按键提示弹窗。

项目是纯前端应用，没有后端服务。构建产物输出到 `dist/`，依赖安装在 `node_modules/`。

## 主要文件

- `index.html`：页面结构入口，包含游戏面板、开始弹窗、按键提示弹窗，以及加载 `/src/main.ts`。
- `src/main.ts`：游戏主逻辑，负责棋盘状态、方块生成、移动、旋转、硬降、消行、计分、开始/重开、下一个方块预览和弹窗交互。
- `src/style.css`：全部页面样式，负责游戏面板、棋盘、方块颜色、按钮、预览区、弹窗和响应式布局。
- `package.json`：项目脚本和依赖配置。
- `tsconfig.json`：TypeScript 配置，开启了 `strict`，目标为 ES2020。
- `README.md`：简短项目说明。

## 运行命令

推荐在 Windows PowerShell 中使用 `npm.cmd`，因为当前环境可能禁止直接运行 `npm.ps1`。

- 安装依赖：`npm.cmd install`
- 启动开发服务：`npm.cmd run dev`
- 指定端口启动：`npm.cmd run dev -- --port 5173`
- 构建验证：`npm.cmd run build`
- 预览构建产物：`npm.cmd run preview`

开发服务默认绑定 `127.0.0.1`。

## 游戏规则与交互

棋盘大小：

- 宽度：10 格
- 高度：20 格
- 自动下落间隔：650ms

当前支持的方块颜色和形状定义在 `src/main.ts` 的 `PIECES` 常量中，包括 I、J、L、O、S、T、Z 七类基础形状。

键盘操作：

- `←`：向左移动
- `→`：向右移动
- `↓`：加速下落一格
- `↑`：旋转方块
- `Space`：直接落到底部
- `R`：重新开始
- `Escape`：关闭按键提示弹窗

按钮操作：

- `到底`：当前方块直接落到底部
- `Restart`：重新开始游戏
- `?`：打开按键提示弹窗
- `开始游戏`：关闭开局弹窗并开始自动下落

游戏刚进入页面时不会自动开始，初始状态为 `Ready`，需要点击开始弹窗里的“开始游戏”按钮才会启动定时器。游戏结束后状态显示为 `Game Over`，并停止下落定时器。

## 代码结构要点

`src/main.ts` 中的核心状态：

- `board`：20 行 x 10 列的棋盘数组，单元格为颜色字符串或 `null`。
- `currentPiece`：当前正在下落的方块。
- `nextPiece`：下一个方块，用于预览和生成。
- `score`：当前分数。
- `isStarted`：游戏是否已经开始。
- `isGameOver`：游戏是否结束。
- `dropTimer`：自动下落的 `setInterval` 句柄。

主要函数：

- `createBoard()`：创建空棋盘。
- `createPiece()`：随机创建一个方块。
- `drawBoard()`：重绘棋盘、分数、状态和下一个方块预览。
- `tick()`：自动下落一步，不能继续下落时锁定方块、消行并生成下一个方块。
- `movePiece(dx, dy)`：尝试移动方块。
- `rotatePiece()`：顺时针旋转当前方块。
- `hardDropPiece()`：持续下落直到碰撞，然后锁定方块。
- `clearLines()`：清除满行，每行加 100 分。
- `spawnNextPiece()`：把 `nextPiece` 提升为当前方块，并生成新的 `nextPiece`。
- `startGame()` / `restartGame()`：开始和重开游戏。
- `showHelp()` / `hideHelp()`：控制按键提示弹窗。

## 样式与布局约定

- 整体使用深色玻璃质感 UI。
- 棋盘使用 CSS Grid，固定 10 列，`aspect-ratio: 1 / 2` 保持 10x20 比例。
- 方块颜色通过 `.cyan`、`.blue`、`.orange`、`.yellow`、`.green`、`.purple`、`.red` 等类控制。
- `--panel-width` 会根据视口高度动态计算，避免棋盘和顶部信息区域溢出。
- 小屏幕下 `.scorebar` 会变成两列，操作按钮单独占一行。
- 弹窗统一使用 `.modal-overlay` 和 `.modal`。

## 开发注意事项

- 修改 DOM 结构时，要同步检查 `src/main.ts` 中的 `requiredElement(...)` 选择器，缺失元素会直接抛错。
- 修改中文文案时，注意文件应保持 UTF-8 编码；终端输出中文乱码不一定代表文件内容错误。
- 修改按键功能时，要同时更新 `handleKeydown(...)` 和按键提示弹窗里的文案。
- 修改方块渲染时，注意棋盘格 `.cell` 和预览格 `.preview-cell` 都会复用 `.filled` 和颜色类。
- 运行验证时优先使用 `npm.cmd run build`，它会先跑 TypeScript 编译检查再跑 Vite 构建。
- 当前没有自动化测试，功能改动后建议至少手动检查：开局弹窗、开始游戏、左右移动、旋转、加速下落、硬降、重新开始、按键提示弹窗、下一个方块预览。
