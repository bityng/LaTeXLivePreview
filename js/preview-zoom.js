/* ============================================================
   preview-zoom.js — 预览图点击放大（类似各平台"查看大图"）
   特性：Canvas 位图渲染大图 / 滚轮缩放 / 拖拽平移 / 全屏 / ESC 关闭
   ============================================================ */

const PreviewZoom = {

  scale: 2,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  lastTrans: { x: 0, y: 0 },
  /** 事件清理引用（防止内存泄漏） */
  _boundMove: null,
  _boundUp: null,
  _boundEsc: null,

  /**
   * 初始化缩放模态框的事件
   * 由 UIBindings.init() 调用
   */
  init() {
    const overlay = document.getElementById('zoomOverlay');
    const previewWrap = document.getElementById('previewWrap');
    const zoomContent = document.getElementById('zoomContent');
    const zoomClose  = document.getElementById('zoomClose');
    const zoomFullscreen = document.getElementById('zoomFullscreen');

    if (!overlay || !previewWrap) return;

    // 点击预览区打开大图
    previewWrap.addEventListener('click', () => {
      const svg = document.querySelector('#formula-render svg');
      if (!svg) return;
      this.open();
    });

    // 关闭按钮
    zoomClose.addEventListener('click', (e) => { e.stopPropagation(); this.close(); });

    // 全屏按钮
    if (zoomFullscreen) {
      zoomFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          overlay.requestFullscreen().catch(() => {});
        }
      });
    }

    // 点击遮罩背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // ESC 关闭（复用 _boundEsc，确保只注册一次）
    this._boundEsc = (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._boundEsc);

    // 滚轮缩放
    zoomContent.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      this.scale = Math.max(0.25, Math.min(10, this.scale + delta));
      this._update();
    }, { passive: false });

    // ═══ 拖拽平移：mousemove/mouseup 按需注册/清理，防止全局泄漏 ═══
    zoomContent.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      this.lastTrans.x = this.translateX;
      this.lastTrans.y = this.translateY;
      zoomContent.style.cursor = 'grabbing';
      e.preventDefault();

      // 动态注册 move/up，mouseup 时清理
      this._boundMove = (ev) => {
        if (!this.isDragging) return;
        this.translateX = this.lastTrans.x + (ev.clientX - this.dragStart.x);
        this.translateY = this.lastTrans.y + (ev.clientY - this.dragStart.y);
        this._update();
      };
      this._boundUp = () => {
        this.isDragging = false;
        zoomContent.style.cursor = 'default';
        window.removeEventListener('mousemove', this._boundMove);
        window.removeEventListener('mouseup', this._boundUp);
        this._boundMove = null;
        this._boundUp = null;
      };
      window.addEventListener('mousemove', this._boundMove);
      window.addEventListener('mouseup', this._boundUp);
    });

    // 双击重置
    zoomContent.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.scale = 2;
      this.translateX = 0;
      this.translateY = 0;
      this._update();
      const info = document.getElementById('zoomScaleInfo');
      if (info) info.textContent = '200%';
    });
  },

  /** 打开大图模态框 */
  open() {
    const overlay = document.getElementById('zoomOverlay');
    const zoomRender = document.getElementById('zoomRender');
    const info = document.getElementById('zoomScaleInfo');
    const svgEl = document.querySelector('#formula-render svg');
    if (!svgEl || !zoomRender) return;

    // 深克隆 SVG
    const clone = svgEl.cloneNode(true);

    // 使用 Canvas 将 SVG 渲染为高清位图（真正的"大图"体验）
    const bbox = svgEl.getBBox ? svgEl.getBBox() : null;
    const vb = svgEl.getAttribute('viewBox');
    let w = 800, h = 200;
    if (vb) {
      const parts = vb.split(/\s+/);
      w = parseFloat(parts[2]) || 800;
      h = parseFloat(parts[3]) || 200;
    } else if (bbox) {
      w = bbox.width + 20;
      h = bbox.height + 20;
    }

    const scale = Math.min(3, Math.max(1.5, 800 / w)); // 自适应缩放
    const cw = Math.ceil(w * scale);
    const ch = Math.ceil(h * scale);

    // 用 Canvas 渲染高清位图
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    // 将 SVG 序列化后绘制到 Canvas
    const serializer = new XMLSerializer();
    clone.setAttribute('width', w * scale);
    clone.setAttribute('height', h * scale);
    const svgStr = serializer.serializeToString(clone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, cw, ch);
      URL.revokeObjectURL(url);

      // 显示 Canvas 位图
      zoomRender.innerHTML = '';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      zoomRender.appendChild(canvas);

      this.scale = 2;
      this.translateX = 0;
      this.translateY = 0;
      this._update();
      if (info) info.textContent = '200%';
    };
    img.src = url;

    overlay.classList.add('active');
  },

  /** 关闭大图 */
  close() {
    document.getElementById('zoomOverlay').classList.remove('active');
  },

  /** 更新缩放/平移变换 */
  _update() {
    const zoomRender = document.getElementById('zoomRender');
    const info = document.getElementById('zoomScaleInfo');
    if (zoomRender) {
      zoomRender.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
      zoomRender.style.transformOrigin = 'center center';
    }
    if (info) info.textContent = Math.round(this.scale * 100) + '%';
  }
};
