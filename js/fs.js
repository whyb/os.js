// js/fs.js
// ==============================
// 虚拟文件系统模块（修正版）
// ==============================

class VirtualFS {
  constructor() {
    const saved = localStorage.getItem('jsos-fs');
    if (saved) {
      try {
        this.root = JSON.parse(saved);
      } catch (e) {
        this.root = this._createDefaultFS();
      }
    } else {
      this.root = this._createDefaultFS();
    }
  }

  _createDefaultFS() {
    return {
      type: 'dir', name: '/', children: {
        home: {
          type: 'dir', name: 'home', children: {
            user: {
              type: 'dir', name: 'user', children: {
                documents: {
                  type: 'dir', name: 'documents', children: {
                    'readme.txt': {
                      type: 'file', name: 'readme.txt',
                      content: 'Welcome to OS-JS!\nThis is a simulated Linux environment.\nType "help" to see available commands.',
                      modified: Date.now()
                    },
                    'notes.txt': {
                      type: 'file', name: 'notes.txt',
                      content: 'TODO:\n- Learn more Linux commands\n- Build something cool\n- Have fun!',
                      modified: Date.now()
                    }
                  }
                },
                downloads: { type: 'dir', name: 'downloads', children: {} },
                projects: {
                  type: 'dir', name: 'projects', children: {
                    'hello.sh': {
                      type: 'file', name: 'hello.sh',
                      content: '#!/bin/bash\necho "Hello, World!"',
                      modified: Date.now()
                    }
                  }
                },
                '.bashrc': {
                  type: 'file', name: '.bashrc',
                  content: '# OS-JS Shell Configuration\nexport PS1="user@os-js:~$ "',
                  modified: Date.now()
                },
                '.profile': {
                  type: 'file', name: '.profile',
                  content: '# ~/.profile\nexport PATH="/usr/local/bin:/usr/bin:/bin"',
                  modified: Date.now()
                }
              }
            }
          }
        },
        etc: {
          type: 'dir', name: 'etc', children: {
            'hosts': { type: 'file', name: 'hosts', content: '127.0.0.1   localhost\n::1         localhost', modified: Date.now() },
            'hostname': { type: 'file', name: 'hostname', content: 'os-js', modified: Date.now() },
            'passwd': { type: 'file', name: 'passwd', content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash', modified: Date.now() },
            'shells': { type: 'file', name: 'shells', content: '/bin/bash\n/bin/sh', modified: Date.now() },
            'profile': { type: 'file', name: 'profile', content: '# /etc/profile\nexport PATH="/usr/local/bin:/usr/bin:/bin"', modified: Date.now() }
          }
        },
        bin: { type: 'dir', name: 'bin', children: {} },
        tmp: { type: 'dir', name: 'tmp', children: {} },
        var: {
          type: 'dir', name: 'var', children: {
            log: {
              type: 'dir', name: 'log', children: {
                'syslog': { type: 'file', name: 'syslog', content: '[INFO] OS-JS initialized.\n[INFO] File system mounted.\n[INFO] Shell ready.', modified: Date.now() }
              }
            },
            tmp: { type: 'dir', name: 'tmp', children: {} }
          }
        },
        usr: {
          type: 'dir', name: 'usr', children: {
            bin: { type: 'dir', name: 'bin', children: {} },
            lib: { type: 'dir', name: 'lib', children: {} },
            share: { type: 'dir', name: 'share', children: {} },
            local: {
              type: 'dir', name: 'local', children: {
                bin: { type: 'dir', name: 'bin', children: {} },
                lib: { type: 'dir', name: 'lib', children: {} }
              }
            }
          }
        },
        root: { type: 'dir', name: 'root', children: {} },
        dev: { type: 'dir', name: 'dev', children: {} },
        proc: { type: 'dir', name: 'proc', children: {} },
        opt: { type: 'dir', name: 'opt', children: {} }
      }
    };
  }

  save() {
    try {
      localStorage.setItem('jsos-fs', JSON.stringify(this.root));
    } catch (e) {
      console.warn('Failed to save FS:', e);
    }
  }

  // 路径拆分
  _splitPath(path) {
    return path.split('/').filter(seg => seg.length > 0);
  }

  // 解析路径（支持绝对/相对、.、..）
  resolvePath(currentPath, targetPath) {
    if (!targetPath) return currentPath;
    let segments;
    if (targetPath.startsWith('/')) {
      segments = this._splitPath(targetPath);
    } else {
      segments = this._splitPath(currentPath).concat(this._splitPath(targetPath));
    }
    const resolved = [];
    for (const seg of segments) {
      if (seg === '.') continue;
      else if (seg === '..') resolved.pop();
      else resolved.push(seg);
    }
    return '/' + resolved.join('/');
  }

  // 显示路径（~ 替换 home）
  displayPath(currentPath, homeDir) {
    if (currentPath === homeDir) return '~';
    if (currentPath.startsWith(homeDir + '/')) {
      return '~' + currentPath.slice(homeDir.length);
    }
    return currentPath;
  }

  // 根据绝对路径获取节点
  getNode(path) {
    if (path === '/') return this.root;
    const segments = this._splitPath(path);
    let current = this.root;
    for (const seg of segments) {
      if (!current || current.type !== 'dir' || !current.children) return null;
      current = current.children[seg];
      if (!current) return null;
    }
    return current;
  }

  // 获取父目录和目标名称
  getParentAndName(path) {
    const segments = this._splitPath(path);
    if (segments.length === 0) return { parent: null, name: '/' };
    const name = segments.pop();
    const parentPath = '/' + segments.join('/');
    return { parent: this.getNode(parentPath), name };
  }

  // 列出目录内容（名称数组）
  listDir(path) {
    const node = this.getNode(path);
    if (!node || node.type !== 'dir') return null;
    return Object.keys(node.children);
  }

  // 列出目录详细信息
  listDirDetailed(path) {
    const node = this.getNode(path);
    if (!node || node.type !== 'dir') return null;
    const entries = [];
    for (const [name, child] of Object.entries(node.children)) {
      entries.push({
        name, type: child.type,
        content: child.type === 'file' ? child.content : null,
        size: child.type === 'file' ? (child.content || '').length : 0,
        modified: child.modified || Date.now()
      });
    }
    return entries;
  }

  // 创建文件
  createFile(path, content = '') {
    const { parent, name } = this.getParentAndName(path);
    if (!parent || parent.type !== 'dir') return { success: false, error: 'No such directory' };
    if (parent.children[name]) {
      if (parent.children[name].type === 'dir') {
        return { success: false, error: `Cannot create file '${name}': Is a directory` };
      }
      parent.children[name].modified = Date.now();
      this.save();
      return { success: true };
    }
    parent.children[name] = { type: 'file', name, content, modified: Date.now() };
    this.save();
    return { success: true };
  }

  // 创建目录
  createDir(path) {
    const { parent, name } = this.getParentAndName(path);
    if (!parent || parent.type !== 'dir') return { success: false, error: 'No such directory' };
    if (parent.children[name]) return { success: false, error: `Cannot create directory '${name}': File exists` };
    parent.children[name] = { type: 'dir', name, children: {} };
    this.save();
    return { success: true };
  }

  // 递归创建目录（mkdir -p）
  createDirRecursive(path) {
    const segments = this._splitPath(path);
    let current = this.root;
    for (const seg of segments) {
      if (!current.children[seg]) {
        current.children[seg] = { type: 'dir', name: seg, children: {} };
      } else if (current.children[seg].type !== 'dir') {
        return { success: false, error: `Not a directory: ${seg}` };
      }
      current = current.children[seg];
    }
    this.save();
    return { success: true };
  }

  // 删除节点
  remove(path) {
    if (path === '/') return { success: false, error: 'Cannot remove root directory' };
    const { parent, name } = this.getParentAndName(path);
    if (!parent || parent.type !== 'dir') return { success: false, error: 'No such file or directory' };
    if (!parent.children[name]) return { success: false, error: `No such file or directory: ${name}` };
    const node = parent.children[name];
    if (node.type === 'dir' && Object.keys(node.children).length > 0) {
      return { success: false, error: `Directory not empty: ${name}` };
    }
    delete parent.children[name];
    this.save();
    return { success: true };
  }

  // 递归删除
  removeRecursive(path) {
    if (path === '/') return { success: false, error: 'Cannot remove root directory' };
    const { parent, name } = this.getParentAndName(path);
    if (!parent || parent.type !== 'dir') return { success: false, error: 'No such file or directory' };
    if (!parent.children[name]) return { success: false, error: `No such file or directory: ${name}` };
    delete parent.children[name];
    this.save();
    return { success: true };
  }

  // 读取文件
  readFile(path) {
    const node = this.getNode(path);
    if (!node) return { success: false, error: 'No such file or directory' };
    if (node.type === 'dir') return { success: false, error: `Is a directory: ${path}` };
    return { success: true, content: node.content };
  }

  // 写入文件
  writeFile(path, content) {
    const node = this.getNode(path);
    if (node) {
      if (node.type === 'dir') return { success: false, error: `Is a directory: ${path}` };
      node.content = content;
      node.modified = Date.now();
      this.save();
      return { success: true };
    }
    return this.createFile(path, content);
  }

  // 追加内容
  appendFile(path, content) {
    const node = this.getNode(path);
    if (node) {
      if (node.type === 'dir') return { success: false, error: `Is a directory: ${path}` };
      node.content = (node.content || '') + content;
      node.modified = Date.now();
      this.save();
      return { success: true };
    }
    return this.createFile(path, content);
  }

  // 检查是否存在
  exists(path) {
    return this.getNode(path) !== null;
  }

  // 检查是否是目录
  isDir(path) {
    const node = this.getNode(path);
    return node && node.type === 'dir';
  }

  // 检查是否是文件
  isFile(path) {
    const node = this.getNode(path);
    return node && node.type === 'file';
  }

  // 获取节点类型
  getNodeType(path) {
    const node = this.getNode(path);
    return node ? node.type : null;
  }

  // 复制节点（文件）
  copyFile(srcPath, destPath) {
    const srcNode = this.getNode(srcPath);
    if (!srcNode) return { success: false, error: `No such file: ${srcPath}` };
    if (srcNode.type === 'dir') return { success: false, error: `Is a directory: ${srcPath}` };
    return this.writeFile(destPath, srcNode.content || '');
  }

  // 移动/重命名
  move(srcPath, destPath) {
    const { parent: srcParent, name: srcName } = this.getParentAndName(srcPath);
    if (!srcParent || !srcParent.children[srcName]) {
      return { success: false, error: `No such file or directory: ${srcPath}` };
    }
    const node = srcParent.children[srcName];

    // 检查目标是否已存在
    const destNode = this.getNode(destPath);
    if (destNode && destNode.type === 'dir') {
      // 移动到目录内
      destNode.children[srcName] = node;
      node.name = srcName;
    } else {
      const { parent: destParent, name: destName } = this.getParentAndName(destPath);
      if (!destParent || destParent.type !== 'dir') {
        return { success: false, error: 'No such directory' };
      }
      destParent.children[destName] = node;
      node.name = destName;
    }

    delete srcParent.children[srcName];
    this.save();
    return { success: true };
  }

  // 统计目录/文件大小（递归）
  getSize(path) {
    const node = this.getNode(path);
    if (!node) return 0;
    if (node.type === 'file') return (node.content || '').length;
    let total = 0;
    for (const child of Object.values(node.children)) {
      total += this.getSize('/' + this._splitPath(path).concat(child.name).join('/'));
    }
    return total;
  }

  // 重置文件系统
  reset() {
    this.root = this._createDefaultFS();
    localStorage.removeItem('jsos-fs');
  }
}
