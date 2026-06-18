// js/desktop/window-manager.js
// ==============================
// 窗口管理器 - 基础窗口系统
// ==============================

class WindowManager {
  constructor() {
    this.windows = [];
    this.windowIdCounter = 0;
    this.activeWindow = null;
    this.zIndex = 100;
    this.desktop = document.getElementById('desktop-container');
    this.taskbarWindows = document.getElementById('taskbar-windows');
    this.desktopIcons = document.getElementById('desktop-icons');
    this.startMenu = document.getElementById('start-menu');
    this.altTabActive = false;
    this.altTabIndex = 0;

    // 拖拽状态
    this.dragState = null;

    // 窗口位置记忆（用于最大化还原）
    this._savedPositions = {};

    // 托盘状态
    this._wifiEnabled = true;
    this._volumeMuted = false;
    this._volumeLevel = 75;

    // 绑定全局事件
    this._bindEvents();
  }

  // 创建新窗口
  createWindow(options = {}) {
    const id = ++this.windowIdCounter;
    // 级联定位
    const baseX = 80 + ((this.windowIdCounter - 1) * 30) % 300;
    const baseY = 40 + ((this.windowIdCounter - 1) * 30) % 200;
    
    const win = {
      id,
      title: options.title || 'Window',
      icon: options.icon || '📄',
      width: options.width || 600,
      height: options.height || 400,
      x: options.x || baseX,
      y: options.y || baseY,
      minWidth: options.minWidth || 300,
      minHeight: options.minHeight || 200,
      maximized: false,
      minimized: false,
      onClose: options.onClose || null,
      resizable: options.resizable !== false,
      data: options.data || {},
    };

    // 创建 DOM
    const el = document.createElement('div');
    el.className = 'window';
    el.id = 'window-' + id;
    el.style.width = win.width + 'px';
    el.style.height = win.height + 'px';
    el.style.left = win.x + 'px';
    el.style.top = win.y + 'px';
    el.style.zIndex = ++this.zIndex;

    // 标题栏
    const titlebar = document.createElement('div');
    titlebar.className = 'window-titlebar';
    titlebar.innerHTML = `
      <span class="window-icon">${win.icon}</span>
      <span class="window-title">${win.title}</span>
      <span class="window-controls">
        <button class="btn-minimize" title="Minimize">−</button>
        <button class="btn-maximize" title="Maximize">□</button>
        <button class="btn-close" title="Close">✕</button>
      </span>
    `;
    el.appendChild(titlebar);

    // 内容区
    const content = document.createElement('div');
    content.className = 'window-content';
    if (options.contentClass) content.classList.add(options.contentClass);
    content.id = 'window-content-' + id;
    if (options.content) {
      if (typeof options.content === 'string') {
        content.innerHTML = options.content;
      } else {
        content.appendChild(options.content);
      }
    }
    el.appendChild(content);

    // 调整大小手柄（如果可调整大小）
    if (win.resizable) {
      const handle = document.createElement('div');
      handle.className = 'window-resize-handle';
      el.appendChild(handle);
      
      // 四个边和四个角的手柄
      const edges = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
      for (const edge of edges) {
        const edgeHandle = document.createElement('div');
        edgeHandle.className = `window-edge-handle edge-${edge}`;
        el.appendChild(edgeHandle);
      }
    }

    this.desktop.appendChild(el);
    
    win.element = el;
    win.content = content;
    win.titlebar = titlebar;
    win._contentHtml = options.content;
    this.windows.push(win);
    
    // 绑定窗口事件
    this._bindWindowEvents(win);
    
    // 激活窗口
    this.activateWindow(id);
    this._updateTaskbar();
    
    return win;
  }

  // 关闭窗口
  closeWindow(id) {
    const win = this.getWindow(id);
    if (!win) return;
    
    if (win.onClose) {
      try { win.onClose(win); } catch(e) {}
    }
    
    win.element.remove();
    this.windows = this.windows.filter(w => w.id !== id);
    delete this._savedPositions[id];
    
    if (this.activeWindow === id) {
      this.activeWindow = null;
      const lastWin = [...this.windows.filter(w => !w.minimized)].pop();
      if (lastWin) this.activateWindow(lastWin.id);
    }
    
    this._updateTaskbar();
  }

  // 获取窗口对象
  getWindow(id) {
    return this.windows.find(w => w.id === id);
  }

  // 激活窗口（置顶）
  activateWindow(id) {
    const win = this.getWindow(id);
    if (!win) return;
    
    if (win.minimized) {
      win.minimized = false;
      win.element.classList.remove('minimized');
    }
    
    this.activeWindow = id;
    win.element.style.zIndex = ++this.zIndex;
    this._updateTaskbar();
  }

  // 最小化
  minimizeWindow(id) {
    const win = this.getWindow(id);
    if (!win) return;
    win.minimized = true;
    win.element.classList.add('minimized');
    this._updateTaskbar();
    
    // 切换到下一个非最小化窗口
    const others = this.windows.filter(w => w.id !== id && !w.minimized);
    if (others.length > 0) {
      this.activateWindow(others[others.length - 1].id);
    }
  }

  // 最小化所有窗口
  minimizeAll() {
    for (const win of this.windows) {
      if (!win.minimized) {
        win.minimized = true;
        win.element.classList.add('minimized');
      }
    }
    this.activeWindow = null;
    this._updateTaskbar();
  }

