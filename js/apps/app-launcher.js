// js/apps/app-launcher.js
// ==============================
// 应用启动器 - 包含基础桌面应用
// ==============================

// 系统信息管理器 - 提供共享的硬件信息数据
class SystemInfo {
  static _instance = null;

  static getInstance() {
    if (!this._instance) {
      this._instance = new SystemInfo();
    }
    return this._instance;
  }

  constructor() {
    // 固定的硬件信息
    this.cpu = {
      model: 'Intel Core i7-12700K',
      cores: 12,
      threads: 20,
      baseSpeed: 3.6,
      maxSpeed: 5.0,
      cache: '25 MB'
    };

    this.gpu = {
      model: 'NVIDIA GeForce RTX 3070',
      vram: 8,
      vramType: 'GDDR6',
      driver: '535.129.03',
      cuda: '12.2'
    };

    this.memory = {
      total: 32,
      type: 'DDR5',
      speed: 4800,
      slots: 4,
      usedSlot: 2
    };

    this.disk = {
      model: 'Samsung 980 PRO NVMe',
      total: 1000,
      type: 'NVMe SSD',
      readSpeed: 7000,
      writeSpeed: 5000
    };

    this.os = {
      name: 'OS-JS',
      version: '0.1.0',
      kernel: '6.1.0-browser',
      arch: 'x86_64',
      desktop: 'KDE Plasma',
      hostname: 'osjs-desktop'
    };

    // 动态利用率 (会变化)
    this._cpuUsage = 25;
    this._gpuUsage = 15;
    this._memoryUsage = 45;
    this._diskUsage = 62;

    // 启动时间
    this._bootTime = Date.now() - Math.floor(Math.random() * 86400000);

    // 模拟进程
    this._processes = [
      { pid: 1, name: 'systemd', cpu: 0.1, mem: 12, user: 'root' },
      { pid: 234, name: 'Xorg', cpu: 2.3, mem: 156, user: 'root' },
      { pid: 456, name: 'kwin_x11', cpu: 5.2, mem: 234, user: 'user' },
      { pid: 678, name: 'plasmashell', cpu: 3.8, mem: 456, user: 'user' },
      { pid: 890, name: 'firefox', cpu: 12.5, mem: 1245, user: 'user' },
      { pid: 1023, name: 'konsole', cpu: 0.8, mem: 89, user: 'user' },
      { pid: 1145, name: 'dolphin', cpu: 0.3, mem: 67, user: 'user' },
      { pid: 1267, name: 'kate', cpu: 0.2, mem: 123, user: 'user' },
      { pid: 1389, name: 'pulseaudio', cpu: 1.2, mem: 34, user: 'user' },
      { pid: 1501, name: 'NetworkManager', cpu: 0.1, mem: 23, user: 'root' },
      { pid: 1623, name: 'dbus-daemon', cpu: 0.0, mem: 12, user: 'root' },
      { pid: 1745, name: 'systemd-journal', cpu: 0.2, mem: 45, user: 'root' },
      { pid: 1867, name: 'cupsd', cpu: 0.0, mem: 8, user: 'root' },
      { pid: 1989, name: 'sshd', cpu: 0.0, mem: 5, user: 'root' },
      { pid: 2101, name: 'osjs-shell', cpu: 1.5, mem: 67, user: 'user' }
    ];

    // 启动模拟更新
    this._startSimulation();
  }

  _startSimulation() {
    setInterval(() => {
      // 模拟 CPU 使用率波动
      this._cpuUsage = Math.max(5, Math.min(95,
        this._cpuUsage + (Math.random() - 0.5) * 10
      ));

      // 模拟 GPU 使用率波动
      this._gpuUsage = Math.max(2, Math.min(80,
        this._gpuUsage + (Math.random() - 0.5) * 8
      ));

      // 模拟内存使用率缓慢变化
      this._memoryUsage = Math.max(30, Math.min(85,
        this._memoryUsage + (Math.random() - 0.5) * 3
      ));

      // 更新进程 CPU 使用率
      this._processes.forEach(p => {
        if (p.name === 'firefox' || p.name === 'kwin_x11') {
          p.cpu = Math.max(0.1, p.cpu + (Math.random() - 0.5) * 2);
        }
      });
    }, 2000);
  }

  getCpuUsage() {
    return Math.round(this._cpuUsage * 10) / 10;
  }

  getGpuUsage() {
    return Math.round(this._gpuUsage * 10) / 10;
  }

  getMemoryUsage() {
    return Math.round(this._memoryUsage * 10) / 10;
  }

  getMemoryUsed() {
    return Math.round(this.memory.total * this._memoryUsage / 100 * 10) / 10;
  }

  getDiskUsage() {
    return this._diskUsage;
  }

  getDiskUsed() {
    return Math.round(this.disk.total * this._diskUsage / 100);
  }

  getUptime() {
    const ms = Date.now() - this._bootTime;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return {
      days,
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60,
      formatted: `${days}d ${hours % 24}h ${minutes % 60}m`
    };
  }

  getProcesses() {
    return [...this._processes];
  }

  getProcessCount() {
    return this._processes.length;
  }
}

// 通知管理器
class NotificationManager {
  static _instance = null;
  static _notifications = [];
  static _idCounter = 0;

  static getInstance() {
    if (!this._instance) {
      this._instance = new NotificationManager();
    }
    return this._instance;
  }

  static show(title, body, icon = '📢', duration = 5000) {
    const id = ++this._idCounter;
    const notification = {
      id,
      title,
      body,
      icon,
      time: new Date(),
      read: false
    };

    this._notifications.unshift(notification);

    // 创建弹出通知
    this._createToast(notification, duration);

    // 更新通知中心图标
    this._updateBadge();

    return id;
  }

