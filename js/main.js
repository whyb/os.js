// js/main.js
// ==============================
// 入口文件 + 全部命令定义
// ==============================

(function () {
  'use strict';

  // ===== 初始化模块 =====
  const fs = new VirtualFS();
  const shell = new Shell(fs);
  const terminal = new Terminal(shell);

  // ===== 工具函数 =====

  // 解析 ls 参数
  function parseLsArgs(args) {
    let showAll = false;
    let showLong = false;
    let targets = [];

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('a')) showAll = true;
        if (arg.includes('l')) showLong = true;
      } else {
        targets.push(arg);
      }
    }
    if (targets.length === 0) targets = ['.'];
    return { showAll, showLong, targets };
  }

  // 格式化 ls -l 输出的一行
  function formatLsEntry(entry) {
    const isDir = entry.type === 'dir';
    const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
    const links = isDir ? '2' : '1';
    const owner = 'user user';
    const size = String(entry.size || 0).padStart(6, ' ');
    const date = shell.formatTimestamp(entry.modified || Date.now());
    const name = isDir ? `\x1b[36m${entry.name}\x1b[0m` : entry.name;
    return `${perms} ${links} ${owner} ${size} ${date} ${name}`;
  }

  // 生成 ls 颜色输出
  function colorizeName(name, type) {
    if (type === 'dir') return `\x1b[1;36m${name}\x1b[0m`;
    if (name.endsWith('.sh')) return `\x1b[1;32m${name}\x1b[0m`;
    return name;
  }

  // 解析 test 表达式
  function evaluateTest(args) {
    if (args.length === 0) return false;

    // 一元操作
    if (args.length === 2) {
      const op = args[0];
      const val = args[1];
      switch (op) {
        case '-z': return val.length === 0;
        case '-n': return val.length > 0;
        case '-f': return shell.fs.isFile(shell.fs.resolvePath(shell.cwd, val));
        case '-d': return shell.fs.isDir(shell.fs.resolvePath(shell.cwd, val));
        case '-e': return shell.fs.exists(shell.fs.resolvePath(shell.cwd, val));
        case '-r': return shell.fs.exists(shell.fs.resolvePath(shell.cwd, val));
        case '-w': return shell.fs.exists(shell.fs.resolvePath(shell.cwd, val));
        case '-x': return shell.fs.exists(shell.fs.resolvePath(shell.cwd, val));
        case '-s': {
          const node = shell.fs.getNode(shell.fs.resolvePath(shell.cwd, val));
          return node && node.type === 'file' && (node.content || '').length > 0;
        }
        case '-L': return false; // no symlinks
        case '!': return !val;
        default: return false;
      }
    }

    // 二元操作
    if (args.length === 3) {
      const left = args[0];
      const op = args[1];
      const right = args[2];
      switch (op) {
        case '=': case '==': return left === right;
        case '!=': return left !== right;
        case '-eq': return parseInt(left) === parseInt(right);
        case '-ne': return parseInt(left) !== parseInt(right);
        case '-gt': return parseInt(left) > parseInt(right);
        case '-ge': return parseInt(left) >= parseInt(right);
        case '-lt': return parseInt(left) < parseInt(right);
        case '-le': return parseInt(left) <= parseInt(right);
        default: return false;
      }
    }

    // 单个非空字符串
    if (args.length === 1) {
      return args[0].length > 0;
    }

    return false;
  }

  // ===== 注册所有命令 =====

  // ---------- 基础命令 ----------

  shell.registerCommand('help', (args) => {
    const categories = {
      'Basic Commands': {
        help: 'Display this help message',
        echo: 'Display text',
        clear: 'Clear the terminal screen',
        pwd: 'Print working directory',
        ls: 'List directory contents (-a, -l)',
        cd: 'Change directory',
        cat: 'Display file contents',
        touch: 'Create empty file or update timestamp',
        mkdir: 'Create directory (-p for parents)',
        rm: 'Remove files or directories (-r, -f)',
        cp: 'Copy files',
        mv: 'Move/rename files',
        find: 'Search for files by name',
        grep: 'Search text patterns in files',
        wc: 'Count lines, words, characters',
        head: 'Display first lines of a file',
        tail: 'Display last lines of a file',
        sort: 'Sort lines of text',
        uniq: 'Remove duplicate lines',
        tee: 'Write output to file and stdout',
        stat: 'Display file status',
        file: 'Determine file type',
        ln: 'Create links (simplified)',
      },
      'System Info': {
        uname: 'Print system information',
        whoami: 'Print current user name',
        hostname: 'Show or set system hostname',
        date: 'Display current date and time',
        uptime: 'Show system uptime',
        id: 'Print user identity',
        arch: 'Print machine architecture',
        env: 'Display environment variables',
        printenv: 'Print environment variables',
      },
      'Shell Builtins': {
        alias: 'Define or display aliases',
        unalias: 'Remove aliases',
        export: 'Set environment variables',
        unset: 'Unset variables',
        set: 'Set shell options',
        shopt: 'Set shell options (bash-style)',
        declare: 'Declare variables and attributes',
        typeset: 'Same as declare',
        readonly: 'Mark variables as read-only',
        local: 'Declare local variables',
        let: 'Evaluate arithmetic expressions',
        eval: 'Evaluate arguments as command',
        exec: 'Replace shell with command',
        source: 'Execute commands from file',
        '.': 'Same as source',
        read: 'Read input into variables',
        printf: 'Formatted output',
        true: 'Return success (exit 0)',
        false: 'Return failure (exit 1)',
        test: 'Evaluate conditional expression',
        '[': 'Evaluate conditional (alias for test)',
        type: 'Display command type',
        command: 'Execute a simple command',
        builtin: 'Execute a shell builtin',
        enable: 'Enable/disable shell builtins',
        hash: 'Remember command locations',
        history: 'Display command history',
        fc: 'Fix command (re-edit history)',
        return: 'Return from function',
        exit: 'Exit the shell',
        logout: 'Exit the shell',
        break: 'Exit loop (stub)',
        continue: 'Continue loop (stub)',
      },
      'Directory Stack': {
        pushd: 'Push directory onto stack',
        popd: 'Pop directory from stack',
        dirs: 'Display directory stack',
      },
      'Job Control': {
        jobs: 'Display active jobs',
        bg: 'Resume job in background',
        fg: 'Resume job in foreground',
        kill: 'Send signal to process/job',
        disown: 'Remove job from table',
        wait: 'Wait for job completion',
        suspend: 'Suspend shell (stub)',
      },
      'Signals & Traps': {
        trap: 'Set signal handlers',
        times: 'Show user/system times',
      },
      'Options & Limits': {
        getopts: 'Parse positional parameters',
        ulimit: 'Set resource limits',
        umask: 'Set file creation mask',
      },
      'I/O & Arrays': {
        mapfile: 'Read lines into array',
        readarray: 'Same as mapfile',
      },
      'Fun & Misc': {
        sleep: 'Delay execution',
        motd: 'Display message of the day',
        banner: 'Display ASCII banner',
        fortune: 'Display a random fortune',
        cal: 'Display a calendar',
        cowsay: 'A cow says your message',
        rev: 'Reverse text',
        yes: 'Repeat output',
        seq: 'Print number sequence',
      },
    };

    let output = '\x1b[1;33mOS-JS Shell - Available Commands\x1b[0m\n';
    output += '\x1b[90m' + '─'.repeat(60) + '\x1b[0m\n';

    for (const [category, cmds] of Object.entries(categories)) {
      output += `\n\x1b[1;36m${category}:\x1b[0m\n`;
      for (const [cmd, desc] of Object.entries(cmds)) {
        output += `  \x1b[1;33m${cmd.padEnd(16)}\x1b[0m ${desc}\n`;
      }
    }

    output += '\n\x1b[90m' + '─'.repeat(60) + '\x1b[0m\n';
    output += 'Tip: Use ↑/↓ for history, Tab for completion, Ctrl+L to clear\n';

    return output;
  });

  // echo
  shell.registerCommand('echo', (args) => {
    let suppressNewline = false;
    let enableEscapes = false;
    let startIdx = 0;

    // 解析选项
    while (startIdx < args.length && args[startIdx].startsWith('-')) {
      const opt = args[startIdx];
      if (opt === '-n') { suppressNewline = true; }
      else if (opt === '-e') { enableEscapes = true; }
      else if (opt === '-E') { enableEscapes = false; }
      else break;
      startIdx++;
    }

    let text = args.slice(startIdx).join(' ');

    if (enableEscapes) {
      text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
      text = text.replace(/\\e/g, '\x1b').replace(/\\033/g, '\x1b');
      text = text.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }

    return suppressNewline ? text : text;
  });

  // clear
  shell.registerCommand('clear', () => {
    terminal.clear();
    return null;
  });

  // pwd
  shell.registerCommand('pwd', (args) => {
    if (args.includes('-P')) return shell.cwd;
    return shell.cwd;
  });

  // ls
  shell.registerCommand('ls', (args) => {
    const { showAll, showLong, targets } = parseLsArgs(args);
    let output = '';

    for (const target of targets) {
      const fullPath = shell.fs.resolvePath(shell.cwd, target);
      const node = shell.fs.getNode(fullPath);

      if (!node) {
        output += `ls: cannot access '${target}': No such file or directory\n`;
        continue;
      }

      if (node.type === 'file') {
        if (showLong) {
          output += formatLsEntry({
            name: node.name, type: 'file',
            size: (node.content || '').length, modified: node.modified
          }) + '\n';
        } else {
          output += node.name + '\n';
        }
        continue;
      }

      // 目录
      if (targets.length > 1) {
        output += `${target}:\n`;
      }

      const entries = shell.fs.listDirDetailed(fullPath);
      if (!entries) continue;

      // 排序：目录优先，然后按名称
      entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      // 添加 . 和 ..
      if (showAll) {
        if (showLong) {
          output += 'drwxr-xr-x 2 user user    0 ' + shell.formatTimestamp(Date.now()) + ' \x1b[1;36m.\x1b[0m\n';
          output += 'drwxr-xr-x 2 user user    0 ' + shell.formatTimestamp(Date.now()) + ' \x1b[1;36m..\x1b[0m\n';
        } else {
          output += '\x1b[1;36m.\x1b[0m  \x1b[1;36m..\x1b[0m  ';
        }
      }

      for (const entry of entries) {
        if (!showAll && entry.name.startsWith('.')) continue;

        if (showLong) {
          output += formatLsEntry(entry) + '\n';
        } else {
          output += colorizeName(entry.name, entry.type) + '  ';
        }
      }

      if (!showLong) output += '\n';
    }

    return output.trimEnd() || null;
  });

  // cd
  shell.registerCommand('cd', (args) => {
    let target = args[0];

    // 无参数：回 home
    if (!target) target = shell.homeDir;

    // cd - : 回上一个目录
    if (target === '-') {
      const old = shell.env.OLDPWD;
      if (!old) return 'bash: cd: OLDPWD not set';
      const newPath = shell.fs.resolvePath(shell.cwd, old);
      if (!shell.fs.isDir(newPath)) return `bash: cd: ${old}: No such directory`;
      shell.env.OLDPWD = shell.cwd;
      shell.cwd = newPath;
      shell.env.PWD = newPath;
      shell.pushDir(newPath);
      return newPath;
    }

    const newPath = shell.fs.resolvePath(shell.cwd, target);

    if (!shell.fs.exists(newPath)) {
      return `bash: cd: ${target}: No such file or directory`;
    }
    if (!shell.fs.isDir(newPath)) {
      return `bash: cd: ${target}: Not a directory`;
    }

    shell.env.OLDPWD = shell.cwd;
    shell.cwd = newPath;
    shell.env.PWD = newPath;
    shell.pushDir(newPath);
    return null;
  });

  // cat
  shell.registerCommand('cat', (args) => {
    if (args.length === 0) return 'cat: missing operand';

    let number = false;
    let numberNonBlank = false;
    let showEnds = false;
    let squeezeBlank = false;
    const files = [];

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('n')) number = true;
        if (arg.includes('b')) numberNonBlank = true;
        if (arg.includes('E')) showEnds = true;
        if (arg.includes('s')) squeezeBlank = true;
      } else {
        files.push(arg);
      }
    }

    let output = '';
    let lineNum = 1;
    let prevBlank = false;

    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      const result = shell.fs.readFile(fullPath);

      if (!result.success) {
        output += `cat: ${file}: ${result.error}\n`;
        continue;
      }

      const lines = (result.content || '').split('\n');
      for (const line of lines) {
        const isBlank = line.length === 0;

        if (squeezeBlank && isBlank && prevBlank) continue;
        prevBlank = isBlank;

        let prefix = '';
        if (numberNonBlank && !isBlank) {
          prefix = String(lineNum++).padStart(6) + '\t';
        } else if (number) {
          prefix = String(lineNum++).padStart(6) + '\t';
        }

        const suffix = showEnds ? '$' : '';
        output += prefix + line + suffix + '\n';
      }
    }

    return output.trimEnd() || null;
  });

  // touch
  shell.registerCommand('touch', (args) => {
    if (args.length === 0) return 'touch: missing file operand';

    let noCreate = false;
    const files = [];

    for (const arg of args) {
      if (arg === '-c' || arg === '--no-create') noCreate = true;
      else files.push(arg);
    }

    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      if (!shell.fs.exists(fullPath)) {
        if (noCreate) continue;
        const result = shell.fs.createFile(fullPath, '');
        if (!result.success) return `touch: cannot create '${file}': ${result.error}`;
      } else {
        // 更新修改时间
        const node = shell.fs.getNode(fullPath);
        if (node) node.modified = Date.now();
        shell.fs.save();
      }
    }
    return null;
  });

  // mkdir
  shell.registerCommand('mkdir', (args) => {
    let createParents = false;
    const dirs = [];

    for (const arg of args) {
      if (arg === '-p' || arg === '--parents') createParents = true;
      else if (arg === '-v' || arg === '--verbose') { /* ignore */ }
      else dirs.push(arg);
    }

    if (dirs.length === 0) return 'mkdir: missing operand';

    let output = '';
    for (const dir of dirs) {
      const fullPath = shell.fs.resolvePath(shell.cwd, dir);
      let result;
      if (createParents) {
        result = shell.fs.createDirRecursive(fullPath);
      } else {
        result = shell.fs.createDir(fullPath);
      }
      if (!result.success) {
        output += `mkdir: cannot create directory '${dir}': ${result.error}\n`;
      }
    }
    return output.trimEnd() || null;
  });

  // rm
  shell.registerCommand('rm', (args) => {
    let recursive = false;
    let force = false;
    let dirOnly = false;
    const targets = [];

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('r') || arg.includes('R')) recursive = true;
        if (arg.includes('f')) force = true;
        if (arg.includes('d')) dirOnly = true;
      } else {
        targets.push(arg);
      }
    }

    if (targets.length === 0) return 'rm: missing operand';

    let output = '';
    for (const target of targets) {
      const fullPath = shell.fs.resolvePath(shell.cwd, target);
      const node = shell.fs.getNode(fullPath);

      if (!node) {
        if (!force) output += `rm: cannot remove '${target}': No such file or directory\n`;
        continue;
      }

      if (node.type === 'dir' && !recursive) {
        if (!force) output += `rm: cannot remove '${target}': Is a directory\n`;
        continue;
      }

      let result;
      if (recursive) {
        result = shell.fs.removeRecursive(fullPath);
      } else {
        result = shell.fs.remove(fullPath);
      }

      if (!result.success && !force) {
        output += `rm: cannot remove '${target}': ${result.error}\n`;
      }
    }
    return output.trimEnd() || null;
  });

  // cp
  shell.registerCommand('cp', (args) => {
    if (args.length < 2) return 'cp: missing operand';

    const sources = args.slice(0, -1);
    const dest = args[args.length - 1];
    const destPath = shell.fs.resolvePath(shell.cwd, dest);

    for (const src of sources) {
      const srcPath = shell.fs.resolvePath(shell.cwd, src);
      if (!shell.fs.exists(srcPath)) {
        return `cp: cannot stat '${src}': No such file or directory`;
      }

      let targetPath = destPath;
      if (shell.fs.isDir(destPath)) {
        targetPath = destPath + '/' + src.split('/').pop();
      }

      const result = shell.fs.copyFile(srcPath, targetPath);
      if (!result.success) return `cp: cannot copy '${src}': ${result.error}`;
    }
    return null;
  });

  // mv
  shell.registerCommand('mv', (args) => {
    if (args.length < 2) return 'mv: missing operand';

    const sources = args.slice(0, -1);
    const dest = args[args.length - 1];
    const destPath = shell.fs.resolvePath(shell.cwd, dest);

    for (const src of sources) {
      const srcPath = shell.fs.resolvePath(shell.cwd, src);
      if (!shell.fs.exists(srcPath)) {
        return `mv: cannot stat '${src}': No such file or directory`;
      }

      let targetPath = destPath;
      if (shell.fs.isDir(destPath)) {
        targetPath = destPath + '/' + src.split('/').pop();
      }

      const result = shell.fs.move(srcPath, targetPath);
      if (!result.success) return `mv: cannot move '${src}': ${result.error}`;
    }
    return null;
  });

  // find
  shell.registerCommand('find', (args) => {
    let searchPath = '.';
    let namePattern = null;
    let typeFilter = null;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name' && args[i + 1]) { namePattern = args[++i]; }
      else if (args[i] === '-type' && args[i + 1]) { typeFilter = args[++i]; }
      else if (!args[i].startsWith('-')) { searchPath = args[i]; }
    }

    const fullPath = shell.fs.resolvePath(shell.cwd, searchPath);
    const results = [];

    function walk(path, node) {
      if (!node) return;

      const name = node.name || path.split('/').pop();
      let match = true;

      if (namePattern) {
        const regex = new RegExp('^' + namePattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        match = regex.test(name);
      }

      if (typeFilter) {
        if (typeFilter === 'f' && node.type !== 'file') match = false;
        if (typeFilter === 'd' && node.type !== 'dir') match = false;
      }

      if (match) results.push(path);

      if (node.type === 'dir' && node.children) {
        for (const [childName, child] of Object.entries(node.children)) {
          walk(path + '/' + childName, child);
        }
      }
    }

    walk(fullPath, shell.fs.getNode(fullPath));
    return results.join('\n') || null;
  });

  // grep
  shell.registerCommand('grep', (args, ctx, stdin) => {
    let ignoreCase = false;
    let showLineNum = false;
    let invert = false;
    let count = false;
    let quiet = false;
    let files = [];
    let pattern = null;

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('i')) ignoreCase = true;
        if (arg.includes('n')) showLineNum = true;
        if (arg.includes('v')) invert = true;
        if (arg.includes('c')) count = true;
        if (arg.includes('q')) quiet = true;
      } else if (!pattern) {
        pattern = arg;
      } else {
        files.push(arg);
      }
    }

    if (!pattern) return 'grep: missing pattern';

    const flags = ignoreCase ? 'i' : '';
    const regex = new RegExp(pattern, flags);

    let text = stdin;
    if (!text && files.length === 0) return 'grep: no input';

    let output = '';
    let matchCount = 0;

    const processText = (content, filename) => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const matched = regex.test(lines[i]);
        const show = invert ? !matched : matched;
        if (show) {
          matchCount++;
          if (!count && !quiet) {
            const prefix = filename ? `${filename}:` : '';
            const lnum = showLineNum ? `${i + 1}:` : '';
            output += prefix + lnum + lines[i] + '\n';
          }
        }
      }
    };

    if (text) {
      processText(text, files.length > 1 ? '(standard input)' : null);
    }

    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      const result = shell.fs.readFile(fullPath);
      if (!result.success) {
        output += `grep: ${file}: ${result.error}\n`;
        continue;
      }
      processText(result.content || '', files.length > 1 ? file : null);
    }

    if (count) return String(matchCount);
    if (quiet) return matchCount > 0 ? null : null;
    return output.trimEnd() || null;
  });

  // wc
  shell.registerCommand('wc', (args) => {
    let showLines = false, showWords = false, showChars = false;
    const files = [];

    for (const arg of args) {
      if (arg === '-l') showLines = true;
      else if (arg === '-w') showWords = true;
      else if (arg === '-c') showChars = true;
      else if (arg === '-m') showChars = true;
      else files.push(arg);
    }

    if (!showLines && !showWords && !showChars) {
      showLines = showWords = showChars = true;
    }

    const countAll = (text) => {
      const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
      const words = text.trim().split(/\s+/).filter(w => w).length;
      const chars = text.length;
      let parts = [];
      if (showLines) parts.push(String(lines).padStart(8));
      if (showWords) parts.push(String(words).padStart(8));
      if (showChars) parts.push(String(chars).padStart(8));
      return parts.join('');
    };

    let output = '';
    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      const result = shell.fs.readFile(fullPath);
      if (!result.success) {
        output += `wc: ${file}: ${result.error}\n`;
        continue;
      }
      output += countAll(result.content || '') + ' ' + file + '\n';
    }

    return output.trimEnd() || null;
  });

  // head
  shell.registerCommand('head', (args) => {
    let n = 10;
    const files = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) { n = parseInt(args[++i]); }
      else if (args[i].startsWith('-') && !isNaN(args[i].slice(1))) { n = parseInt(args[i].slice(1)); }
      else files.push(args[i]);
    }

    let output = '';
    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      const result = shell.fs.readFile(fullPath);
      if (!result.success) {
        output += `head: ${file}: ${result.error}\n`;
        continue;
      }
      const lines = (result.content || '').split('\n').slice(0, n);
      output += lines.join('\n') + '\n';
    }

    return output.trimEnd() || null;
  });

  // tail
  shell.registerCommand('tail', (args) => {
    let n = 10;
    const files = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) { n = parseInt(args[++i]); }
      else if (args[i].startsWith('-') && !isNaN(args[i].slice(1))) { n = parseInt(args[i].slice(1)); }
      else files.push(args[i]);
    }

    let output = '';
    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      const result = shell.fs.readFile(fullPath);
      if (!result.success) {
        output += `tail: ${file}: ${result.error}\n`;
        continue;
      }
      const allLines = (result.content || '').split('\n');
      const lines = allLines.slice(-n);
      output += lines.join('\n') + '\n';
    }

    return output.trimEnd() || null;
  });

  // sort
  shell.registerCommand('sort', (args) => {
    let reverse = false, numeric = false, unique = false, ignoreCase = false;
    const files = [];

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('r')) reverse = true;
        if (arg.includes('n')) numeric = true;
        if (arg.includes('u')) unique = true;
        if (arg.includes('f')) ignoreCase = true;
      } else {
        files.push(arg);
      }
    }

    let text = '';
    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      const result = shell.fs.readFile(fullPath);
      if (!result.success) return `sort: ${file}: ${result.error}`;
      text += result.content + '\n';
    }

    if (!text) return null;

    let lines = text.split('\n').filter(l => l !== '');
    if (numeric) {
      lines.sort((a, b) => parseFloat(a) - parseFloat(b));
    } else if (ignoreCase) {
      lines.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    } else {
      lines.sort();
    }

    if (reverse) lines.reverse();
    if (unique) lines = [...new Set(lines)];

    return lines.join('\n');
  });

  // uniq
  shell.registerCommand('uniq', (args) => {
    let count = false, ignoreCase = false;
    const files = [];

    for (const arg of args) {
      if (arg === '-c') count = true;
      else if (arg === '-i') ignoreCase = true;
      else files.push(arg);
    }

    let text = '';
    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      const result = shell.fs.readFile(fullPath);
      if (!result.success) return `uniq: ${file}: ${result.error}`;
      text += result.content + '\n';
    }

    if (!text) return null;

    const lines = text.split('\n');
    const output = [];
    let prev = null;
    let cnt = 0;

    for (const line of lines) {
      const cmp = ignoreCase ? line.toLowerCase() : line;
      const prevCmp = ignoreCase ? (prev || '').toLowerCase() : prev;

      if (cmp === prevCmp) {
        cnt++;
      } else {
        if (prev !== null) {
          output.push(count ? `${String(cnt).padStart(7)} ${prev}` : prev);
        }
        prev = line;
        cnt = 1;
      }
    }

    if (prev !== null) {
      output.push(count ? `${String(cnt).padStart(7)} ${prev}` : prev);
    }

    return output.join('\n');
  });

  // tee
  shell.registerCommand('tee', (args, ctx, stdin) => {
    let append = false;
    const files = [];

    for (const arg of args) {
      if (arg === '-a') append = true;
      else files.push(arg);
    }

    const text = stdin || '';

    for (const file of files) {
      const fullPath = shell.fs.resolvePath(shell.cwd, file);
      if (append) {
        shell.fs.appendFile(fullPath, text);
      } else {
        shell.fs.writeFile(fullPath, text);
      }
    }

    return text;
  });

  // stat
  shell.registerCommand('stat', (args) => {
    if (args.length === 0) return 'stat: missing operand';

    const file = args[0];
    const fullPath = shell.fs.resolvePath(shell.cwd, file);
    const node = shell.fs.getNode(fullPath);

    if (!node) return `stat: cannot stat '${file}': No such file or directory`;

    let output = `  File: ${file}\n`;
    output += `  Type: ${node.type === 'dir' ? 'directory' : 'regular file'}\n`;
    if (node.type === 'file') {
      output += `  Size: ${(node.content || '').length} bytes\n`;
    }
    output += `Modify: ${new Date(node.modified || Date.now()).toISOString()}\n`;

    return output;
  });

  // file
  shell.registerCommand('file', (args) => {
    if (args.length === 0) return 'file: missing operand';

    const file = args[0];
    const fullPath = shell.fs.resolvePath(shell.cwd, file);
    const node = shell.fs.getNode(fullPath);

    if (!node) return `file: ${file}: No such file or directory`;
    if (node.type === 'dir') return `${file}: directory`;

    const content = node.content || '';
    if (content.startsWith('#!/bin/bash') || content.startsWith('#!/bin/sh')) {
      return `${file}: Bourne-Again shell script, UTF-8 text executable`;
    }
    if (content.startsWith('#!/')) {
      return `${file}: script text executable`;
    }
    if (/^[\x00-\x7F]*$/.test(content.slice(0, 100))) {
      return `${file}: ASCII text`;
    }

    return `${file}: data`;
  });

  // ln (simplified - only copies)
  shell.registerCommand('ln', (args) => {
    let symbolic = false;
    const files = [];

    for (const arg of args) {
      if (arg === '-s' || arg === '--symbolic') symbolic = true;
      else files.push(arg);
    }

    if (files.length < 2) return 'ln: missing operand';

    const src = files[0];
    const dest = files[1];
    const srcPath = shell.fs.resolvePath(shell.cwd, src);
    const destPath = shell.fs.resolvePath(shell.cwd, dest);

    if (!shell.fs.exists(srcPath)) return `ln: ${src}: No such file or directory`;

    const result = shell.fs.copyFile(srcPath, destPath);
    if (!result.success) return `ln: ${result.error}`;
    return null;
  });

  // ---------- 系统信息命令 ----------

  shell.registerCommand('uname', (args) => {
    let all = false, kernel = false, nodename = false, release = false;
    let machine = false, os = false;

    for (const arg of args) {
      if (arg === '-a') all = true;
      if (arg === '-s') kernel = true;
      if (arg === '-n') nodename = true;
      if (arg === '-r') release = true;
      if (arg === '-m') machine = true;
      if (arg === '-o') os = true;
    }

    if (all || (!kernel && !nodename && !release && !machine && !os)) {
      return 'Linux os-js 0.1.0-browser #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
    }

    let parts = [];
    if (kernel) parts.push('Linux');
    if (nodename) parts.push('os-js');
    if (release) parts.push('0.1.0-browser');
    if (machine) parts.push('x86_64');
    if (os) parts.push('GNU/Linux');

    return parts.join(' ');
  });

  shell.registerCommand('whoami', () => shell.username);

  shell.registerCommand('hostname', (args) => {
    if (args.length > 0) {
      shell.hostname = args[0];
      shell.env.HOSTNAME = args[0];
      return null;
    }
    return shell.hostname;
  });

  shell.registerCommand('date', (args) => {
    const now = new Date();
    let format = null;

    if (args.length > 0 && args[0].startsWith('+')) {
      format = args[0].slice(1);
    } else if (args.includes('-u')) {
      return now.toUTCString();
    }

    if (format) {
      return format
        .replace('%Y', now.getFullYear())
        .replace('%m', String(now.getMonth() + 1).padStart(2, '0'))
        .replace('%d', String(now.getDate()).padStart(2, '0'))
        .replace('%H', String(now.getHours()).padStart(2, '0'))
        .replace('%M', String(now.getMinutes()).padStart(2, '0'))
        .replace('%S', String(now.getSeconds()).padStart(2, '0'))
        .replace('%A', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()])
        .replace('%a', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()])
        .replace('%B', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()])
        .replace('%b', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()])
        .replace('%Z', Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
        .replace('%s', Math.floor(now.getTime() / 1000));
    }

    return shell.formatDate(now);
  });

  shell.registerCommand('uptime', () => {
    const hours = Math.floor(Math.random() * 200) + 1;
    const mins = Math.floor(Math.random() * 60);
    const users = 1;
    const load = [
      (Math.random() * 2).toFixed(2),
      (Math.random() * 1.5).toFixed(2),
      (Math.random() * 1).toFixed(2)
    ];
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    return ` ${time} up ${hours}:${String(mins).padStart(2, '0')},  ${users} user,  load average: ${load.join(', ')}`;
  });

  shell.registerCommand('id', (args) => {
    const user = args[0] || shell.username;
    if (user === 'root') return 'uid=0(root) gid=0(root) groups=0(root)';
    return `uid=1000(${user}) gid=1000(${user}) groups=1000(${user}),4(adm),27(sudo)`;
  });

  shell.registerCommand('arch', () => 'x86_64');

  shell.registerCommand('env', () => {
    let output = '';
    for (const [key, val] of Object.entries(shell.env)) {
      output += `${key}=${val}\n`;
    }
    return output.trimEnd();
  });

  shell.registerCommand('printenv', (args) => {
    if (args.length > 0) {
      return shell.env[args[0]] || '';
    }
    let output = '';
    for (const [key, val] of Object.entries(shell.env)) {
      output += `${key}=${val}\n`;
    }
    return output.trimEnd();
  });

  // ---------- Shell 内建命令 ----------

  // alias
  shell.registerCommand('alias', (args) => {
    if (args.length === 0) {
      let output = '';
      for (const [name, value] of Object.entries(shell.aliases)) {
        output += `alias ${name}='${value}'\n`;
      }
      return output.trimEnd() || null;
    }

    for (const arg of args) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const name = arg.slice(0, eqIdx);
        let value = arg.slice(eqIdx + 1);
        // 去除引号
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        shell.aliases[name] = value;
      } else {
        if (shell.aliases[arg]) {
          return `alias ${arg}='${shell.aliases[arg]}'`;
        }
        return `bash: alias: ${arg}: not found`;
      }
    }
    return null;
  });

  // unalias
  shell.registerCommand('unalias', (args) => {
    if (args.includes('-a')) {
      shell.aliases = {};
      return null;
    }
    for (const arg of args) {
      if (shell.aliases[arg]) {
        delete shell.aliases[arg];
      } else {
        return `bash: unalias: ${arg}: not found`;
      }
    }
    return null;
  });

  // export
  shell.registerCommand('export', (args) => {
    if (args.length === 0) {
      let output = '';
      for (const [key, val] of Object.entries(shell.env)) {
        output += `declare -x ${key}="${val}"\n`;
      }
      return output.trimEnd();
    }

    for (const arg of args) {
      if (arg === '-p') {
        let output = '';
        for (const [key, val] of Object.entries(shell.env)) {
          output += `declare -x ${key}="${val}"\n`;
        }
        return output.trimEnd();
      }

      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const name = arg.slice(0, eqIdx);
        let value = arg.slice(eqIdx + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        shell.env[name] = value;
        shell.variables[name] = value;
      } else {
        if (shell.variables[arg] !== undefined) {
          shell.env[arg] = shell.variables[arg];
        } else {
          shell.env[arg] = '';
        }
      }
    }
    return null;
  });

  // unset
  shell.registerCommand('unset', (args) => {
    let funcMode = false;
    for (const arg of args) {
      if (arg === '-f') { funcMode = true; continue; }
      if (arg === '-v') { funcMode = false; continue; }
      if (shell.readonlyVars.has(arg)) {
        return `bash: unset: ${arg}: cannot unset: readonly variable`;
      }
      delete shell.env[arg];
      delete shell.variables[arg];
    }
    return null;
  });

  // set
  shell.registerCommand('set', (args) => {
    if (args.length === 0) {
      let output = '';
      for (const [key, val] of Object.entries(shell.variables)) {
        output += `${key}=${val}\n`;
      }
      for (const [key, val] of Object.entries(shell.env)) {
        output += `declare -x ${key}="${val}"\n`;
      }
      return output.trimEnd();
    }

    for (const arg of args) {
      if (arg === '+o') {
        let output = '';
        for (const [opt, val] of Object.entries(shell.setOptions)) {
          output += `set ${val ? '-o' : '+o'} ${opt}\n`;
        }
        return output;
      }
      if (arg === '-o') {
        let output = '';
        for (const [opt, val] of Object.entries(shell.setOptions)) {
          output += `${opt.padEnd(20)} ${val ? 'on' : 'off'}\n`;
        }
        return output;
      }

      if (arg.startsWith('-')) {
        const flags = arg.slice(1);
        for (const f of flags) {
          switch (f) {
            case 'a': shell.setOptions.allexport = true; break;
            case 'b': shell.setOptions.notify = true; break;
            case 'e': shell.setOptions.errexit = true; break;
            case 'f': shell.setOptions.noglob = true; break;
            case 'h': shell.setOptions.hashall = true; break;
            case 'k': shell.setOptions.keyword = true; break;
            case 'm': shell.setOptions.monitor = true; break;
            case 'n': shell.setOptions.noexec = true; break;
            case 'u': shell.setOptions.nounset = true; break;
            case 'v': shell.setOptions.verbose = true; break;
            case 'x': shell.setOptions.xtrace = true; break;
            case 'C': shell.setOptions.noclobber = true; break;
          }
        }
      } else if (arg.startsWith('+')) {
        const flags = arg.slice(1);
        for (const f of flags) {
          switch (f) {
            case 'a': shell.setOptions.allexport = false; break;
            case 'e': shell.setOptions.errexit = false; break;
            case 'f': shell.setOptions.noglob = false; break;
            case 'n': shell.setOptions.noexec = false; break;
            case 'u': shell.setOptions.nounset = false; break;
            case 'v': shell.setOptions.verbose = false; break;
            case 'x': shell.setOptions.xtrace = false; break;
            case 'C': shell.setOptions.noclobber = false; break;
          }
        }
      }
    }
    return null;
  });

  // shopt
  shell.registerCommand('shopt', (args) => {
    if (args.length === 0) {
      let output = '';
      for (const [opt, val] of Object.entries(shell.shoptOptions)) {
        output += `${opt.padEnd(25)} ${val ? 'on' : 'off'}\n`;
      }
      return output;
    }

    let showAll = false, showSet = false, showUnset = false;
    const opts = [];

    for (const arg of args) {
      if (arg === '-s') showSet = true;
      else if (arg === '-u') showUnset = true;
      else if (arg === '-p') showAll = true;
      else opts.push(arg);
    }

    if (showAll || (showSet && opts.length === 0) || (showUnset && opts.length === 0)) {
      let output = '';
      for (const [opt, val] of Object.entries(shell.shoptOptions)) {
        if (showSet && !val) continue;
        if (showUnset && val) continue;
        output += `shopt ${val ? '-s' : '-u'} ${opt}\n`;
      }
      return output;
    }

    if (opts.length > 0) {
      let output = '';
      for (const opt of opts) {
        if (showSet) {
          shell.shoptOptions[opt] = true;
        } else if (showUnset) {
          shell.shoptOptions[opt] = false;
        } else {
          if (shell.shoptOptions.hasOwnProperty(opt)) {
            output += `${opt.padEnd(25)} ${shell.shoptOptions[opt] ? 'on' : 'off'}\n`;
          } else {
            output += `bash: shopt: ${opt}: invalid shell option name\n`;
          }
        }
      }
      return output.trimEnd() || null;
    }

    return null;
  });

  // declare / typeset
  shell.registerCommand('declare', (args) => {
    let intMode = false, readonly = false, exportMode = false, upper = false, lower = false, array = false;
    const vars = [];

    for (const arg of args) {
      if (arg.startsWith('-')) {
        const flags = arg.slice(1);
        if (flags.includes('i')) intMode = true;
        if (flags.includes('r')) readonly = true;
        if (flags.includes('x')) exportMode = true;
        if (flags.includes('u')) upper = true;
        if (flags.includes('l')) lower = true;
        if (flags.includes('a')) array = true;
        if (flags.includes('p')) {
          let output = '';
          for (const [key, val] of Object.entries(shell.variables)) {
            output += `declare -- ${key}="${val}"\n`;
          }
          for (const [key, val] of Object.entries(shell.env)) {
            output += `declare -x ${key}="${val}"\n`;
          }
          return output.trimEnd() || null;
        }
      } else {
        vars.push(arg);
      }
    }

    for (const v of vars) {
      const eqIdx = v.indexOf('=');
      if (eqIdx !== -1) {
        const name = v.slice(0, eqIdx);
        let value = v.slice(eqIdx + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (upper) value = value.toUpperCase();
        if (lower) value = value.toLowerCase();
        if (intMode) value = String(parseInt(value) || 0);
        shell.variables[name] = value;
        if (exportMode) shell.env[name] = value;
        if (readonly) shell.readonlyVars.add(name);
      } else {
        if (shell.variables[v] !== undefined) {
          return `declare -- ${v}="${shell.variables[v]}"`;
        }
        shell.variables[v] = '';
      }
    }
    return null;
  });
  shell.registerCommand('typeset', (args, ctx) => shell.commands['declare'](args, ctx));

  // readonly
  shell.registerCommand('readonly', (args) => {
    if (args.length === 0) {
      let output = '';
      for (const v of shell.readonlyVars) {
        output += `declare -r ${v}="${shell.env[v] || shell.variables[v] || ''}"\n`;
      }
      return output.trimEnd() || null;
    }

    for (const arg of args) {
      if (arg === '-p') {
        let output = '';
        for (const v of shell.readonlyVars) {
          output += `declare -r ${v}="${shell.env[v] || shell.variables[v] || ''}"\n`;
        }
        return output.trimEnd() || null;
      }

      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const name = arg.slice(0, eqIdx);
        const value = arg.slice(eqIdx + 1);
        shell.variables[name] = value;
        shell.readonlyVars.add(name);
      } else {
        shell.readonlyVars.add(arg);
      }
    }
    return null;
  });

  // local
  shell.registerCommand('local', (args) => {
    for (const arg of args) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        shell.variables[arg.slice(0, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        shell.variables[arg] = shell.variables[arg] || '';
      }
    }
    return null;
  });

  // let
  shell.registerCommand('let', (args) => {
    if (args.length === 0) return 'let: missing expression';

    const expr = args.join(' ');
    try {
      // 替换变量
      const expanded = expr.replace(/\$?([A-Za-z_][A-Za-z0-9_]*)/g, (match, name) => {
        if (match.startsWith('$')) return shell._expandVariable(name);
        return shell.variables[name] || shell.env[name] || '0';
      });

      // 安全的算术求值
      const safeExpr = expanded.replace(/[^0-9+\-*/%()<>&|^!~ ]/g, '');
      const result = Function('"use strict"; return (' + safeExpr + ')')();

      shell.variables['REPLY'] = String(result);
      shell.lastExitCode = result === 0 ? 1 : 0;
      return result !== 0 ? null : null;
    } catch (e) {
      return `let: expression failed: ${expr}`;
    }
  });

  // eval
  shell.registerCommand('eval', (args, ctx) => {
    const cmd = args.join(' ');
    return shell.execute(cmd);
  });

  // exec
  shell.registerCommand('exec', (args) => {
    if (args.length === 0) return null;
    const cmdName = args[0];
    if (shell.commands[cmdName]) {
      return shell.commands[cmdName](args.slice(1), shell);
    }
    return `bash: exec: ${cmdName}: command not found`;
  });

  // source / .
  shell.registerCommand('source', async (args) => {
    if (args.length === 0) return 'source: filename argument required';

    const file = args[0];
    const fullPath = shell.fs.resolvePath(shell.cwd, file);
    const result = shell.fs.readFile(fullPath);

    if (!result.success) return `bash: source: ${file}: ${result.error}`;

    const lines = (result.content || '').split('\n');
    let output = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const res = await shell.execute(trimmed);
      if (res) output += res + '\n';
    }

    return output.trimEnd() || null;
  });
  shell.registerCommand('.', (args, ctx) => shell.commands['source'](args, ctx));

  // read
  shell.registerCommand('read', async (args) => {
    let prompt = '';
    let varName = 'REPLY';
    let silent = false;
    let timeout = 0;
    let delim = '\n';
    let raw = false;
    const vars = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-p' && args[i + 1]) { prompt = args[++i]; }
      else if (args[i] === '-t' && args[i + 1]) { timeout = parseInt(args[++i]); }
      else if (args[i] === '-s') { silent = true; }
      else if (args[i] === '-r') { raw = true; }
      else if (args[i] === '-d' && args[i + 1]) { delim = args[++i]; }
      else if (args[i] === '-n' && args[i + 1]) { /* char count, ignore */ i++; }
      else { vars.push(args[i]); }
    }

    if (vars.length > 0) varName = vars[0];

    const value = await terminal.waitForInput(prompt || '? ');

    if (vars.length <= 1) {
      shell.variables[varName] = value;
    } else {
      const parts = value.split(/\s+/);
      for (let i = 0; i < vars.length; i++) {
        shell.variables[vars[i]] = i < parts.length - 1 ? parts[i] : parts.slice(i).join(' ');
      }
    }

    shell.lastExitCode = 0;
    return null;
  });

  // printf
  shell.registerCommand('printf', (args) => {
    if (args.length === 0) return 'printf: usage: printf [-v var] format [arguments]';

    let format = args[0];
    const values = args.slice(1);
    let valIdx = 0;

    // 处理 \e, \n, \t 等
    format = format.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\').replace(/\\e/g, '\x1b')
      .replace(/\\033/g, '\x1b').replace(/\\0/g, '\0');

    let output = '';
    let i = 0;

    while (i < format.length) {
      if (format[i] === '%' && format[i + 1] !== '%') {
        i++;
        // 解析格式说明符
        let flags = '', width = '', precision = '', length = '', specifier = '';

        while (i < format.length && /[+\- 0#]/.test(format[i])) flags += format[i++];
        while (i < format.length && /[0-9]/.test(format[i])) width += format[i++];
        if (format[i] === '.') { precision += format[i++]; while (i < format.length && /[0-9]/.test(format[i])) precision += format[i++]; }
        while (i < format.length && /[hlL]/.test(format[i])) length += format[i++];

        if (i < format.length) specifier = format[i++];

        const val = values[valIdx] !== undefined ? values[valIdx] : '';
        valIdx++;

        switch (specifier) {
          case 's': output += String(val); break;
          case 'd': case 'i': output += String(parseInt(val) || 0); break;
          case 'f': case 'F': output += String(parseFloat(val) || 0); break;
          case 'x': output += (parseInt(val) || 0).toString(16); break;
          case 'X': output += (parseInt(val) || 0).toString(16).toUpperCase(); break;
          case 'o': output += (parseInt(val) || 0).toString(8); break;
          case 'c': output += String.fromCharCode(parseInt(val) || 0); break;
          case 'b': output += String(val).replace(/\\n/g, '\n').replace(/\\t/g, '\t'); break;
          case 'u': output += String(parseInt(val) >>> 0); break;
          default: output += '%' + specifier; break;
        }
      } else if (format[i] === '%' && format[i + 1] === '%') {
        output += '%';
        i += 2;
      } else {
        output += format[i++];
      }
    }

    return output;
  });

  // true / false
  shell.registerCommand('true', () => { shell.lastExitCode = 0; return null; });
  shell.registerCommand('false', () => { shell.lastExitCode = 1; return null; });

  // test / [
  shell.registerCommand('test', (args) => {
    // 去除尾部的 ]
    const cleanArgs = args.filter(a => a !== ']');
    const result = evaluateTest(cleanArgs);
    shell.lastExitCode = result ? 0 : 1;
    return null;
  });
  shell.registerCommand('[', (args) => {
    const cleanArgs = args.filter(a => a !== ']');
    const result = evaluateTest(cleanArgs);
    shell.lastExitCode = result ? 0 : 1;
    return null;
  });

  // type
  shell.registerCommand('type', (args) => {
    if (args.length === 0) return 'type: missing argument';

    let output = '';
    for (const arg of args) {
      if (shell.commands[arg]) {
        output += `${arg} is a shell builtin\n`;
      } else if (shell.aliases[arg]) {
        output += `${arg} is aliased to '${shell.aliases[arg]}'\n`;
      } else {
        output += `bash: type: ${arg}: not found\n`;
      }
    }
    return output.trimEnd();
  });

  // command
  shell.registerCommand('command', (args) => {
    if (args.length === 0) return null;
    const cmdName = args[0];
    const cmdArgs = args.slice(1);

    if (args[0] === '-v') {
      if (shell.commands[args[1]]) return args[1];
      return `bash: ${args[1]}: not found`;
    }

    if (shell.commands[cmdName]) {
      return shell.commands[cmdName](cmdArgs, shell);
    }
    return `bash: command: ${cmdName}: not found`;
  });

  // builtin
  shell.registerCommand('builtin', (args) => {
    if (args.length === 0) return 'builtin: missing builtin name';
    const cmdName = args[0];
    if (shell.commands[cmdName]) {
      return shell.commands[cmdName](args.slice(1), shell);
    }
    return `bash: builtin: ${cmdName}: not a shell builtin`;
  });

  // enable
  shell.registerCommand('enable', (args) => {
    if (args.length === 0 || args[0] === '-n') {
      let output = '';
      for (const name of Object.keys(shell.commands).sort()) {
        output += `enable ${name}\n`;
      }
      return output.trimEnd();
    }

    if (args[0] === '-a') {
      let output = '';
      for (const name of Object.keys(shell.commands).sort()) {
        output += `enable ${name}\n`;
      }
      return output.trimEnd();
    }

    return null;
  });

  // hash
  shell.registerCommand('hash', (args) => {
    if (args.length === 0) {
      if (Object.keys(shell.hashTable).length === 0) {
        return 'hash: hash table empty';
      }
      let output = 'hits\tcommand\n';
      for (const [cmd, info] of Object.entries(shell.hashTable)) {
        output += `${info.hits}\t${info.path}\n`;
      }
      return output.trimEnd();
    }

    if (args[0] === '-r') {
      shell.hashTable = {};
      return null;
    }

    if (args[0] === '-d') {
      delete shell.hashTable[args[1]];
      return null;
    }

    if (args[0] === '-p') {
      if (args[1] && args[2]) {
        shell.hashTable[args[2]] = { path: args[1], hits: 0 };
      }
      return null;
    }

    for (const arg of args) {
      if (shell.commands[arg]) {
        shell.hashTable[arg] = { path: `/usr/bin/${arg}`, hits: (shell.hashTable[arg]?.hits || 0) + 1 };
      }
    }
    return null;
  });

  // history
  shell.registerCommand('history', (args) => {
    let count = null;
    let clearHistory = false;
    let deleteIdx = null;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-c') clearHistory = true;
      else if (args[i] === '-d' && args[i + 1]) { deleteIdx = parseInt(args[++i]); }
      else if (!isNaN(parseInt(args[i]))) count = parseInt(args[i]);
    }

    if (clearHistory) {
      shell.history = [];
      return null;
    }

    if (deleteIdx !== null) {
      if (deleteIdx > 0 && deleteIdx <= shell.history.length) {
        shell.history.splice(deleteIdx - 1, 1);
      }
      return null;
    }

    const start = count ? Math.max(0, shell.history.length - count) : 0;
    let output = '';
    for (let i = start; i < shell.history.length; i++) {
      output += `  ${String(i + 1).padStart(5)}  ${shell.history[i]}\n`;
    }
    return output.trimEnd() || null;
  });

  // fc
  shell.registerCommand('fc', (args) => {
    let listMode = false;
    let editor = shell.env.EDITOR || 'vim';
    let first = null, last = null;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-l') listMode = true;
      else if (args[i] === '-e' && args[i + 1]) editor = args[++i];
      else if (!isNaN(parseInt(args[i]))) {
        if (first === null) first = parseInt(args[i]);
        else last = parseInt(args[i]);
      }
    }

    if (listMode) {
      const start = first ? first - 1 : Math.max(0, shell.history.length - 16);
      const end = last ? last : shell.history.length;
      let output = '';
      for (let i = start; i < end && i < shell.history.length; i++) {
        output += `${String(i + 1).padStart(5)}  ${shell.history[i]}\n`;
      }
      return output.trimEnd() || null;
    }

    return `fc: editing not supported in browser environment`;
  });

  // return
  shell.registerCommand('return', (args) => {
    shell.lastExitCode = args[0] ? parseInt(args[0]) : 0;
    return null;
  });

  // exit / logout
  shell.registerCommand('exit', (args) => {
    const code = args[0] ? parseInt(args[0]) : 0;
    terminal._appendOutput(`exit`, 'command-output');
    terminal._appendOutput(`Process exited with code ${code}`, 'command-output');
    terminal.isProcessing = true;
    return null;
  });
  shell.registerCommand('logout', (args) => shell.commands['exit'](args));

  // break / continue (stubs)
  shell.registerCommand('break', () => { return 'break: only meaningful in a loop'; });
  shell.registerCommand('continue', () => { return 'continue: only meaningful in a loop'; });

  // ---------- 目录栈 ----------

  // pushd
  shell.registerCommand('pushd', (args) => {
    let target = args[0];

    if (!target || target === '+0') {
      // 交换栈顶两个目录
      if (shell.dirStack.length >= 2) {
        const top = shell.dirStack.pop();
        const second = shell.dirStack.pop();
        shell.dirStack.push(top);
        shell.dirStack.push(second);
        shell.cwd = second;
        shell.env.PWD = second;
      }
    } else if (target.startsWith('+')) {
      const n = parseInt(target.slice(1));
      if (n < shell.dirStack.length) {
        const dir = shell.dirStack.splice(shell.dirStack.length - 1 - n, 1)[0];
        shell.dirStack.push(dir);
        shell.cwd = dir;
        shell.env.PWD = dir;
      }
    } else if (target.startsWith('-')) {
      const n = parseInt(target.slice(1)) || 1;
      if (n < shell.dirStack.length) {
        const dir = shell.dirStack[shell.dirStack.length - 1 - n];
        shell.dirStack.push(dir);
        shell.cwd = dir;
        shell.env.PWD = dir;
      }
    } else {
      const newPath = shell.fs.resolvePath(shell.cwd, target);
      if (!shell.fs.isDir(newPath)) return `bash: pushd: ${target}: Not a directory`;
      shell.dirStack.push(newPath);
      shell.cwd = newPath;
      shell.env.PWD = newPath;
    }

    let output = '';
    for (let i = shell.dirStack.length - 1; i >= 0; i--) {
      output += shell.fs.displayPath(shell.dirStack[i], shell.homeDir) + ' ';
    }
    return output.trimEnd();
  });

  // popd
  shell.registerCommand('popd', (args) => {
    if (shell.dirStack.length <= 1) return 'bash: popd: directory stack empty';

    let target = args[0];

    if (!target) {
      shell.dirStack.pop();
      shell.cwd = shell.dirStack[shell.dirStack.length - 1];
      shell.env.PWD = shell.cwd;
    } else if (target.startsWith('+')) {
      const n = parseInt(target.slice(1));
      shell.dirStack.splice(shell.dirStack.length - 1 - n, 1);
    } else if (target.startsWith('-')) {
      const n = parseInt(target.slice(1));
      shell.dirStack.splice(n, 1);
    }

    let output = '';
    for (let i = shell.dirStack.length - 1; i >= 0; i--) {
      output += shell.fs.displayPath(shell.dirStack[i], shell.homeDir) + ' ';
    }
    return output.trimEnd() || null;
  });

  // dirs
  shell.registerCommand('dirs', (args) => {
    let output = '';
    if (args.includes('-v')) {
      for (let i = 0; i < shell.dirStack.length; i++) {
        output += ` ${i}  ${shell.fs.displayPath(shell.dirStack[i], shell.homeDir)}\n`;
      }
    } else if (args.includes('-p')) {
      for (let i = shell.dirStack.length - 1; i >= 0; i--) {
        output += shell.fs.displayPath(shell.dirStack[i], shell.homeDir) + '\n';
      }
    } else {
      for (let i = shell.dirStack.length - 1; i >= 0; i--) {
        output += shell.fs.displayPath(shell.dirStack[i], shell.homeDir) + ' ';
      }
    }
    return output.trimEnd();
  });

  // ---------- 任务控制 ----------

  // jobs
  shell.registerCommand('jobs', (args) => {
    if (shell.jobs.length === 0) return null;

    let output = '';
    for (const job of shell.jobs) {
      const status = job.status === 'running' ? 'Running' : 'Stopped';
      output += `[${job.id}]  ${status.padEnd(10)} ${job.command}\n`;
    }
    return output.trimEnd();
  });

  // bg
  shell.registerCommand('bg', (args) => {
    const jobId = args[0] ? parseInt(args[0].replace('%', '')) : shell.jobs.length;
    const job = shell.jobs.find(j => j.id === jobId);
    if (!job) return `bash: bg: job ${jobId} not found`;
    job.status = 'running';
    return `[${job.id}] ${job.command} &`;
  });

  // fg
  shell.registerCommand('fg', (args) => {
    const jobId = args[0] ? parseInt(args[0].replace('%', '')) : shell.jobs.length;
    const job = shell.jobs.find(j => j.id === jobId);
    if (!job) return `bash: fg: job ${jobId} not found`;
    shell.removeJob(job.id);
    return job.command;
  });

  // kill
  shell.registerCommand('kill', (args) => {
    let signal = 15; // SIGTERM
    const targets = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-l') {
        let output = '';
        for (const [num, name] of Object.entries(shell.signals)) {
          output += `${String(num).padStart(2)}) ${name}\n`;
        }
        return output.trimEnd();
      }
      if (args[i].startsWith('-')) {
        signal = parseInt(args[i].slice(1)) || signal;
      } else {
        targets.push(args[i]);
      }
    }

    if (targets.length === 0) return 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]';

    let output = '';
    for (const target of targets) {
      const id = parseInt(target.replace('%', ''));
      const job = shell.jobs.find(j => j.id === id || j.pid === id);

      if (job) {
        if (signal === 9 || signal === 15) {
          shell.removeJob(job.id);
        } else {
          job.status = 'stopped';
        }
      } else {
        output += `bash: kill: (${target}) - No such process\n`;
      }
    }
    return output.trimEnd() || null;
  });

  // disown
  shell.registerCommand('disown', (args) => {
    const jobId = args[0] ? parseInt(args[0].replace('%', '')) : shell.jobs.length;
    const idx = shell.jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return `bash: disown: job ${jobId} not found`;
    shell.jobs.splice(idx, 1);
    return null;
  });

  // wait
  shell.registerCommand('wait', (args) => {
    if (args.length === 0) {
      if (shell.jobs.length === 0) return null;
      return 'wait: no jobs running';
    }
    return null; // stub - returns immediately
  });

  // suspend
  shell.registerCommand('suspend', () => {
    return 'bash: suspend: cannot suspend login shell';
  });

  // ---------- 信号与陷阱 ----------

  // trap
  shell.registerCommand('trap', (args) => {
    if (args.length === 0 || (args[0] === '-p')) {
      let output = '';
      for (const [signal, handler] of Object.entries(shell.traps)) {
        output += `trap -- '${handler}' ${signal}\n`;
      }
      return output.trimEnd() || null;
    }

    const handler = args[0] === '-' ? '' : args[0];
    const signals = args.slice(1);

    for (const sig of signals) {
      if (handler === '') {
        delete shell.traps[sig];
      } else {
        shell.traps[sig] = handler;
      }
    }
    return null;
  });

  // times
  shell.registerCommand('times', () => {
    const user = (Math.random() * 10).toFixed(3);
    const sys = (Math.random() * 5).toFixed(3);
    return `${user}s ${sys}s\n${user}s ${sys}s`;
  });

  // ---------- 选项与限制 ----------

  // getopts
  shell.registerCommand('getopts', (args) => {
    if (args.length < 2) return 'getopts: usage: getopts optstring name [arg ...]';
    return null; // stub
  });

  // ulimit
  shell.registerCommand('ulimit', (args) => {
    const limits = {
      'core file size': 'unlimited',
      'data seg size': 'unlimited',
      'scheduling priority': '0',
      'file size': 'unlimited',
      'pending signals': '63456',
      'max locked memory': '65536',
      'max memory size': 'unlimited',
      'open files': '1024',
      'POSIX message queues': '819200',
      'real-time priority': '0',
      'stack size': '8192',
      'cpu time': 'unlimited',
      'max user processes': '63456',
      'virtual memory': 'unlimited',
      'file locks': 'unlimited',
    };

    let showAll = false;
    let limitName = null;

    for (const arg of args) {
      if (arg === '-a') showAll = true;
      else if (arg === '-H' || arg === '-S') { /* ignore hard/soft */ }
      else if (arg === '-c') limitName = 'core file size';
      else if (arg === '-d') limitName = 'data seg size';
      else if (arg === '-f') limitName = 'file size';
      else if (arg === '-l') limitName = 'max locked memory';
      else if (arg === '-m') limitName = 'max memory size';
      else if (arg === '-n') limitName = 'open files';
      else if (arg === '-s') limitName = 'stack size';
      else if (arg === '-t') limitName = 'cpu time';
      else if (arg === '-u') limitName = 'max user processes';
      else if (arg === '-v') limitName = 'virtual memory';
    }

    if (showAll || args.length === 0) {
      let output = '';
      for (const [name, val] of Object.entries(limits)) {
        output += `${name.padEnd(25)}${val}\n`;
      }
      return output.trimEnd();
    }

    if (limitName) {
      return limits[limitName] || 'unlimited';
    }

    return null;
  });

  // umask
  shell.registerCommand('umask', (args) => {
    if (args.length === 0) {
      return String(shell.umaskValue).padStart(4, '0').slice(-3);
    }

    if (args[0] === '-S') {
      const u = (shell.umaskValue >> 6) & 7;
      const g = (shell.umaskValue >> 3) & 7;
      const o = shell.umaskValue & 7;
      const perm = (v) => {
        let s = '';
        s += (v & 4) ? 'r' : '-';
        s += (v & 2) ? 'w' : '-';
        s += (v & 1) ? 'x' : '-';
        return s;
      };
      return `u=${perm(7 - u)},g=${perm(7 - g)},o=${perm(7 - o)}`;
    }

    const val = parseInt(args[0], 8);
    if (!isNaN(val)) {
      shell.umaskValue = val;
    }
    return null;
  });

  // ---------- I/O & 数组 ----------

  // mapfile / readarray
  shell.registerCommand('mapfile', (args) => {
    let delim = '\n';
    let count = null;
    let arrayName = 'MAPFILE';

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-d' && args[i + 1]) delim = args[++i];
      else if (args[i] === '-n' && args[i + 1]) count = parseInt(args[++i]);
      else if (args[i] === '-t') delim = '\n';
      else if (!args[i].startsWith('-')) arrayName = args[i];
    }

    shell.variables[`${arrayName}[0]`] = '(not implemented - requires stdin)';
    return null;
  });
  shell.registerCommand('readarray', (args, ctx) => shell.commands['mapfile'](args, ctx));

  // ---------- 有趣命令 ----------

  // sleep
  shell.registerCommand('sleep', async (args) => {
    if (args.length === 0) return 'sleep: missing operand';

    let seconds = parseFloat(args[0]);
    if (isNaN(seconds) || seconds < 0) return `sleep: invalid time interval '${args[0]}'`;

    // 支持后缀：s=秒, m=分, h=时, d=天
    const suffix = args[0].slice(-1);
    if (suffix === 'm') seconds *= 60;
    else if (suffix === 'h') seconds *= 3600;
    else if (suffix === 'd') seconds *= 86400;

    // 限制最大 30 秒
    seconds = Math.min(seconds, 30);

    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    return null;
  });

  // motd
  shell.registerCommand('motd', () => {
    return `
\x1b[1;36m╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ██╗███████╗       ██████╗ ███████╗                     ║
║   ██║██╔════╝      ██╔═══██╗██╔════╝                     ║
║   ██║███████╗█████╗██║   ██║███████╗                     ║
║   ██║╚════██║╚════╝██║   ██║╚════██║                     ║
║   ██║███████║      ╚██████╔╝███████║                     ║
║   ╚═╝╚══════╝       ╚═════╝ ╚══════╝                     ║
║                                                          ║
║   Welcome to OS-JS v0.1.0                                ║
║   A browser-based Linux terminal simulator               ║
║                                                          ║
║   🖥️  Simulated kernel: 0.1.0-browser                    ║
║   📁 File system: Virtual (JS object tree)               ║
║   🐚 Shell: bash-compatible (simplified)                 ║
║                                                          ║
║   Type 'help' for commands, 'fortune' for wisdom.        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝\x1b[0m`;
  });

  // banner
  shell.registerCommand('banner', (args) => {
    const text = args.join(' ') || 'OS-JS';
    const lines = ['', '', '', '', '', '', '', ''];

    const font = {
      'A': ['  ██  ', ' ████ ', '██  ██', '██████', '██  ██', '██  ██', '██  ██', '      '],
      'B': ['█████ ', '██  ██', '█████ ', '██  ██', '██  ██', '█████ ', '      ', '      '],
      'C': [' ████ ', '██  ██', '██    ', '██    ', '██  ██', ' ████ ', '      ', '      '],
      'D': ['████  ', '██ ██ ', '██  ██', '██  ██', '██ ██ ', '████  ', '      ', '      '],
      'E': ['██████', '██    ', '████  ', '██    ', '██    ', '██████', '      ', '      '],
      'F': ['██████', '██    ', '████  ', '██    ', '██    ', '██    ', '      ', '      '],
      'G': [' ████ ', '██    ', '██ ███', '██  ██', '██  ██', ' ████ ', '      ', '      '],
      'H': ['██  ██', '██  ██', '██████', '██  ██', '██  ██', '██  ██', '      ', '      '],
      'I': ['██████', '  ██  ', '  ██  ', '  ██  ', '  ██  ', '██████', '      ', '      '],
      'J': ['██████', '    ██', '    ██', '    ██', '██  ██', ' ████ ', '      ', '      '],
      'K': ['██  ██', '██ ██ ', '████  ', '██ ██ ', '██  ██', '██  ██', '      ', '      '],
      'L': ['██    ', '██    ', '██    ', '██    ', '██    ', '██████', '      ', '      '],
      'M': ['██  ██', '██████', '██████', '██  ██', '██  ██', '██  ██', '      ', '      '],
      'N': ['██  ██', '███ ██', '██████', '██ ███', '██  ██', '██  ██', '      ', '      '],
      'O': [' ████ ', '██  ██', '██  ██', '██  ██', '██  ██', ' ████ ', '      ', '      '],
      'P': ['█████ ', '██  ██', '█████ ', '██    ', '██    ', '██    ', '      ', '      '],
      'Q': [' ████ ', '██  ██', '██  ██', '██ ███', ' ████ ', '    ██', '      ', '      '],
      'R': ['█████ ', '██  ██', '█████ ', '██ ██ ', '██  ██', '██  ██', '      ', '      '],
      'S': [' ████ ', '██    ', ' ████ ', '    ██', '    ██', '█████ ', '      ', '      '],
      'T': ['██████', '  ██  ', '  ██  ', '  ██  ', '  ██  ', '  ██  ', '      ', '      '],
      'U': ['██  ██', '██  ██', '██  ██', '██  ██', '██  ██', ' ████ ', '      ', '      '],
      'V': ['██  ██', '██  ██', '██  ██', '██  ██', ' ████ ', '  ██  ', '      ', '      '],
      'W': ['██  ██', '██  ██', '██  ██', '██████', '██████', '██  ██', '      ', '      '],
      'X': ['██  ██', '██  ██', ' ████ ', ' ████ ', '██  ██', '██  ██', '      ', '      '],
      'Y': ['██  ██', '██  ██', ' ████ ', '  ██  ', '  ██  ', '  ██  ', '      ', '      '],
      'Z': ['██████', '   ██ ', '  ██  ', ' ██   ', '██    ', '██████', '      ', '      '],
      ' ': ['      ', '      ', '      ', '      ', '      ', '      ', '      ', '      '],
      '0': [' ████ ', '██  ██', '██ ██ ', '██████', '██  ██', ' ████ ', '      ', '      '],
      '1': ['  ██  ', ' ███  ', '  ██  ', '  ██  ', '  ██  ', '██████', '      ', '      '],
      '2': [' ████ ', '██  ██', '   ██ ', '  ██  ', ' ██   ', '██████', '      ', '      '],
      '3': [' ████ ', '██  ██', '   ██ ', '   ██ ', '██  ██', ' ████ ', '      ', '      '],
      '4': ['██  ██', '██  ██', '██████', '    ██', '    ██', '    ██', '      ', '      '],
      '5': ['██████', '██    ', '█████ ', '    ██', '    ██', '█████ ', '      ', '      '],
      '6': [' ████ ', '██    ', '█████ ', '██  ██', '██  ██', ' ████ ', '      ', '      '],
      '7': ['██████', '    ██', '   ██ ', '  ██  ', ' ██   ', ' ██   ', '      ', '      '],
      '8': [' ████ ', '██  ██', ' ████ ', '██  ██', '██  ██', ' ████ ', '      ', '      '],
      '9': [' ████ ', '██  ██', ' █████', '    ██', '    ██', ' ████ ', '      ', '      '],
      '-': ['      ', '      ', '██████', '      ', '      ', '      ', '      ', '      '],
      '.': ['      ', '      ', '      ', '      ', '      ', '  ██  ', '      ', '      '],
      '!': ['  ██  ', '  ██  ', '  ██  ', '  ██  ', '      ', '  ██  ', '      ', '      '],
      '?': [' ████ ', '██  ██', '   ██ ', '  ██  ', '      ', '  ██  ', '      ', '      '],
    };

    const upper = text.toUpperCase();
    for (const ch of upper) {
      const glyph = font[ch] || font[' '];
      for (let i = 0; i < 8; i++) {
        lines[i] += glyph[i] + ' ';
      }
    }

    return '\x1b[1;32m' + lines.join('\n') + '\x1b[0m';
  });

  // fortune
  shell.registerCommand('fortune', () => {
    const fortunes = [
      'The best way to predict the future is to invent it. - Alan Kay',
      'Talk is cheap. Show me the code. - Linus Torvalds',
      'Any sufficiently advanced technology is indistinguishable from magic. - Arthur C. Clarke',
      'First, solve the problem. Then, write the code. - John Johnson',
      'Programs must be written for people to read, and only incidentally for machines to execute. - Abelson & Sussman',
      'Simplicity is the soul of efficiency. - Austin Freeman',
      'Make it work, make it right, make it fast. - Kent Beck',
      'The most disastrous thing that you can ever learn is your first programming language. - Alan Kay',
      'There are only two hard things in Computer Science: cache invalidation and naming things. - Phil Karlton',
      'It works on my machine. - Every developer ever',
      'sudo make me a sandwich. - xkcd',
      'There is no place like 127.0.0.1.',
      'A SQL query walks into a bar, walks up to two tables and asks... "Can I join you?"',
      'In a world without fences, who needs Gates?',
      'The cloud is just someone else\'s computer.',
      'It\'s not a bug, it\'s a feature.',
      'Weeks of coding can save you hours of planning.',
      '99 little bugs in the code, 99 little bugs. Take one down, patch it around... 127 little bugs in the code.',
      'To understand recursion, you must first understand recursion.',
      'There are 10 types of people: those who understand binary and those who don\'t.',
    ];
    return '\x1b[33m' + fortunes[Math.floor(Math.random() * fortunes.length)] + '\x1b[0m';
  });

  // cal
  shell.registerCommand('cal', (args) => {
    const now = new Date();
    let month = now.getMonth();
    let year = now.getFullYear();

    if (args.length === 1) {
      const m = parseInt(args[0]);
      if (!isNaN(m) && m >= 1 && m <= 12) month = m - 1;
    } else if (args.length === 2) {
      const m = parseInt(args[0]);
      const y = parseInt(args[1]);
      if (!isNaN(m)) month = m - 1;
      if (!isNaN(y)) year = y;
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const title = `${monthNames[month]} ${year}`;
    const pad = Math.floor((20 - title.length) / 2);

    let output = ' '.repeat(pad) + '\x1b[1m' + title + '\x1b[0m\n';
    output += '\x1b[1mSu Mo Tu We Th Fr Sa\x1b[0m\n';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let line = '   '.repeat(firstDay);
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
        ? `\x1b[7m${String(d).padStart(2)}\x1b[0m`
        : String(d).padStart(2);
      line += dayStr + ' ';
      if ((firstDay + d) % 7 === 0) {
        output += line.trimEnd() + '\n';
        line = '';
      }
    }
    if (line.trimEnd()) output += line.trimEnd();

    return output;
  });

  // cowsay
  shell.registerCommand('cowsay', (args) => {
    const text = args.join(' ') || 'Moo!';
    const border = '-'.repeat(text.length + 2);
    return ` ${border}\n< ${text} >\n ${border}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`;
  });

  // rev
  shell.registerCommand('rev', (args, ctx, stdin) => {
    const text = stdin || args.join(' ') || '';
    return text.split('\n').map(l => l.split('').reverse().join('')).join('\n');
  });

  // yes
  shell.registerCommand('yes', (args) => {
    const text = args.join(' ') || 'y';
    return Array(20).fill(text).join('\n') + '\n... (truncated)';
  });

  // seq
  shell.registerCommand('seq', (args) => {
    let start = 1, end, step = 1;

    if (args.length === 1) {
      end = parseInt(args[0]);
    } else if (args.length === 2) {
      start = parseInt(args[0]);
      end = parseInt(args[1]);
    } else if (args.length >= 3) {
      start = parseInt(args[0]);
      step = parseInt(args[1]);
      end = parseInt(args[2]);
    } else {
      return 'seq: missing operand';
    }

    if (isNaN(start) || isNaN(end) || isNaN(step) || step === 0) {
      return 'seq: invalid arguments';
    }

    const result = [];
    if (step > 0) {
      for (let i = start; i <= end; i += step) result.push(String(i));
    } else {
      for (let i = start; i >= end; i += step) result.push(String(i));
    }

    return result.join('\n');
  });

  // ========== 初始化 ==========
  // 重置 FS 按钮（调试用）
  window.resetOS = () => {
    fs.reset();
    location.reload();
  };

  // 显示欢迎信息
  terminal.showBanner();

  // 系统初始化日志（静默）
})();