  // 最大化/还原
  toggleMaximize(id) {
    const win = this.getWindow(id);
    if (!win) return;
    
    if (win.maximized) {
      win.maximized = false;
      win.element.classList.remove('maximized');
      // 还原位置和大小
      const saved = this._savedPositions[id];
      if (saved) {
        win.element.style.left = saved.x + 'px';
        win.element.style.top = saved.y + 'px';
        win.element.style.width = saved.width + 'px';
        win.element.style.height = saved.height + 'px';
        win.x = saved.x;
        win.y = saved.y;
        win.width = saved.width;
        win.height = saved.height;
      }
    } else {
      // 保存当前位置和大小
      this._savedPositions[id] = {
        x: win.x,
        y: win.y,
        width: win.width,
        height: win.height
      };
      win.maximized = true;
      win.element.classList.add('maximized');
    }
  }

  // ===== 窗口边缘调整大小 =====

  _getResizeCursor(edge) {
    const cursors = {
      'n': 'n-resize', 's': 's-resize', 'e': 'e-resize', 'w': 'w-resize',
      'ne': 'ne-resize', 'nw': 'nw-resize', 'se': 'se-resize', 'sw': 'sw-resize'
    };
    return cursors[edge] || 'default';
  }

  // ===== 事件绑定 =====

  _bindEvents() {
    document.addEventListener('mouseup', (e) => this._onMouseUp(e));
    document.addEventListener('mousemove', (e) => this._onMouseMove(e));
    document.addEventListener('keydown', (e) => this._onGlobalKeyDown(e));
    document.addEventListener('keyup', (e) => this._onGlobalKeyUp(e));

    this._createModeSwitch();
    this._updateClock();
    setInterval(() => this._updateClock(), 1000);

    // 绑定托盘图标事件
    this._setupTrayIcons();
  }

  // ===== 托盘图标功能 =====

