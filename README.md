# LaTeX Live Preview — 图灵完备版

一个基于 MathJax 3 的 LaTeX 公式实时预览与导出工具，支持四大核心功能模块。

## 功能特性

### 🔤 模块一：字体自由选择（可导入）
- 内置 14 种预设数学字体（Latin Modern、STIX、Noto Serif、Times New Roman 等）
- **Google Fonts** 动态加载 —— 输入字体名称一键引入
- **URL 导入** —— 粘贴 .woff2/.ttf/.otf 字体文件链接
- **本地拖拽上传** —— 拖放字体文件到页面即可使用
- 字体粗细（100–900）与斜体样式调节

### 📐 模块二：更多 LaTeX 公式支持
- 扩展 MathJax 宏包：`ams`、`mathtools`、`mhchem`（化学）、`cancel`、`color`、`boldsymbol`、`braket`（量子）、`physics`、`empheq`、`unicode`
- 支持化学方程式、矩阵、分段函数、消去符号、量子态等公式
- 多行公式渲染（display math + aligned 环境）

### 📝 模块三：自定义命令（\newcommand）
- 可视化宏定义界面 —— 输入命令名、参数个数、定义体
- 预设模板：`\R`→实数、`\norm{·}`→范数、`\inner{·}{·}`→内积 等 9 个常用宏
- 宏标签列表（点击编辑 / × 删除）
- **JSON 导出/导入** —— 保存和恢复宏定义配置
- LaTeX 标准命令冲突检测

### 🧠 模块四：图灵完备预处理器
- **变量系统**：`\defvar{name}{value}` / `\usevar{name}`
- **条件分支**：`\ifcond{expr}{true}{false}` 支持 == != > < >= <=
- **循环展开**：`\forloop{var}{start}{end}{step}{body}`
- **算术运算**：`\eval{expression}` 支持 + - * / ^
- **字符串操作**：`\concat{a}{b}` / `\rep{text}{n}`
- 演示示例：乘法表、斐波那契数列、条件分级、三角形图案

### 通用特性
- 透明/白色/黑色/自定义背景
- 公式颜色自定义
- 字体大小 (12–96px) + 内边距调节
- **PNG 导出**（支持透明背景）
- **SVG 导出**（矢量，缩放不失真）
- 一键复制 SVG 源码

## 项目结构

```
LeTexLivePreview/
├── index.html              # 主页面
├── README.md               # 项目说明
├── css/
│   └── style.css           # 统一样式表
├── js/
│   ├── main.js             # 全局状态 & 初始化
│   ├── render.js           # MathJax 渲染管道
│   ├── export.js           # PNG/SVG 导出 & 剪贴板
│   ├── font-manager.js     # 模块一：字体管理
│   ├── macros.js           # 模块三：自定义宏命令
│   ├── preprocessor.js     # 模块四：图灵完备预处理器
│   └── ui.js               # UI 事件绑定 & 控件
└── assets/
    └── fonts/              # 本地导入字体存放目录
```

## 技术栈

| 组件 | 技术 |
|------|------|
| LaTeX 渲染引擎 | MathJax 3.2 (tex-svg) |
| 字体加载 | Google Fonts API + CSS @font-face |
| 导出 | HTML Canvas + SVG Serializer |
| 预处理器 | 自研 JavaScript 宏展开引擎 |
| 样式 | CSS Variables + CSS Grid + 响应式布局 |

## 使用方式

直接在浏览器中打开 `index.html` 即可使用，无需构建工具或服务器。

## License

MIT
