// js/terminal.js
// ==============================
// 终端 UI 渲染模块
// ==============================

class Terminal {
  constructor(shell) {
    this.shell = shell;

    // DOM 元素
    this.terminalEl = document.getElementById('terminal');
    this.outputEl = document.getElementById('output');
    this.inputLineEl = document.getElementById('input-line');
    this.promptEl = document.getElementById('prompt');
    this.inputDisplayEl = document.getElementById('input-display');
    this.cursorEl = document.getElementById('cursor');
    this.hiddenInput = document.getElementById('hidden-input');

    // 输入状态
    this.currentInput = '';
    this.cursorPos = 0;
    this.inputHistory = [];
    this.historyIndex = -1;
    this.tempInput = ''; // 浏览历史时暂存当前输入

    // 状态
    this.isProcessing = false;
    this.isWaitingForInput = false;
    this.inputResolve = null;

    // 初始化
    this._init();
  }

  _init() {
    // 更新 prompt
    this.updatePrompt();

    // 绑定键盘事件
    document.addEventListener('keydown', (e) => this._onKeyDown(e));

    // 点击终端聚焦隐藏输入
    this.terminalEl.addEventListener('click', () => {
      this.hiddenInput.focus();
    });

    // 处理移动端输入
    this.hiddenInput.addEventListener('input', (e) => {
      const value = this.hiddenInput.value;
      if (value) {
        this.currentInput += value;
        this.cursorPos = this.currentInput.length;
        this.hiddenInput.value = '';
        this._renderInput();
      }
    });

    // 聚焦
    this.hiddenInput.focus();
  }

  // ===== 键盘事件处理 =====

  _onKeyDown(e) {
    // 如果正在等待 read 命令的输入
    if (this.isWaitingForInput) {
      this._handleReadInput(e);
      return;
    }

    // 如果正在处理命令，忽略输入
    if (this.isProcessing) {
      // 允许 Ctrl+C 中断
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        this._appendOutput(`^C`, 'command-output');
        this.currentInput = '';
        this.cursorPos = 0;
        this.updatePrompt();
        this._renderInput();
        this.scrollToBottom();
      }
      return;
    }

    // 阻止默认行为（除了复制）
    if (!(e.ctrlKey && ['c', 'v', 'a'].includes(e.key))) {
      e.preventDefault();
    }

    // Ctrl 组合键
    if (e.ctrlKey) {
      switch (e.key) {
        case 'c':
          if (this.currentInput) {
            // 复制选中文本
            const selection = window.getSelection().toString();
            if (selection) {
              navigator.clipboard.writeText(selection).catch(() => {});
            }
          }
          break;
        case 'l':
          this.clear();
          break;
        case 'a':
          this.cursorPos = 0;
          this._renderInput();
          break;
        case 'e':
          this.cursorPos = this.currentInput.length;
          this._renderInput();
          break;
        case 'u':
          this.currentInput = this.currentInput.slice(this.cursorPos);
          this.cursorPos = 0;
          this._renderInput();
          break;
        case 'k':
          this.currentInput = this.currentInput.slice(0, this.cursorPos);
          this._renderInput();
          break;
        case 'w':
          // 删除光标前的一个词
          const before = this.currentInput.slice(0, this.cursorPos);
          const after = this.currentInput.slice(this.cursorPos);
          const trimmed = before.trimEnd();
          const lastSpace = trimmed.lastIndexOf(' ');
          this.currentInput = (lastSpace === -1 ? '' : before.slice(0, lastSpace + 1)) + after;
          this.cursorPos = lastSpace === -1 ? 0 : lastSpace + 1;
          this._renderInput();
          break;
        case 'd':
          // EOF 或删除光标后的字符
          if (this.currentInput.length === 0) {
            this._appendOutput('exit', 'command-output');
          } else {
            this.currentInput = this.currentInput.slice(0, this.cursorPos) + this.currentInput.slice(this.cursorPos + 1);
            this._renderInput();
          }
          break;
      }
      return;
    }