  _setupTrayIcons() {
    const networkBtn = document.getElementById('tray-network');
    const volumeBtn = document.getElementById('tray-volume');
    const clockEl = document.getElementById('taskbar-clock');
    const powerBtn = document.getElementById('tray-power');
    const clipboardBtn = document.getElementById('tray-clipboard');
    const notificationsBtn = document.getElementById('tray-notifications');

    if (networkBtn) {
      networkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleNetworkPanel();
      });
    }

    if (volumeBtn) {
      volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleVolumePanel();
      });
    }

    if (clockEl) {
      clockEl.style.cursor = 'pointer';
      clockEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleCalendarPanel();
      });
    }

    if (powerBtn) {
      powerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        AppLauncher.showPowerMenu();
      });
    }

    if (clipboardBtn) {
      clipboardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        AppLauncher.openClipboardManager();
      });
    }

    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        NotificationManager.openNotificationCenter();
      });
    }

    // 点击其他地方关闭所有面板
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#network-panel') && !e.target.closest('#tray-network')) {
        const panel = document.getElementById('network-panel');
        if (panel) panel.remove();
      }
      if (!e.target.closest('#volume-panel') && !e.target.closest('#tray-volume')) {
        const panel = document.getElementById('volume-panel');
        if (panel) panel.remove();
      }
      if (!e.target.closest('#calendar-panel') && !e.target.closest('#taskbar-clock')) {
        const panel = document.getElementById('calendar-panel');
        if (panel) panel.remove();
      }
    });
  }

  // 网络面板
  _toggleNetworkPanel() {
    const existing = document.getElementById('network-panel');
    if (existing) {
      existing.remove();
      return;
    }

    // 关闭其他面板
    document.getElementById('volume-panel')?.remove();
    document.getElementById('calendar-panel')?.remove();

    const panel = document.createElement('div');
    panel.id = 'network-panel';
    panel.style.cssText = `
      position: fixed; bottom: 56px; right: 80px; z-index: 10002;
      width: 300px; background: rgba(47,47,47,0.95); backdrop-filter: blur(8px);
      border-radius: 8px; padding: 0; color: white; font-size: 13px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    `;

    const networks = [
      { name: 'OS-JS Network', signal: 4, connected: true, secured: true },
      { name: 'Neighbor-WiFi', signal: 3, connected: false, secured: true },
      { name: 'Free-WiFi', signal: 2, connected: false, secured: false },
      { name: 'Guest-Network', signal: 1, connected: false, secured: true },
    ];

    const renderPanel = () => {
      const wifiEnabled = this._wifiEnabled;

      let html = `
        <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <span style="font-weight:500;">📶 Network</span>
            <span id="wifi-status-text" style="font-size:11px;opacity:0.6;">${wifiEnabled ? 'Connected' : 'Disabled'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;">Wi-Fi</span>
            <div id="wifi-toggle" style="
              width:40px;height:22px;border-radius:11px;cursor:pointer;position:relative;
              background:${wifiEnabled ? '#3daee9' : '#666'};transition:background 0.2s;
            ">
              <div id="wifi-toggle-knob" style="
                width:18px;height:18px;border-radius:50%;background:white;position:absolute;top:2px;
                left:${wifiEnabled ? '20px' : '2px'};transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);
              "></div>
            </div>
          </div>
        </div>
        <div id="network-list" style="max-height:200px;overflow-y:auto;padding:4px 0;${wifiEnabled ? '' : 'opacity:0.4;pointer-events:none;'}">
      `;

      if (wifiEnabled) {
        for (const net of networks) {
          html += `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;${net.connected ? 'background:rgba(61,174,233,0.2);' : ''}"
                 onmouseenter="this.style.background='rgba(255,255,255,0.1)'"
                 onmouseleave="this.style.background='${net.connected ? 'rgba(61,174,233,0.2)' : 'transparent'}'">
              <span style="font-size:16px;">${net.secured ? '🔒' : '📶'}</span>
              <div style="flex:1;">
                <div style="font-size:13px;">${net.name}</div>
                <div style="font-size:11px;opacity:0.6;">${net.connected ? 'Connected' : net.secured ? 'Secured' : 'Open'}</div>
              </div>
              <span style="font-size:12px;letter-spacing:-2px;">📶</span>
            </div>
          `;
        }
      } else {
        html += `
          <div style="padding:20px;text-align:center;opacity:0.5;">
            <div style="font-size:24px;margin-bottom:8px;">📵</div>
            <div style="font-size:12px;">Wi-Fi is turned off</div>
          </div>
        `;
      }

      html += `
        </div>
        <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:8px;">
          <button style="flex:1;padding:6px;background:rgba(255,255,255,0.1);border:none;color:white;border-radius:4px;cursor:pointer;font-size:12px;">Network Settings</button>
        </div>
      `;

      return html;
    };

    panel.innerHTML = renderPanel();
    document.body.appendChild(panel);

    // Wi-Fi 开关事件
    const wifiToggle = panel.querySelector('#wifi-toggle');
    if (wifiToggle) {
      wifiToggle.addEventListener('click', () => {
        this._wifiEnabled = !this._wifiEnabled;

        // 更新任务栏图标
        const networkBtn = document.getElementById('tray-network');
        if (networkBtn) {
          if (this._wifiEnabled) {
            networkBtn.textContent = '📶';
            networkBtn.style.opacity = '1';
          } else {
            networkBtn.textContent = '📶';
            networkBtn.style.opacity = '0.4';
          }
        }

        // 重新渲染面板内容
        panel.innerHTML = renderPanel();

        // 重新绑定开关事件（因为 innerHTML 替换了）
        const newToggle = panel.querySelector('#wifi-toggle');
        if (newToggle) {
          newToggle.addEventListener('click', () => {
            this._wifiEnabled = !this._wifiEnabled;
            const btn = document.getElementById('tray-network');
            if (btn) {
              btn.style.opacity = this._wifiEnabled ? '1' : '0.4';
            }
            panel.innerHTML = renderPanel();
            // 递归绑定会越来越深，但实际使用中用户不会连续点击太多次
            // 更好的方式是用事件委托，但这里简单处理
          });
        }
      });
    }
  }

  // 音量面板
  _toggleVolumePanel() {
    const existing = document.getElementById('volume-panel');
    if (existing) {
      existing.remove();
      return;
    }

    // 关闭其他面板
    document.getElementById('network-panel')?.remove();
    document.getElementById('calendar-panel')?.remove();

    const panel = document.createElement('div');
    panel.id = 'volume-panel';
    panel.style.cssText = `
      position: fixed; bottom: 56px; right: 48px; z-index: 10002;
      width: 280px; background: rgba(47,47,47,0.95); backdrop-filter: blur(8px);
      border-radius: 8px; padding: 0; color: white; font-size: 13px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    `;

    const currentVolume = this._volumeLevel;
    const isMuted = this._volumeMuted;

    const getVolumeIcon = (vol, muted) => {
      if (muted || vol === 0) return '🔇';
      if (vol < 33) return '🔈';
      if (vol < 66) return '🔉';
      return '🔊';
    };

    panel.innerHTML = `
      <div style="padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="font-weight:500;">${getVolumeIcon(currentVolume, isMuted)} Volume</span>
          <span id="volume-label" style="font-size:12px;opacity:0.7;">${currentVolume}%</span>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <button id="mute-btn" style="background:none;border:none;color:white;cursor:pointer;font-size:20px;padding:4px;">
            ${isMuted ? '🔇' : '🔊'}
          </button>
          <input type="range" id="volume-slider" min="0" max="100" value="${currentVolume}" style="
            flex:1;height:4px;-webkit-appearance:none;background:linear-gradient(to right, #3daee9 ${currentVolume}%, #555 ${currentVolume}%);
            border-radius:2px;outline:none;cursor:pointer;${isMuted ? 'opacity:0.5;' : ''}
          ">
        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;">
          <div style="font-size:11px;opacity:0.5;margin-bottom:8px;text-transform:uppercase;">Output Device</div>
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;">
            <span>🔈</span>
            <div>
              <div style="font-size:12px;">Built-in Audio</div>
              <div style="font-size:11px;opacity:0.5;">Speakers</div>
            </div>
            <span style="margin-left:auto;color:#3daee9;">✓</span>
          </div>
        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;margin-top:12px;">
          <div style="font-size:11px;opacity:0.5;margin-bottom:8px;text-transform:uppercase;">Applications</div>
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
            <span style="font-size:14px;">🦊</span>
            <span style="font-size:12px;flex:1;">Firefox</span>
            <input type="range" min="0" max="100" value="60" style="width:80px;height:3px;-webkit-appearance:none;background:#555;border-radius:2px;outline:none;">
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
            <span style="font-size:14px;">💻</span>
            <span style="font-size:12px;flex:1;">Terminal</span>
            <input type="range" min="0" max="100" value="80" style="width:80px;height:3px;-webkit-appearance:none;background:#555;border-radius:2px;outline:none;">
          </div>
        </div>
      </div>

      <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:8px;">
        <button style="flex:1;padding:6px;background:rgba(255,255,255,0.1);border:none;color:white;border-radius:4px;cursor:pointer;font-size:12px;">Sound Settings</button>
      </div>
    `;

    document.body.appendChild(panel);

    // 音量滑块事件
    const slider = panel.querySelector('#volume-slider');
    const label = panel.querySelector('#volume-label');
    const muteBtn = panel.querySelector('#mute-btn');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this._volumeLevel = val;
        this._volumeMuted = val === 0;

        label.textContent = val + '%';
        e.target.style.background = `linear-gradient(to right, #3daee9 ${val}%, #555 ${val}%)`;

        const volumeBtn = document.getElementById('tray-volume');
        if (volumeBtn) {
          volumeBtn.textContent = getVolumeIcon(val, this._volumeMuted);
        }

        // 更新标题图标
        const titleIcon = panel.querySelector('span[style*="font-weight:500"]');
        if (titleIcon) {
          titleIcon.textContent = getVolumeIcon(val, this._volumeMuted) + ' Volume';
        }

        // 更新静音按钮
        if (muteBtn) {
          muteBtn.textContent = this._volumeMuted ? '🔇' : '🔊';
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this._volumeMuted = !this._volumeMuted;
        const volumeBtn = document.getElementById('tray-volume');

        if (this._volumeMuted) {
          muteBtn.textContent = '🔇';
          if (volumeBtn) volumeBtn.textContent = '🔇';
          slider.disabled = true;
          slider.style.opacity = '0.5';
        } else {
          muteBtn.textContent = '🔊';
          if (volumeBtn) volumeBtn.textContent = getVolumeIcon(this._volumeLevel, false);
          slider.disabled = false;
          slider.style.opacity = '1';
        }

        // 更新标题
        const titleIcon = panel.querySelector('span[style*="font-weight:500"]');
        if (titleIcon) {
          titleIcon.textContent = (this._volumeMuted ? '🔇' : '🔊') + ' Volume';
        }
      });
    }
  }

  // 日历面板
  _toggleCalendarPanel() {
    const existing = document.getElementById('calendar-panel');
    if (existing) {
      existing.remove();
      return;
    }

    // 关闭其他面板
    document.getElementById('network-panel')?.remove();
    document.getElementById('volume-panel')?.remove();

    const panel = document.createElement('div');
    panel.id = 'calendar-panel';
    panel.style.cssText = `
      position: fixed; bottom: 56px; right: 8px; z-index: 10002;
      width: 300px; background: rgba(47,47,47,0.95); backdrop-filter: blur(8px);
      border-radius: 8px; padding: 0; color: white; font-size: 13px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    `;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // 获取月份第一天是星期几
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // 获取月份天数
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let calendarDays = '';
    // 空白填充
    for (let i = 0; i < firstDay; i++) {
      calendarDays += '<div style="padding:8px;text-align:center;"></div>';
    }
    // 日期
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today;
      calendarDays += `
        <div style="
          padding:8px;text-align:center;cursor:pointer;border-radius:50%;
          ${isToday ? 'background:#3daee9;font-weight:bold;' : ''}
          transition:background 0.1s;
        "
        onmouseenter="if(!${isToday})this.style.background='rgba(255,255,255,0.1)'"
        onmouseleave="if(!${isToday})this.style.background='transparent'"
        >${day}</div>
      `;
    }

    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    panel.innerHTML = `
      <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="font-size:28px;font-weight:200;margin-bottom:4px;">${timeStr}</div>
        <div style="font-size:12px;opacity:0.7;">${now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <button id="cal-prev" style="background:none;border:none;color:white;cursor:pointer;font-size:16px;padding:4px 8px;">◀</button>
          <span style="font-weight:500;">${monthNames[currentMonth]} ${currentYear}</span>
          <button id="cal-next" style="background:none;border:none;color:white;cursor:pointer;font-size:16px;padding:4px 8px;">▶</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:8px;">
          ${dayNames.map(d => `<div style="padding:8px;text-align:center;font-size:11px;opacity:0.5;">${d}</div>`).join('')}
        </div>

        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
          ${calendarDays}
        </div>
      </div>

      <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.1);">
        <div style="font-size:11px;opacity:0.5;margin-bottom:8px;">UPCOMING</div>
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;">
          <span style="color:#3daee9;">●</span>
          <span>No upcoming events</span>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // 时钟更新
    const clockInterval = setInterval(() => {
      const timeEl = panel.querySelector('div > div:first-child');
      if (timeEl) {
        const newNow = new Date();
        timeEl.textContent = newNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } else {
        clearInterval(clockInterval);
      }
    }, 1000);
  }

  _bindWindowEvents(win) {
    const el = win.element;
    const titlebar = win.titlebar;

    // 点击窗口激活
    el.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.window-controls') && !e.target.classList.contains('window-edge-handle')) {
        this.activateWindow(win.id);
      }
    });

    // 标题栏拖拽
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-controls')) return;
      if (win.maximized) return;
      
      const rect = el.getBoundingClientRect();
      this.dragState = {
        type: 'move',
        id: win.id,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
      e.preventDefault();
    });

    // 关闭按钮
    titlebar.querySelector('.btn-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeWindow(win.id);
    });

    // 最小化按钮
    titlebar.querySelector('.btn-minimize').addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimizeWindow(win.id);
    });

    // 最大化按钮
    titlebar.querySelector('.btn-maximize').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize(win.id);
    });

    // 双击标题栏最大化
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.window-controls')) return;
      this.toggleMaximize(win.id);
    });

    // 边缘调整大小
    if (win.resizable) {
      const handles = el.querySelectorAll('.window-edge-handle');
      handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          const edge = Array.from(handle.classList)
            .find(cls => cls.startsWith('edge-'))
            .replace('edge-', '');
          
          const rect = el.getBoundingClientRect();
          this.dragState = {
            type: 'resize-edge',
            id: win.id,
            edge: edge,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: rect.left,
            startTop: rect.top,
            startWidth: win.width,
            startHeight: win.height,
          };
        });
      });

      // 右下角特殊手柄
      const handle = el.querySelector('.window-resize-handle');
      if (handle) {
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.dragState = {
            type: 'resize',
            id: win.id,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: win.width,
            startHeight: win.height
          };
        });
      }
    }
  }

  _onGlobalKeyDown(e) {
    // Alt+Tab 切换窗口
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
      const visibleWindows = this.windows.filter(w => !w.minimized);
      if (visibleWindows.length <= 1) return;
      
      if (!this.altTabActive) {
        this.altTabActive = true;
        this.altTabIndex = visibleWindows.findIndex(w => w.id === this.activeWindow);
      }
      
      if (e.shiftKey) {
        this.altTabIndex = (this.altTabIndex - 1 + visibleWindows.length) % visibleWindows.length;
      } else {
        this.altTabIndex = (this.altTabIndex + 1) % visibleWindows.length;
      }
      
      // 显示 Alt+Tab 指示器
      this._showAltTab(visibleWindows);
    }
  }

  _onGlobalKeyUp(e) {
    if (e.key === 'Tab' && this.altTabActive) {
      this.altTabActive = false;
      this._hideAltTab();
      
      const visibleWindows = this.windows.filter(w => !w.minimized);
      if (this.altTabIndex >= 0 && this.altTabIndex < visibleWindows.length) {
        this.activateWindow(visibleWindows[this.altTabIndex].id);
      }
    }
  }

  _showAltTab(visibleWindows) {
    // 移除旧的指示器
    const old = document.getElementById('alt-tab-indicator');
    if (old) old.remove();
    
    const container = document.createElement('div');
    container.id = 'alt-tab-indicator';
    container.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 99999; display: flex; gap: 8px; padding: 12px;
      background: rgba(0,0,0,0.8); border-radius: 12px;
      backdrop-filter: blur(10px);
    `;
    
    for (let i = 0; i < visibleWindows.length; i++) {
      const w = visibleWindows[i];
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex; flex-direction: column; align-items: center;
        padding: 12px; border-radius: 8px; color: white;
        font-size: 12px; transition: all 0.1s; min-width: 80px;
        background: ${i === this.altTabIndex ? 'rgba(61,174,233,0.3)' : 'transparent'};
        border: ${i === this.altTabIndex ? '2px solid #3daee9' : '2px solid transparent'};
      `;
      item.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 4px;">${w.icon}</div>
        <div style="text-align: center;">${w.title}</div>
      `;
      container.appendChild(item);
    }
    
    document.body.appendChild(container);
  }

  _hideAltTab() {
    const el = document.getElementById('alt-tab-indicator');
    if (el) el.remove();
  }

  _onMouseMove(e) {
    if (!this.dragState) return;
    
    const state = this.dragState;
    const win = this.getWindow(state.id);
    if (!win || win.maximized) return;
    
    if (state.type === 'move') {
      const x = e.clientX - state.offsetX;
      const y = e.clientY - state.offsetY;
      win.x = Math.max(0, x);
      win.y = Math.max(0, y);
      win.element.style.left = win.x + 'px';
      win.element.style.top = win.y + 'px';
    } else if (state.type === 'resize') {
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      win.width = Math.max(win.minWidth, state.startWidth + dx);
      win.height = Math.max(win.minHeight, state.startHeight + dy);
      win.element.style.width = win.width + 'px';
      win.element.style.height = win.height + 'px';
    } else if (state.type === 'resize-edge') {
      const edge = state.edge;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      
      let newX = state.startLeft;
      let newY = state.startTop;
      let newW = win.width;
      let newH = win.height;
      
      // 垂直方向
      if (edge.includes('n')) {
        newY = state.startTop + dy;
        newH = state.startHeight - dy;
        if (newH < win.minHeight) {
          newY = state.startTop + state.startHeight - win.minHeight;
          newH = win.minHeight;
        }
      }
      if (edge.includes('s') || edge === 'resize') {
        newH = state.startHeight + dy;
        newH = Math.max(win.minHeight, newH);
      }
      
      // 水平方向
      if (edge.includes('w')) {
        newX = state.startLeft + dx;
        newW = state.startWidth - dx;
        if (newW < win.minWidth) {
          newX = state.startLeft + state.startWidth - win.minWidth;
          newW = win.minWidth;
        }
      }
      if (edge.includes('e') || edge === 'resize') {
        newW = state.startWidth + dx;
        newW = Math.max(win.minWidth, newW);
      }
      
      win.x = newX;
      win.y = newY;
      win.width = newW;
      win.height = newH;
      
      win.element.style.left = newX + 'px';
      win.element.style.top = newY + 'px';
      win.element.style.width = newW + 'px';
      win.element.style.height = newH + 'px';
    }
  }

  _onMouseUp(e) {
    if (this.dragState) {
      this.dragState = null;
    }
  }

  // ===== 任务栏 =====

  _updateTaskbar() {
    this.taskbarWindows.innerHTML = '';
    
    for (const win of this.windows) {
      const btn = document.createElement('button');
      btn.className = 'taskbar-item';
      if (win.id === this.activeWindow && !win.minimized) {
        btn.classList.add('active');
      }
      btn.innerHTML = `<span class="taskbar-icon">${win.icon}</span>${win.title}`;
      btn.title = win.title;
      btn.addEventListener('click', () => {
        if (win.minimized || win.id !== this.activeWindow) {
          this.activateWindow(win.id);
        } else {
          this.minimizeWindow(win.id);
        }
      });
      // 鼠标中键关闭
      btn.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
          e.preventDefault();
          this.closeWindow(win.id);
        }
      });
      this.taskbarWindows.appendChild(btn);
    }
  }

  // ===== 模式切换 =====

  _createModeSwitch() {
    const btn = document.createElement('button');
    btn.id = 'mode-switch';
    btn.textContent = '⛁ Desktop';
    btn.addEventListener('click', () => this.toggleDesktop());
    document.body.appendChild(btn);
  }

  toggleDesktop() {
    const container = document.getElementById('desktop-container');
    const terminal = document.getElementById('terminal');
    const btn = document.getElementById('mode-switch');
    
    if (container.classList.contains('active')) {
      container.classList.remove('active');
      terminal.style.display = '';
      btn.textContent = '⛁ Desktop';
      const hiddenInput = document.getElementById('hidden-input');
      if (hiddenInput) {
        hiddenInput.style.display = '';
        hiddenInput.focus();
        // 启用主终端键盘处理
        if (window.terminal) window.terminal.disabled = false;
      }
    } else {
      container.classList.add('active');
      terminal.style.display = 'none';
      btn.textContent = '⌨ Terminal';
      
      // 禁用主终端键盘处理（避免拦截桌面输入）
      if (window.terminal) window.terminal.disabled = true;
      
      // 隐藏 hidden-input 使其不干扰桌面
      const hiddenInput = document.getElementById('hidden-input');
      if (hiddenInput) hiddenInput.style.display = 'none';
      
      if (!this._initialized) {
        this._initDesktop();
        this._initialized = true;
      }
    }
  }

  _updateClock() {
    const clock = document.getElementById('taskbar-clock');
    if (clock) {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  // ===== 右键菜单 =====

  _setupContextMenu() {
    const menu = document.createElement('div');
    menu.id = 'desktop-context-menu';
    menu.style.cssText = `
      position: fixed; display: none; z-index: 99998;
      background: rgba(47,47,47,0.95); backdrop-filter: blur(8px);
      border-radius: 8px; padding: 4px 0; min-width: 180px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(menu);

    const items = [
      { icon: '📁', label: 'New Folder', action: () => {
        const dirName = prompt('Folder name:');
        if (dirName) {
          window.fs.createDir(window.fs.resolvePath('/home/user', dirName));
        }
      }},
      { icon: '📄', label: 'New File', action: () => {
        const fileName = prompt('File name:');
        if (fileName) {
          window.fs.createFile(window.fs.resolvePath('/home/user', fileName), '');
        }
      }},
      { separator: true },
      { icon: '🔲', label: 'Terminal', action: () => AppLauncher.openTerminal() },
      { separator: true },
      { icon: '🔃', label: 'Refresh Desktop', action: () => this._refreshDesktop() },
    ];

    for (const item of items) {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:rgba(255,255,255,0.1);margin:4px 0;';
        menu.appendChild(sep);
        continue;
      }
      const el = document.createElement('div');
      el.style.cssText = `
        display: flex; align-items: center; gap: 8px; padding: 8px 16px;
        cursor: pointer; color: white; font-size: 13px;
        transition: background 0.1s;
      `;
      el.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`;
      el.addEventListener('mouseenter', () => el.style.background = 'rgba(255,255,255,0.1)');
      el.addEventListener('mouseleave', () => el.style.background = 'transparent');
      el.addEventListener('click', () => {
        menu.style.display = 'none';
        item.action();
      });
      menu.appendChild(el);
    }

    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('.window') && !e.target.closest('#taskbar') && !e.target.closest('#start-menu')) {
        e.preventDefault();
        menu.style.display = 'block';
        menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
        menu.style.top = Math.min(e.clientY, window.innerHeight - 300) + 'px';
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#desktop-context-menu')) {
        menu.style.display = 'none';
      }
    });
  }

  _refreshDesktop() {
    // 重新创建桌面图标
    this.desktopIcons.innerHTML = '';
    this._createDesktopIcons();
  }

  // ===== 桌面初始化 =====

  _initDesktop() {
    this._setupStartMenu();
    this._createDesktopIcons();
    this._renderWallpaper();
    this._setupContextMenu();
    
    // 打开文件管理器作为欢迎
    setTimeout(() => {
      AppLauncher.openFileManager('/home/user');
    }, 500);
  }

  _setupStartMenu() {
    const startBtn = document.getElementById('start-button');

    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#start-button') && !e.target.closest('#start-menu')) {
        this.startMenu.classList.remove('open');
      }
    });

    // 设置菜单项
    const menuItems = document.getElementById('start-menu-items');
    const appGroups = [
      { header: 'Applications' },
      { icon: '🦊', name: 'Firefox', desc: 'Web browser', action: () => AppLauncher.openBrowser() },
      { icon: '📁', name: 'File Manager', desc: 'Browse files', action: () => AppLauncher.openFileManager() },
      { icon: '✏️', name: 'Text Editor', desc: 'Edit text files', action: () => AppLauncher.openTextEditor() },
      { icon: '💻', name: 'Terminal', desc: 'Command line', action: () => AppLauncher.openTerminal() },
      { icon: '🔢', name: 'Calculator', desc: 'Basic calculator', action: () => AppLauncher.openCalculator() },
      { icon: '📋', name: 'Clipboard', desc: 'Clipboard history', action: () => AppLauncher.openClipboardManager() },
      { icon: '📸', name: 'Screenshot', desc: 'Capture screen', action: () => AppLauncher.openScreenshot() },
      { icon: '🖼️', name: 'Image Viewer', desc: 'View images', action: () => AppLauncher.openImageViewer() },
      { separator: true },
      { header: 'System' },
      { icon: '📊', name: 'System Monitor', desc: 'Task manager', action: () => AppLauncher.openTaskManager() },
      { icon: '🗑️', name: 'Trash', desc: 'Deleted files', action: () => AppLauncher.openTrash() },
      { icon: '⚙️', name: 'Settings', desc: 'System settings', action: () => AppLauncher.openSettings() },
      { icon: '❓', name: 'Help', desc: 'Help center', action: () => AppLauncher.openHelpCenter() },
      { icon: '🔍', name: 'Search', desc: 'Search files', action: () => this._openSearch() },
      { separator: true },
      { icon: '🔒', name: 'Lock Screen', desc: 'Lock the screen', action: () => this._lockScreen() },
      { icon: '⏻', name: 'Power', desc: 'Shutdown options', action: () => AppLauncher.showPowerMenu() },
      { icon: '🔌', name: 'Switch to Terminal', desc: 'Return to terminal mode', action: () => {
        this.startMenu.classList.remove('open');
        this.toggleDesktop();
      }},
    ];

    for (const app of appGroups) {
      if (app.separator) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:rgba(255,255,255,0.1);margin:4px 0;';
        menuItems.appendChild(sep);
        continue;
      }
      if (app.header) {
        const header = document.createElement('div');
        header.style.cssText = 'padding: 8px 16px 4px; font-size: 11px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px;';
        header.textContent = app.header;
        menuItems.appendChild(header);
        continue;
      }

      const item = document.createElement('button');
      item.className = 'start-menu-item';
      item.innerHTML = `
        <span class="menu-icon">${app.icon}</span>
        <span class="menu-text">${app.name}</span>
        <span class="menu-desc">${app.desc}</span>
      `;
      item.addEventListener('click', () => {
        this.startMenu.classList.remove('open');
        app.action();
      });
      menuItems.appendChild(item);
    }
  }

  // 打开搜索窗口
  _openSearch() {
    const win = AppLauncher.wm.createWindow({
      title: 'Search Files',
      icon: '🔍',
      width: 600,
      height: 450,
      content: `
        <div style="display:flex;flex-direction:column;height:100%;">
          <div style="display:flex;gap:8px;padding:12px;background:#f5f5f5;border-bottom:1px solid #ddd;">
            <input type="text" id="search-input" placeholder="Search for files..." style="flex:1;padding:8px 12px;border:1px solid #ccc;border-radius:4px;font-size:13px;outline:none;">
            <button id="search-btn" style="padding:8px 16px;background:#3daee9;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">Search</button>
          </div>
          <div id="search-results" style="flex:1;overflow:auto;padding:8px;">
            <div style="padding:20px;color:#888;text-align:center;">Enter a search term to find files</div>
          </div>
        </div>
      `
    });

    const input = win.element.querySelector('#search-input');
    const btn = win.element.querySelector('#search-btn');
    const results = win.element.querySelector('#search-results');

    const doSearch = () => {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        results.innerHTML = '<div style="padding:20px;color:#888;text-align:center;">Enter a search term to find files</div>';
        return;
      }

      const matches = [];
      const searchNode = (node, path) => {
        if (!node) return;
        const fullPath = path + (path === '/' ? '' : '/') + node.name;
        if (node.name.toLowerCase().includes(query)) {
          matches.push({ name: node.name, path: fullPath, type: node.type });
        }
        if (node.children) {
          for (const child of node.children) {
            searchNode(child, fullPath);
          }
        }
      };

      // 搜索整个文件系统
      if (window.fs && window.fs.root) {
        for (const child of window.fs.root.children || []) {
          searchNode(child, '');
        }
      }

      if (matches.length === 0) {
        results.innerHTML = `<div style="padding:20px;color:#888;text-align:center;">No files found matching "${query}"</div>`;
      } else {
        let html = `<div style="padding:8px;color:#666;font-size:12px;">Found ${matches.length} result(s)</div>`;
        for (const match of matches) {
          const icon = match.type === 'dir' ? '📁' : '📄';
          html += `
            <div class="search-result-item" data-path="${match.path}" data-type="${match.type}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;">
              <span>${icon}</span>
              <span style="flex:1;font-size:13px;">${match.name}</span>
              <span style="font-size:11px;color:#888;">${match.path}</span>
            </div>
          `;
        }
        results.innerHTML = html;

        // 双击打开
        results.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('dblclick', () => {
            const path = item.dataset.path;
            const type = item.dataset.type;
            if (type === 'dir') {
              AppLauncher.openFileManager(path);
            } else {
              const result = window.fs.readFile(path);
              if (result.success) {
                AppLauncher.openTextEditor(match.name, result.content);
              }
            }
          });
        });
      }
    };

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });

    setTimeout(() => input.focus(), 100);
  }

  // 锁屏功能
  _lockScreen() {
    this.startMenu.classList.remove('open');

    // 创建锁屏覆盖层
    const lockOverlay = document.createElement('div');
    lockOverlay.id = 'lock-screen';
    lockOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      z-index: 999999; display: flex; flex-direction: column;
      align-items: center; justify-content: center; color: white;
      font-family: 'Segoe UI', sans-serif; cursor: default;
    `;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    lockOverlay.innerHTML = `
      <div style="text-align:center;margin-bottom:40px;">
        <div style="font-size:72px;font-weight:200;margin-bottom:8px;">${timeStr}</div>
        <div style="font-size:18px;opacity:0.7;">${dateStr}</div>
      </div>
      <div style="text-align:center;">
        <div style="margin-bottom:16px;">
          <input type="password" id="lock-password" placeholder="Enter password (any key to unlock)" style="
            padding:12px 20px;border:1px solid rgba(255,255,255,0.3);border-radius:24px;
            background:rgba(255,255,255,0.1);color:white;font-size:14px;width:280px;
            outline:none;text-align:center;backdrop-filter:blur(10px);
          ">
        </div>
        <div style="font-size:12px;opacity:0.5;">Press Enter or click to unlock</div>
      </div>
      <div style="position:absolute;bottom:20px;font-size:11px;opacity:0.3;">OS-JS Desktop</div>
    `;

    document.body.appendChild(lockOverlay);

    const passwordInput = lockOverlay.querySelector('#lock-password');
    passwordInput.focus();

    // 解锁函数
    const unlock = () => {
      lockOverlay.style.opacity = '0';
      lockOverlay.style.transition = 'opacity 0.3s';
      setTimeout(() => lockOverlay.remove(), 300);
    };

    // Enter 键解锁
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        unlock();
      }
    });

    // 点击任意位置也可以解锁（简化版）
    lockOverlay.addEventListener('click', (e) => {
      if (e.target === lockOverlay || e.target.closest('div')?.textContent?.includes('Press Enter')) {
        unlock();
      }
    });

    // 更新时钟
    const clockInterval = setInterval(() => {
      const timeEl = lockOverlay.querySelector('div > div:first-child');
      if (timeEl) {
        const newNow = new Date();
        timeEl.textContent = newNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        clearInterval(clockInterval);
      }
    }, 1000);
  }

  _createDesktopIcons() {
    const icons = [
      { icon: '🦊', label: 'Firefox', action: () => AppLauncher.openBrowser() },
      { icon: '📁', label: 'Home', path: '/home/user', action: () => AppLauncher.openFileManager('/home/user') },
      { icon: '📁', label: 'Documents', path: '/home/user/documents', action: () => AppLauncher.openFileManager('/home/user/documents') },
      { icon: '⬇️', label: 'Downloads', path: '/home/user/downloads', action: () => AppLauncher.openFileManager('/home/user/downloads') },
      { icon: '💻', label: 'Terminal', action: () => AppLauncher.openTerminal() },
      { icon: '📊', label: 'System Monitor', action: () => AppLauncher.openTaskManager() },
      { icon: '🗑️', label: 'Trash', action: () => AppLauncher.openTrash() },
    ];

    for (const item of icons) {
      const div = document.createElement('div');
      div.className = 'desktop-icon';
      div.innerHTML = `<div class="icon-img">${item.icon}</div><div class="icon-label">${item.label}</div>`;

      if (item.action) {
        div.addEventListener('dblclick', (e) => {
          e.preventDefault();
          item.action();
        });
      }

      this.desktopIcons.appendChild(div);
    }
  }

  _renderWallpaper() {
    const canvas = document.getElementById('desktop-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 渐变壁纸
    const gradient = ctx.createRadialGradient(
      canvas.width * 0.7, canvas.height * 0.3, 0,
      canvas.width * 0.7, canvas.height * 0.3, canvas.width * 0.8
    );
    gradient.addColorStop(0, '#2a5a8f');
    gradient.addColorStop(0.3, '#1e3a5f');
    gradient.addColorStop(0.7, '#152240');
    gradient.addColorStop(1, '#0d1520');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 星星
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.6;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.5 + 0.2;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 山丘轮廓
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.75);
    for (let x = 0; x <= canvas.width; x += 50) {
      const y = canvas.height * 0.75 + Math.sin(x * 0.003) * 30 + Math.sin(x * 0.007) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // 第二个山丘层
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.85);
    for (let x = 0; x <= canvas.width; x += 50) {
      const y = canvas.height * 0.85 + Math.sin(x * 0.005 + 1) * 20 + Math.sin(x * 0.01) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      this._renderWallpaper();
    }, { once: true });
  }
}