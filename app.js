/**
 * =============================================================================
 * LED GRID MAPPER - APLICACIÓN WEB DE MAPPING LED EN PÍXELES REALES
 * =============================================================================
 * Prototipo funcional estático (HTML5 + CSS3 + Vanilla JavaScript)
 * 
 * Estructura de módulos:
 *  1. CONSTANTS & DEFAULTS: Valores predeterminados y paletas de color
 *  2. STATE: Almacén reactivo del estado de la aplicación
 *  3. CALCULATION ENGINE: Cálculos bidireccionales (pitch, metros, px, módulos)
 *  4. RENDER ENGINE: Motor de renderizado en Canvas 2D (1:1 px reales, damero)
 *  5. VIEWPORT ENGINE: Sistema de navegación (Zoom y Pan con soporte 4K/8K)
 *  6. INTERACTION ENGINE: Selección, arrastre de pantallas y snap magnético
 *  7. UI CONTROLLER: Formularios de control, tabla resumen y tags
 *  8. EXPORT & STORAGE: Exportación PNG a escala real, JSON y localStorage
 *  9. INITIALIZATION: Arranque de la aplicación
 * =============================================================================
 */

(function () {
  "use strict";

  /* ===========================================================================
   * 1. CONSTANTS & DEFAULTS
   * =========================================================================== */
  const STORAGE_KEY = "led_grid_mapper_project_v1";

  // Lista inicial de ubicaciones sugeridas para los eventos/escenarios
  const DEFAULT_LOCATIONS = [
    "Central",
    "Izquierda",
    "Derecha",
    "Fondo",
    "Piso",
    "Techo",
    "Arriba",
    "Abajo",
    "Lateral",
    "Tótem",
    "Bandeja"
  ];

  // Paleta de colores para damero por defecto (contrastes altos y modernos)
  const DEFAULT_COLOR_PALETTES = [
    { c1: "#1e3a8a", c2: "#3b82f6" }, // Azules (Central)
    { c1: "#831843", c2: "#ec4899" }, // Rosas/Magenta (Izquierda)
    { c1: "#065f46", c2: "#10b981" }, // Verdes/Esmeralda (Derecha)
    { c1: "#78350f", c2: "#f59e0b" }, // Ámbar/Naranja (Fondo)
    { c1: "#4c1d95", c2: "#8b5cf6" }, // Violetas
    { c1: "#134e4a", c2: "#14b8a6" }  // Cianes
  ];

  /**
   * Layout inicial de ejemplo en forma de cruz desplegada:
   * - Central (arriba)
   * - Izquierda y Derecha (a los costados)
   * - Fondo (abajo)
   * Dimensiones: módulos estándar de 0.50 x 1.00 m, pitch 2.5 mm -> 2.00 x 2.00 m (800 x 800 px)
   */
  const DEFAULT_INITIAL_SCREENS = [
    {
      id: "screen_central",
      label: "C",
      location: "Central",
      pitch: 2.5,
      widthM: 2.00,
      heightM: 2.00,
      widthPx: 800,
      heightPx: 800,
      moduleWidthM: 0.50,
      moduleHeightM: 1.00,
      cols: 4,
      rows: 2,
      fixedMode: "pitch_m", // Opciones: 'pitch_m', 'pitch_px', 'm_px'
      color1: "#1e3a8a",
      color2: "#3b82f6",
      x: 800,
      y: 0
    },
    {
      id: "screen_izq",
      label: "i1",
      location: "Izquierda",
      pitch: 2.5,
      widthM: 2.00,
      heightM: 2.00,
      widthPx: 800,
      heightPx: 800,
      moduleWidthM: 0.50,
      moduleHeightM: 1.00,
      cols: 4,
      rows: 2,
      fixedMode: "pitch_m",
      color1: "#831843",
      color2: "#ec4899",
      x: 0,
      y: 800
    },
    {
      id: "screen_der",
      label: "d1",
      location: "Derecha",
      pitch: 2.5,
      widthM: 2.00,
      heightM: 2.00,
      widthPx: 800,
      heightPx: 800,
      moduleWidthM: 0.50,
      moduleHeightM: 1.00,
      cols: 4,
      rows: 2,
      fixedMode: "pitch_m",
      color1: "#065f46",
      color2: "#10b981",
      x: 1600,
      y: 800
    },
    {
      id: "screen_fondo",
      label: "fondo",
      location: "Fondo",
      pitch: 2.5,
      widthM: 2.00,
      heightM: 2.00,
      widthPx: 800,
      heightPx: 800,
      moduleWidthM: 0.50,
      moduleHeightM: 1.00,
      cols: 4,
      rows: 2,
      fixedMode: "pitch_m",
      color1: "#78350f",
      color2: "#f59e0b",
      x: 800,
      y: 1600
    }
  ];


  /* ===========================================================================
   * 2. STATE MANAGEMENT
   * =========================================================================== */
  const state = {
    screens: [],
    selectedScreenId: null,
    locations: [...DEFAULT_LOCATIONS],
    canvas: {
      mode: "auto", // 'auto' o 'manual'
      manualWidth: 2400,
      manualHeight: 2400,
      computedWidth: 2400,
      computedHeight: 2400
    },
    viewport: {
      zoom: 0.35, // Escala actual
      panX: 80,   // Desplazamiento X en píxeles de pantalla
      panY: 50,   // Desplazamiento Y en píxeles de pantalla
      isPanning: false,
      startPanX: 0,
      startPanY: 0
    },
    settings: {
      snapEnabled: true,
      showModuleGrid: true,
      showLabels: true,
      showSublabels: true,
      exportBackground: "#0b0f19"
    },
    interaction: {
      draggingScreenId: null,
      dragOffsetX: 0,
      dragOffsetY: 0,
      hasMoved: false,
      activeSnapLines: [] // Guías visuales de alineación
    }
  };


  /* ===========================================================================
   * 3. CALCULATION ENGINE (Cálculo Bidireccional y Validación)
   * ===========================================================================
   * Fórmula base: píxeles = metros * 1000 / pitch
   * Relación:
   *  - Fijar pitch + metros -> calcula px
   *  - Fijar pitch + px     -> calcula metros
   *  - Fijar metros + px    -> calcula pitch real
   */
  const CalcEngine = {
    /**
     * Recalcula las variables de una pantalla según su 'fixedMode' y valida exactitud.
     * @param {Object} screen - Objeto pantalla
     * @returns {Object} { screen, warnings: Array<string>, isExact: boolean }
     */
    recalculate(screen) {
      const warnings = [];

      // Asegurar números válidos mayores a cero
      screen.pitch = Math.max(0.01, Number(screen.pitch) || 2.5);
      screen.widthM = Math.max(0.001, Number(screen.widthM) || 1.0);
      screen.heightM = Math.max(0.001, Number(screen.heightM) || 1.0);
      screen.widthPx = Math.max(1, Math.round(Number(screen.widthPx) || 100));
      screen.heightPx = Math.max(1, Math.round(Number(screen.heightPx) || 100));
      screen.moduleWidthM = Math.max(0.01, Number(screen.moduleWidthM) || 0.50);
      screen.moduleHeightM = Math.max(0.01, Number(screen.moduleHeightM) || 1.00);

      const mode = screen.fixedMode || "pitch_m";

      if (mode === "pitch_m") {
        // Metros + Pitch fijos -> Calcula Px
        const rawPxW = (screen.widthM * 1000) / screen.pitch;
        const rawPxH = (screen.heightM * 1000) / screen.pitch;
        
        const roundedPxW = Math.round(rawPxW);
        const roundedPxH = Math.round(rawPxH);

        // Advertencia si los píxeles no eran enteros
        if (Math.abs(rawPxW - roundedPxW) > 0.001 || Math.abs(rawPxH - roundedPxH) > 0.001) {
          warnings.push(`Píxeles redondeados: ${rawPxW.toFixed(1)}×${rawPxH.toFixed(1)} px → ${roundedPxW}×${roundedPxH} px.`);
        }

        screen.widthPx = roundedPxW;
        screen.heightPx = roundedPxH;

      } else if (mode === "pitch_px") {
        // Pitch + Px fijos -> Calcula Metros
        const calcMW = (screen.widthPx * screen.pitch) / 1000;
        const calcMH = (screen.heightPx * screen.pitch) / 1000;
        
        screen.widthM = Number(calcMW.toFixed(4));
        screen.heightM = Number(calcMH.toFixed(4));

      } else if (mode === "m_px") {
        // Metros + Px fijos -> Calcula Pitch real
        const calcPitchW = (screen.widthM * 1000) / screen.widthPx;
        const calcPitchH = (screen.heightM * 1000) / screen.heightPx;
        
        if (Math.abs(calcPitchW - calcPitchH) > 0.01) {
          warnings.push(`Pitch no cuadrado: W=${calcPitchW.toFixed(2)} mm, H=${calcPitchH.toFixed(2)} mm.`);
        }
        screen.pitch = Number(((calcPitchW + calcPitchH) / 2).toFixed(3));
      }

      // Cálculo y validación de módulos (Columnas x Filas)
      const exactCols = screen.widthM / screen.moduleWidthM;
      const exactRows = screen.heightM / screen.moduleHeightM;

      const roundedCols = Math.max(1, Math.round(exactCols));
      const roundedRows = Math.max(1, Math.round(exactRows));

      if (Math.abs(exactCols - roundedCols) > 0.01 || Math.abs(exactRows - roundedRows) > 0.01) {
        warnings.push(`No coincide con módulos enteros: da ${exactCols.toFixed(2)} × ${exactRows.toFixed(2)} módulos.`);
      }

      screen.cols = roundedCols;
      screen.rows = roundedRows;

      // Píxeles por módulo
      const modPxW = screen.widthPx / screen.cols;
      const modPxH = screen.heightPx / screen.rows;
      if (Math.abs(modPxW - Math.round(modPxW)) > 0.001 || Math.abs(modPxH - Math.round(modPxH)) > 0.001) {
        warnings.push(`Px por módulo no entero: ${modPxW.toFixed(1)} × ${modPxH.toFixed(1)} px/mód.`);
      }

      screen.modPxW = modPxW;
      screen.modPxH = modPxH;

      return {
        screen,
        warnings,
        isExact: warnings.length === 0
      };
    },

    /**
     * Ajusta el tamaño en metros a partir de una cantidad exacta de módulos (columnas x filas).
     * @param {Object} screen 
     * @param {number} newCols 
     * @param {number} newRows 
     */
    setModulesCount(screen, newCols, newRows) {
      screen.cols = Math.max(1, parseInt(newCols, 10) || 1);
      screen.rows = Math.max(1, parseInt(newRows, 10) || 1);
      screen.widthM = Number((screen.cols * screen.moduleWidthM).toFixed(4));
      screen.heightM = Number((screen.rows * screen.moduleHeightM).toFixed(4));
      return this.recalculate(screen);
    }
  };


  /* ===========================================================================
   * 4. RENDER ENGINE (Canvas 2D en Píxeles Reales 1:1)
   * ===========================================================================
   * - Cada pantalla se dibuja en sus dimensiones reales en px.
   * - image-rendering: pixelated; sin suavizado ni interpolación.
   * - Damero por módulos alternando color1 y color2.
   * - Etiqueta en texto blanco con sombra y contorno para máxima legibilidad.
   * - Totalmente preparado para V2 (capas, formas libres, SVG).
   */
  const RenderEngine = {
    canvas: null,
    ctx: null,

    init(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext("2d", { alpha: false });
    },

    /**
     * Calcula los límites totales de las pantallas para el tamaño automático del lienzo.
     */
    computeCanvasBounds() {
      if (state.canvas.mode === "manual") {
        state.canvas.computedWidth = Math.max(200, state.canvas.manualWidth);
        state.canvas.computedHeight = Math.max(200, state.canvas.manualHeight);
        return;
      }

      // Modo Automático: calcula la caja envolvente de todas las pantallas
      if (state.screens.length === 0) {
        state.canvas.computedWidth = 1920;
        state.canvas.computedHeight = 1080;
        return;
      }

      let maxX = 0;
      let maxY = 0;
      state.screens.forEach(s => {
        const right = s.x + s.widthPx;
        const bottom = s.y + s.heightPx;
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      });

      // Asegurar un tamaño mínimo y redondear a múltiplos
      state.canvas.computedWidth = Math.max(800, maxX);
      state.canvas.computedHeight = Math.max(600, maxY);
    },

    /**
     * Dibuja toda la escena en el Canvas.
     */
    render() {
      if (!this.canvas || !this.ctx) return;

      this.computeCanvasBounds();

      const w = state.canvas.computedWidth;
      const h = state.canvas.computedHeight;

      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }

      const ctx = this.ctx;
      // Desactivar suavizado para 1:1 pixel perfection
      ctx.imageSmoothingEnabled = false;

      // 1. Fondo del lienzo
      ctx.fillStyle = state.settings.exportBackground || "#0b0f19";
      ctx.fillRect(0, 0, w, h);

      // Si es modo manual, dibujar un marco guía sutil del área activa
      if (state.canvas.mode === "manual") {
        ctx.strokeStyle = "#2e3b52";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
      }

      // 2. Dibujar cada pantalla LED (damero y etiquetas)
      state.screens.forEach(screen => {
        const isSelected = screen.id === state.selectedScreenId;
        this.renderScreen(ctx, screen, isSelected);
      });

      // 3. Dibujar guías de alineación magnética si están activas
      this.renderSnapGuides(ctx);

      // 4. Actualizar textos HUD de dimensiones
      const hudResText = document.getElementById("hud-res-text");
      if (hudResText) {
        hudResText.textContent = `${w} × ${h} px`;
      }
    },

    /**
     * Renderiza una pantalla individual como damero de módulos y etiqueta centrada.
     */
    renderScreen(ctx, screen, isSelected) {
      const { x, y, widthPx, heightPx, cols, rows, color1, color2 } = screen;

      ctx.save();

      // Cálculo de anchos y altos exactos de módulos por celda para evitar vacíos por redondeo
      const colStep = widthPx / cols;
      const rowStep = heightPx / rows;

      // 1. Dibujar celdas del damero
      for (let r = 0; r < rows; r++) {
        const cellY = Math.floor(y + r * rowStep);
        const nextCellY = Math.floor(y + (r + 1) * rowStep);
        const cellH = nextCellY - cellY;

        for (let c = 0; c < cols; c++) {
          const cellX = Math.floor(x + c * colStep);
          const nextCellX = Math.floor(x + (c + 1) * colStep);
          const cellW = nextCellX - cellX;

          // Alternar color del damero
          ctx.fillStyle = ((r + c) % 2 === 0) ? color1 : color2;
          ctx.fillRect(cellX, cellY, cellW, cellH);

          // Líneas divisorias de módulos si está habilitado
          if (state.settings.showModuleGrid) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX + 0.5, cellY + 0.5, cellW - 1, cellH - 1);
          }
        }
      }

      // 2. Borde exterior de la pantalla
      if (isSelected) {
        // Marco de selección brillante (cian)
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, widthPx - 3, heightPx - 3);

        // Manijas en las esquinas
        this.drawHandle(ctx, x, y);
        this.drawHandle(ctx, x + widthPx, y);
        this.drawHandle(ctx, x, y + heightPx);
        this.drawHandle(ctx, x + widthPx, y + heightPx);
      } else {
        // Borde neutral
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, widthPx - 1, heightPx - 1);
      }

      // 3. Etiqueta centrada en texto blanco
      if (state.settings.showLabels) {
        this.renderScreenLabels(ctx, screen);
      }

      ctx.restore();
    },

    /**
     * Dibuja los textos de etiqueta y especificaciones técnicas centrados en la pantalla.
     */
    renderScreenLabels(ctx, screen) {
      const { x, y, widthPx, heightPx, label, location, pitch, cols, rows } = screen;
      const centerX = x + widthPx / 2;
      const centerY = y + heightPx / 2;

      // Tamaño de fuente escalonado según el tamaño de la pantalla
      const baseFontSize = Math.max(14, Math.min(64, Math.floor(Math.min(widthPx, heightPx) / 6)));
      
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Etiqueta principal (blanco con sombra y contorno para legibilidad en cualquier color)
      ctx.font = `bold ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      
      // Sombra oscura y trazo para contraste
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 8;
      ctx.lineWidth = Math.max(3, baseFontSize / 7);
      ctx.strokeStyle = "#000000";
      ctx.strokeText(label, centerX, state.settings.showSublabels ? centerY - baseFontSize * 0.45 : centerY);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, centerX, state.settings.showSublabels ? centerY - baseFontSize * 0.45 : centerY);

      // Sub-etiqueta con información técnica (resolución, pitch, módulos)
      if (state.settings.showSublabels && heightPx >= 70 && widthPx >= 90) {
        const subFontSize = Math.max(10, Math.floor(baseFontSize * 0.38));
        ctx.font = `600 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.shadowBlur = 4;
        ctx.lineWidth = 2.5;
        
        const line1 = `${location} • P${pitch} mm`;
        const line2 = `${widthPx}×${heightPx} px (${cols}×${rows} mod)`;

        const line1Y = centerY + baseFontSize * 0.35;
        const line2Y = line1Y + subFontSize * 1.35;

        ctx.strokeStyle = "#000000";
        ctx.strokeText(line1, centerX, line1Y);
        ctx.strokeText(line2, centerX, line2Y);

        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(line1, centerX, line1Y);
        ctx.fillText(line2, centerX, line2Y);
      }
    },

    drawHandle(ctx, hx, hy) {
      const size = 6;
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
    },

    renderSnapGuides(ctx) {
      if (!state.interaction.activeSnapLines || state.interaction.activeSnapLines.length === 0) return;

      ctx.save();
      ctx.strokeStyle = "#06b6d4"; // Cian brillante para alineación
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      state.interaction.activeSnapLines.forEach(line => {
        ctx.beginPath();
        if (line.type === "vertical") {
          ctx.moveTo(line.val + 0.5, 0);
          ctx.lineTo(line.val + 0.5, state.canvas.computedHeight);
        } else if (line.type === "horizontal") {
          ctx.moveTo(0, line.val + 0.5);
          ctx.lineTo(state.canvas.computedWidth, line.val + 0.5);
        }
        ctx.stroke();
      });

      ctx.restore();
    }
  };


  /* ===========================================================================
   * 5. VIEWPORT ENGINE (Zoom, Pan y Espacio de Trabajo)
   * ===========================================================================
   */
  const ViewportEngine = {
    workspace: null,
    stage: null,

    init(workspaceEl, stageEl) {
      this.workspace = workspaceEl;
      this.stage = stageEl;
      this.bindEvents();
      this.updateTransform();
    },

    updateTransform() {
      if (!this.stage) return;
      const { zoom, panX, panY } = state.viewport;
      this.stage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;

      const zoomText = document.getElementById("hud-zoom-level");
      if (zoomText) {
        zoomText.textContent = `${Math.round(zoom * 100)}%`;
      }
    },

    setZoom(newZoom, centerX, centerY) {
      const clampedZoom = Math.min(5.0, Math.max(0.05, newZoom));
      const oldZoom = state.viewport.zoom;

      if (centerX !== undefined && centerY !== undefined) {
        // Zoom centrado hacia el cursor del mouse
        state.viewport.panX = centerX - (centerX - state.viewport.panX) * (clampedZoom / oldZoom);
        state.viewport.panY = centerY - (centerY - state.viewport.panY) * (clampedZoom / oldZoom);
      }

      state.viewport.zoom = clampedZoom;
      this.updateTransform();
    },

    zoomBy(delta, clientX, clientY) {
      let cx = clientX;
      let cy = clientY;

      if (cx === undefined || cy === undefined) {
        const rect = this.workspace.getBoundingClientRect();
        cx = rect.left + rect.width / 2;
        cy = rect.top + rect.height / 2;
      }

      const factor = delta > 0 ? 1.15 : 0.85;
      this.setZoom(state.viewport.zoom * factor, cx, cy);
    },

    zoom100() {
      const rect = this.workspace.getBoundingClientRect();
      this.setZoom(1.0, rect.left + rect.width / 2, rect.top + rect.height / 2);
    },

    zoomToFit() {
      RenderEngine.computeCanvasBounds();
      const rect = this.workspace.getBoundingClientRect();
      const cw = state.canvas.computedWidth;
      const ch = state.canvas.computedHeight;

      const padding = 60;
      const availableW = rect.width - padding * 2;
      const availableH = rect.height - padding * 2;

      const scaleX = availableW / cw;
      const scaleY = availableH / ch;
      const fitZoom = Math.min(1.0, Math.min(scaleX, scaleY));

      state.viewport.zoom = Math.max(0.05, fitZoom);
      state.viewport.panX = (rect.width - cw * state.viewport.zoom) / 2;
      state.viewport.panY = (rect.height - ch * state.viewport.zoom) / 2;
      this.updateTransform();
    },

    clientToCanvasCoords(clientX, clientY) {
      const rect = this.stage.getBoundingClientRect();
      const zoom = state.viewport.zoom;
      return {
        x: Math.round((clientX - rect.left) / zoom),
        y: Math.round((clientY - rect.top) / zoom)
      };
    },

    bindEvents() {
      const ws = this.workspace;

      // 1. Rueda del ratón para Zoom
      ws.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY);
        this.zoomBy(delta, e.clientX, e.clientY);
      }, { passive: false });

      // 2. Pan (con botón central o tecla Espacio + botón izquierdo)
      let isSpacePressed = false;
      window.addEventListener("keydown", (e) => {
        if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          isSpacePressed = true;
          ws.classList.add("panning");
        }
      });
      window.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
          isSpacePressed = false;
          ws.classList.remove("panning");
        }
      });

      ws.addEventListener("mousedown", (e) => {
        const isMiddleClick = e.button === 1;
        const isSpaceDrag = isSpacePressed && e.button === 0;

        if (isMiddleClick || isSpaceDrag) {
          e.preventDefault();
          state.viewport.isPanning = true;
          state.viewport.startPanX = e.clientX - state.viewport.panX;
          state.viewport.startPanY = e.clientY - state.viewport.panY;
          ws.classList.add("is-panning");
        }
      });

      window.addEventListener("mousemove", (e) => {
        if (state.viewport.isPanning) {
          state.viewport.panX = e.clientX - state.viewport.startPanX;
          state.viewport.panY = e.clientY - state.viewport.startPanY;
          this.updateTransform();
        }

        // Actualizar coordenadas HUD del cursor en el canvas
        const canvasCoords = this.clientToCanvasCoords(e.clientX, e.clientY);
        const cursorEl = document.getElementById("hud-cursor-coords");
        if (cursorEl) {
          cursorEl.textContent = `X: ${canvasCoords.x}, Y: ${canvasCoords.y} px`;
        }
      });

      window.addEventListener("mouseup", (e) => {
        if (state.viewport.isPanning) {
          state.viewport.isPanning = false;
          ws.classList.remove("is-panning");
        }
      });
    }
  };


  /* ===========================================================================
   * 6. INTERACTION ENGINE (Arrastre, Selección y Snap Magnético)
   * ===========================================================================
   */
  const InteractionEngine = {
    init() {
      const stage = ViewportEngine.stage;
      const ws = ViewportEngine.workspace;
      if (!stage || !ws) return;

      stage.addEventListener("mousedown", (e) => this.onMouseDown(e));
      window.addEventListener("mousemove", (e) => this.onMouseMove(e));
      window.addEventListener("mouseup", (e) => this.onMouseUp(e));
    },

    getScreenAt(canvasX, canvasY) {
      // Buscar de atrás hacia adelante para seleccionar la pantalla superior
      for (let i = state.screens.length - 1; i >= 0; i--) {
        const s = state.screens[i];
        if (
          canvasX >= s.x &&
          canvasX <= s.x + s.widthPx &&
          canvasY >= s.y &&
          canvasY <= s.y + s.heightPx
        ) {
          return s;
        }
      }
      return null;
    },

    onMouseDown(e) {
      if (e.button !== 0 || e.spaceKey) return; // Solo clic primario sin espacio

      const pos = ViewportEngine.clientToCanvasCoords(e.clientX, e.clientY);
      const clickedScreen = this.getScreenAt(pos.x, pos.y);

      if (clickedScreen) {
        state.selectedScreenId = clickedScreen.id;
        state.interaction.draggingScreenId = clickedScreen.id;
        state.interaction.dragOffsetX = pos.x - clickedScreen.x;
        state.interaction.dragOffsetY = pos.y - clickedScreen.y;
        state.interaction.hasMoved = false;

        UIController.updateActiveScreenForm();
        RenderEngine.render();
      } else {
        // Clic en fondo vacío del canvas: deselecciona y activa panning rápido
        state.selectedScreenId = null;
        UIController.updateActiveScreenForm();
        RenderEngine.render();

        // Iniciar panning por clic en fondo
        state.viewport.isPanning = true;
        state.viewport.startPanX = e.clientX - state.viewport.panX;
        state.viewport.startPanY = e.clientY - state.viewport.panY;
        ViewportEngine.workspace.classList.add("is-panning");
      }
    },

    onMouseMove(e) {
      if (!state.interaction.draggingScreenId) return;

      const screen = state.screens.find(s => s.id === state.interaction.draggingScreenId);
      if (!screen) return;

      state.interaction.hasMoved = true;
      const pos = ViewportEngine.clientToCanvasCoords(e.clientX, e.clientY);

      let targetX = pos.x - state.interaction.dragOffsetX;
      let targetY = pos.y - state.interaction.dragOffsetY;

      // Aplicar Snap Magnético si está habilitado
      state.interaction.activeSnapLines = [];

      if (state.settings.snapEnabled) {
        const snapThreshold = 12; // Píxeles de tolerancia magnética

        // 1. Snap a módulo del propio panel
        const modW = Math.round(screen.modPxW) || 50;
        const modH = Math.round(screen.modPxH) || 50;
        const nearestModX = Math.round(targetX / modW) * modW;
        const nearestModY = Math.round(targetY / modH) * modH;

        if (Math.abs(targetX - nearestModX) < snapThreshold) {
          targetX = nearestModX;
        }
        if (Math.abs(targetY - nearestModY) < snapThreshold) {
          targetY = nearestModY;
        }

        // 2. Snap a bordes de otras pantallas (alineación magnética CAD)
        state.screens.forEach(other => {
          if (other.id === screen.id) return;

          // Alineación Horizontal (X)
          const edgesX = [
            { val: other.x, snapTo: other.x }, // Izq con Izq
            { val: other.x + other.widthPx, snapTo: other.x + other.widthPx }, // Izq con Der
            { val: other.x - screen.widthPx, snapTo: other.x }, // Der con Izq
            { val: other.x + other.widthPx - screen.widthPx, snapTo: other.x + other.widthPx } // Der con Der
          ];

          edgesX.forEach(edge => {
            if (Math.abs(targetX - edge.val) < snapThreshold) {
              targetX = edge.val;
              state.interaction.activeSnapLines.push({ type: "vertical", val: edge.snapTo });
            }
          });

          // Alineación Vertical (Y)
          const edgesY = [
            { val: other.y, snapTo: other.y }, // Arriba con Arriba
            { val: other.y + other.heightPx, snapTo: other.y + other.heightPx }, // Arriba con Abajo
            { val: other.y - screen.heightPx, snapTo: other.y }, // Abajo con Arriba
            { val: other.y + other.heightPx - screen.heightPx, snapTo: other.y + other.heightPx } // Abajo con Abajo
          ];

          edgesY.forEach(edge => {
            if (Math.abs(targetY - edge.val) < snapThreshold) {
              targetY = edge.val;
              state.interaction.activeSnapLines.push({ type: "horizontal", val: edge.snapTo });
            }
          });
        });

        // 3. Snap al origen (0,0)
        if (Math.abs(targetX) < snapThreshold) {
          targetX = 0;
          state.interaction.activeSnapLines.push({ type: "vertical", val: 0 });
        }
        if (Math.abs(targetY) < snapThreshold) {
          targetY = 0;
          state.interaction.activeSnapLines.push({ type: "horizontal", val: 0 });
        }
      }

      // Restringir a coordenadas no negativas para evitar desplazamientos fuera del raster
      screen.x = Math.max(0, Math.round(targetX));
      screen.y = Math.max(0, Math.round(targetY));

      // Sincronizar inputs de posición X / Y en el panel
      const inputX = document.getElementById("screen-pos-x");
      const inputY = document.getElementById("screen-pos-y");
      if (inputX) inputX.value = screen.x;
      if (inputY) inputY.value = screen.y;

      RenderEngine.render();
    },

    onMouseUp() {
      if (state.interaction.draggingScreenId) {
        state.interaction.draggingScreenId = null;
        state.interaction.activeSnapLines = [];
        RenderEngine.render();
        if (state.interaction.hasMoved) {
          Persistence.saveAuto();
        }
      }
    }
  };


  /* ===========================================================================
   * 7. UI CONTROLLER (Formularios, Tabla Resumen, Settings y V2)
   * ===========================================================================
   */
  const UIController = {
    init() {
      this.bindTabNavigation();
      this.bindTopbarControls();
      this.bindScreenListControls();
      this.bindSettingsControls();
      this.bindLandingScreen();
      this.renderLocationsList();
      this.updateScreensSelector();
      this.updateActiveScreenForm();
      this.updateSummaryTable();
    },

    bindLandingScreen() {
      const landing = document.getElementById("landing-screen");
      const enterBtn = document.getElementById("btn-enter-app");
      const showLandingBtn = document.getElementById("btn-show-landing");

      if (enterBtn && landing) {
        enterBtn.addEventListener("click", () => {
          landing.classList.add("hidden");
          setTimeout(() => {
            ViewportEngine.zoomToFit();
          }, 100);
        });
      }

      if (showLandingBtn && landing) {
        showLandingBtn.addEventListener("click", () => {
          landing.classList.remove("hidden");
        });
      }
    },

    bindTabNavigation() {
      const tabs = document.querySelectorAll(".tab-btn");
      tabs.forEach(tab => {
        tab.addEventListener("click", () => {
          tabs.forEach(t => t.classList.remove("active"));
          document.querySelectorAll(".sidebar-tab-content").forEach(c => c.classList.remove("active"));

          tab.classList.add("active");
          const targetId = tab.dataset.tab;
          const targetContent = document.getElementById(targetId);
          if (targetContent) {
            targetContent.classList.add("active");
          }
          if (targetId === "tab-summary") {
            this.updateSummaryTable();
          }
        });
      });
    },

    bindTopbarControls() {
      // Modo de Lienzo (Auto / Manual)
      const modeSelect = document.getElementById("canvas-mode-select");
      const manualDims = document.getElementById("manual-canvas-dimensions");
      const inputW = document.getElementById("canvas-width-input");
      const inputH = document.getElementById("canvas-height-input");
      const presetsSelect = document.getElementById("canvas-presets-select");
      const snapCheck = document.getElementById("snap-enabled");

      modeSelect.value = state.canvas.mode;
      inputW.value = state.canvas.manualWidth;
      inputH.value = state.canvas.manualHeight;

      modeSelect.addEventListener("change", (e) => {
        state.canvas.mode = e.target.value;
        if (state.canvas.mode === "manual") {
          manualDims.classList.remove("hidden");
        } else {
          manualDims.classList.add("hidden");
        }
        RenderEngine.render();
        Persistence.saveAuto();
      });

      inputW.addEventListener("change", (e) => {
        state.canvas.manualWidth = Math.max(100, parseInt(e.target.value, 10) || 1920);
        RenderEngine.render();
        Persistence.saveAuto();
      });

      inputH.addEventListener("change", (e) => {
        state.canvas.manualHeight = Math.max(100, parseInt(e.target.value, 10) || 1080);
        RenderEngine.render();
        Persistence.saveAuto();
      });

      presetsSelect.addEventListener("change", (e) => {
        if (!e.target.value) return;
        const [pw, ph] = e.target.value.split("x").map(Number);
        inputW.value = pw;
        inputH.value = ph;
        state.canvas.manualWidth = pw;
        state.canvas.manualHeight = ph;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      snapCheck.checked = state.settings.snapEnabled;
      snapCheck.addEventListener("change", (e) => {
        state.settings.snapEnabled = e.target.checked;
        Persistence.saveAuto();
      });

      // HUD Zoom Buttons
      document.getElementById("btn-zoom-in").addEventListener("click", () => ViewportEngine.zoomBy(1));
      document.getElementById("btn-zoom-out").addEventListener("click", () => ViewportEngine.zoomBy(-1));
      document.getElementById("btn-zoom-100").addEventListener("click", () => ViewportEngine.zoom100());
      document.getElementById("btn-zoom-fit").addEventListener("click", () => ViewportEngine.zoomToFit());
    },

    bindScreenListControls() {
      const select = document.getElementById("active-screen-select");
      const addBtn = document.getElementById("btn-add-screen");
      const dupBtn = document.getElementById("btn-duplicate-screen");
      const delBtn = document.getElementById("btn-delete-screen");

      select.addEventListener("change", (e) => {
        state.selectedScreenId = e.target.value;
        this.updateActiveScreenForm();
        RenderEngine.render();
      });

      addBtn.addEventListener("click", () => {
        this.addNewScreen();
      });

      dupBtn.addEventListener("click", () => {
        this.duplicateSelectedScreen();
      });

      delBtn.addEventListener("click", () => {
        this.deleteSelectedScreen();
      });
    },

    bindSettingsControls() {
      const chkGrid = document.getElementById("opt-show-module-grid");
      const chkLabels = document.getElementById("opt-show-labels");
      const chkSublabels = document.getElementById("opt-show-sublabels");
      const selBg = document.getElementById("opt-export-bg");

      chkGrid.checked = state.settings.showModuleGrid;
      chkLabels.checked = state.settings.showLabels;
      chkSublabels.checked = state.settings.showSublabels;
      selBg.value = state.settings.exportBackground;

      chkGrid.addEventListener("change", (e) => {
        state.settings.showModuleGrid = e.target.checked;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      chkLabels.addEventListener("change", (e) => {
        state.settings.showLabels = e.target.checked;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      chkSublabels.addEventListener("change", (e) => {
        state.settings.showSublabels = e.target.checked;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      selBg.addEventListener("change", (e) => {
        state.settings.exportBackground = e.target.value;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // Agregar ubicación
      const btnAddLoc = document.getElementById("btn-add-location");
      const inputLoc = document.getElementById("input-new-location");

      const handleAddLoc = () => {
        const val = inputLoc.value.trim();
        if (val && !state.locations.includes(val)) {
          state.locations.push(val);
          inputLoc.value = "";
          this.renderLocationsList();
          this.updateActiveScreenForm();
          Persistence.saveAuto();
        }
      };

      btnAddLoc.addEventListener("click", handleAddLoc);
      inputLoc.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleAddLoc();
      });

      // Restaurar layout de cruz inicial
      document.getElementById("btn-reset-layout").addEventListener("click", () => {
        if (confirm("¿Restaurar el layout inicial de cruz desplegada? Se sobrescribirá el proyecto actual.")) {
          state.screens = JSON.parse(JSON.stringify(DEFAULT_INITIAL_SCREENS));
          state.screens.forEach(s => CalcEngine.recalculate(s));
          state.selectedScreenId = state.screens[0].id;
          this.updateScreensSelector();
          this.updateActiveScreenForm();
          this.updateSummaryTable();
          RenderEngine.render();
          ViewportEngine.zoomToFit();
          Persistence.saveAuto();
        }
      });

      // Limpiar proyecto
      document.getElementById("btn-clear-project").addEventListener("click", () => {
        if (confirm("¿Borrar todas las pantallas del lienzo?")) {
          state.screens = [];
          state.selectedScreenId = null;
          this.updateScreensSelector();
          this.updateActiveScreenForm();
          this.updateSummaryTable();
          RenderEngine.render();
          Persistence.saveAuto();
        }
      });
    },

    renderLocationsList() {
      const container = document.getElementById("locations-tag-list");
      if (!container) return;

      container.innerHTML = "";
      state.locations.forEach((loc, index) => {
        const tag = document.createElement("span");
        tag.className = "location-tag";
        tag.innerHTML = `
          <span>${loc}</span>
          <button class="location-tag-remove" data-index="${index}" title="Eliminar ubicación">×</button>
        `;
        container.appendChild(tag);
      });

      container.querySelectorAll(".location-tag-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.target.dataset.index, 10);
          state.locations.splice(idx, 1);
          this.renderLocationsList();
          this.updateActiveScreenForm();
          Persistence.saveAuto();
        });
      });
    },

    updateScreensSelector() {
      const select = document.getElementById("active-screen-select");
      const badge = document.getElementById("screens-count-badge");
      if (!select) return;

      select.innerHTML = "";
      state.screens.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.label} (${s.location}) - ${s.widthPx}×${s.heightPx} px`;
        select.appendChild(opt);
      });

      if (!state.selectedScreenId && state.screens.length > 0) {
        state.selectedScreenId = state.screens[0].id;
      }
      select.value = state.selectedScreenId || "";

      if (badge) {
        badge.textContent = state.screens.length;
      }
    },

    /**
     * Renderiza el formulario de la pantalla activa.
     */
    updateActiveScreenForm() {
      const formContainer = document.getElementById("screen-editor-form");
      const select = document.getElementById("active-screen-select");
      if (!formContainer) return;

      if (select) {
        select.value = state.selectedScreenId || "";
      }

      const screen = state.screens.find(s => s.id === state.selectedScreenId);
      if (!screen) {
        formContainer.innerHTML = `
          <div class="editor-card" style="text-align: center; padding: 32px 16px;">
            <p style="color: var(--text-muted); margin-bottom: 12px;">No hay pantallas seleccionadas o el lienzo está vacío.</p>
            <button id="btn-add-screen-empty" class="btn btn-primary btn-sm">➕ Agregar Pantalla</button>
          </div>
        `;
        const addEmptyBtn = document.getElementById("btn-add-screen-empty");
        if (addEmptyBtn) {
          addEmptyBtn.addEventListener("click", () => this.addNewScreen());
        }
        return;
      }

      // Ejecutar motor de cálculo y obtener advertencias
      const { warnings, isExact } = CalcEngine.recalculate(screen);

      // Opciones del selector de ubicación
      const locationOptions = state.locations
        .map(loc => `<option value="${loc}" ${screen.location === loc ? "selected" : ""}>${loc}</option>`)
        .join("");

      formContainer.innerHTML = `
        <!-- Identificación -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Identificación</span>
            <span class="badge">ID: ${screen.id}</span>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-label">Etiqueta</label>
              <input type="text" id="screen-label" class="form-input" value="${screen.label}" placeholder="ej: C, i1, d1, fondo">
            </div>
            <div class="form-group">
              <label for="screen-location">Ubicación</label>
              <select id="screen-location" class="form-select">
                ${locationOptions}
                <option value="__custom__">+ Nueva ubicación...</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Modo de Cálculo Fijo -->
        <div class="editor-card fixed-mode-box">
          <div class="form-group">
            <label for="screen-fixed-mode">
              <span>Dato Fijo (Vínculo Bidireccional)</span>
            </label>
            <select id="screen-fixed-mode" class="form-select">
              <option value="pitch_m" ${screen.fixedMode === "pitch_m" ? "selected" : ""}>Fijo Pitch + Metros (Calcula Píxeles)</option>
              <option value="pitch_px" ${screen.fixedMode === "pitch_px" ? "selected" : ""}>Fijo Pitch + Píxeles (Calcula Metros)</option>
              <option value="m_px" ${screen.fixedMode === "m_px" ? "selected" : ""}>Fijo Metros + Píxeles (Calcula Pitch real)</option>
            </select>
          </div>
        </div>

        <!-- Variables Principales: Pitch, Metros y Píxeles -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Dimensiones & Resolución</span>
          </div>

          <div class="form-group">
            <label for="screen-pitch">
              <span>Pixel Pitch</span>
              <span class="label-unit">mm</span>
            </label>
            <input type="number" id="screen-pitch" class="form-input" step="0.01" min="0.1" value="${screen.pitch}" ${screen.fixedMode === "m_px" ? "readonly" : ""}>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-width-m">
                <span>Ancho</span>
                <span class="label-unit">metros</span>
              </label>
              <input type="number" id="screen-width-m" class="form-input" step="0.01" min="0.01" value="${screen.widthM}" ${screen.fixedMode === "pitch_px" ? "readonly" : ""}>
            </div>
            <div class="form-group">
              <label for="screen-height-m">
                <span>Alto</span>
                <span class="label-unit">metros</span>
              </label>
              <input type="number" id="screen-height-m" class="form-input" step="0.01" min="0.01" value="${screen.heightM}" ${screen.fixedMode === "pitch_px" ? "readonly" : ""}>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-width-px">
                <span>Ancho</span>
                <span class="label-unit">píxeles (enteros)</span>
              </label>
              <input type="number" id="screen-width-px" class="form-input" step="1" min="1" value="${screen.widthPx}" ${screen.fixedMode === "pitch_m" ? "readonly" : ""}>
            </div>
            <div class="form-group">
              <label for="screen-height-px">
                <span>Alto</span>
                <span class="label-unit">píxeles (enteros)</span>
              </label>
              <input type="number" id="screen-height-px" class="form-input" step="1" min="1" value="${screen.heightPx}" ${screen.fixedMode === "pitch_m" ? "readonly" : ""}>
            </div>
          </div>

          <!-- Alerta de cálculo y estado de exactitud -->
          <div id="calc-alert-box" class="calc-alert ${isExact ? "exact" : "warning"}">
            <span class="calc-alert-icon">${isExact ? "✓" : "⚠️"}</span>
            <div id="calc-alert-text">
              ${isExact 
                ? "<strong>Cálculo exacto:</strong> Píxeles enteros y coincide con módulos." 
                : `<strong>Avisos:</strong><br>${warnings.join("<br>")}`
              }
            </div>
          </div>
        </div>

        <!-- Módulos y Damero -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Módulos de Gabinete (Cols × Filas)</span>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-mod-w">
                <span>Gabinete Ancho</span>
                <span class="label-unit">m</span>
              </label>
              <input type="number" id="screen-mod-w" class="form-input" step="0.01" min="0.01" value="${screen.moduleWidthM}">
            </div>
            <div class="form-group">
              <label for="screen-mod-h">
                <span>Gabinete Alto</span>
                <span class="label-unit">m</span>
              </label>
              <input type="number" id="screen-mod-h" class="form-input" step="0.01" min="0.01" value="${screen.moduleHeightM}">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-cols">Columnas</label>
              <input type="number" id="screen-cols" class="form-input" step="1" min="1" value="${screen.cols}">
            </div>
            <div class="form-group">
              <label for="screen-rows">Filas</label>
              <input type="number" id="screen-rows" class="form-input" step="1" min="1" value="${screen.rows}">
            </div>
          </div>

          <button id="btn-sync-modules" class="btn btn-secondary btn-sm" title="Ajustar metros para que coincidan exactamente con la cantidad de módulos">
            <span>📐</span> Ajustar tamaño a estos módulos
          </button>
        </div>

        <!-- Colores del Damero -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Colores del Damero</span>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Color 1</label>
              <div class="color-picker-pair">
                <input type="color" id="screen-color1-picker" class="color-input-native" value="${screen.color1}">
                <input type="text" id="screen-color1-hex" class="color-input-hex" value="${screen.color1}" maxlength="7">
              </div>
            </div>
            <div class="form-group">
              <label>Color 2</label>
              <div class="color-picker-pair">
                <input type="color" id="screen-color2-picker" class="color-input-native" value="${screen.color2}">
                <input type="text" id="screen-color2-hex" class="color-input-hex" value="${screen.color2}" maxlength="7">
              </div>
            </div>
          </div>
        </div>

        <!-- Posicionamiento en Lienzo (X, Y en px) -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Posición en Lienzo</span>
            <span class="label-unit">píxeles reales</span>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-pos-x">Posición X</label>
              <input type="number" id="screen-pos-x" class="form-input" step="1" value="${screen.x}">
            </div>
            <div class="form-group">
              <label for="screen-pos-y">Posición Y</label>
              <input type="number" id="screen-pos-y" class="form-input" step="1" value="${screen.y}">
            </div>
          </div>
        </div>
      `;

      // Eventos del formulario para sincronización en tiempo real sin perder foco
      this.attachFormEvents(screen);
    },

    /**
     * Sincroniza dinámicamente los campos dependientes sin recrear el DOM,
     * garantizando que el usuario nunca pierda el foco ni la posición del cursor mientras escribe.
     */
    syncFormValues(screen) {
      const getEl = id => document.getElementById(id);
      const { warnings, isExact } = CalcEngine.recalculate(screen);

      const pitchEl = getEl("screen-pitch");
      const wmEl = getEl("screen-width-m");
      const hmEl = getEl("screen-height-m");
      const wpxEl = getEl("screen-width-px");
      const hpxEl = getEl("screen-height-px");
      const colsEl = getEl("screen-cols");
      const rowsEl = getEl("screen-rows");
      const alertBox = getEl("calc-alert-box");
      const alertText = getEl("calc-alert-text");

      // Actualizar solo los campos que no tienen foco actualmente
      if (pitchEl && document.activeElement !== pitchEl) pitchEl.value = screen.pitch;
      if (wmEl && document.activeElement !== wmEl) wmEl.value = screen.widthM;
      if (hmEl && document.activeElement !== hmEl) hmEl.value = screen.heightM;
      if (wpxEl && document.activeElement !== wpxEl) wpxEl.value = screen.widthPx;
      if (hpxEl && document.activeElement !== hpxEl) hpxEl.value = screen.heightPx;
      if (colsEl && document.activeElement !== colsEl) colsEl.value = screen.cols;
      if (rowsEl && document.activeElement !== rowsEl) rowsEl.value = screen.rows;

      // Actualizar caja de alerta
      if (alertBox && alertText) {
        alertBox.className = `calc-alert ${isExact ? "exact" : "warning"}`;
        const iconSpan = alertBox.querySelector(".calc-alert-icon");
        if (iconSpan) iconSpan.textContent = isExact ? "✓" : "⚠️";
        alertText.innerHTML = isExact 
          ? "<strong>Cálculo exacto:</strong> Píxeles enteros y coincide con módulos." 
          : `<strong>Avisos:</strong><br>${warnings.join("<br>")}`;
      }

      this.updateScreensSelector();
      this.updateSummaryTable();
      RenderEngine.render();
      Persistence.saveAuto();
    },

    attachFormEvents(screen) {
      const getEl = id => document.getElementById(id);

      // 1. Etiqueta
      getEl("screen-label").addEventListener("input", (e) => {
        screen.label = e.target.value;
        this.updateScreensSelector();
        this.updateSummaryTable();
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // 2. Ubicación
      getEl("screen-location").addEventListener("change", (e) => {
        if (e.target.value === "__custom__") {
          const newLoc = prompt("Ingresa el nombre de la nueva ubicación (ej: Tótem, Pasarela, Torre):");
          if (newLoc && newLoc.trim()) {
            const trimmed = newLoc.trim();
            if (!state.locations.includes(trimmed)) {
              state.locations.push(trimmed);
              this.renderLocationsList();
            }
            screen.location = trimmed;
          }
          this.updateActiveScreenForm();
        } else {
          screen.location = e.target.value;
        }
        this.updateScreensSelector();
        this.updateSummaryTable();
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // 3. Dato Fijo (fixedMode)
      getEl("screen-fixed-mode").addEventListener("change", (e) => {
        screen.fixedMode = e.target.value;
        this.updateActiveScreenForm();
        this.updateSummaryTable();
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // 4. Pitch
      getEl("screen-pitch").addEventListener("input", (e) => {
        screen.pitch = parseFloat(e.target.value) || 2.5;
        this.syncFormValues(screen);
      });

      // 5. Metros W y H
      getEl("screen-width-m").addEventListener("input", (e) => {
        screen.widthM = parseFloat(e.target.value) || 1.0;
        this.syncFormValues(screen);
      });

      getEl("screen-height-m").addEventListener("input", (e) => {
        screen.heightM = parseFloat(e.target.value) || 1.0;
        this.syncFormValues(screen);
      });

      // 6. Píxeles W y H
      getEl("screen-width-px").addEventListener("input", (e) => {
        screen.widthPx = parseInt(e.target.value, 10) || 100;
        this.syncFormValues(screen);
      });

      getEl("screen-height-px").addEventListener("input", (e) => {
        screen.heightPx = parseInt(e.target.value, 10) || 100;
        this.syncFormValues(screen);
      });

      // 7. Tamaño de módulo (ancho y alto de gabinete)
      getEl("screen-mod-w").addEventListener("input", (e) => {
        screen.moduleWidthM = parseFloat(e.target.value) || 0.50;
        this.syncFormValues(screen);
      });

      getEl("screen-mod-h").addEventListener("input", (e) => {
        screen.moduleHeightM = parseFloat(e.target.value) || 1.00;
        this.syncFormValues(screen);
      });

      // 8. Cantidad de módulos (columnas y filas)
      const btnSync = getEl("btn-sync-modules");
      const handleSyncModules = () => {
        const c = parseInt(getEl("screen-cols").value, 10) || 1;
        const r = parseInt(getEl("screen-rows").value, 10) || 1;
        CalcEngine.setModulesCount(screen, c, r);
        this.syncFormValues(screen);
      };

      btnSync.addEventListener("click", handleSyncModules);
      getEl("screen-cols").addEventListener("change", handleSyncModules);
      getEl("screen-rows").addEventListener("change", handleSyncModules);

      // 9. Colores Damero (Pickers y Hex)
      const col1Picker = getEl("screen-color1-picker");
      const col1Hex = getEl("screen-color1-hex");
      const col2Picker = getEl("screen-color2-picker");
      const col2Hex = getEl("screen-color2-hex");

      col1Picker.addEventListener("input", (e) => {
        screen.color1 = e.target.value;
        col1Hex.value = e.target.value;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      col1Hex.addEventListener("change", (e) => {
        const val = e.target.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          screen.color1 = val;
          col1Picker.value = val;
          RenderEngine.render();
          Persistence.saveAuto();
        }
      });

      col2Picker.addEventListener("input", (e) => {
        screen.color2 = e.target.value;
        col2Hex.value = e.target.value;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      col2Hex.addEventListener("change", (e) => {
        const val = e.target.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          screen.color2 = val;
          col2Picker.value = val;
          RenderEngine.render();
          Persistence.saveAuto();
        }
      });

      // 10. Posición X e Y manual
      getEl("screen-pos-x").addEventListener("input", (e) => {
        screen.x = Math.max(0, parseInt(e.target.value, 10) || 0);
        RenderEngine.render();
        Persistence.saveAuto();
      });

      getEl("screen-pos-y").addEventListener("input", (e) => {
        screen.y = Math.max(0, parseInt(e.target.value, 10) || 0);
        RenderEngine.render();
        Persistence.saveAuto();
      });
    },

    /**
     * Actualiza la tabla resumen con módulos, px/mód, resolución y metros por pantalla.
     */
    updateSummaryTable() {
      const tbody = document.getElementById("summary-table-body");
      const totalsEl = document.getElementById("summary-totals");
      if (!tbody) return;

      tbody.innerHTML = "";

      let totalModules = 0;
      let totalPixels = 0;
      let totalAreaM2 = 0;

      state.screens.forEach(screen => {
        const { warnings, isExact } = CalcEngine.recalculate(screen);

        const modCount = screen.cols * screen.rows;
        const totalPx = screen.widthPx * screen.heightPx;
        const areaM2 = screen.widthM * screen.heightM;

        totalModules += modCount;
        totalPixels += totalPx;
        totalAreaM2 += areaM2;

        const row = document.createElement("tr");
        row.style.cursor = "pointer";
        if (screen.id === state.selectedScreenId) {
          row.style.background = "rgba(59, 130, 246, 0.12)";
        }

        row.innerHTML = `
          <td><span class="tag-label">${screen.label}</span></td>
          <td>${screen.location}</td>
          <td>${screen.pitch} mm</td>
          <td>${screen.cols} × ${screen.rows} (${modCount} mod)</td>
          <td>${Math.round(screen.modPxW)} × ${Math.round(screen.modPxH)} px</td>
          <td><strong>${screen.widthPx} × ${screen.heightPx}</strong> px</td>
          <td>${screen.widthM.toFixed(2)} × ${screen.heightM.toFixed(2)} m</td>
          <td>
            <span class="status-badge ${isExact ? "exact" : "warning"}" title="${warnings.join(" | ")}">
              ${isExact ? "✓ Exacto" : "⚠️ Redondeo"}
            </span>
          </td>
        `;

        row.addEventListener("click", () => {
          state.selectedScreenId = screen.id;
          this.updateScreensSelector();
          this.updateActiveScreenForm();
          this.updateSummaryTable();
          RenderEngine.render();
        });

        tbody.appendChild(row);
      });

      if (totalsEl) {
        totalsEl.innerHTML = `
          <div class="total-stat">
            <span class="total-stat-val">${state.screens.length}</span>
            <span class="total-stat-lbl">Pantallas</span>
          </div>
          <div class="total-stat">
            <span class="total-stat-val">${totalModules}</span>
            <span class="total-stat-lbl">Módulos Totales</span>
          </div>
          <div class="total-stat">
            <span class="total-stat-val">${(totalPixels / 1000000).toFixed(2)} M</span>
            <span class="total-stat-lbl">Megapíxeles</span>
          </div>
          <div class="total-stat">
            <span class="total-stat-val">${totalAreaM2.toFixed(2)} m²</span>
            <span class="total-stat-lbl">Área Total</span>
          </div>
        `;
      }
    },

    addNewScreen() {
      const palette = DEFAULT_COLOR_PALETTES[state.screens.length % DEFAULT_COLOR_PALETTES.length];
      const newId = `screen_${Date.now()}`;
      const newLabel = `P${state.screens.length + 1}`;

      // Posicionar cerca del centro visible o con offset
      let newX = 100;
      let newY = 100;
      if (state.screens.length > 0) {
        const last = state.screens[state.screens.length - 1];
        newX = last.x + 50;
        newY = last.y + 50;
      }

      const newScreen = {
        id: newId,
        label: newLabel,
        location: state.locations[0] || "Central",
        pitch: 2.5,
        widthM: 2.00,
        heightM: 1.00,
        widthPx: 800,
        heightPx: 400,
        moduleWidthM: 0.50,
        moduleHeightM: 1.00,
        cols: 4,
        rows: 1,
        fixedMode: "pitch_m",
        color1: palette.c1,
        color2: palette.c2,
        x: newX,
        y: newY
      };

      CalcEngine.recalculate(newScreen);
      state.screens.push(newScreen);
      state.selectedScreenId = newId;

      this.updateScreensSelector();
      this.updateActiveScreenForm();
      this.updateSummaryTable();
      RenderEngine.render();
      Persistence.saveAuto();
    },

    duplicateSelectedScreen() {
      const original = state.screens.find(s => s.id === state.selectedScreenId);
      if (!original) return;

      const clone = JSON.parse(JSON.stringify(original));
      clone.id = `screen_${Date.now()}`;
      clone.label = `${original.label}_copia`;
      clone.x += 40;
      clone.y += 40;

      state.screens.push(clone);
      state.selectedScreenId = clone.id;

      this.updateScreensSelector();
      this.updateActiveScreenForm();
      this.updateSummaryTable();
      RenderEngine.render();
      Persistence.saveAuto();
    },

    deleteSelectedScreen() {
      if (!state.selectedScreenId) return;
      const screen = state.screens.find(s => s.id === state.selectedScreenId);
      if (!screen) return;

      if (confirm(`¿Eliminar la pantalla "${screen.label}"?`)) {
        state.screens = state.screens.filter(s => s.id !== state.selectedScreenId);
        state.selectedScreenId = state.screens.length > 0 ? state.screens[0].id : null;

        this.updateScreensSelector();
        this.updateActiveScreenForm();
        this.updateSummaryTable();
        RenderEngine.render();
        Persistence.saveAuto();
      }
    }
  };


  /* ===========================================================================
   * 8. EXPORT & STORAGE (PNG 1:1, JSON y LocalStorage)
   * ===========================================================================
   */
  const Persistence = {
    saveTimeout: null,

    init() {
      this.bindButtons();
      this.loadOnStart();
    },

    bindButtons() {
      // Exportar PNG
      document.getElementById("btn-export-png").addEventListener("click", () => {
        this.exportPNG();
      });

      // Guardar JSON
      document.getElementById("btn-save-json").addEventListener("click", () => {
        this.exportJSON();
      });

      // Cargar JSON
      document.getElementById("input-load-json").addEventListener("change", (e) => {
        this.importJSON(e.target.files[0]);
        e.target.value = "";
      });
    },

    exportPNG() {
      RenderEngine.computeCanvasBounds();
      const w = state.canvas.computedWidth;
      const h = state.canvas.computedHeight;

      // Crear canvas offscreen de alta fidelidad sin escalar
      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const oCtx = offscreen.getContext("2d", { alpha: false });
      oCtx.imageSmoothingEnabled = false;

      // Fondo
      oCtx.fillStyle = state.settings.exportBackground || "#0b0f19";
      oCtx.fillRect(0, 0, w, h);

      // Dibujar pantallas
      state.screens.forEach(screen => {
        RenderEngine.renderScreen(oCtx, screen, false);
      });

      // Generar descarga de imagen
      offscreen.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `led_mapping_grid_${w}x${h}px.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    },

    exportJSON() {
      const projectData = {
        version: "1.0",
        appName: "LED Grid Mapper",
        timestamp: new Date().toISOString(),
        canvas: state.canvas,
        settings: state.settings,
        locations: state.locations,
        screens: state.screens
      };

      const jsonStr = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `led_mapping_project_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    importJSON(file) {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data && Array.isArray(data.screens)) {
            state.screens = data.screens;
            if (data.canvas) state.canvas = { ...state.canvas, ...data.canvas };
            if (data.settings) state.settings = { ...state.settings, ...data.settings };
            if (Array.isArray(data.locations)) state.locations = data.locations;

            state.screens.forEach(s => CalcEngine.recalculate(s));
            state.selectedScreenId = state.screens.length > 0 ? state.screens[0].id : null;

            UIController.renderLocationsList();
            UIController.updateScreensSelector();
            UIController.updateActiveScreenForm();
            UIController.updateSummaryTable();
            RenderEngine.render();
            ViewportEngine.zoomToFit();
            this.saveAuto();

            alert("¡Proyecto cargado exitosamente!");
          } else {
            alert("El archivo JSON no tiene un formato válido de proyecto.");
          }
        } catch (err) {
          alert(`Error al leer el archivo JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    },

    saveAuto() {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        try {
          const projectData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            canvas: state.canvas,
            settings: state.settings,
            locations: state.locations,
            screens: state.screens
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
          
          const statusEl = document.getElementById("autosave-status");
          if (statusEl) {
            statusEl.textContent = `✓ Guardado automático: ${new Date().toLocaleTimeString()}`;
          }
        } catch (e) {
          console.warn("No se pudo autoguardar en localStorage:", e);
        }
      }, 400);
    },

    loadOnStart() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data && Array.isArray(data.screens) && data.screens.length > 0) {
            state.screens = data.screens;
            if (data.canvas) state.canvas = { ...state.canvas, ...data.canvas };
            if (data.settings) state.settings = { ...state.settings, ...data.settings };
            if (Array.isArray(data.locations)) state.locations = data.locations;
            state.screens.forEach(s => CalcEngine.recalculate(s));
            return;
          }
        }
      } catch (e) {
        console.warn("Error leyendo localStorage, cargando layout inicial por defecto:", e);
      }

      // Si no hay datos guardados, cargar layout de cruz desplegada por defecto
      state.screens = JSON.parse(JSON.stringify(DEFAULT_INITIAL_SCREENS));
      state.screens.forEach(s => CalcEngine.recalculate(s));
    }
  };


  /* ===========================================================================
   * 9. INITIALIZATION
   * ===========================================================================
   */
  window.addEventListener("DOMContentLoaded", () => {
    const canvasEl = document.getElementById("mapping-canvas");
    const workspaceEl = document.getElementById("canvas-workspace");
    const stageEl = document.getElementById("canvas-stage");

    // Inicializar subsistemas
    RenderEngine.init(canvasEl);
    ViewportEngine.init(workspaceEl, stageEl);
    InteractionEngine.init();
    Persistence.init();
    UIController.init();

    // Renderizar grilla inicial y ajustar vista al lienzo
    RenderEngine.render();
    setTimeout(() => {
      ViewportEngine.zoomToFit();
    }, 120);

    // Reajustar vista al redimensionar ventana
    window.addEventListener("resize", () => {
      RenderEngine.render();
    });
  });

})();
