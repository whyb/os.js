# 🖥️ OS-JS — 基于浏览器的完整 Linux 桌面环境

<div align="center">

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Browser-yellow)
![Shell](https://img.shields.io/badge/shell-bash--compatible-orange)
![AI](https://img.shields.io/badge/AI-Xiaomi%20MiMo--V2--Pro-red)

**一个完全在浏览器中运行的类 Linux 操作系统模拟环境**

*由小米 MiMo-V2.5-Pro 大模型驱动开发*

</div>

---

## 📖 项目简介

OS-JS 是一个基于纯 JavaScript + HTML + CSS 实现的完整 Linux 桌面环境，完全在浏览器端运行，无需任何后端服务。它不仅模拟了类 Unix 操作系统的核心交互体验，还提供了完整的桌面环境，包括窗口管理、任务栏、开始菜单、多种内置应用等。

本项目的完整设计、架构规划与代码实现均由**小米公司发布的 MiMo-V2.5-Pro 大模型**生成。MiMo-V2.5-Pro 作为小米自研的大语言模型，在代码生成、系统架构设计和多轮对话协作方面展现了强大的能力。

---

## 🚀 立即体验
[https://whyb.github.io/os.js/](https://whyb.github.io/os.js/)

---

## ✨ 核心特性

### 🖥️ 桌面环境
- **窗口管理系统** — 创建、关闭、最小化、最大化、拖拽移动、8 方向调整大小
- **任务栏** — 显示打开的窗口，支持切换、鼠标中键关闭
- **开始菜单** — 快速访问所有应用和系统功能
- **桌面图标** — 双击打开应用，支持右键菜单
- **壁纸** — Canvas 渲染的星空渐变壁纸
- **Alt+Tab** — 窗口快速切换
- **模式切换** — 终端模式与桌面模式一键切换

### 🐚 终端与 Shell
- **Bash 兼容 Shell** — 支持 90+ 条命令
- **虚拟文件系统** — 完整的树形目录结构
- **命令历史** — 通过 ↑/↓ 浏览历史命令
- **Tab 补全** — 支持命令名自动补全
- **ANSI 颜色** — 支持终端颜色输出
- **管道与重定向** — 支持 `|`、`>`、`>>`、`<`
- **持久化存储** — 文件系统状态自动保存到 localStorage

---

## 📱 内置应用

### 生产力工具
| 应用 | 图标 | 说明 |
|------|------|------|
| **Firefox** | 🦊 | Web 浏览器，支持书签、历史、菜单 |
| **File Manager** | 📁 | 文件管理器，支持目录浏览、导航 |
| **Text Editor** | ✏️ | 文本编辑器，支持多文件编辑 |
| **Terminal** | 💻 | 终端模拟器，支持完整命令集 |
| **Calculator** | 🔢 | 计算器，支持四则运算、百分比 |

### 系统工具
| 应用 | 图标 | 说明 |
|------|------|------|
| **System Monitor** | 📊 | 任务管理器，显示 CPU/GPU/RAM/Disk 使用率 |
| **Settings** | ⚙️ | 系统设置，支持主题、桌面、终端配置 |
| **Screenshot** | 📸 | 截图工具，支持全屏/窗口/区域截图 |
| **Clipboard** | 📋 | 剪贴板历史管理器 |
| **Trash** | 🗑️ | 回收站，支持恢复和永久删除 |
| **Help** | ❓ | 帮助中心，包含使用指南 |
| **Search** | 🔍 | 文件搜索工具 |

---

## 🎛️ 任务栏功能

### 托盘图标
| 图标 | 功能 |
|------|------|
| 📋 | 剪贴板管理器 |
| 📶 | 网络面板（Wi-Fi 开关、网络列表） |
| 🔊 | 音量面板（音量调节、静音、输出设备） |
| 🕐 | 日历面板（时钟、月视图日历） |
| 🔔 | 通知中心（未读计数、通知历史） |
| ⏻ | 电源菜单（锁定、注销、重启、关机） |

### 通知系统
- 弹出通知动画（右侧滑入）
- 未读计数徽章
- 通知中心面板
- 系统通知集成（需浏览器授权）

---

## 🖼️ 窗口系统特性

- **级联定位** — 新窗口自动偏移避免重叠
- **8 方向调整大小** — 支持边和角的拖拽调整
- **最大化记忆** — 还原时恢复原始位置和大小
- **窗口阴影** — 立体感的窗口效果
- **打开动画** — 平滑的窗口打开动画

---

## 📋 支持的命令列表（90+）

### 基础命令（23 个）
`help` `echo` `clear` `pwd` `ls` `cd` `cat` `touch` `mkdir` `rm` `cp` `mv` `find` `grep` `wc` `head` `tail` `sort` `uniq` `tee` `stat` `file` `ln`

### 系统信息（9 个）
`uname` `whoami` `hostname` `date` `uptime` `id` `arch` `env` `printenv`

### Shell 内建（30 个）
`alias` `unalias` `export` `unset` `set` `shopt` `declare` `readonly` `local` `let` `eval` `exec` `source` `read` `printf` `true` `false` `test` `type` `command` `builtin` `enable` `hash` `history` `fc` `return` `exit` `break` `continue`

### 目录栈（3 个）
`pushd` `popd` `dirs`

### 任务控制（7 个）
`jobs` `bg` `fg` `kill` `disown` `wait` `suspend`

### 信号与陷阱（2 个）
`trap` `times`

### 选项与限制（3 个）
`getopts` `ulimit` `umask`

### I/O 与数组（2 个）
`mapfile` `readarray`

### 进程与系统（4 个）
`ps` `top` `df` `du`

### 文件权限（2 个）
`chmod` `chown`

### 文本处理（2 个）
`diff` `xargs`

### 手册与定位（4 个）
`man` `which` `whereis` `more`

### 权限模拟（2 个）
`sudo` `su`

### 有趣命令（9 个）
`sleep` `motd` `banner` `fortune` `cal` `cowsay` `rev` `yes` `seq`

---

## 🖥️ 系统信息模拟

任务管理器和设置中显示的硬件信息：

| 组件 | 规格 |
|------|------|
| **CPU** | Intel Core i7-12700K (12核20线程, 3.6GHz) |
| **GPU** | NVIDIA GeForce RTX 3070 (8GB GDDR6) |
| **RAM** | 32GB DDR5-4800 |
| **Disk** | Samsung 980 PRO NVMe 1TB |
| **OS** | OS-JS 0.2.0 (Kernel 6.1.0-browser) |

---

## ⌨️ 快捷键

### 终端模式
| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 浏览历史命令 |
| `Tab` | 命令名自动补全 |
| `Ctrl+C` | 中断当前输入 |
| `Ctrl+L` | 清空终端屏幕 |
| `Ctrl+A` | 光标移动到行首 |
| `Ctrl+E` | 光标移动到行尾 |
| `Ctrl+U` | 删除光标前所有内容 |
| `Ctrl+K` | 删除光标后所有内容 |
| `Ctrl+W` | 删除光标前一个词 |
| `Ctrl+D` | EOF / 退出 |
| `Alt+B` / `Alt+F` | 词移动 |

### 桌面模式
| 快捷键 | 功能 |
|--------|------|
| `Alt+Tab` | 窗口切换 |

---

## 📂 文件结构

```
os-js/
├── README.md                  # 项目说明文档
├── index.html                 # 入口页面
├── css/
│   ├── terminal.css           # 终端样式
│   └── desktop/
│       └── desktop.css        # 桌面主题（Breeze 风格）
└── js/
    ├── fs.js                  # 虚拟文件系统
    ├── shell.js               # Shell 解析器
    ├── terminal.js            # 终端 UI 渲染
    ├── main.js                # 入口文件 + 命令注册
    ├── desktop/
    │   └── window-manager.js  # 窗口管理器
    └── apps/
        └── app-launcher.js    # 应用启动器 + 所有应用
```

---

## 🚀 快速开始

### 安装
```bash
git clone https://github.com/whyb/os.js.git
cd os-js
```

### 运行
直接用浏览器打开 `index.html` 即可

### 切换模式
- 点击右上角 `⛁ Desktop` 按钮切换到桌面模式
- 点击 `⌨ Terminal` 按钮切换回终端模式
- 或在终端中输入 `desktop` 命令

---

## 🤖 关于 MiMo-V2.5-Pro

本项目由小米公司发布的 MiMo-V2.5-Pro 大语言模型辅助开发完成。MiMo-V2.5-Pro 在以下方面为本项目提供了关键支持：

* **架构设计** — 从零规划了四层模块分离的系统架构
* **代码生成** — 生成了全部模块的完整实现
* **交互设计** — 设计了贴近真实 Linux 桌面的交互体验
* **多轮协作** — 通过分模块、分批次的多轮对话方式完成开发

---

## 📄 License

MIT License
Copyright (c) 2025

---

<div align="center">

⭐ **如果觉得这个项目有趣，请给一个 Star！** ⭐

Powered by **Xiaomi MiMo-V2.5-Pro**

</div>