    // Alt 组合键
    if (e.altKey) {
      if (e.key === 'b') {
        // 向后移动一个词
        const before = this.currentInput.slice(0, this.cursorPos);
        const trimmed = before.trimEnd();
        const lastSpace = trimmed.lastIndexOf(' ');
        this.cursorPos = lastSpace === -1 ? 0 : lastSpace + 1;
        this._renderInput();
      } else if (e.key === 'f') {
        // 向前移动一个词
        const after = this.currentInput.slice(this.cursorPos);
        const nextSpace = after.indexOf(' ');
        if (nextSpace === -1) {
          this.cursorPos = this.currentInput.length;
        } else {
          this.cursorPos += nextSpace + 1;
        }
        this._renderInput();
      } else if (e.key === 'Backspace') {
        // 删除光标前的一个词
        const before = this.currentInput.slice(0, this.cursorPos);
        const after = this.currentInput.slice(this.cursorPos);
        const trimmed = before.trimEnd();
        const lastSpace = trimmed.lastIndexOf(' ');
        this.currentInput = (lastSpace === -1 ? '' : before.slice(0, lastSpace + 1)) + after;
        this.cursorPos = lastSpace === -1 ? 0 : lastSpace + 1;
        this._renderInput();
      }
      return;
    }

    // 普通按键
    switch (e.key) {
      case 'Enter':
        this._onEnter();
        break;
      case 'Backspace':
        if (this.cursorPos > 0) {
          this.currentInput = this.currentInput.slice(0, this.cursorPos - 1) + this.currentInput.slice(this.cursorPos);
          this.cursorPos--;
          this._renderInput();
        }
        break;
      case 'Delete':
        if (this.cursorPos < this.currentInput.length) {
          this.currentInput = this.currentInput.slice(0, this.cursorPos) + this.currentInput.slice(this.cursorPos + 1);
          this._renderInput();
        }
        break;
      case 'ArrowLeft':
        if (this.cursorPos > 0) {
          this.cursorPos--;
          this._renderInput();
        }
        break;
      case 'ArrowRight':
        if (this.cursorPos < this.currentInput.length) {
          this.cursorPos++;
          this._renderInput();
        }
        break;
      case 'ArrowUp':
        this._historyUp();
        break;
      case 'ArrowDown':
        this._historyDown();
        break;
      case 'Home':
        this.cursorPos = 0;
        this._renderInput();
        break;
      case 'End':
        this.cursorPos = this.currentInput.length;
        this._renderInput();
        break;
      case 'Tab':
        this._onTab();
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          this.currentInput = this.currentInput.slice(0, this.cursorPos) + e.key + this.currentInput.slice(this.cursorPos);
          this.cursorPos++;
          this._renderInput();
        }
        break;
    }
  }

  // ===== Tab 补全 =====

  _onTab() {
    const tokens = this.currentInput.split(/\s+/);
    const isFirstToken = tokens.length <= 1;
    const partial = tokens[tokens.length - 1] || '';

    let completions = [];

    if (isFirstToken) {
      // 补全命令名
      const cmdNames = Object.keys(this.shell.commands);
      const aliasNames = Object.keys(this.shell.aliases);
      const allNames = [...new Set([...cmdNames, ...aliasNames])];
      completions = allNames.filter(n => n.startsWith(partial));
    } else {
      // 补全路径
      completions = this._completePath(partial);
    }

    if (completions.length === 1) {
      const completion = completions[0];
      tokens[tokens.length - 1] = completion;
      this.currentInput = tokens.join(' ');
      // 如果是目录，追加 /
      const fullPath = this.shell.fs.resolvePath(this.shell.cwd, completion);
      if (this.shell.fs.isDir(fullPath)) {
        this.currentInput += '/';
      }
      this.cursorPos = this.currentInput.length;
      this._renderInput();
    } else if (completions.length > 1) {
      // 显示所有候选项
      this._renderCurrentLine();
      this._appendOutput(completions.join('  '), 'command-output');
      this.scrollToBottom();
    }
  }

  _completePath(partial) {
    let dir, prefix;

    if (partial.includes('/')) {
      const lastSlash = partial.lastIndexOf('/');
      dir = this.shell.fs.resolvePath(this.shell.cwd, partial.slice(0, lastSlash) || '/');
      prefix = partial.slice(lastSlash + 1);
    } else {
      dir = this.shell.cwd;
      prefix = partial;
    }

    const entries = this.shell.fs.listDir(dir);
    if (!entries) return [];

    return entries.filter(n => n.startsWith(prefix));
  }

  // ===== 历史命令 =====

  _historyUp() {
    if (this.shell.history.length === 0) return;

    if (this.historyIndex === -1) {
      this.tempInput = this.currentInput;
      this.historyIndex = this.shell.history.length - 1;
    } else if (this.historyIndex > 0) {
      this.historyIndex--;
    }

    this.currentInput = this.shell.history[this.historyIndex];
    this.cursorPos = this.currentInput.length;
    this._renderInput();
  }

  _historyDown() {
    if (this.historyIndex === -1) return;

    if (this.historyIndex < this.shell.history.length - 1) {
      this.historyIndex++;
      this.currentInput = this.shell.history[this.historyIndex];
    } else {
      this.historyIndex = -1;
      this.currentInput = this.tempInput;
    }

    this.cursorPos = this.currentInput.length;
    this._renderInput();
  }

  // ===== 回车处理 =====

  async _onEnter() {
    const input = this.currentInput;

    // 渲染已输入的命令行
    this._renderCurrentLine();

    // 清空输入
    this.currentInput = '';
    this.cursorPos = 0;
    this.historyIndex = -1;

    // 如果是空行
    if (!input.trim()) {
      this.updatePrompt();
      this._renderInput();
      this.scrollToBottom();
      return;
    }

    // 执行命令
    this.isProcessing = true;
    this.inputDisplayEl.textContent = '';
    this.promptEl.textContent = '';

    try {
      const output = await this.shell.execute(input);
      if (output !== null && output !== undefined) {
        this._appendOutput(output, 'command-output');
      }
    } catch (e) {
      this._appendOutput(`bash: ${e.message}`, 'error-output');
    }

    this.isProcessing = false;
    this.updatePrompt();
    this._renderInput();
    this.scrollToBottom();
  }

  // ===== read 命令支持 =====

  waitForInput(promptText) {
    return new Promise((resolve) => {
      this.isWaitingForInput = true;
      this.inputResolve = resolve;
      this.promptEl.textContent = promptText || '';
      this.inputDisplayEl.textContent = '';
      this.currentInput = '';
      this.cursorPos = 0;
      this._renderInput();
    });
  }

  _handleReadInput(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._renderCurrentLine();
      this.isWaitingForInput = false;
      const value = this.currentInput;
      this.currentInput = '';
      this.cursorPos = 0;
      if (this.inputResolve) {
        this.inputResolve(value);
        this.inputResolve = null;
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.cursorPos > 0) {
        this.currentInput = this.currentInput.slice(0, this.cursorPos - 1) + this.currentInput.slice(this.cursorPos);
        this.cursorPos--;
        this._renderInput();
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.currentInput = this.currentInput.slice(0, this.cursorPos) + e.key + this.currentInput.slice(this.cursorPos);
      this.cursorPos++;
      this._renderInput();
    }
  }

  // ===== 渲染方法 =====

  // 更新 prompt
  updatePrompt() {
    this.promptEl.textContent = this.shell.getPrompt();
  }

  // 渲染当前输入行
  _renderInput() {
    const before = this.currentInput.slice(0, this.cursorPos);
    const after = this.currentInput.slice(this.cursorPos + 1);
    const charAtCursor = this.currentInput[this.cursorPos] || '';

    this.inputDisplayEl.innerHTML = this._escapeHtml(before);

    // 更新光标
    this.cursorEl.textContent = charAtCursor || ' ';
    this.cursorEl.className = 'blink';
  }

  // 渲染当前行（固化到输出区域）
  _renderCurrentLine() {
    const line = document.createElement('div');
    line.className = 'command-line';

    const promptSpan = document.createElement('span');
    promptSpan.className = 'prompt';
    promptSpan.textContent = this.shell.getPrompt();

    const cmdSpan = document.createElement('span');
    cmdSpan.className = 'command-text';
    cmdSpan.textContent = this.currentInput;

    line.appendChild(promptSpan);
    line.appendChild(cmdSpan);
    this.outputEl.appendChild(line);
  }

  // 追加输出
  _appendOutput(text, className = 'command-output') {
    if (text === null || text === undefined) return;

    const lines = String(text).split('\n');
    for (const line of lines) {
      const div = document.createElement('div');
      div.className = className;

      // 检查是否包含 ANSI 颜色代码，转换为 HTML
      if (line.includes('\x1b[')) {
        div.innerHTML = this._ansiToHtml(line);
      } else {
        div.textContent = line;
      }

      this.outputEl.appendChild(div);
    }
  }

  // ANSI 转 HTML（简化版）
  _ansiToHtml(text) {
    let result = this._escapeHtml(text);

    // 基本颜色
    result = result.replace(/\x1b\[0m/g, '</span>');
    result = result.replace(/\x1b\[1m/g, '<span style="font-weight:bold">');
    result = result.replace(/\x1b\[30m/g, '<span style="color:#000">');
    result = result.replace(/\x1b\[31m/g, '<span style="color:#ff4444">');
    result = result.replace(/\x1b\[32m/g, '<span style="color:#00ff41">');
    result = result.replace(/\x1b\[33m/g, '<span style="color:#ffcc00">');
    result = result.replace(/\x1b\[34m/g, '<span style="color:#4488ff">');
    result = result.replace(/\x1b\[35m/g, '<span style="color:#ff44ff">');
    result = result.replace(/\x1b\[36m/g, '<span style="color:#00d4ff">');
    result = result.replace(/\x1b\[37m/g, '<span style="color:#fff">');
    result = result.replace(/\x1b\[90m/g, '<span style="color:#888">');
    result = result.replace(/\x1b\[38;5;(\d+)m/g, (m, code) => {
      return `<span style="color:var(--ansi-${code},#fff)">`;
    });

    // 移除其他未处理的 ANSI 代码
    result = result.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

    return result;
  }

  // HTML 转义
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 清空终端
  clear() {
    this.outputEl.innerHTML = '';
    this.updatePrompt();
    this._renderInput();
  }

  // 滚动到底部
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.terminalEl.scrollTop = this.terminalEl.scrollHeight;
    });
  }

  // 输出欢迎信息
  showBanner() {
    const banner = `
 _____  _____  _____    ___   ____
/ __  \\|  _  |/  ___/  /   | |  _ \\
\`' / /'| | | |\\ \`--.  / /| | | |_) |
 / / \\  \\ \\_/ | \`--. \\/ /_| | |  __/
/ /   \\  \\   //\\__/ /\\___  | | |
\\/     \\_/ \\_\\/\\____/     |_/ \\_|`;
    this._appendOutput(banner, 'banner');
    this._appendOutput('', 'command-output');
    this._appendOutput('  Welcome to OS-JS v0.1.0 (Browser/Linux)', 'banner-info');
    this._appendOutput('  A minimal Linux-like terminal simulator', 'banner-info');
    this._appendOutput('  Type "help" for available commands.', 'banner-info');
    this._appendOutput('', 'command-output');
    this.scrollToBottom();
  }

  // 打印消息（供外部调用）
  print(text, className) {
    this._appendOutput(text, className);
    this.scrollToBottom();
  }

  // 打印错误
  printError(text) {
    this._appendOutput(text, 'error-output');
    this.scrollToBottom();
  }
}
