// js/shell.js
// ==============================
// Shell 层 - 命令解析与调度
// ==============================

class Shell {
  constructor(fs) {
    this.fs = fs;

    // 执行上下文
    this.cwd = '/home/user';             // 当前工作目录
    this.username = 'user';              // 用户名
    this.hostname = 'js-os';             // 主机名
    this.homeDir = '/home/user';         // 主目录
    this.lastExitCode = 0;               // 上次命令退出码

    // 环境变量
    this.env = {
      HOME: '/home/user',
      USER: 'user',
      SHELL: '/bin/bash',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
      PWD: '/home/user',
      OLDPWD: '/home/user',
      HOSTNAME: 'js-os',
      PS1: '\\u@\\h:\\w$ ',
      EDITOR: 'vim',
      HISTSIZE: '1000',
      HISTFILE: '~/.bash_history'
    };

    // Shell 变量（非导出的本地变量）
    this.variables = {};

    // 命令注册表
    this.commands = {};

    // 命令别名
    this.aliases = {
      'll': 'ls -la',
      'la': 'ls -a',
      'l': 'ls -l',
      '..': 'cd ..',
      '...': 'cd ../..',
      'grep': 'grep --color=auto',
      'cls': 'clear'
    };

    // 命令历史
    this.history = [];

    // 目录栈（pushd/popd）
    this.dirStack = [this.cwd];

    // 后台任务
    this.jobs = [];
    this.jobCounter = 0;

    // 选项开关（set / shopt）
    this.setOptions = {
      allexport: false,
      braceexpand: true,
      emacs: true,
      errexit: false,
      nounset: false,
      verbose: false,
      xtrace: false,
      noclobber: false,
      noglob: false
    };

    this.shoptOptions = {
      autocd: false,
      cdspell: false,
      checkwinsize: false,
      cmdhist: true,
      dotglob: false,
      expand_aliases: true,
      extglob: false,
      histappend: true,
      nocaseglob: false,
      nullglob: false
    };

    // Hash 表（command 路径缓存）
    this.hashTable = {};

    // Trap 表
    this.traps = {};

    // readonly 变量
    this.readonlyVars = new Set(['HOME', 'SHELL', 'USER', 'PATH', 'TERM']);

    // 信号名映射
    this.signals = {
      0: 'EXIT', 1: 'SIGHUP', 2: 'SIGINT', 3: 'SIGQUIT',
      9: 'SIGKILL', 15: 'SIGTERM', 19: 'SIGSTOP', 20: 'SIGTSTP'
    };

    // Umask
    this.umaskValue = 0o022;
  }

  // 注册命令
  registerCommand(name, fn) {
    this.commands[name] = fn;
  }

  // ===== 命令解析 =====