  static _createToast(notification, duration) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 999999;
      width: 320px; background: rgba(47,47,47,0.95); backdrop-filter: blur(10px);
      border-radius: 8px; padding: 16px; color: white;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
    `;

    toast.innerHTML = `
      <div style="display:flex;gap:12px;">
        <span style="font-size:24px;">${notification.icon}</span>
        <div style="flex:1;">
          <div style="font-weight:500;font-size:13px;margin-bottom:4px;">${notification.title}</div>
          <div style="font-size:12px;opacity:0.8;">${notification.body}</div>
        </div>
        <button style="background:none;border:none;color:white;cursor:pointer;opacity:0.5;font-size:16px;">✕</button>
      </div>
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // 关闭按钮
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._removeToast(toast);
    });

    // 点击通知
    toast.addEventListener('click', () => {
      notification.read = true;
      this._updateBadge();
      this._removeToast(toast);
      this.openNotificationCenter();
    });

    // 自动关闭
    if (duration > 0) {
      setTimeout(() => this._removeToast(toast), duration);
    }

    // 发送系统通知（如果支持）
    this._sendSystemNotification(notification);
  }

  static _removeToast(toast) {
    toast.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }

  static _sendSystemNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon
      });
    }
  }

  static _updateBadge() {
    const badge = document.getElementById('notification-badge');
    const unread = this._notifications.filter(n => !n.read).length;
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
  }

  static getUnreadCount() {
    return this._notifications.filter(n => !n.read).length;
  }

  static getAll() {
    return [...this._notifications];
  }

  static markAllRead() {
    this._notifications.forEach(n => n.read = true);
    this._updateBadge();
  }

  static clearAll() {
    this._notifications = [];
    this._updateBadge();
  }

  static openNotificationCenter() {
    if (!window.wm) return;

    // 移除已有面板
    const existing = document.getElementById('notification-center');
    if (existing) {
      existing.remove();
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'notification-center';
    panel.style.cssText = `
      position: fixed; top: 0; right: 0; width: 360px; height: calc(100% - 48px);
      background: rgba(47,47,47,0.95); backdrop-filter: blur(10px);
      z-index: 10001; color: white; display: flex; flex-direction: column;
      box-shadow: -4px 0 16px rgba(0,0,0,0.3);
      animation: slideInRight 0.2s ease-out;
    `;

    const notifications = this.getAll();
    const unread = notifications.filter(n => !n.read).length;

    let listHtml = '';
    if (notifications.length === 0) {
      listHtml = `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0.5;">
          <span style="font-size:48px;margin-bottom:16px;">🔔</span>
          <div>No notifications</div>
        </div>
      `;
    } else {
      listHtml = `
        <div style="flex:1;overflow-y:auto;">
          ${notifications.map(n => `
            <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.1);${n.read ? 'opacity:0.6;' : ''}">
              <div style="display:flex;gap:10px;">
                <span style="font-size:20px;">${n.icon}</span>
                <div style="flex:1;">
                  <div style="font-weight:500;font-size:13px;">${n.title}</div>
                  <div style="font-size:12px;opacity:0.8;margin-top:2px;">${n.body}</div>
                  <div style="font-size:11px;opacity:0.5;margin-top:4px;">${this._formatTime(n.time)}</div>
                </div>
                ${!n.read ? '<div style="width:8px;height:8px;background:#3daee9;border-radius:50;margin-top:4px;"></div>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    panel.innerHTML = `
      <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-weight:500;">Notifications${unread > 0 ? ` (${unread})` : ''}</span>
        <div style="display:flex;gap:8px;">
          <button id="notif-mark-read" style="background:none;border:none;color:#3daee9;cursor:pointer;font-size:12px;">Mark all read</button>
          <button id="notif-clear" style="background:none;border:none;color:#3daee9;cursor:pointer;font-size:12px;">Clear all</button>
        </div>
      </div>
      ${listHtml}
    `;

    document.body.appendChild(panel);

    // 标记全部已读
    panel.querySelector('#notif-mark-read')?.addEventListener('click', () => {
      this.markAllRead();
      panel.remove();
      this.openNotificationCenter();
    });

    // 清除所有
    panel.querySelector('#notif-clear')?.addEventListener('click', () => {
      this.clearAll();
      panel.remove();
    });

    // 点击外部关闭
    const closeHandler = (e) => {
      if (!panel.contains(e.target) && !e.target.closest('#tray-notifications')) {
        panel.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  static _formatTime(date) {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
}

class AppLauncher {
  static wm = null;
  static systemInfo = SystemInfo.getInstance();
  static notifications = NotificationManager.getInstance();

  static init(wm) {
    this.wm = wm;

    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 显示欢迎通知
    setTimeout(() => {
      NotificationManager.show(
        'Welcome to OS-JS',
        'Your desktop environment is ready!',
        '🎉',
        3000
      );
    }, 1000);
  }

  // 打开文件管理器
  static openFileManager(path) {
    if (!this.wm) return;
    path = path || '/home/user';
    
    const win = this.wm.createWindow({
      title: 'File Manager - ' + path,
      icon: '📁',
      width: 720,
      height: 480,
      contentClass: 'file-manager',
      content: this._buildFileManagerUI(path),
    });
    
    this._setupFileManager(win, path);
    return win;
  }

  static _buildFileManagerUI(path) {
    return `
      <div class="fm-toolbar">
        <button onclick="AppLauncher._fmGoBack()">◀</button>
        <button onclick="AppLauncher._fmGoForward()">▶</button>
        <button onclick="AppLauncher._fmGoUp()">⬆</button>
        <input class="fm-pathbar" id="fm-path" value="${path}" readonly>
      </div>
      <div class="fm-list" id="fm-list"></div>
    `;
  }

  static _setupFileManager(win, path) {
    const list = win.content.querySelector('#fm-list');
    const pathBar = win.content.querySelector('#fm-path');
    
    const render = () => {
      const entries = window.fs.listDirDetailed(path);
      if (!entries) {
        list.innerHTML = '<div style="padding: 20px; color: #888;">Cannot access directory</div>';
        return;
      }
      
      // 按目录优先、名称排序
      entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      
      let html = '';
      for (const entry of entries) {
        const isDir = entry.type === 'dir';
        const icon = isDir ? '📁' : '📄';
        const size = isDir ? '-' : (entry.size || 0) + ' B';
        const date = new Date(entry.modified).toLocaleDateString();
        html += `
          <div class="fm-item" data-name="${entry.name}" data-type="${entry.type}">
            <span class="fm-icon">${icon}</span>
            <span class="fm-name">${entry.name}</span>
            <span class="fm-size">${size}</span>
            <span class="fm-date">${date}</span>
          </div>
        `;
      }
      list.innerHTML = html;
    };
    
    render();
    
    // 点击进入目录
    list.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.fm-item');
      if (!item) return;
      
      const name = item.dataset.name;
      const type = item.dataset.type;
      
      if (type === 'dir') {
        const newPath = path + '/' + name;
        // 更新窗口内容
        win.content.innerHTML = this._buildFileManagerUI(newPath);
        this._setupFileManager(win, newPath);
        win.element.querySelector('.window-title').textContent = 'File Manager - ' + newPath;
      } else {
        // 打开文件
        const fullPath = window.fs.resolvePath(path, name);
        const result = window.fs.readFile(fullPath);
        if (result.success) {
          this.openTextEditor(name, result.content);
        }
      }
    });
    
    // 存储当前路径用于导航
    win._fmPath = path;
  }

  static _fmGetActiveWin() {
    return window.wm ? window.wm.windows.find(w => w.content.querySelector('#fm-list')) : null;
  }

  static _fmGoBack() {
    const win = this._fmGetActiveWin();
    if (win && win._fmHistory && win._fmHistory.length > 0) {
      const prev = win._fmHistory.pop();
      win._fmForwardHistory = win._fmForwardHistory || [];
      win._fmForwardHistory.push(win._fmPath);
      this._navigateFM(win, prev);
    }
  }

  static _fmGoForward() {
    const win = this._fmGetActiveWin();
    if (win && win._fmForwardHistory && win._fmForwardHistory.length > 0) {
      const next = win._fmForwardHistory.pop();
      win._fmHistory = win._fmHistory || [];
      win._fmHistory.push(win._fmPath);
      this._navigateFM(win, next);
    }
  }

  static _fmGoUp() {
    const win = this._fmGetActiveWin();
    if (win && win._fmPath !== '/') {
      const parent = win._fmPath.substring(0, win._fmPath.lastIndexOf('/')) || '/';
      this._navigateFM(win, parent);
    }
  }

  static _navigateFM(win, newPath) {
    win.content.innerHTML = this._buildFileManagerUI(newPath);
    this._setupFileManager(win, newPath);
    win.element.querySelector('.window-title').textContent = 'File Manager - ' + newPath;
  }

  // 打开文本编辑器
  static openTextEditor(filename, content) {
    if (!this.wm) return;
    
    const title = filename || 'Untitled.txt';
    const win = this.wm.createWindow({
      title: 'Text Editor - ' + title,
      icon: '✏️',
      width: 700,
      height: 500,
      contentClass: 'text-editor',
      content: `<textarea id="editor-${Date.now()}">${this._escapeHtml(content || '')}</textarea>`,
    });
    
    return win;
  }

  // 打开终端 - 使用主 Shell（共享文件系统和状态）
  static openTerminal() {
    if (!this.wm) return;
    
    // 使用全局的主 Shell（来自 main.js）
    const mainShell = window.shell;
    
    const termUI = document.createElement('div');
    termUI.style.cssText = 'width:100%;height:100%;background:#1e1e1e;color:#0f0;font-family:monospace;font-size:13px;display:flex;flex-direction:column;';
    
    const output = document.createElement('div');
    output.style.cssText = 'flex:1;overflow-y:auto;padding:4px 8px;white-space:pre-wrap;';
    output.id = 'desktop-term-output-' + Date.now();
    termUI.appendChild(output);
    
    const inputLine = document.createElement('div');
    inputLine.style.cssText = 'display:flex;align-items:center;padding:4px 8px;background:#2d2d2d;border-radius:0 0 8px 8px;';
    
    const promptSpan = document.createElement('span');
    promptSpan.style.cssText = 'color:#0f0;white-space:pre;';
    promptSpan.textContent = mainShell.getPrompt();
    
    const input = document.createElement('input');
    input.type = 'text';
    input.style.cssText = 'flex:1;background:transparent;border:none;color:#0f0;outline:none;font-family:monospace;font-size:13px;caret-color:#0f0;';
    input.autocomplete = 'off';
    input.spellcheck = false;
    
    inputLine.appendChild(promptSpan);
    inputLine.appendChild(input);
    termUI.appendChild(inputLine);
    
    // 显示欢迎信息
    const bannerDiv = document.createElement('div');
    bannerDiv.style.cssText = 'color:#0f0;padding:8px;';
    bannerDiv.textContent = `OS-JS Terminal v0.1.0 (Desktop Mode)\nType "help" for available commands.\n`;
    output.appendChild(bannerDiv);
    
    // 存储历史状态
    let historyIndex = -1;
    let tempInput = '';

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = input.value;
        
        // 显示输入行
        const cmdLine = document.createElement('div');
        cmdLine.style.cssText = 'color:#0f0;';
        cmdLine.textContent = promptSpan.textContent + cmd;
        output.appendChild(cmdLine);
        
        input.value = '';
        historyIndex = -1;
        
        // 执行命令
        try {
          const result = await mainShell.execute(cmd);
          if (result !== null && result !== undefined) {
            const resultDiv = document.createElement('div');
            resultDiv.style.cssText = 'color:#ccc;';
            resultDiv.innerHTML = this._ansiToHtml(result);
            output.appendChild(resultDiv);
          }
        } catch (err) {
          const errDiv = document.createElement('div');
          errDiv.style.cssText = 'color:#f44;';
          errDiv.textContent = 'bash: ' + err.message;
          output.appendChild(errDiv);
        }
        
        promptSpan.textContent = mainShell.getPrompt();
        output.scrollTop = output.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (mainShell.history.length === 0) return;
        if (historyIndex === -1) {
          tempInput = input.value;
          historyIndex = mainShell.history.length - 1;
        } else if (historyIndex > 0) {
          historyIndex--;
        }
        input.value = mainShell.history[historyIndex];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex === -1) return;
        if (historyIndex < mainShell.history.length - 1) {
          historyIndex++;
          input.value = mainShell.history[historyIndex];
        } else {
          historyIndex = -1;
          input.value = tempInput;
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Tab 补全 - 简单实现
        const partial = input.value;
        const cmdNames = Object.keys(mainShell.commands);
        const matches = cmdNames.filter(n => n.startsWith(partial));
        if (matches.length === 1) {
          input.value = matches[0] + ' ';
        } else if (matches.length > 1) {
          const listDiv = document.createElement('div');
          listDiv.style.cssText = 'color:#888;padding:2px 8px;';
          listDiv.innerHTML = this._ansiToHtml(matches.join('  '));
          output.appendChild(listDiv);
          output.scrollTop = output.scrollHeight;
        }
      } else if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        input.value = '';
        const cancelDiv = document.createElement('div');
        cancelDiv.style.cssText = 'color:#888;';
        cancelDiv.textContent = '^C';
        output.appendChild(cancelDiv);
        output.scrollTop = output.scrollHeight;
      } else if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        output.innerHTML = '';
      }
    });

    // 自动聚焦
    setTimeout(() => {
      input.focus();
      input.click();
    }, 50);
    
    // 窗口获得焦点时自动聚焦输入
    const win = this.wm.createWindow({
      title: 'Terminal',
      icon: '💻',
      width: 800,
      height: 500,
      contentClass: 'terminal-app',
      content: termUI,
      onClose: (w) => {
        // cleanup
      }
    });
    
    // 窗口点击时聚焦输入
    win.element.addEventListener('mousedown', () => {
      setTimeout(() => input.focus(), 10);
    });
    
    return win;
  }

  // 打开 Firefox 浏览器
  static openBrowser(url) {
    if (!this.wm) return;
    
    const defaultUrl = url || 'https://www.wikipedia.org';
    const winId = 'browser-' + Date.now();
    
    const html = `
      <div style="display:flex;flex-direction:column;height:100%;background:#f0f0f0;">
        <div style="display:flex;align-items:center;gap:4px;padding:6px 8px;background:linear-gradient(to bottom,#f5f5f5,#e8e8e8);border-bottom:1px solid #c0c0c0;">
          <button id="${winId}-back" style="width:28px;height:28px;border:1px solid #c0c0c0;border-radius:3px;background:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" title="Back">◀</button>
          <button id="${winId}-forward" style="width:28px;height:28px;border:1px solid #c0c0c0;border-radius:3px;background:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" title="Forward">▶</button>
          <button id="${winId}-refresh" style="width:28px;height:28px;border:1px solid #c0c0c0;border-radius:3px;background:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" title="Refresh">⟳</button>
          <button id="${winId}-home" style="width:28px;height:28px;border:1px solid #c0c0c0;border-radius:3px;background:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" title="Home">🏠</button>
          <div style="flex:1;display:flex;align-items:center;gap:4px;padding:0 8px;">
            <span style="font-size:11px;color:#888;">🔒</span>
            <input id="${winId}-urlbar" type="text" value="${defaultUrl}" style="flex:1;padding:4px 8px;border:1px solid #c0c0c0;border-radius:16px;font-size:13px;outline:none;background:#fff;color:#333;">
          </div>
          <div style="display:flex;gap:2px;">
            <button id="${winId}-bookmark" style="width:28px;height:28px;border:none;background:transparent;cursor:pointer;font-size:14px;" title="Bookmark">⭐</button>
            <button id="${winId}-menu" style="width:28px;height:28px;border:none;background:transparent;cursor:pointer;font-size:16px;" title="Menu">☰</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:2px 12px;background:#e8e8e8;border-bottom:1px solid #d0d0d0;font-size:11px;color:#555;">
          <span style="cursor:pointer;" class="browser-tab active-tab" data-url="${defaultUrl}">New Tab</span>
        </div>
        <div style="flex:1;background:#fff;" id="${winId}-content">
          <iframe id="${winId}-iframe" src="${defaultUrl}" style="width:100%;height:100%;border:none;"></iframe>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:2px 12px;background:#e8e8e8;border-top:1px solid #d0d0d0;font-size:11px;color:#666;">
          <span id="${winId}-status">Done</span>
          <span>OS-JS Firefox</span>
        </div>
      </div>
    `;
    
    const win = this.wm.createWindow({
      title: 'Firefox',
      icon: '🦊',
      width: 960,
      height: 680,
      minWidth: 500,
      minHeight: 400,
      content: html,
    });
    
    // 设置浏览器逻辑
    setTimeout(() => this._setupBrowser(win, winId, defaultUrl), 50);
    
    return win;
  }

  static _setupBrowser(win, winId, defaultUrl) {
    const iframe = document.getElementById(winId + '-iframe');
    const urlbar = document.getElementById(winId + '-urlbar');
    const backBtn = document.getElementById(winId + '-back');
    const forwardBtn = document.getElementById(winId + '-forward');
    const refreshBtn = document.getElementById(winId + '-refresh');
    const homeBtn = document.getElementById(winId + '-home');
    const bookmarkBtn = document.getElementById(winId + '-bookmark');
    const menuBtn = document.getElementById(winId + '-menu');
    const statusEl = document.getElementById(winId + '-status');

    // 历史记录
    let history = [defaultUrl];
    let historyIndex = 0;
    let bookmarks = JSON.parse(localStorage.getItem('osjs-bookmarks') || '[]');

    // 更新按钮状态
    const updateNav = () => {
      backBtn.style.opacity = historyIndex > 0 ? '1' : '0.3';
      forwardBtn.style.opacity = historyIndex < history.length - 1 ? '1' : '0.3';
      if (urlbar) urlbar.value = iframe.src;
      // 更新书签按钮状态
      const isBookmarked = bookmarks.includes(iframe.src);
      bookmarkBtn.textContent = isBookmarked ? '⭐' : '☆';
      bookmarkBtn.title = isBookmarked ? 'Remove Bookmark' : 'Add Bookmark';
    };

    // 导航到 URL
    const navigate = (url) => {
      if (!url) return;

      // 添加协议前缀
      let finalUrl = url.trim();
      if (!finalUrl.match(/^https?:\/\//i)) {
        if (finalUrl.includes('.')) {
          finalUrl = 'https://' + finalUrl;
        } else {
          // 搜索
          finalUrl = 'https://www.google.com/search?q=' + encodeURIComponent(finalUrl);
        }
      }

      iframe.src = finalUrl;
      urlbar.value = finalUrl;

      // 更新历史
      if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
      }
      history.push(finalUrl);
      historyIndex = history.length - 1;

      statusEl.textContent = 'Loading...';
      updateNav();
    };

    // 事件绑定
    urlbar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigate(urlbar.value);
      }
    });

    backBtn.addEventListener('click', () => {
      if (historyIndex > 0) {
        historyIndex--;
        iframe.src = history[historyIndex];
        urlbar.value = history[historyIndex];
        updateNav();
      }
    });

    forwardBtn.addEventListener('click', () => {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        iframe.src = history[historyIndex];
        urlbar.value = history[historyIndex];
        updateNav();
      }
    });

    refreshBtn.addEventListener('click', () => {
      iframe.src = iframe.src;
      statusEl.textContent = 'Refreshing...';
    });

    homeBtn.addEventListener('click', () => {
      navigate('https://www.wikipedia.org');
    });

    // 书签功能
    bookmarkBtn.addEventListener('click', () => {
      const currentUrl = iframe.src;
      const index = bookmarks.indexOf(currentUrl);
      if (index >= 0) {
        bookmarks.splice(index, 1);
        statusEl.textContent = 'Bookmark removed';
      } else {
        bookmarks.push(currentUrl);
        statusEl.textContent = 'Bookmark added';
      }
      localStorage.setItem('osjs-bookmarks', JSON.stringify(bookmarks));
      updateNav();
    });

    // 菜单功能
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      // 移除已有菜单
      const existingMenu = document.getElementById(winId + '-menu-popup');
      if (existingMenu) {
        existingMenu.remove();
        return;
      }

      const menu = document.createElement('div');
      menu.id = winId + '-menu-popup';
      menu.style.cssText = `
        position: absolute; top: 40px; right: 8px; z-index: 10000;
        background: #fff; border: 1px solid #ccc; border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2); min-width: 180px;
        padding: 4px 0;
      `;

      const menuItems = [
        { icon: '📑', label: 'Bookmarks', action: () => this._showBookmarks(win, winId, bookmarks, navigate) },
        { icon: '📋', label: 'History', action: () => this._showHistory(win, winId, history, navigate) },
        { separator: true },
        { icon: '🔍', label: 'Find', action: () => {
          const query = prompt('Search in page:');
          if (query) {
            try { iframe.contentWindow.find(query); } catch(e) {}
          }
        }},
        { icon: '🖨️', label: 'Print', action: () => {
          try { iframe.contentWindow.print(); } catch(e) { alert('Cannot print due to cross-origin restrictions'); }
        }},
        { separator: true },
        { icon: 'ℹ️', label: 'About', action: () => {
          alert('OS-JS Firefox v0.1.0\nA simulated browser using iframe');
        }}
      ];

      for (const item of menuItems) {
        if (item.separator) {
          const sep = document.createElement('div');
          sep.style.cssText = 'height:1px;background:#e0e0e0;margin:4px 0;';
          menu.appendChild(sep);
          continue;
        }
        const el = document.createElement('div');
        el.style.cssText = `
          display:flex;align-items:center;gap:8px;padding:8px 12px;
          cursor:pointer;font-size:12px;color:#333;
        `;
        el.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`;
        el.addEventListener('mouseenter', () => el.style.background = '#e8f0fe');
        el.addEventListener('mouseleave', () => el.style.background = 'transparent');
        el.addEventListener('click', () => {
          menu.remove();
          item.action();
        });
        menu.appendChild(el);
      }

      // 定位到菜单按钮下方
      win.element.querySelector('.window-content').style.position = 'relative';
      win.element.querySelector('.window-content').appendChild(menu);

      // 点击其他地方关闭菜单
      const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 10);
    });

    // iframe 加载完成事件
    iframe.addEventListener('load', () => {
      try {
        urlbar.value = iframe.contentWindow.location.href || iframe.src;
        statusEl.textContent = 'Done';
      } catch(e) {
        // 跨域限制
        statusEl.textContent = 'Loaded';
      }
      updateNav();
    });

    // 聚焦 URL 栏快捷键
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        urlbar.focus();
        urlbar.select();
      }
    };
    document.addEventListener('keydown', handleKey);
    win.onClose = () => {
      document.removeEventListener('keydown', handleKey);
    };

    updateNav();
  }

  // 显示书签列表
  static _showBookmarks(win, winId, bookmarks, navigate) {
    const content = win.element.querySelector('.window-content');
    const iframe = document.getElementById(winId + '-iframe');
    const urlbar = document.getElementById(winId + '-urlbar');

    // 创建书签面板
    const panel = document.createElement('div');
    panel.style.cssText = `
      position:absolute;top:0;left:0;right:0;bottom:0;background:#fff;z-index:100;
      display:flex;flex-direction:column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display:flex;align-items:center;justify-content:space-between;
      padding:12px 16px;background:#f5f5f5;border-bottom:1px solid #ddd;
    `;
    header.innerHTML = `
      <span style="font-weight:500;">📑 Bookmarks</span>
      <button style="padding:4px 12px;border:1px solid #ccc;background:#fff;border-radius:4px;cursor:pointer;">Close</button>
    `;
    header.querySelector('button').addEventListener('click', () => panel.remove());
    panel.appendChild(header);

    const list = document.createElement('div');
    list.style.cssText = 'flex:1;overflow:auto;padding:8px;';

    if (bookmarks.length === 0) {
      list.innerHTML = '<div style="padding:20px;color:#888;text-align:center;">No bookmarks yet</div>';
    } else {
      for (const url of bookmarks) {
        const item = document.createElement('div');
        item.style.cssText = `
          display:flex;align-items:center;gap:8px;padding:8px 12px;
          cursor:pointer;border-bottom:1px solid #f0f0f0;
        `;
        item.innerHTML = `<span>⭐</span><span style="flex:1;font-size:12px;color:#1a0dab;word-break:break-all;">${url}</span>`;
        item.addEventListener('click', () => {
          panel.remove();
          navigate(url);
        });
        list.appendChild(item);
      }
    }
    panel.appendChild(list);
    content.appendChild(panel);
  }

  // 显示历史记录
  static _showHistory(win, winId, history, navigate) {
    const content = win.element.querySelector('.window-content');

    const panel = document.createElement('div');
    panel.style.cssText = `
      position:absolute;top:0;left:0;right:0;bottom:0;background:#fff;z-index:100;
      display:flex;flex-direction:column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display:flex;align-items:center;justify-content:space-between;
      padding:12px 16px;background:#f5f5f5;border-bottom:1px solid #ddd;
    `;
    header.innerHTML = `
      <span style="font-weight:500;">📋 History</span>
      <button style="padding:4px 12px;border:1px solid #ccc;background:#fff;border-radius:4px;cursor:pointer;">Close</button>
    `;
    header.querySelector('button').addEventListener('click', () => panel.remove());
    panel.appendChild(header);

    const list = document.createElement('div');
    list.style.cssText = 'flex:1;overflow:auto;padding:8px;';

    const uniqueHistory = [...new Set(history)].reverse();
    for (const url of uniqueHistory) {
      const item = document.createElement('div');
      item.style.cssText = `
        display:flex;align-items:center;gap:8px;padding:8px 12px;
        cursor:pointer;border-bottom:1px solid #f0f0f0;
      `;
      item.innerHTML = `<span>🕐</span><span style="flex:1;font-size:12px;color:#1a0dab;word-break:break-all;">${url}</span>`;
      item.addEventListener('click', () => {
        panel.remove();
        navigate(url);
      });
      list.appendChild(item);
    }
    panel.appendChild(list);
    content.appendChild(panel);
  }

  // 打开计算器
  static openCalculator() {
    if (!this.wm) return;

    const win = this.wm.createWindow({
      title: 'Calculator',
      icon: '🔢',
      width: 320,
      height: 450,
      minWidth: 280,
      minHeight: 400,
      content: `
        <div style="display:flex;flex-direction:column;height:100%;background:#f5f5f5;">
          <div id="calc-display" style="padding:16px;background:#fff;border-bottom:1px solid #ddd;text-align:right;">
            <div id="calc-history" style="font-size:12px;color:#888;height:18px;overflow:hidden;"></div>
            <div id="calc-result" style="font-size:32px;font-weight:300;padding:8px 0;">0</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;padding:1px;flex:1;">
            <button class="calc-btn calc-func" data-action="clear">C</button>
            <button class="calc-btn calc-func" data-action="toggle-sign">±</button>
            <button class="calc-btn calc-func" data-action="percent">%</button>
            <button class="calc-btn calc-op" data-action="operator" data-value="/">÷</button>

            <button class="calc-btn calc-num" data-action="number" data-value="7">7</button>
            <button class="calc-btn calc-num" data-action="number" data-value="8">8</button>
            <button class="calc-btn calc-num" data-action="number" data-value="9">9</button>
            <button class="calc-btn calc-op" data-action="operator" data-value="*">×</button>

            <button class="calc-btn calc-num" data-action="number" data-value="4">4</button>
            <button class="calc-btn calc-num" data-action="number" data-value="5">5</button>
            <button class="calc-btn calc-num" data-action="number" data-value="6">6</button>
            <button class="calc-btn calc-op" data-action="operator" data-value="-">−</button>

            <button class="calc-btn calc-num" data-action="number" data-value="1">1</button>
            <button class="calc-btn calc-num" data-action="number" data-value="2">2</button>
            <button class="calc-btn calc-num" data-action="number" data-value="3">3</button>
            <button class="calc-btn calc-op" data-action="operator" data-value="+">+</button>

            <button class="calc-btn calc-num calc-zero" data-action="number" data-value="0">0</button>
            <button class="calc-btn calc-num" data-action="decimal">.</button>
            <button class="calc-btn calc-equals" data-action="equals">=</button>
          </div>
        </div>
        <style>
          .calc-btn {
            border: none;
            cursor: pointer;
            font-size: 18px;
            transition: background 0.1s;
            outline: none;
          }
          .calc-btn:active { background: #ddd !important; }
          .calc-num { background: #fff; color: #333; }
          .calc-num:hover { background: #f0f0f0; }
          .calc-func { background: #e0e0e0; color: #333; }
          .calc-func:hover { background: #d0d0d0; }
          .calc-op { background: #ff9500; color: #fff; }
          .calc-op:hover { background: #ff8000; }
          .calc-op.active { background: #fff; color: #ff9500; }
          .calc-equals { background: #ff9500; color: #fff; }
          .calc-equals:hover { background: #ff8000; }
          .calc-zero { grid-column: span 2; }
        </style>
      `
    });

    // 计算器逻辑
    const display = win.element.querySelector('#calc-result');
    const history = win.element.querySelector('#calc-history');
    const buttons = win.element.querySelectorAll('.calc-btn');

    let currentValue = '0';
    let previousValue = null;
    let operator = null;
    let waitingForOperand = false;

    const updateDisplay = () => {
      display.textContent = currentValue;
      const fontSize = currentValue.length > 10 ? '20px' : currentValue.length > 7 ? '24px' : '32px';
      display.style.fontSize = fontSize;
    };

    const handleNumber = (num) => {
      if (waitingForOperand) {
        currentValue = num;
        waitingForOperand = false;
      } else {
        currentValue = currentValue === '0' ? num : currentValue + num;
      }
      updateDisplay();
    };

    const handleOperator = (op) => {
      const value = parseFloat(currentValue);

      if (previousValue !== null && !waitingForOperand) {
        const result = calculate(previousValue, value, operator);
        currentValue = String(result);
        updateDisplay();
      }

      previousValue = parseFloat(currentValue);
      operator = op;
      waitingForOperand = true;

      history.textContent = `${previousValue} ${getOperatorSymbol(op)}`;

      // 高亮操作符按钮
      buttons.forEach(btn => btn.classList.remove('active'));
      const opBtn = win.element.querySelector(`[data-value="${op}"]`);
      if (opBtn) opBtn.classList.add('active');
    };

    const calculate = (a, b, op) => {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b !== 0 ? a / b : 'Error';
        default: return b;
      }
    };

    const getOperatorSymbol = (op) => {
      const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
      return symbols[op] || op;
    };

    const handleEquals = () => {
      if (previousValue === null || operator === null) return;

      const value = parseFloat(currentValue);
      const result = calculate(previousValue, value, operator);

      history.textContent = `${previousValue} ${getOperatorSymbol(operator)} ${value} =`;
      currentValue = String(result);
      previousValue = null;
      operator = null;
      waitingForOperand = true;

      buttons.forEach(btn => btn.classList.remove('active'));
      updateDisplay();
    };

    const handleClear = () => {
      currentValue = '0';
      previousValue = null;
      operator = null;
      waitingForOperand = false;
      history.textContent = '';
      buttons.forEach(btn => btn.classList.remove('active'));
      updateDisplay();
    };

    const handleToggleSign = () => {
      currentValue = String(-parseFloat(currentValue));
      updateDisplay();
    };

    const handlePercent = () => {
      currentValue = String(parseFloat(currentValue) / 100);
      updateDisplay();
    };

    const handleDecimal = () => {
      if (waitingForOperand) {
        currentValue = '0.';
        waitingForOperand = false;
      } else if (!currentValue.includes('.')) {
        currentValue += '.';
      }
      updateDisplay();
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const value = btn.dataset.value;

        switch (action) {
          case 'number': handleNumber(value); break;
          case 'operator': handleOperator(value); break;
          case 'equals': handleEquals(); break;
          case 'clear': handleClear(); break;
          case 'toggle-sign': handleToggleSign(); break;
          case 'percent': handlePercent(); break;
          case 'decimal': handleDecimal(); break;
        }
      });
    });

    return win;
  }

  // 打开剪贴板管理器
  static openClipboardManager() {
    if (!this.wm) return;

    // 模拟剪贴板历史
    const clipboardHistory = [
      { text: 'Hello World', time: '2 minutes ago', app: 'Terminal' },
      { text: 'https://github.com/whyb/os.js', time: '5 minutes ago', app: 'Firefox' },
      { text: 'const x = 42;', time: '10 minutes ago', app: 'Text Editor' },
      { text: '/home/user/documents', time: '15 minutes ago', app: 'File Manager' },
      { text: 'OS-JS Desktop Environment', time: '20 minutes ago', app: 'Settings' },
    ];

    const win = this.wm.createWindow({
      title: 'Clipboard Manager',
      icon: '📋',
      width: 400,
      height: 400,
      content: `
        <div style="display:flex;flex-direction:column;height:100%;">
          <div style="padding:12px;background:#f5f5f5;border-bottom:1px solid #ddd;">
            <input type="text" placeholder="Search clipboard..." style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:4px;font-size:13px;outline:none;box-sizing:border-box;">
          </div>
          <div id="clipboard-list" style="flex:1;overflow:auto;"></div>
          <div style="padding:8px;background:#f5f5f5;border-top:1px solid #ddd;display:flex;justify-content:space-between;">
            <button style="padding:6px 12px;border:1px solid #ccc;background:#fff;border-radius:4px;cursor:pointer;font-size:12px;">Clear All</button>
            <span style="font-size:11px;color:#888;line-height:28px;">${clipboardHistory.length} items</span>
          </div>
        </div>
      `
    });

    const list = win.element.querySelector('#clipboard-list');
    const search = win.element.querySelector('input');

    const renderList = (filter = '') => {
      const filtered = filter
        ? clipboardHistory.filter(item => item.text.toLowerCase().includes(filter.toLowerCase()))
        : clipboardHistory;

      if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No clipboard items</div>';
        return;
      }

      list.innerHTML = filtered.map((item, index) => `
        <div style="padding:12px;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.1s;"
             onmouseenter="this.style.background='#f0f7ff'"
             onmouseleave="this.style.background='transparent'"
             data-index="${index}">
          <div style="font-size:13px;word-break:break-all;margin-bottom:4px;">${this._escapeHtml(item.text.substring(0, 100))}${item.text.length > 100 ? '...' : ''}</div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#888;">
            <span>${item.app}</span>
            <span>${item.time}</span>
          </div>
        </div>
      `).join('');

      // 点击复制
      list.querySelectorAll('[data-index]').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.index);
          const text = clipboardHistory[idx].text;
          navigator.clipboard.writeText(text).then(() => {
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:10px 20px;border-radius:8px;font-size:13px;z-index:99999;';
            toast.textContent = 'Copied to clipboard!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
          });
        });
      });
    };

    renderList();

    search.addEventListener('input', () => renderList(search.value));

    return win;
  }

  // 显示电源菜单
  static showPowerMenu() {
    // 移除已有菜单
    const existing = document.getElementById('power-menu');
    if (existing) {
      existing.remove();
      return;
    }

    const menu = document.createElement('div');
    menu.id = 'power-menu';
    menu.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 999999;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s;
    `;

    menu.innerHTML = `
      <div style="background:rgba(47,47,47,0.95);backdrop-filter:blur(10px);border-radius:12px;padding:24px;min-width:300px;text-align:center;">
        <div style="font-size:16px;font-weight:500;color:white;margin-bottom:20px;">Power Options</div>
        <div style="display:flex;justify-content:center;gap:16px;">
          <button class="power-option" data-action="lock" style="
            display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 24px;
            background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;color:white;
            transition:background 0.2s;
          ">
            <span style="font-size:32px;">🔒</span>
            <span style="font-size:12px;">Lock</span>
          </button>
          <button class="power-option" data-action="logout" style="
            display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 24px;
            background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;color:white;
            transition:background 0.2s;
          ">
            <span style="font-size:32px;">👤</span>
            <span style="font-size:12px;">Logout</span>
          </button>
          <button class="power-option" data-action="restart" style="
            display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 24px;
            background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;color:white;
            transition:background 0.2s;
          ">
            <span style="font-size:32px;">🔄</span>
            <span style="font-size:12px;">Restart</span>
          </button>
          <button class="power-option" data-action="shutdown" style="
            display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 24px;
            background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;color:white;
            transition:background 0.2s;
          ">
            <span style="font-size:32px;">⏻</span>
            <span style="font-size:12px;">Shutdown</span>
          </button>
        </div>
        <button id="power-cancel" style="margin-top:20px;padding:8px 24px;background:transparent;border:1px solid rgba(255,255,255,0.3);color:white;border-radius:4px;cursor:pointer;font-size:12px;">Cancel</button>
      </div>
      <style>
        .power-option:hover { background: rgba(255,255,255,0.2) !important; }
      </style>
    `;

    document.body.appendChild(menu);

    // 事件处理
    menu.querySelectorAll('.power-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        menu.remove();

        switch (action) {
          case 'lock':
            if (window.wm) window.wm._lockScreen();
            break;
          case 'logout':
            this._showShutdownScreen('Logging out...', () => {
              location.reload();
            });
            break;
          case 'restart':
            this._showShutdownScreen('Restarting...', () => {
              location.reload();
            });
            break;
          case 'shutdown':
            this._showShutdownScreen('Shutting down...', () => {
              document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#888;font-size:14px;">System halted. You can close this window.</div>';
            });
            break;
        }
      });
    });

    menu.querySelector('#power-cancel').addEventListener('click', () => menu.remove());
    menu.addEventListener('click', (e) => {
      if (e.target === menu) menu.remove();
    });
  }

  static _showShutdownScreen(message, callback) {
    const screen = document.createElement('div');
    screen.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #000; z-index: 9999999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: white;
    `;

    screen.innerHTML = `
      <div style="font-size:48px;margin-bottom:24px;">⏻</div>
      <div style="font-size:18px;margin-bottom:16px;">${message}</div>
      <div style="width:200px;height:4px;background:#333;border-radius:2px;overflow:hidden;">
        <div id="shutdown-progress" style="width:0%;height:100%;background:#3daee9;transition:width 0.3s;"></div>
      </div>
    `;

    document.body.appendChild(screen);

    const progress = screen.querySelector('#shutdown-progress');
    let percent = 0;
    const interval = setInterval(() => {
      percent += Math.random() * 15 + 5;
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        setTimeout(() => {
          screen.remove();
          if (callback) callback();
        }, 500);
      }
      progress.style.width = percent + '%';
    }, 200);
  }

  // 截图工具
  static openScreenshot() {
    if (!this.wm) return;

    const win = this.wm.createWindow({
      title: 'Screenshot',
      icon: '📸',
      width: 400,
      height: 350,
      content: `
        <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">
          <div style="text-align:center;">
            <span style="font-size:48px;">📸</span>
            <h3 style="margin:12px 0 4px;">Screenshot Tool</h3>
            <p style="color:#888;font-size:12px;">Capture your screen</p>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            <button id="ss-fullscreen" style="padding:12px;background:#3daee9;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🖥️</span> Full Screen
            </button>
            <button id="ss-window" style="padding:12px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🪟</span> Current Window
            </button>
            <button id="ss-area" style="padding:12px;background:#FF9800;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>✂️</span> Select Area
            </button>
          </div>

          <div style="border-top:1px solid #eee;padding-top:12px;">
            <div style="font-size:11px;color:#888;margin-bottom:8px;">Delay</div>
            <div style="display:flex;gap:8px;">
              <button class="ss-delay active" data-delay="0" style="flex:1;padding:6px;border:1px solid #ccc;background:#3daee9;color:white;border-radius:4px;cursor:pointer;font-size:12px;">None</button>
              <button class="ss-delay" data-delay="3" style="flex:1;padding:6px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;font-size:12px;">3s</button>
              <button class="ss-delay" data-delay="5" style="flex:1;padding:6px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;font-size:12px;">5s</button>
              <button class="ss-delay" data-delay="10" style="flex:1;padding:6px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;font-size:12px;">10s</button>
            </div>
          </div>

          <div id="ss-status" style="text-align:center;font-size:12px;color:#888;min-height:18px;"></div>
        </div>
      `
    });

    let delay = 0;

    // 延迟按钮
    win.element.querySelectorAll('.ss-delay').forEach(btn => {
      btn.addEventListener('click', () => {
        win.element.querySelectorAll('.ss-delay').forEach(b => {
          b.style.background = 'white';
          b.style.color = '#333';
        });
        btn.style.background = '#3daee9';
        btn.style.color = 'white';
        delay = parseInt(btn.dataset.delay);
      });
    });

    const status = win.element.querySelector('#ss-status');
    const captureBtns = {
      'ss-fullscreen': 'Full Screen',
      'ss-window': 'Current Window',
      'ss-area': 'Select Area'
    };

    Object.entries(captureBtns).forEach(([id, type]) => {
      win.element.querySelector(`#${id}`).addEventListener('click', () => {
        const takeScreenshot = () => {
          status.textContent = 'Capturing...';

          // 模拟截图
          setTimeout(() => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screenshot-${timestamp}.png`;

            // 创建模拟截图
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');

            // 绘制模拟截图
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, 800, 600);
            ctx.fillStyle = '#3daee9';
            ctx.fillRect(0, 0, 800, 32);
            ctx.fillStyle = 'white';
            ctx.font = '14px sans-serif';
            ctx.fillText('OS-JS Desktop', 10, 22);
            ctx.fillStyle = '#888';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Screenshot captured`, 400, 300);
            ctx.font = '14px sans-serif';
            ctx.fillText(`${type} - ${new Date().toLocaleString()}`, 400, 330);

            // 保存到文件系统
            const dataUrl = canvas.toDataURL('image/png');
            if (window.fs) {
              window.fs.createFile(`/home/user/pictures/${filename}`, '[PNG Image Data]');
            }

            status.innerHTML = `
              <span style="color:#4CAF50;">✓ Screenshot saved!</span><br>
              <span style="font-size:11px;">~/pictures/${filename}</span>
            `;

            NotificationManager.show(
              'Screenshot Captured',
              `Saved as ${filename}`,
              '📸',
              3000
            );
          }, 500);
        };

        if (delay > 0) {
          let countdown = delay;
          status.textContent = `Taking screenshot in ${countdown}...`;
          const interval = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
              clearInterval(interval);
              takeScreenshot();
            } else {
              status.textContent = `Taking screenshot in ${countdown}...`;
            }
          }, 1000);
        } else {
          takeScreenshot();
        }
      });
    });

    return win;
  }

  // 图片查看器
  static openImageViewer(imagePath) {
    if (!this.wm) return;

    // 默认显示示例图片
    const defaultContent = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#1e1e1e;color:white;">
        <span style="font-size:64px;margin-bottom:16px;">🖼️</span>
        <div style="font-size:16px;margin-bottom:8px;">Image Viewer</div>
        <div style="font-size:12px;color:#888;">Open an image file to view</div>
        <div style="margin-top:20px;padding:12px;background:rgba(255,255,255,0.1);border-radius:8px;font-size:11px;color:#888;">
          Supported formats: PNG, JPG, GIF, BMP, SVG
        </div>
      </div>
    `;

    const win = this.wm.createWindow({
      title: 'Image Viewer',
      icon: '🖼️',
      width: 700,
      height: 500,
      contentClass: 'image-viewer',
      content: defaultContent
    });

    return win;
  }

  // 回收站
  static openTrash() {
    if (!this.wm) return;

    // 模拟回收站内容
    const trashItems = [
      { name: 'old-document.txt', original: '/home/user/documents/', deleted: '2 hours ago', size: '2.4 KB' },
      { name: 'temp-image.png', original: '/home/user/pictures/', deleted: '1 day ago', size: '156 KB' },
      { name: 'backup.sh', original: '/home/user/scripts/', deleted: '3 days ago', size: '890 B' },
    ];

    const win = this.wm.createWindow({
      title: 'Trash',
      icon: '🗑️',
      width: 600,
      height: 400,
      content: `
        <div style="display:flex;flex-direction:column;height:100%;">
          <div style="padding:12px 16px;background:#f5f5f5;border-bottom:1px solid #ddd;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:20px;">🗑️</span>
              <span style="font-weight:500;">Trash</span>
              <span style="font-size:12px;color:#888;">(${trashItems.length} items)</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button id="trash-restore-all" style="padding:6px 12px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;font-size:12px;">Restore All</button>
              <button id="trash-empty" style="padding:6px 12px;border:1px solid #f44;background:white;color:#f44;border-radius:4px;cursor:pointer;font-size:12px;">Empty Trash</button>
            </div>
          </div>
          <div id="trash-list" style="flex:1;overflow:auto;">
            ${trashItems.length === 0 ? `
              <div style="padding:40px;text-align:center;color:#888;">
                <span style="font-size:48px;">🗑️</span>
                <div style="margin-top:12px;">Trash is empty</div>
              </div>
            ` : trashItems.map((item, i) => `
              <div class="trash-item" data-index="${i}" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.1s;"
                   onmouseenter="this.style.background='#f0f7ff'"
                   onmouseleave="this.style.background='transparent'">
                <span style="font-size:24px;">📄</span>
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:500;">${item.name}</div>
                  <div style="font-size:11px;color:#888;">From: ${item.original}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:12px;">${item.size}</div>
                  <div style="font-size:11px;color:#888;">${item.deleted}</div>
                </div>
                <button class="trash-restore" data-index="${i}" style="padding:4px 8px;border:1px solid #ccc;background:white;border-radius:3px;cursor:pointer;font-size:11px;" title="Restore">♻️</button>
                <button class="trash-delete" data-index="${i}" style="padding:4px 8px;border:1px solid #f44;background:white;border-radius:3px;cursor:pointer;font-size:11px;color:#f44;" title="Delete permanently">✕</button>
              </div>
            `).join('')}
          </div>
        </div>
      `
    });

    const list = win.element.querySelector('#trash-list');

    // 恢复单个文件
    list.querySelectorAll('.trash-restore').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        const item = trashItems[idx];
        btn.closest('.trash-item').remove();
        NotificationManager.show('File Restored', `${item.name} restored to ${item.original}`, '♻️');
      });
    });

    // 删除单个文件
    list.querySelectorAll('.trash-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        const item = trashItems[idx];
        if (confirm(`Permanently delete "${item.name}"?`)) {
          btn.closest('.trash-item').remove();
          NotificationManager.show('File Deleted', `${item.name} permanently deleted`, '🗑️');
        }
      });
    });

    // 恢复所有
    win.element.querySelector('#trash-restore-all')?.addEventListener('click', () => {
      list.innerHTML = `
        <div style="padding:40px;text-align:center;color:#888;">
          <span style="font-size:48px;">🗑️</span>
          <div style="margin-top:12px;">Trash is empty</div>
        </div>
      `;
      NotificationManager.show('Trash Emptied', 'All files restored', '♻️');
    });

    // 清空回收站
    win.element.querySelector('#trash-empty')?.addEventListener('click', () => {
      if (confirm('Permanently delete all items in Trash?')) {
        list.innerHTML = `
          <div style="padding:40px;text-align:center;color:#888;">
            <span style="font-size:48px;">🗑️</span>
            <div style="margin-top:12px;">Trash is empty</div>
          </div>
        `;
        NotificationManager.show('Trash Emptied', 'All items permanently deleted', '🗑️');
      }
    });

    return win;
  }

  // 快速设置面板
  static openQuickSettings() {
    // 移除已有面板
    const existing = document.getElementById('quick-settings');
    if (existing) {
      existing.remove();
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'quick-settings';
    panel.style.cssText = `
      position: fixed; bottom: 56px; right: 8px; width: 340px;
      background: rgba(47,47,47,0.95); backdrop-filter: blur(10px);
      border-radius: 12px; padding: 0; color: white; z-index: 10002;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    `;

    panel.innerHTML = `
      <!-- 快速开关 -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:16px;">
        <button class="qs-toggle active" data-toggle="wifi" style="
          display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;
          background:rgba(61,174,233,0.3);border:none;border-radius:8px;cursor:pointer;color:white;
        ">
          <span style="font-size:20px;">📶</span>
          <span style="font-size:10px;">Wi-Fi</span>
        </button>
        <button class="qs-toggle" data-toggle="bluetooth" style="
          display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;
          background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;color:white;
        ">
          <span style="font-size:20px;">🔵</span>
          <span style="font-size:10px;">Bluetooth</span>
        </button>
        <button class="qs-toggle active" data-toggle="airplane" style="
          display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;
          background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;color:white;
        ">
          <span style="font-size:20px;">✈️</span>
          <span style="font-size:10px;">Airplane</span>
        </button>
        <button class="qs-toggle active" data-toggle="darkmode" style="
          display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;
          background:rgba(61,174,233,0.3);border:none;border-radius:8px;cursor:pointer;color:white;
        ">
          <span style="font-size:20px;">🌙</span>
          <span style="font-size:10px;">Dark Mode</span>
        </button>
        <button class="qs-toggle" data-toggle="dnd" style="
          display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;
          background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;color:white;
        ">
          <span style="font-size:20px;">🔕</span>
          <span style="font-size:10px;">DND</span>
        </button>
        <button class="qs-toggle" data-toggle="rotate" style="
          display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;
          background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;color:white;
        ">
          <span style="font-size:20px;">🔄</span>
          <span style="font-size:10px;">Rotate</span>
        </button>
      </div>

      <!-- 亮度滑块 -->
      <div style="padding:0 16px 12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:16px;">☀️</span>
          <input type="range" min="0" max="100" value="80" style="
            flex:1;height:4px;-webkit-appearance:none;background:linear-gradient(to right, #3daee9 80%, #555 80%);
            border-radius:2px;outline:none;cursor:pointer;
          ">
          <span style="font-size:12px;width:30px;text-align:right;">80%</span>
        </div>
      </div>

      <!-- 音量滑块 -->
      <div style="padding:0 16px 16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:16px;">🔊</span>
          <input type="range" min="0" max="100" value="75" style="
            flex:1;height:4px;-webkit-appearance:none;background:linear-gradient(to right, #3daee9 75%, #555 75%);
            border-radius:2px;outline:none;cursor:pointer;
          ">
          <span style="font-size:12px;width:30px;text-align:right;">75%</span>
        </div>
      </div>

      <!-- 底部快捷方式 -->
      <div style="display:flex;justify-content:space-around;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.1);">
        <button style="background:none;border:none;color:white;cursor:pointer;font-size:12px;display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span style="font-size:16px;">⚙️</span>
          Settings
        </button>
        <button style="background:none;border:none;color:white;cursor:pointer;font-size:12px;display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span style="font-size:16px;">🔋</span>
          Battery
        </button>
        <button style="background:none;border:none;color:white;cursor:pointer;font-size:12px;display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span style="font-size:16px;">👤</span>
          Account
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    // 快速开关事件
    panel.querySelectorAll('.qs-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) {
          btn.style.background = 'rgba(61,174,233,0.3)';
        } else {
          btn.style.background = 'rgba(255,255,255,0.1)';
        }
      });
    });

    // 滑块事件
    panel.querySelectorAll('input[type="range"]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const val = e.target.value;
        e.target.style.background = `linear-gradient(to right, #3daee9 ${val}%, #555 ${val}%)`;
        e.target.nextElementSibling.textContent = val + '%';
      });
    });

    // 点击外部关闭
    const closeHandler = (e) => {
      if (!panel.contains(e.target)) {
        panel.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  // 帮助中心
  static openHelpCenter() {
    if (!this.wm) return;

    const win = this.wm.createWindow({
      title: 'Help Center',
      icon: '❓',
      width: 650,
      height: 500,
      content: `
        <div style="display:flex;height:100%;">
          <div style="width:200px;background:#f5f5f5;border-right:1px solid #ddd;overflow-y:auto;">
            <div class="help-nav-item active" data-section="getting-started" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #eee;font-size:13px;">
              🚀 Getting Started
            </div>
            <div class="help-nav-item" data-section="desktop" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #eee;font-size:13px;">
              🖥️ Desktop
            </div>
            <div class="help-nav-item" data-section="terminal" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #eee;font-size:13px;">
              💻 Terminal
            </div>
            <div class="help-nav-item" data-section="files" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #eee;font-size:13px;">
              📁 Files
            </div>
            <div class="help-nav-item" data-section="apps" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #eee;font-size:13px;">
              📱 Applications
            </div>
            <div class="help-nav-item" data-section="shortcuts" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #eee;font-size:13px;">
              ⌨️ Shortcuts
            </div>
            <div class="help-nav-item" data-section="faq" style="padding:12px 16px;cursor:pointer;font-size:13px;">
              ❓ FAQ
            </div>
          </div>
          <div id="help-content" style="flex:1;padding:20px;overflow-y:auto;">
            <h2 style="margin-top:0;">🚀 Getting Started</h2>
            <p>Welcome to OS-JS, a browser-based Linux desktop environment!</p>
            <h3>Quick Start</h3>
            <ul>
              <li><strong>Desktop Mode:</strong> Click the "⛁ Desktop" button in the top-right corner</li>
              <li><strong>Terminal Mode:</strong> Click "⌨ Terminal" or press the button again</li>
              <li><strong>Start Menu:</strong> Click the 🌀 icon in the bottom-left</li>
              <li><strong>Taskbar:</strong> Switch between open windows</li>
            </ul>
            <h3>First Steps</h3>
            <ol>
              <li>Explore the File Manager by double-clicking "Home" on the desktop</li>
              <li>Open Terminal to run Linux commands</li>
              <li>Try the Calculator and other apps from the Start Menu</li>
              <li>Customize your desktop in Settings</li>
            </ol>
          </div>
        </div>
      `
    });

    const sections = {
      'getting-started': `
        <h2 style="margin-top:0;">🚀 Getting Started</h2>
        <p>Welcome to OS-JS, a browser-based Linux desktop environment!</p>
        <h3>Quick Start</h3>
        <ul>
          <li><strong>Desktop Mode:</strong> Click the "⛁ Desktop" button in the top-right corner</li>
          <li><strong>Terminal Mode:</strong> Click "⌨ Terminal" or press the button again</li>
          <li><strong>Start Menu:</strong> Click the 🌀 icon in the bottom-left</li>
          <li><strong>Taskbar:</strong> Switch between open windows</li>
        </ul>
      `,
      'desktop': `
        <h2 style="margin-top:0;">🖥️ Desktop</h2>
        <h3>Desktop Icons</h3>
        <p>Double-click icons to open applications. Right-click the desktop for more options.</p>
        <h3>Windows</h3>
        <ul>
          <li>Drag title bars to move windows</li>
          <li>Drag edges to resize</li>
          <li>Double-click title bar to maximize</li>
          <li>Use buttons to minimize/maximize/close</li>
        </ul>
        <h3>Taskbar</h3>
        <p>Click taskbar items to switch windows. Middle-click to close.</p>
      `,
      'terminal': `
        <h2 style="margin-top:0;">💻 Terminal</h2>
        <h3>Basic Commands</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;"><code>ls</code></td><td>List files</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;"><code>cd</code></td><td>Change directory</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;"><code>cat</code></td><td>Show file contents</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;"><code>mkdir</code></td><td>Create directory</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;"><code>help</code></td><td>Show all commands</td></tr>
        </table>
      `,
      'files': `
        <h2 style="margin-top:0;">📁 Files</h2>
        <h3>File Manager</h3>
        <p>Navigate your virtual file system with the built-in file manager.</p>
        <ul>
          <li>Double-click folders to open them</li>
          <li>Double-click files to edit</li>
          <li>Use toolbar buttons for navigation</li>
        </ul>
      `,
      'apps': `
        <h2 style="margin-top:0;">📱 Applications</h2>
        <h3>Built-in Apps</h3>
        <ul>
          <li><strong>Firefox:</strong> Web browser</li>
          <li><strong>File Manager:</strong> Browse files</li>
          <li><strong>Text Editor:</strong> Edit text files</li>
          <li><strong>Terminal:</strong> Command line</li>
          <li><strong>Calculator:</strong> Basic calculator</li>
          <li><strong>System Monitor:</strong> View system info</li>
        </ul>
      `,
      'shortcuts': `
        <h2 style="margin-top:0;">⌨️ Shortcuts</h2>
        <h3>Terminal</h3>
        <ul>
          <li><code>Ctrl+C</code> - Cancel</li>
          <li><code>Ctrl+L</code> - Clear screen</li>
          <li><code>↑/↓</code> - Command history</li>
          <li><code>Tab</code> - Auto-complete</li>
        </ul>
        <h3>Desktop</h3>
        <ul>
          <li><code>Alt+Tab</code> - Switch windows</li>
        </ul>
      `,
      'faq': `
        <h2 style="margin-top:0;">❓ FAQ</h2>
        <h3>Q: Is this a real Linux system?</h3>
        <p>A: No, it's a browser-based simulator that mimics Linux behavior.</p>
        <h3>Q: Are my files saved?</h3>
        <p>A: Yes, files are saved in browser localStorage.</p>
        <h3>Q: Can I run real programs?</h3>
        <p>A: Only the built-in simulated commands are supported.</p>
      `
    };

    const content = win.element.querySelector('#help-content');
    const navItems = win.element.querySelectorAll('.help-nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        item.style.background = '#e0e0e0';
        const section = item.dataset.section;
        if (sections[section]) {
          content.innerHTML = sections[section];
        }
      });
    });

    return win;
  }

  // 打开系统设置
  static openSettings() {
    if (!this.wm) return;
    
    const win = this.wm.createWindow({
      title: 'System Settings',
      icon: '⚙️',
      width: 700,
      height: 500,
      minWidth: 500,
      minHeight: 400,
      contentClass: 'settings-app',
      content: this._buildSettingsUI(),
    });
    
    this._setupSettings(win);
    return win;
  }

  // 打开任务管理器
  static openTaskManager() {
    if (!this.wm) return;

    const info = this.systemInfo;
    const winId = 'taskmgr-' + Date.now();

    const win = this.wm.createWindow({
      title: 'System Monitor',
      icon: '📊',
      width: 750,
      height: 550,
      minWidth: 600,
      minHeight: 400,
      content: `<div id="${winId}-content" style="height:100%;display:flex;flex-direction:column;"></div>`,
    });

    const container = win.element.querySelector(`#${winId}-content`);

    // 渲染任务管理器
    const render = () => {
      const cpuUsage = info.getCpuUsage();
      const gpuUsage = info.getGpuUsage();
      const memUsage = info.getMemoryUsage();
      const memUsed = info.getMemoryUsed();
      const diskUsage = info.getDiskUsage();
      const diskUsed = info.getDiskUsed();
      const uptime = info.getUptime();
      const processes = info.getProcesses();

      const getColor = (val) => val > 80 ? '#f44' : val > 50 ? '#fa0' : '#3daee9';

      container.innerHTML = `
        <div style="display:flex;border-bottom:1px solid #ddd;background:#f5f5f5;">
          <div class="tm-tab active" data-tab="resources" style="padding:10px 16px;cursor:pointer;font-size:12px;border-bottom:2px solid #3daee9;">Resources</div>
          <div class="tm-tab" data-tab="processes" style="padding:10px 16px;cursor:pointer;font-size:12px;">Processes</div>
          <div class="tm-tab" data-tab="system" style="padding:10px 16px;cursor:pointer;font-size:12px;">System</div>
        </div>
        <div id="${winId}-tab-content" style="flex:1;overflow:auto;padding:16px;"></div>
      `;

      const tabContent = container.querySelector(`#${winId}-tab-content`);
      const tabs = container.querySelectorAll('.tm-tab');

      const renderTab = (tabName) => {
        if (tabName === 'resources') {
          tabContent.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              <!-- CPU -->
              <div style="background:#f8f8f8;border-radius:8px;padding:16px;border:1px solid #e0e0e0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <span style="font-size:20px;">🖥️</span>
                  <div>
                    <div style="font-weight:500;font-size:13px;">CPU</div>
                    <div style="font-size:11px;color:#888;">${info.cpu.model}</div>
                  </div>
                </div>
                <div style="font-size:28px;font-weight:300;color:${getColor(cpuUsage)};margin-bottom:8px;">${cpuUsage}%</div>
                <div style="height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;margin-bottom:8px;">
                  <div style="height:100%;width:${cpuUsage}%;background:${getColor(cpuUsage)};transition:width 0.5s;border-radius:4px;"></div>
                </div>
                <div style="font-size:11px;color:#888;">${info.cpu.cores} cores / ${info.cpu.threads} threads @ ${info.cpu.baseSpeed} GHz</div>
              </div>

              <!-- GPU -->
              <div style="background:#f8f8f8;border-radius:8px;padding:16px;border:1px solid #e0e0e0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <span style="font-size:20px;">🎮</span>
                  <div>
                    <div style="font-weight:500;font-size:13px;">GPU</div>
                    <div style="font-size:11px;color:#888;">${info.gpu.model}</div>
                  </div>
                </div>
                <div style="font-size:28px;font-weight:300;color:${getColor(gpuUsage)};margin-bottom:8px;">${gpuUsage}%</div>
                <div style="height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;margin-bottom:8px;">
                  <div style="height:100%;width:${gpuUsage}%;background:${getColor(gpuUsage)};transition:width 0.5s;border-radius:4px;"></div>
                </div>
                <div style="font-size:11px;color:#888;">${info.gpu.vram} GB ${info.gpu.vramType} VRAM</div>
              </div>

              <!-- Memory -->
              <div style="background:#f8f8f8;border-radius:8px;padding:16px;border:1px solid #e0e0e0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <span style="font-size:20px;">🧠</span>
                  <div>
                    <div style="font-weight:500;font-size:13px;">Memory</div>
                    <div style="font-size:11px;color:#888;">${info.memory.type}-${info.memory.speed}</div>
                  </div>
                </div>
                <div style="font-size:28px;font-weight:300;color:${getColor(memUsage)};margin-bottom:8px;">${memUsage}%</div>
                <div style="height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;margin-bottom:8px;">
                  <div style="height:100%;width:${memUsage}%;background:${getColor(memUsage)};transition:width 0.5s;border-radius:4px;"></div>
                </div>
                <div style="font-size:11px;color:#888;">${memUsed} GB / ${info.memory.total} GB</div>
              </div>

              <!-- Disk -->
              <div style="background:#f8f8f8;border-radius:8px;padding:16px;border:1px solid #e0e0e0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <span style="font-size:20px;">💾</span>
                  <div>
                    <div style="font-weight:500;font-size:13px;">Disk</div>
                    <div style="font-size:11px;color:#888;">${info.disk.model}</div>
                  </div>
                </div>
                <div style="font-size:28px;font-weight:300;color:#3daee9;margin-bottom:8px;">${diskUsage}%</div>
                <div style="height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;margin-bottom:8px;">
                  <div style="height:100%;width:${diskUsage}%;background:#3daee9;transition:width 0.5s;border-radius:4px;"></div>
                </div>
                <div style="font-size:11px;color:#888;">${diskUsed} GB / ${info.disk.total} GB</div>
              </div>
            </div>

            <!-- 底部信息栏 -->
            <div style="margin-top:16px;padding:12px;background:#f0f0f0;border-radius:8px;display:flex;justify-content:space-around;font-size:12px;">
              <div style="text-align:center;">
                <div style="color:#888;">Uptime</div>
                <div style="font-weight:500;">${uptime.formatted}</div>
              </div>
              <div style="text-align:center;">
                <div style="color:#888;">Processes</div>
                <div style="font-weight:500;">${processes.length}</div>
              </div>
              <div style="text-align:center;">
                <div style="color:#888;">CPU Temp</div>
                <div style="font-weight:500;">${Math.round(45 + cpuUsage * 0.4)}°C</div>
              </div>
              <div style="text-align:center;">
                <div style="color:#888;">GPU Temp</div>
                <div style="font-weight:500;">${Math.round(40 + gpuUsage * 0.5)}°C</div>
              </div>
            </div>
          `;
        } else if (tabName === 'processes') {
          let procHtml = `
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#f0f0f0;border-bottom:2px solid #ddd;">
                  <th style="padding:8px;text-align:left;">PID</th>
                  <th style="padding:8px;text-align:left;">Name</th>
                  <th style="padding:8px;text-align:left;">User</th>
                  <th style="padding:8px;text-align:right;">CPU %</th>
                  <th style="padding:8px;text-align:right;">Memory (MB)</th>
                </tr>
              </thead>
              <tbody>
          `;

          for (const proc of processes) {
            procHtml += `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:6px 8px;">${proc.pid}</td>
                <td style="padding:6px 8px;">${proc.name}</td>
                <td style="padding:6px 8px;">${proc.user}</td>
                <td style="padding:6px 8px;text-align:right;color:${proc.cpu > 10 ? '#f44' : proc.cpu > 5 ? '#fa0' : '#333'}">${proc.cpu.toFixed(1)}%</td>
                <td style="padding:6px 8px;text-align:right;">${proc.mem}</td>
              </tr>
            `;
          }

          procHtml += '</tbody></table>';
          tabContent.innerHTML = procHtml;
        } else if (tabName === 'system') {
          tabContent.innerHTML = `
            <div style="display:grid;grid-template-columns:140px 1fr;gap:10px 20px;font-size:13px;">
              <span style="color:#888;font-weight:500;">Operating System</span>
              <span>${info.os.name} ${info.os.version}</span>

              <span style="color:#888;font-weight:500;">Kernel</span>
              <span>${info.os.kernel}</span>

              <span style="color:#888;font-weight:500;">Architecture</span>
              <span>${info.os.arch}</span>

              <span style="color:#888;font-weight:500;">Desktop</span>
              <span>${info.os.desktop}</span>

              <span style="color:#888;font-weight:500;">Hostname</span>
              <span>${info.os.hostname}</span>

              <span style="color:#888;font-weight:500;">Uptime</span>
              <span>${uptime.formatted}</span>

              <span style="color:#888;font-weight:500;border-top:1px solid #eee;padding-top:12px;">CPU</span>
              <span style="border-top:1px solid #eee;padding-top:12px;">${info.cpu.model}</span>

              <span style="color:#888;font-weight:500;">CPU Cores</span>
              <span>${info.cpu.cores} cores / ${info.cpu.threads} threads</span>

              <span style="color:#888;font-weight:500;">CPU Speed</span>
              <span>${info.cpu.baseSpeed} GHz (Turbo ${info.cpu.maxSpeed} GHz)</span>

              <span style="color:#888;font-weight:500;">CPU Cache</span>
              <span>${info.cpu.cache}</span>

              <span style="color:#888;font-weight:500;border-top:1px solid #eee;padding-top:12px;">GPU</span>
              <span style="border-top:1px solid #eee;padding-top:12px;">${info.gpu.model}</span>

              <span style="color:#888;font-weight:500;">VRAM</span>
              <span>${info.gpu.vram} GB ${info.gpu.vramType}</span>

              <span style="color:#888;font-weight:500;">GPU Driver</span>
              <span>${info.gpu.driver}</span>

              <span style="color:#888;font-weight:500;">CUDA Version</span>
              <span>${info.gpu.cuda}</span>

              <span style="color:#888;font-weight:500;border-top:1px solid #eee;padding-top:12px;">Memory</span>
              <span style="border-top:1px solid #eee;padding-top:12px;">${info.memory.total} GB ${info.memory.type}-${info.memory.speed}</span>

              <span style="color:#888;font-weight:500;">Memory Slots</span>
              <span>${info.memory.usedSlot}/${info.memory.slots} used</span>

              <span style="color:#888;font-weight:500;border-top:1px solid #eee;padding-top:12px;">Disk</span>
              <span style="border-top:1px solid #eee;padding-top:12px;">${info.disk.model}</span>

              <span style="color:#888;font-weight:500;">Disk Type</span>
              <span>${info.disk.type} ${info.disk.total} GB</span>

              <span style="color:#888;font-weight:500;">Read Speed</span>
              <span>${info.disk.readSpeed} MB/s</span>

              <span style="color:#888;font-weight:500;">Write Speed</span>
              <span>${info.disk.writeSpeed} MB/s</span>
            </div>
          `;
        }
      };

      // 默认显示资源标签
      renderTab('resources');

      // 标签切换
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => {
            t.style.borderBottom = 'none';
            t.classList.remove('active');
          });
          tab.style.borderBottom = '2px solid #3daee9';
          tab.classList.add('active');
          renderTab(tab.dataset.tab);
        });
      });
    };

    render();

    // 定时更新资源标签（如果是当前活动标签）
    const updateInterval = setInterval(() => {
      if (!document.getElementById(win.element.id)) {
        clearInterval(updateInterval);
        return;
      }
      const activeTab = container.querySelector('.tm-tab.active');
      if (activeTab && activeTab.dataset.tab === 'resources') {
        render();
      }
    }, 2000);

    return win;
  }

  static _buildSettingsUI() {
    return `
      <div class="settings-sidebar" id="settings-sidebar">
        <div class="settings-sidebar-item active" data-section="appearance">🎨 Appearance</div>
        <div class="settings-sidebar-item" data-section="desktop">🖥️ Desktop</div>
        <div class="settings-sidebar-item" data-section="terminal">💻 Terminal</div>
        <div class="settings-sidebar-item" data-section="system">💻 System Info</div>
        <div class="settings-sidebar-item" data-section="about">ℹ️ About</div>
      </div>
      <div class="settings-content" id="settings-content">
        ${this._buildAppearanceSection()}
      </div>
    `;
  }

  static _buildAppearanceSection() {
    return `
      <div class="settings-section">
        <h3>Window Theme</h3>
        <div class="settings-row">
          <label>Title Bar Color</label>
          <input type="color" id="set-title-color" value="#3daee9">
        </div>
        <div class="settings-row">
          <label>Window Background</label>
          <input type="color" id="set-window-bg" value="#f5f5f5">
        </div>
      </div>
      <div class="settings-section">
        <h3>Font</h3>
        <div class="settings-row">
          <label>UI Font Size</label>
          <select id="set-font-size">
            <option value="12px">Small</option>
            <option value="13px" selected>Normal</option>
            <option value="14px">Large</option>
            <option value="16px">Extra Large</option>
          </select>
        </div>
      </div>
    `;
  }

  static _buildDesktopSection() {
    return `
      <div class="settings-section">
        <h3>Desktop</h3>
        <div class="settings-row">
          <label>Show Desktop Icons</label>
          <select id="set-desktop-icons">
            <option value="show" selected>Show</option>
            <option value="hide">Hide</option>
          </select>
        </div>
        <div class="settings-row">
          <label>Icon Size</label>
          <select id="set-icon-size">
            <option value="small">Small</option>
            <option value="normal" selected>Normal</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
    `;
  }

  static _buildTerminalSection() {
    return `
      <div class="settings-section">
        <h3>Terminal</h3>
        <div class="settings-row">
          <label>Font Size</label>
          <select id="set-term-font">
            <option value="12px">12px</option>
            <option value="13px" selected>13px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
          </select>
        </div>
        <div class="settings-row">
          <label>Green Text</label>
          <select id="set-term-color">
            <option value="#0f0" selected>Classic Green</option>
            <option value="#fff">White</option>
            <option value="#0ff">Cyan</option>
            <option value="#ff0">Yellow</option>
          </select>
        </div>
      </div>
    `;
  }

  static _buildAboutSection() {
    return `
      <div class="settings-section">
        <h3>About OS-JS Desktop</h3>
        <div style="padding: 12px 0; font-size: 13px; line-height: 1.6;">
          <p><strong>OS-JS v0.1.0</strong></p>
          <p>A browser-based Linux terminal & desktop simulator</p>
          <p>Built with pure JavaScript, HTML, and CSS - zero dependencies</p>
          <p>Powered by Xiaomi MiMo-V2-Pro AI</p>
          <p style="margin-top: 12px; color: #888;">
            GitHub: <a href="https://github.com/whyb/os.js" target="_blank" style="color: #3daee9;">github.com/whyb/os.js</a>
          </p>
        </div>
      </div>
    `;
  }

  static _buildSystemInfoSection() {
    const info = this.systemInfo;
    const uptime = info.getUptime();
    const cpuUsage = info.getCpuUsage();
    const memUsed = info.getMemoryUsed();
    const gpuUsage = info.getGpuUsage();

    return `
      <div class="settings-section">
        <h3>Operating System</h3>
        <div style="display:grid;grid-template-columns:120px 1fr;gap:8px 16px;font-size:13px;">
          <span style="color:#888;">Name</span><span>${info.os.name}</span>
          <span style="color:#888;">Version</span><span>${info.os.version}</span>
          <span style="color:#888;">Kernel</span><span>${info.os.kernel}</span>
          <span style="color:#888;">Architecture</span><span>${info.os.arch}</span>
          <span style="color:#888;">Desktop</span><span>${info.os.desktop}</span>
          <span style="color:#888;">Hostname</span><span>${info.os.hostname}</span>
          <span style="color:#888;">Uptime</span><span>${uptime.formatted}</span>
        </div>
      </div>

      <div class="settings-section">
        <h3>Hardware</h3>
        <div style="display:grid;grid-template-columns:120px 1fr;gap:8px 16px;font-size:13px;">
          <span style="color:#888;">CPU</span><span>${info.cpu.model}</span>
          <span style="color:#888;">Cores/Threads</span><span>${info.cpu.cores} cores / ${info.cpu.threads} threads</span>
          <span style="color:#888;">CPU Speed</span><span>${info.cpu.baseSpeed} GHz (Turbo ${info.cpu.maxSpeed} GHz)</span>
          <span style="color:#888;">CPU Cache</span><span>${info.cpu.cache}</span>
          <span style="color:#888;">GPU</span><span>${info.gpu.model}</span>
          <span style="color:#888;">VRAM</span><span>${info.gpu.vram} GB ${info.gpu.vramType}</span>
          <span style="color:#888;">GPU Driver</span><span>${info.gpu.driver}</span>
          <span style="color:#888;">Memory</span><span>${info.memory.total} GB ${info.memory.type}-${info.memory.speed}</span>
          <span style="color:#888;">Memory Slots</span><span>${info.memory.usedSlot}/${info.memory.slots} used</span>
          <span style="color:#888;">Disk</span><span>${info.disk.model}</span>
          <span style="color:#888;">Disk Type</span><span>${info.disk.type} ${info.disk.total} GB</span>
        </div>
      </div>

      <div class="settings-section">
        <h3>Current Usage</h3>
        <div style="font-size:13px;">
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>CPU Usage</span>
              <span style="color:${cpuUsage > 80 ? '#f44' : cpuUsage > 50 ? '#fa0' : '#4f4'}">${cpuUsage}%</span>
            </div>
            <div style="height:8px;background:#333;border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${cpuUsage}%;background:${cpuUsage > 80 ? '#f44' : cpuUsage > 50 ? '#fa0' : '#3daee9'};transition:width 0.3s;border-radius:4px;"></div>
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>GPU Usage</span>
              <span style="color:${gpuUsage > 80 ? '#f44' : gpuUsage > 50 ? '#fa0' : '#4f4'}">${gpuUsage}%</span>
            </div>
            <div style="height:8px;background:#333;border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${gpuUsage}%;background:${gpuUsage > 80 ? '#f44' : gpuUsage > 50 ? '#fa0' : '#3daee9'};transition:width 0.3s;border-radius:4px;"></div>
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Memory</span>
              <span style="color:#3daee9">${memUsed} GB / ${info.memory.total} GB (${info.getMemoryUsage()}%)</span>
            </div>
            <div style="height:8px;background:#333;border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${info.getMemoryUsage()}%;background:#3daee9;transition:width 0.3s;border-radius:4px;"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Disk</span>
              <span style="color:#3daee9">${info.getDiskUsed()} GB / ${info.disk.total} GB (${info.getDiskUsage()}%)</span>
            </div>
            <div style="height:8px;background:#333;border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${info.getDiskUsage()}%;background:#3daee9;transition:width 0.3s;border-radius:4px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static _setupSettings(win) {
    const sidebar = win.content.querySelector('#settings-sidebar');
    const content = win.content.querySelector('#settings-content');

    const sections = {
      appearance: () => this._buildAppearanceSection(),
      desktop: () => this._buildDesktopSection(),
      terminal: () => this._buildTerminalSection(),
      system: () => this._buildSystemInfoSection(),
      about: () => this._buildAboutSection(),
    };

    sidebar.addEventListener('click', (e) => {
      const item = e.target.closest('.settings-sidebar-item');
      if (!item) return;

      // Update active state
      sidebar.querySelectorAll('.settings-sidebar-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      // Load section
      const section = item.dataset.section;
      if (sections[section]) {
        content.innerHTML = sections[section]();
        this._bindSettingsEvents(win);
      }
    });

    // Bind initial events
    setTimeout(() => this._bindSettingsEvents(win), 100);
  }

  static _bindSettingsEvents(win) {
    const root = document.documentElement;

    // Title color
    const titleColor = win.content.querySelector('#set-title-color');
    if (titleColor) {
      titleColor.addEventListener('input', (e) => {
        root.style.setProperty('--window-title-bg', e.target.value);
      });
    }

    // Window bg
    const winBg = win.content.querySelector('#set-window-bg');
    if (winBg) {
      winBg.addEventListener('input', (e) => {
        root.style.setProperty('--window-bg', e.target.value);
      });
    }

    // Font size
    const fontSize = win.content.querySelector('#set-font-size');
    if (fontSize) {
      fontSize.addEventListener('change', (e) => {
        document.querySelectorAll('.window-content').forEach(el => {
          el.style.fontSize = e.target.value;
        });
      });
    }

    // Desktop Icons visibility
    const desktopIcons = win.content.querySelector('#set-desktop-icons');
    if (desktopIcons) {
      desktopIcons.addEventListener('change', (e) => {
        const iconsContainer = document.getElementById('desktop-icons');
        if (iconsContainer) {
          iconsContainer.style.display = e.target.value === 'show' ? '' : 'none';
        }
      });
    }

    // Icon Size
    const iconSize = win.content.querySelector('#set-icon-size');
    if (iconSize) {
      iconSize.addEventListener('change', (e) => {
        const icons = document.querySelectorAll('.desktop-icon');
        const sizes = {
          small: { img: '32px', label: '10px', height: '68px' },
          normal: { img: '40px', label: '11px', height: '82px' },
          large: { img: '48px', label: '12px', height: '96px' }
        };
        const size = sizes[e.target.value] || sizes.normal;
        icons.forEach(icon => {
          icon.style.height = size.height;
          const img = icon.querySelector('.icon-img');
          const lbl = icon.querySelector('.icon-label');
          if (img) img.style.fontSize = size.img;
          if (lbl) lbl.style.fontSize = size.label;
        });
      });
    }

    // Terminal Font Size
    const termFont = win.content.querySelector('#set-term-font');
    if (termFont) {
      termFont.addEventListener('change', (e) => {
        document.querySelectorAll('.terminal-app').forEach(el => {
          el.style.fontSize = e.target.value;
          const inputs = el.querySelectorAll('input');
          inputs.forEach(input => input.style.fontSize = e.target.value);
        });
      });
    }

    // Terminal Text Color
    const termColor = win.content.querySelector('#set-term-color');
    if (termColor) {
      termColor.addEventListener('change', (e) => {
        document.querySelectorAll('.terminal-app').forEach(el => {
          el.style.color = e.target.value;
          const inputs = el.querySelectorAll('input');
          inputs.forEach(input => input.style.color = e.target.value);
          const prompts = el.querySelectorAll('span');
          prompts.forEach(span => {
            if (span.style.color === '#0f0' || span.style.color === 'rgb(0, 255, 0)') {
              span.style.color = e.target.value;
            }
          });
        });
      });
    }
  }

  // ANSI 转义序列转 HTML
  static _ansiToHtml(text) {
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

    // 粗体+颜色组合
    result = result.replace(/\x1b\[1;30m/g, '<span style="font-weight:bold;color:#000">');
    result = result.replace(/\x1b\[1;31m/g, '<span style="font-weight:bold;color:#ff4444">');
    result = result.replace(/\x1b\[1;32m/g, '<span style="font-weight:bold;color:#00ff41">');
    result = result.replace(/\x1b\[1;33m/g, '<span style="font-weight:bold;color:#ffcc00">');
    result = result.replace(/\x1b\[1;34m/g, '<span style="font-weight:bold;color:#4488ff">');
    result = result.replace(/\x1b\[1;35m/g, '<span style="font-weight:bold;color:#ff44ff">');
    result = result.replace(/\x1b\[1;36m/g, '<span style="font-weight:bold;color:#00d4ff">');
    result = result.replace(/\x1b\[1;37m/g, '<span style="font-weight:bold;color:#fff">');

    // 256 色
    result = result.replace(/\x1b\[38;5;(\d+)m/g, '<span style="color:var(--ansi-$1,#fff)">');

    // 清除其他未处理的转义序列
    result = result.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

    return result;
  }

  static _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
}
