# 🖥️ OS-JS — 基于浏览器的极简 Linux 终端模拟器

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Browser-yellow)
![Shell](https://img.shields.io/badge/shell-bash--compatible-orange)
![AI](https://img.shields.io/badge/AI-Xiaomi%20MiMo--V2--Pro-red)

**一个完全在浏览器中运行的类 Linux 操作系统模拟环境**

*由小米 MiMo-V2-Pro 大模型驱动开发*

</div>

---

## 📖 项目简介

OS-JS 是一个基于纯 JavaScript + HTML + CSS 实现的极简 Linux 风格终端模拟器，完全在浏览器端运行，无需任何后端服务。它模拟了一个类 Unix 操作系统的核心交互体验，包括虚拟文件系统、bash 兼容的命令行 Shell、命令历史、Tab 补全等特性。

本项目的完整设计、架构规划与代码实现均由**小米公司发布的 MiMo-V2-Pro 大模型**生成。MiMo-V2-Pro 作为小米自研的大语言模型，在代码生成、系统架构设计和多轮对话协作方面展现了强大的能力，从需求分析到模块拆分、从命令实现到 UI 渲染，整个开发过程充分体现了 MiMo-V2-Pro 在前端工程领域的深度理解与创造力。

---

## 🚀 立即体验
[https://whyb.github.io/os.js/](https://whyb.github.io/os.js/)


## ✨ 核心特性

- **🐚 Bash 兼容 Shell** — 支持 70+ 条命令，涵盖文件操作、系统信息、Shell 内建、任务控制等
- **📁 虚拟文件系统** — 完整的树形目录结构，支持路径解析、文件读写、目录操作
- **📜 命令历史** — 通过 ↑/↓ 浏览历史命令
- **⌨️ Tab 补全** — 支持命令名和文件路径自动补全
- **🎨 终端体验** — 绿色黑客风格界面、闪烁光标、ANSI 颜色支持
- **💾 持久化存储** — 文件系统状态自动保存到 localStorage
- **🔧 管道与重定向** — 支持 `|` 管道和 `>` / `>>` 输出重定向
- **📦 零依赖** — 纯原生实现，无需任何第三方框架或库

---

## 🚀 快速开始

### 安装

```bash
git clone https://github.com/your-username/os-js.git
cd os-js
```

### 运行
直接用浏览器打开 `index.html` 即可

### 文件结构
```
os-js/
├── README.md              # 项目说明文档
├── index.html             # 入口页面
├── css/
│   └── terminal.css       # 终端样式
└── js/
    ├── fs.js              # 虚拟文件系统模块
    ├── shell.js           # Shell 层（命令解析与调度）
    ├── terminal.js        # 终端 UI 渲染模块
    └── main.js            # 入口文件 + 全部命令定义
```

## 📋 支持的完整命令列表（70+）

### 基础命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `help` | 显示所有可用命令及说明 | `help` |
| `echo` | 输出文本（支持 `-n` `-e` 选项） | `echo -e "Hello\nWorld"` |
| `clear` | 清空终端显示 | `clear` |
| `pwd` | 显示当前工作目录 | `pwd` |
| `ls` | 列出目录内容（支持 `-a` `-l`） | `ls -la /home` |
| `cd` | 切换目录（支持 `-`、`~`、`..`） | `cd ~/documents` |
| `cat` | 显示文件内容（支持 `-n` `-b` `-s`） | `cat readme.txt` |
| `touch` | 创建空文件或更新时间戳 | `touch newfile.txt` |
| `mkdir` | 创建目录（支持 `-p` 递归创建） | `mkdir -p a/b/c` |
| `rm` | 删除文件/目录（支持 `-r` `-f`） | `rm -rf tmp/` |
| `cp` | 复制文件 | `cp source.txt dest.txt` |
| `mv` | 移动/重命名文件 | `mv old.txt new.txt` |
| `find` | 按名称搜索文件（支持 `-name` `-type`） | `find /home -name "*.txt"` |
| `grep` | 文本搜索（支持 `-i` `-n` `-v` `-c`） | `grep -n "TODO" notes.txt` |
| `wc` | 统计行数、词数、字符数 | `wc -l file.txt` |
| `head` | 显示文件前 N 行 | `head -n 5 log.txt` |
| `tail` | 显示文件后 N 行 | `tail -n 20 syslog` |
| `sort` | 排序文本行（支持 `-r` `-n` `-u`） | `sort -rn numbers.txt` |
| `uniq` | 去除重复行（支持 `-c`） | `uniq -c sorted.txt` |
| `tee` | 同时输出到文件和终端 | `echo "log" \| tee output.txt` |
| `stat` | 显示文件详细信息 | `stat readme.txt` |
| `file` | 判断文件类型 | `file script.sh` |
| `ln` | 创建链接（简化版，复制实现） | `ln source link` |

### 系统信息命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `uname` | 显示系统信息（支持 `-a` `-s` `-n` `-r` `-m`） | `uname -a` |
| `whoami` | 显示当前用户名 | `whoami` |
| `hostname` | 显示/设置主机名 | `hostname my-machine` |
| `date` | 显示当前日期时间（支持格式化） | `date +"%Y-%m-%d %H:%M:%S"` |
| `uptime` | 显示系统运行时间 | `uptime` |
| `id` | 显示用户身份信息 | `id user` |
| `arch` | 显示系统架构 | `arch` |
| `env` | 显示环境变量 | `env` |
| `printenv` | 打印指定环境变量 | `printenv PATH` |

### Shell 内建命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `alias` | 定义或显示命令别名 | `alias ll='ls -la'` |
| `unalias` | 删除别名 | `unalias ll` |
| `export` | 设置环境变量 | `export PATH=$PATH:/opt/bin` |
| `unset` | 取消变量 | `unset MY_VAR` |
| `set` | 设置 Shell 选项（支持 `-o` `+o`） | `set -o` |
| `shopt` | 设置 Shell 行为选项 | `shopt -s autocd` |
| `declare` | 声明变量及属性（支持 `-i` `-r` `-x`） | `declare -i num=42` |
| `typeset` | 同 `declare` | `typeset name="value"` |
| `readonly` | 标记变量为只读 | `readonly CONFIG="prod"` |
| `local` | 声明局部变量 | `local var="value"` |
| `let` | 算术表达式求值 | `let result=2+3*4` |
| `eval` | 将字符串作为命令执行 | `eval "echo hello"` |
| `exec` | 替换当前 Shell 执行命令 | `exec ls` |
| `source` | 从文件加载并执行命令 | `source ~/.bashrc` |
| `.` | 同 `source` | `. script.sh` |
| `read` | 读取用户输入（支持 `-p` 提示） | `read -p "Name: " name` |
| `printf` | 格式化输出 | `printf "%s: %d\n" "Count" 42` |
| `true` | 返回成功（退出码 0） | `true` |
| `false` | 返回失败（退出码 1） | `false` |
| `test` | 条件测试表达式 | `test -f file.txt && echo "exists"` |
| `[` | 条件测试（`test` 的别名） | `[ -d /tmp ] && echo "dir"` |
| `type` | 显示命令类型 | `type ls` |
| `command` | 执行简单命令（绕过别名） | `command ls` |
| `builtin` | 执行 Shell 内建命令 | `builtin cd /tmp` |
| `enable` | 启用/禁用内建命令 | `enable -a` |
| `hash` | 缓存命令路径 | `hash` |
| `history` | 显示命令历史（支持 `-c` 清除） | `history 10` |
| `fc` | 编辑并重新执行历史命令 | `fc -l` |
| `return` | 从函数返回 | `return 0` |
| `exit` | 退出 Shell | `exit 0` |
| `logout` | 退出登录 Shell | `logout` |
| `break` | 跳出循环（占位） | `break` |
| `continue` | 继续循环（占位） | `continue` |

### 目录栈命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `pushd` | 将目录压入栈并切换 | `pushd /tmp` |
| `popd` | 弹出栈顶目录并切换 | `popd` |
| `dirs` | 显示目录栈 | `dirs -v` |

### 任务控制命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `jobs` | 显示当前任务列表 | `jobs` |
| `bg` | 将任务放到后台运行 | `bg %1` |
| `fg` | 将任务放到前台运行 | `fg %1` |
| `kill` | 发送信号给进程/任务（支持 `-l` 列出信号） | `kill -9 %1` |
| `disown` | 从任务表中移除任务 | `disown %1` |
| `wait` | 等待任务完成 | `wait %1` |
| `suspend` | 挂起 Shell（占位） | `suspend` |

### 信号与陷阱命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `trap` | 设置信号处理器 | `trap 'echo caught' SIGINT` |
| `times` | 显示用户/系统时间 | `times` |

### 选项与限制命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `getopts` | 解析位置参数（占位） | `getopts "ab:" opt` |
| `ulimit` | 设置资源限制（支持 `-a` 查看全部） | `ulimit -n` |
| `umask` | 设置文件创建掩码 | `umask 022` |

### I/O 与数组命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `mapfile` | 读取行到数组（占位） | `mapfile arr < file.txt` |
| `readarray` | 同 `mapfile` | `readarray arr < file.txt` |

### 有趣命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `sleep` | 延迟执行（支持 `s` `m` `h` 后缀） | `sleep 2` |
| `motd` | 显示欢迎信息 | `motd` |
| `banner` | ASCII 艺术字 | `banner HELLO` |
| `fortune` | 随机名言/笑话 | `fortune` |
| `cal` | 显示日历 | `cal 12 2025` |
| `cowsay` | 一只牛说你的话 | `cowsay "Hello!"` |
| `rev` | 反转文本 | `echo "abc" \| rev` |
| `yes` | 重复输出 | `yes "hello"` |
| `seq` | 打印数字序列 | `seq 1 5` |

## 📸 使用示例
```
 _____  _____  _____    ___   ____
/ __  \|  _  |/  ___/  /   | |  _ \
`' / /'| | | |\ `--.  / /| | | |_) |
 / / \  \ \_/ | `--. \/ /_| | |  __/
/ /   \  \   //\__/ /\___  | | |
\/     \_/ \_/\____/     |_/ \_|

  Welcome to OS-JS v0.1.0 (Browser/Linux)
  A minimal Linux-like terminal simulator
  Type "help" for available commands.

user@os-js:~$ ls -la
drwxr-xr-x 2 user user    0 Nov 15 14:30 .
drwxr-xr-x 2 user user    0 Nov 15 14:30 ..
-rw-r--r-- 1 user user   32 Nov 15 14:30 .bashrc
-rw-r--r-- 1 user user   48 Nov 15 14:30 .profile
drwxr-xr-x 2 user user    0 Nov 15 14:30 documents
drwxr-xr-x 2 user user    0 Nov 15 14:30 downloads
drwxr-xr-x 2 user user    0 Nov 15 14:30 projects

user@os-js:~$ fortune
Talk is cheap. Show me the code. - Linus Torvalds

user@os-js:~$ cal
      December 2025
Su Mo Tu We Th Fr Sa
    1  2  3  4  5  6
 7  8  9 10 11 12 13
14 15 16 17 18 19 20
21 22 23 24 25 26 27
28 29 30 31

user@os-js:~$ cowsay "OS-JS is awesome!"
 ________________________
< OS-JS is awesome! >
 ------------------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 浏览历史命令 |
| `Tab` | 命令名 / 文件路径自动补全 |
| `Ctrl+C` | 中断当前输入 |
| `Ctrl+L` | 清空终端屏幕 |
| `Ctrl+A` | 光标移动到行首 |
| `Ctrl+E` | 光标移动到行尾 |
| `Ctrl+U` | 删除光标前所有内容 |
| `Ctrl+K` | 删除光标后所有内容 |
| `Ctrl+W` | 删除光标前一个词 |
| `Ctrl+D` | EOF / 退出（输入为空时） |
| `Alt+B` | 光标向后移动一个词 |
| `Alt+F` | 光标向前移动一个词 |
| `Alt+Backspace` | 删除光标前一个词 |


## 🤖 关于 MiMo-V2-Pro

本项目由小米公司发布的 MiMo-V2-Pro 大语言模型辅助开发完成。MiMo-V2-Pro 是小米自研的大模型，在以下方面为本项目提供了关键支持：

* 架构设计 — 从零规划了四层模块分离的系统架构（FS → Shell → Terminal → Main）
* 代码生成 — 生成了全部四个模块的完整实现，包含 70+ 条命令的逻辑
* 交互设计 — 设计了贴近真实 Linux 终端的交互体验，包括 Tab 补全、命令历史、管道重定向等
* 多轮协作 — 通过分模块、分批次的多轮对话方式，高效完成了大型项目的渐进式开发


MiMo-V2-Pro 展现了在前端工程、系统设计和代码生成方面的强大能力，是本项目得以完整实现的核心驱动力。

## 📄 License

MIT License
Copyright (c) 2025

⭐ 如果觉得这个项目有趣，请给一个 Star！

Powered by Xiaomi MiMo-V2-Pro