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
    this.hostname = 'os-js';             // 主机名
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
      HOSTNAME: 'os-js',
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

    // 函数定义
    this.functions = {};

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

  // 解析命令行：处理引号、转义、变量展开、命令替换、算术展开
  parseCommandLine(input) {
    // 先做命令替换 $() 和反引号
    input = this._expandCommandSubstitution(input);
    // 做算术展开 $((...))
    input = this._expandArithmetic(input);
    // 做大括号展开（先拆，因为会生成多个 token）
    // 大括号展开在 tokenize 前处理

    // 拆分为 tokens，同时处理引号
    const tokens = this._tokenize(input);
    return tokens;
  }

  // 拆分 token（处理引号、变量、波浪号）
  _tokenize(input) {
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

  // 命令替换：$() 和反引号
  _expandCommandSubstitution(input) {
    // 先处理 $()
    let result = input.replace(/\$\(([^)]*)\)/g, (_, cmd) => {
      return this._executeSubshell(cmd.trim());
    });

    // 再处理反引号（注意不能嵌套）
    result = result.replace(/`([^`]*)`/g, (_, cmd) => {
      return this._executeSubshell(cmd.trim());
    });

    return result;
  }

  // 执行子 shell（用于命令替换）
  _executeSubshell(cmd) {
    // 同步执行命令并返回输出
    const result = this._runCommandSync(cmd);
    return result !== null ? String(result).replace(/\n$/, '') : '';
  }

  // 算术展开 $((...))
  _expandArithmetic(input) {
    return input.replace(/\$\(\(([^)]*)\)\)/g, (_, expr) => {
      try {
        const val = this._evalArithmetic(expr.trim());
        return String(val);
      } catch (e) {
        return '0';
      }
    });
  }

  // 算术求值
  _evalArithmetic(expr) {
    // 替换变量
    const expanded = expr.replace(/\$?([A-Za-z_][A-Za-z0-9_]*)/g, (match, name) => {
      if (match.startsWith('$')) return this._expandVariable(name);
      return this.variables[name] || this.env[name] || '0';
    });
    const safeExpr = expanded.replace(/[^0-9+\-*/%()<>&|^!~ ]/g, '');
    if (!safeExpr.trim()) return 0;
    return Function('"use strict"; return (' + safeExpr + ')')() || 0;
  }

  // 大括号展开
  _expandBrace(input) {
    // 只有 braceexpand 选项启用时才展开
    if (!this.setOptions.braceexpand) return [input];

    // 处理 {a,b,c} 类型
    let results = [input];
    const braceRe = /\{([^}]*)\}/;
    let match;

    while ((match = braceRe.exec(results[0]))) {
      const full = match[0];
      const inner = match[1];
      const parts = this._splitBrace(inner);
      if (parts.length > 1) {
        const first = results.shift();
        for (const part of parts) {
          results.push(first.replace(full, part));
        }
      } else {
        break;
      }
    }

    // 处理 {1..5} 和 {a..z} 类型
    const rangeRe = /\{([0-9]+)\.\.([0-9]+)\}|\{([a-zA-Z])\.\.([a-zA-Z])\}/;
    const finalResults = [];
    for (const r of results) {
      if (rangeRe.test(r)) {
        const items = this._expandBraceRange(r);
        finalResults.push(...items);
      } else {
        finalResults.push(r);
      }
    }

    return finalResults;
  }

  _splitBrace(inner) {
    // 以逗号分割，但注意嵌套
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of inner) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    if (current) parts.push(current);
    return parts;
  }

  _expandBraceRange(input) {
    const numRe = /\{([0-9]+)\.\.([0-9]+)\}/;
    const charRe = /\{([a-zA-Z])\.\.([a-zA-Z])\}/;
    const results = [];
    let numMatch, charMatch;

    if ((numMatch = numRe.exec(input))) {
      const start = parseInt(numMatch[1]);
      const end = parseInt(numMatch[2]);
      const step = start <= end ? 1 : -1;
      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        results.push(input.replace(numRe, String(i)));
      }
    } else if ((charMatch = charRe.exec(input))) {
      const start = charMatch[1].charCodeAt(0);
      const end = charMatch[2].charCodeAt(0);
      const step = start <= end ? 1 : -1;
      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        results.push(input.replace(charRe, String.fromCharCode(i)));
      }
    }
    return results;
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

  // ===== 通配符展开（Globbing） =====
  _expandGlob(pattern) {
    // 检查是否包含通配符
    if (!pattern.includes('*') && !pattern.includes('?') && !pattern.includes('[')) {
      return [pattern];
    }

    let dir, prefix;
    const lastSlash = pattern.lastIndexOf('/');
    if (lastSlash !== -1) {
      dir = this.fs.resolvePath(this.cwd, pattern.slice(0, lastSlash) || '/');
      prefix = pattern.slice(lastSlash + 1);
    } else {
      dir = this.cwd;
      prefix = pattern;
    }

    const entries = this.fs.listDir(dir);
    if (!entries) return [pattern];

    // 构建正则
    let regexStr = '^';
    for (const ch of prefix) {
      if (ch === '*') regexStr += '.*';
      else if (ch === '?') regexStr += '.';
      else if (ch === '[') {
        const end = prefix.indexOf(']', prefix.indexOf(ch) + 1);
        if (end !== -1) {
          regexStr += '[' + prefix.slice(prefix.indexOf(ch) + 1, end) + ']';
        }
      } else {
        regexStr += ch.replace(/[.+^${}()|\\]/g, '\\$&');
      }
    }
    regexStr += '$';

    // 忽略隐藏文件（dotglob 选项）
    const dotglob = this.shoptOptions.dotglob;
    const regex = new RegExp(regexStr);
    let matches = entries.filter(e => regex.test(e));
    if (!dotglob) matches = matches.filter(e => !e.startsWith('.'));

    if (matches.length === 0) return [pattern];
    return matches.map(m => {
      if (lastSlash !== -1) return pattern.slice(0, lastSlash + 1) + m;
      return m;
    });
  }

  // 对 tokens 列表做 glob 展开
  _applyGlobbing(tokens) {
    const result = [];
    for (const token of tokens) {
      const expanded = this._expandGlob(token);
      result.push(...expanded);
    }
    return result;
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

    // 先处理大括号展开（在完整命令上处理，生成多行）
    const braceExpanded = this._expandBrace(input);

    let overallOutput = '';
    for (const cmdLine of braceExpanded) {
      // 处理分号和 && / || 链
      const result = await this._executeChain(cmdLine);
      if (result !== null && result !== undefined) {
        overallOutput += (overallOutput ? '\n' : '') + result;
      }
    }

    return overallOutput || null;
  }

  // 链式执行：支持 ; && || 和 &
  async _executeChain(input) {
    // 处理后台运行 & （在分号/&&/|| 之前）
    // 需要正确处理 a & b & 场景
    // 先按 & 分割
    const bgParts = this._splitBackground(input);
    let output = '';

    for (let i = 0; i < bgParts.length; i++) {
      const part = bgParts[i];
      const isBg = part.isBg;

      if (isBg) {
        // 后台执行
        const jobId = this.jobCounter + 1;
        this.addJob(part.cmd, jobId);
        const result = await this._executeSingle(part.cmd);
        if (result !== null && result !== undefined) {
          output += (output ? '\n' : '') + result;
        }
        output += (output ? '\n' : '') + `[${jobId}] ${part.cmd}`;
      } else {
        const result = await this._executeChainOperators(part.cmd);
        if (result !== null && result !== undefined) {
          output += (output ? '\n' : '') + result;
        }
      }
    }

    return output || null;
  }

  // 按 & 分割（处理括号和引号）
  _splitBackground(input) {
    const parts = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let depth = 0;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (ch === '(' && !inSingle && !inDouble) depth++;
      else if (ch === ')' && !inSingle && !inDouble) depth--;

      if (ch === '&' && !inSingle && !inDouble && depth === 0) {
        const trimmed = current.trim();
        if (trimmed) parts.push({ cmd: trimmed, isBg: true });
        current = '';
      } else {
        current += ch;
      }
    }

    const trimmed = current.trim();
    if (trimmed) parts.push({ cmd: trimmed, isBg: false });
    return parts;
  }

  // 处理 && 和 || 链
  async _executeChainOperators(input) {
    // 按 && 和 || 分割
    const segments = [];
    let current = '';
    let operator = null;
    let inSingle = false;
    let inDouble = false;
    let depth = 0;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (ch === '(' && !inSingle && !inDouble) depth++;
      else if (ch === ')' && !inSingle && !inDouble) depth--;

      if (depth === 0 && !inSingle && !inDouble) {
        if (ch === '&' && input[i + 1] === '&') {
          segments.push({ cmd: current.trim(), op: '&&' });
          current = '';
          i++; // skip next &
          continue;
        }
        if (ch === '|' && input[i + 1] === '|') {
          segments.push({ cmd: current.trim(), op: '||' });
          current = '';
          i++; // skip next |
          continue;
        }
      }
      current += ch;
    }

    const trimmed = current.trim();
    if (trimmed) segments.push({ cmd: trimmed, op: null });

    if (segments.length === 0) return null;

    // 执行第一个命令
    let lastOutput = await this._executeSingle(segments[0].cmd);

    // 依次执行后续
    for (let i = 1; i < segments.length; i++) {
      const prevSeg = segments[i - 1];
      const seg = segments[i];

      if (prevSeg.op === '&&') {
        // 前一个成功才执行
        if (this.lastExitCode === 0) {
          const result = await this._executeSingle(seg.cmd);
          if (result !== null) lastOutput = result;
        }
      } else if (prevSeg.op === '||') {
        // 前一个失败才执行
        if (this.lastExitCode !== 0) {
          const result = await this._executeSingle(seg.cmd);
          if (result !== null) lastOutput = result;
        }
      }
    }

    return lastOutput;
  }

  // 单条命令执行（含管道、重定向）
  async _executeSingle(input) {
    input = input.trim();
    if (!input) return null;

    // 解析为 tokens
    let tokens = this.parseCommandLine(input);
    if (tokens.length === 0) return null;

    // 别名展开
    tokens = this.expandAlias(tokens);

    // 检查是否为分号分隔（递归处理）
    if (input.includes(';')) {
      const parts = input.split(';');
      let output = '';
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
          const result = await this._executeChain(trimmed);
          if (result !== null && result !== undefined) {
            output += (output ? '\n' : '') + result;
          }
        }
      }
      return output || null;
    }

    // 检查是否为函数调用
    const cmdName = tokens[0];
    if (this.functions[cmdName]) {
      return await this._executeFunction(cmdName, tokens.slice(1));
    }

    // 处理多管道
    const pipeTokens = this._splitByPipes(tokens);
    if (pipeTokens.length > 1) {
      let stdin = null;
      for (let i = 0; i < pipeTokens.length; i++) {
        const pt = pipeTokens[i];
        if (i === 0) {
          stdin = await this._runCommandWithRedirect(pt);
        } else {
          const rightCmd = pt[0];
          const rightArgs = pt.slice(1);
          if (this.commands[rightCmd]) {
            stdin = this.commands[rightCmd](rightArgs, this, stdin);
          } else if (this.functions[rightCmd]) {
            stdin = await this._executeFunction(rightCmd, rightArgs, stdin);
          } else {
            this.lastExitCode = 127;
            return `bash: ${rightCmd}: command not found`;
          }
        }
      }
      return stdin;
    }

    // 无管道，处理重定向和命令
    return await this._runCommandWithRedirect(tokens);
  }

  // 按管道符分割（支持多个管道）
  _splitByPipes(tokens) {
    const result = [];
    let current = [];
    // 需要先找出所有管道位置
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i] === '|') {
        if (current.length > 0) {
          result.push(current);
          current = [];
        }
        i++;
      } else {
        current.push(tokens[i]);
        i++;
      }
    }
    if (current.length > 0) result.push(current);
    return result;
  }

  // 执行函数
  async _executeFunction(name, args, stdin) {
    const fn = this.functions[name];
    const body = fn.body;
    const params = fn.params;

    // 保存原变量
    const savedVars = { ...this.variables };

    // 设置参数变量
    this.variables['0'] = name;
    this.variables['1'] = args[0] || '';
    this.variables['2'] = args[1] || '';
    this.variables['3'] = args[2] || '';
    this.variables['4'] = args[3] || '';
    this.variables['5'] = args[4] || '';
    this.variables['6'] = args[5] || '';
    this.variables['7'] = args[6] || '';
    this.variables['8'] = args[7] || '';
    this.variables['9'] = args[8] || '';
    this.variables['#'] = String(args.length);
    this.variables['@'] = args.join(' ');
    this.variables['*'] = args.join(' ');

    // 设置命名参数
    for (let i = 0; i < params.length; i++) {
      this.variables[params[i]] = args[i] || '';
    }

    // 执行函数体
    let output = '';
    for (const line of body) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const result = await this._executeChain(trimmed);
      if (result !== null && result !== undefined) {
        output += (output ? '\n' : '') + result;
      }
    }

    // 恢复变量
    Object.assign(this.variables, savedVars);

    return output || null;
  }

  // 运行命令（含重定向、输入重定向、glob展开）
  async _runCommandWithRedirect(tokens) {
    if (tokens.length === 0) return null;

    // 处理输入重定向 < 和 <<
    let stdinContent = null;
    let heredocDelim = null;
    const filteredTokens = [];
    let i = 0;

    while (i < tokens.length) {
      if (tokens[i] === '<' && i + 1 < tokens.length) {
        // 输入重定向
        const filePath = tokens[i + 1];
        const fullPath = this.fs.resolvePath(this.cwd, filePath);
        const result = this.fs.readFile(fullPath);
        if (result.success) {
          stdinContent = result.content;
        } else {
          return `bash: ${filePath}: No such file or directory`;
        }
        i += 2;
      } else if (tokens[i] === '<<' && i + 1 < tokens.length) {
        // Here Document
        heredocDelim = tokens[i + 1];
        // 收集后续行作为 stdin（在 parseCommandLine 中已被合并为 token）
        // 这里读取文件中的内容
        // 简化实现：从后续 token 中读取直到遇到 delim
        const lines = [];
        let j = i + 2;
        while (j < tokens.length && tokens[j] !== heredocDelim) {
          lines.push(tokens[j]);
          j++;
        }
        stdinContent = lines.join('\n');
        i = j + 1; // skip delim
      } else if (tokens[i] === '2>&1') {
        // 合并 stderr 到 stdout，忽略
        i++;
      } else {
        filteredTokens.push(tokens[i]);
        i++;
      }
    }

    tokens = filteredTokens;
    if (tokens.length === 0) return null;

    // Globbing 展开
    if (!this.setOptions.noglob) {
      tokens = this._applyGlobbing(tokens);
    }

    // 处理输出重定向（从后往前找）
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
    const result = await this._runCommand(tokens, stdinContent);

    // 处理输出重定向
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

  // 同步执行命令（用于命令替换）
  _runCommandSync(input) {
    const tokens = this.parseCommandLine(input);
    if (tokens.length === 0) return null;

    // 别名展开
    const expandedTokens = this.expandAlias(tokens);

    const cmdName = expandedTokens[0];
    const args = expandedTokens.slice(1);

    // 检查函数
    if (this.functions[cmdName]) {
      // 简易同步执行：只支持简单命令
      return this._executeFunction(cmdName, args);
    }

    if (this.commands[cmdName]) {
      const result = this.commands[cmdName](args, this);
      if (result && typeof result.then === 'function') {
        return null; // 异步命令不支持
      }
      return result;
    }

    return null;
  }

  async _runCommand(tokens, stdin) {
    if (tokens.length === 0) return null;

    const cmdName = tokens[0];
    const args = tokens.slice(1);

    // 更新 PWD
    this.env.PWD = this.cwd;

    // 检查函数
    if (this.functions[cmdName]) {
      return await this._executeFunction(cmdName, args, stdin);
    }

    // 检查内置命令
    if (this.commands[cmdName]) {
      try {
        const result = await this.commands[cmdName](args, this, stdin);
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

  // ===== Prompt 生成（支持 PS1 转义） =====
  getPrompt() {
    const ps1 = this.env.PS1 || '\\u@\\h:\\w$ ';
    return this._expandPrompt(ps1);
  }

  _expandPrompt(template) {
    const displayPath = this.fs.displayPath(this.cwd, this.homeDir);
    return template
      .replace(/\\\\/g, '\\')
      .replace(/\\u/g, this.username)
      .replace(/\\h/g, this.hostname)
      .replace(/\\w/g, displayPath)
      .replace(/\\W/g, displayPath.split('/').pop() || '/')
      .replace(/\\d/g, new Date().toLocaleDateString())
      .replace(/\\t/g, new Date().toLocaleTimeString())
      .replace(/\\@/g, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      .replace(/\\n/g, '\n')
      .replace(/\\$/, '$')
      .replace(/\\#/g, String(this.history.length + 1))
      .replace(/\\!/g, String(this.history.length))
      .replace(/\$/, '$');
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