  // 解析命令行：处理引号、转义、变量展开
  parseCommandLine(input) {
    const tokens = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let escaped = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];

      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }

      if (ch === '\\' && !inSingle) {
        escaped = true;
        continue;
      }

      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        continue;
      }

      if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
        continue;
      }

      if (ch === ' ' && !inSingle && !inDouble) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      if (ch === '$' && !inSingle) {
        // 变量展开
        const varName = this._extractVarName(input, i + 1);
        if (varName) {
          current += this._expandVariable(varName);
          i += varName.length;
        } else {
          current += ch;
        }
        continue;
      }

      if (ch === '~' && !inSingle && !inDouble && current === '') {
        // 波浪号展开
        const nextCh = input[i + 1];
        if (!nextCh || nextCh === '/' || nextCh === ' ') {
          current += this.env.HOME;
        } else {
          current += ch;
        }
        continue;
      }

      current += ch;
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  // 提取变量名
  _extractVarName(input, start) {
    if (start >= input.length) return '';
    if (input[start] === '{') {
      // ${VAR} 格式
      const end = input.indexOf('}', start + 1);
      if (end !== -1) return input.substring(start + 1, end);
      return '';
    }
    // $VAR 格式
    let name = '';
    for (let i = start; i < input.length; i++) {
      if (/[A-Za-z0-9_]/.test(input[i])) {
        name += input[i];
      } else {
        break;
      }
    }
    return name;
  }

  // 展开变量
  _expandVariable(name) {
    // 特殊变量
    if (name === '?') return String(this.lastExitCode);
    if (name === '$') return String(Math.floor(Math.random() * 90000) + 10000);
    if (name === '#') return '0';
    if (name === '0') return 'bash';
    if (name === 'PWD') return this.cwd;
    if (name === 'OLDPWD') return this.env.OLDPWD || '';

    return this.env[name] || this.variables[name] || '';
  }

  // 展开所有变量
  expandVars(str) {
    return str.replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (_, name) => {
      return this._expandVariable(name);
    });
  }

  // ===== 别名展开 =====
  expandAlias(tokens) {
    if (tokens.length === 0) return tokens;
    const cmd = tokens[0];
    if (this.aliases[cmd] && this.shoptOptions.expand_aliases) {
      const aliasTokens = this.parseCommandLine(this.aliases[cmd]);
      return aliasTokens.concat(tokens.slice(1));
    }
    return tokens;
  }

  // ===== 命令执行 =====

  async execute(input) {
    input = input.trim();
    if (!input) return null;

    // 添加到历史
    this.history.push(input);

    // 处理分号分隔的多个命令
    if (input.includes(';')) {
      const parts = input.split(';');
      let output = '';
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
          const result = await this.executeSingle(trimmed);
          if (result !== null && result !== undefined) {
            output += (output ? '\n' : '') + result;
          }
        }
      }
      return output || null;
    }

    return this.executeSingle(input);
  }

  async executeSingle(input) {
    // 解析
    let tokens = this.parseCommandLine(input);
    if (tokens.length === 0) return null;

    // 别名展开
    tokens = this.expandAlias(tokens);

    const cmdName = tokens[0];
    const args = tokens.slice(1);

    // 处理管道（简化版，仅支持一个管道）
    const pipeIdx = tokens.indexOf('|');
    if (pipeIdx !== -1) {
      const leftTokens = tokens.slice(0, pipeIdx);
      const rightTokens = tokens.slice(pipeIdx + 1);
      const leftResult = await this._runCommand(leftTokens);
      // 将左命令输出作为右命令的 stdin 参数
      if (leftResult && rightTokens.length > 0) {
        const rightCmd = rightTokens[0];
        const rightArgs = rightTokens.slice(1);
        if (this.commands[rightCmd]) {
          return this.commands[rightCmd](rightArgs, this, leftResult);
        }
      }
      return leftResult;
    }

    // 处理输出重定向（简化版）
    let redirectFile = null;
    let appendMode = false;
    let redirectIdx = -1;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '>>' || tokens[i] === '1>>') {
        redirectFile = tokens[i + 1];
        appendMode = true;
        redirectIdx = i;
        break;
      }
      if (tokens[i] === '>' || tokens[i] === '1>') {
        redirectFile = tokens[i + 1];
        appendMode = false;
        redirectIdx = i;
        break;
      }
      if (tokens[i] === '2>') {
        redirectFile = tokens[i + 1];
        appendMode = false;
        redirectIdx = i;
        break;
      }
    }

    if (redirectIdx !== -1) {
      tokens = tokens.slice(0, redirectIdx);
    }

    // 执行命令
    const result = await this._runCommand(tokens);

    // 处理重定向
    if (redirectFile && result !== null) {
      const fullPath = this.fs.resolvePath(this.cwd, redirectFile);
      if (appendMode) {
        this.fs.appendFile(fullPath, result + '\n');
      } else {
        this.fs.writeFile(fullPath, result + '\n');
      }
      return null;
    }

    return result;
  }

  async _runCommand(tokens) {
    if (tokens.length === 0) return null;

    const cmdName = tokens[0];
    const args = tokens.slice(1);

    // 更新 PWD
    this.env.PWD = this.cwd;

    // 检查内置命令
    if (this.commands[cmdName]) {
      try {
        const result = await this.commands[cmdName](args, this);
        this.lastExitCode = 0;
        return result;
      } catch (e) {
        this.lastExitCode = 1;
        return `\x1b[31mbash: ${cmdName}: ${e.message}\x1b[0m`;
      }
    }

    // 检查是否是绝对路径或相对路径的命令
    if (cmdName.includes('/')) {
      const fullPath = this.fs.resolvePath(this.cwd, cmdName);
      if (this.fs.isFile(fullPath)) {
        this.lastExitCode = 0;
        return `bash: ${cmdName}: cannot execute binary file`;
      }
    }

    this.lastExitCode = 127;
    return `bash: ${cmdName}: command not found`;
  }

  // ===== Prompt 生成 =====
  getPrompt() {
    const displayPath = this.fs.displayPath(this.cwd, this.homeDir);
    return `${this.username}@${this.hostname}:${displayPath}$ `;
  }

  // ===== 目录栈操作 =====
  pushDir(path) {
    this.dirStack.push(path);
  }

  popDir() {
    if (this.dirStack.length > 1) {
      return this.dirStack.pop();
    }
    return null;
  }

  // ===== 后台任务 =====
  addJob(command, pid) {
    this.jobCounter++;
    const job = {
      id: this.jobCounter,
      pid: pid || this.jobCounter,
      command,
      status: 'running',
      startTime: Date.now()
    };
    this.jobs.push(job);
    return job;
  }

  removeJob(id) {
    this.jobs = this.jobs.filter(j => j.id !== id);
  }

  // ===== 工具方法 =====
  formatTimestamp(ts) {
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mon = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, ' ');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${mon} ${day} ${h}:${m}`;
  }

  formatDate(d) {
    return d.toString();
  }
}
