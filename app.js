/**
 * =============================================================================
 * LED GRID MAPPER - APLICACIÓN WEB DE MAPPING LED EN PÍXELES REALES
 * =============================================================================
 * Prototipo funcional estático (HTML5 + CSS3 + Vanilla JavaScript)
 * 
 * ETAPA 1: ESTÉTICA SOBRIA, TIPOGRAFÍA INTER, PITCH REAL Y MODOS DE GRILLA
 * =============================================================================
 */

(function () {
  "use strict";

  /* ===========================================================================
   * 1. CONSTANTS & DEFAULTS
   * =========================================================================== */
  const STORAGE_KEY = "led_grid_mapper_project_v1";

  // Fuente principal única para todo el renderizado y la interfaz
  const FONT_MAIN = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';

  // Lista inicial de ubicaciones sugeridas
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

  // Paleta de colores sobrios y saturados para damero (rojos, azules, verdes, ámbar, grises)
  const DEFAULT_COLOR_PALETTES = [
    { c1: "#102a5c", c2: "#1d4ed8" }, // Azul
    { c1: "#4c0519", c2: "#be123c" }, // Rojo
    { c1: "#064e3b", c2: "#047857" }, // Verde
    { c1: "#451a03", c2: "#b45309" }, // Ámbar
    { c1: "#2e1065", c2: "#6d28d9" }, // Violeta
    { c1: "#18181b", c2: "#3f3f46" }  // Grises oscuros
  ];

  /**
   * Layout inicial de ejemplo en cruz desplegada
   */
  const DEFAULT_INITIAL_SCREENS = [
    {
      id: "screen_central",
      label: "C",
      location: "Central",
      pitch: 2.5,
      pitchReal: 2.500,
      widthM: 2.00,
      heightM: 2.00,
      widthPx: 800,
      heightPx: 800,
      moduleWidthM: 0.50,
      moduleHeightM: 1.00,
      cols: 4,
      rows: 2,
      modPxW: 200,
      modPxH: 400,
      fixedMode: "pitch_m", // 'pitch_m', 'pitch_px', 'm_px'
      color1: "#102a5c",
      color2: "#1d4ed8",
      x: 800,
      y: 0,
      labelColor: "#ffffff",
      labelFontWeight: "300",
      labelFontSize: 0, // 0 = automático
      viewMode: "inherit", // 'inherit', 'modules', 'subgrid'
      subgridSize: 0 // 0 = heredar global
    },
    {
      id: "screen_izq",
      label: "i1",
      location: "Izquierda",
      pitch: 2.5,
      pitchReal: 2.500,
      widthM: 2.00,
      heightM: 2.00,
      widthPx: 800,
      heightPx: 800,
      moduleWidthM: 0.50,
      moduleHeightM: 1.00,
      cols: 4,
      rows: 2,
      modPxW: 200,
      modPxH: 400,
      fixedMode: "pitch_m",
      color1: "#4c0519",
      color2: "#be123c",
      x: 0,
      y: 800,
      labelColor: "#ffffff",
      labelFontWeight: "300",
      labelFontSize: 0,
      viewMode: "inherit",
      subgridSize: 0
    },
    {
      id: "screen_der",
      label: "d1",
      location: "Derecha",
      pitch: 2.5,
      pitchReal: 2.500,
      widthM: 2.00,
      heightM: 2.00,
      widthPx: 800,
      heightPx: 800,
      moduleWidthM: 0.50,
      moduleHeightM: 1.00,
      cols: 4,
      rows: 2,
      modPxW: 200,
      modPxH: 400,
      fixedMode: "pitch_m",
      color1: "#064e3b",
      color2: "#047857",
      x: 1600,
      y: 800,
      labelColor: "#ffffff",
      labelFontWeight: "300",
      labelFontSize: 0,
      viewMode: "inherit",
      subgridSize: 0
    },
    {
      id: "screen_fondo",
      label: "fondo",
      location: "Fondo",
      pitch: 2.5,
      pitchReal: 2.500,
      widthM: 2.00,
      heightM: 2.00,
      widthPx: 800,
      heightPx: 800,
      moduleWidthM: 0.50,
      moduleHeightM: 1.00,
      cols: 4,
      rows: 2,
      modPxW: 200,
      modPxH: 400,
      fixedMode: "pitch_m",
      color1: "#451a03",
      color2: "#b45309",
      x: 800,
      y: 1600,
      labelColor: "#ffffff",
      labelFontWeight: "300",
      labelFontSize: 0,
      viewMode: "inherit",
      subgridSize: 0
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
      zoom: 0.35,
      panX: 80,
      panY: 50,
      isPanning: false,
      startPanX: 0,
      startPanY: 0
    },
    settings: {
      snapEnabled: true,
      showLabels: true,
      showSublabels: true,
      exportBackground: "#000000",
      // Modos de visualización globales (Etapa 1.4)
      viewMode: "modules", // 'modules' o 'subgrid'
      subgridSize: 32, // 16, 32, 64, 128 px
      showModuleBorders: true // línea fina de 1 px para borde de módulo
    },
    interaction: {
      draggingScreenId: null,
      dragOffsetX: 0,
      dragOffsetY: 0,
      hasMoved: false,
      activeSnapLines: []
    }
  };


  /* ===========================================================================
   * 3. CALCULATION ENGINE (Pitch real, cálculo bidireccional y prioridad px/mód)
   * ===========================================================================
   */
  const CalcEngine = {
    /**
     * Recalcula las variables de una pantalla según su 'fixedMode' y valida exactitud.
     * Muestra aviso SOLO cuando los píxeles no den entero o módulos no coincidan.
     */
    recalculate(screen) {
      const warnings = [];

      // Validar números básicos
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

        // Aviso solo si no da entero
        if (Math.abs(rawPxW - roundedPxW) > 0.001 || Math.abs(rawPxH - roundedPxH) > 0.001) {
          warnings.push(`Píxeles no enteros: ${rawPxW.toFixed(2)}×${rawPxH.toFixed(2)} px (redondeado a ${roundedPxW}×${roundedPxH} px).`);
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
        // Metros + Px fijos -> Calcula Pitch
        const calcPitchW = (screen.widthM * 1000) / screen.widthPx;
        const calcPitchH = (screen.heightM * 1000) / screen.heightPx;
        screen.pitch = Number(((calcPitchW + calcPitchH) / 2).toFixed(3));
      }

      // Cálculo de módulos (Columnas x Filas)
      const exactCols = screen.widthM / screen.moduleWidthM;
      const exactRows = screen.heightM / screen.moduleHeightM;
      const roundedCols = Math.max(1, Math.round(exactCols));
      const roundedRows = Math.max(1, Math.round(exactRows));

      if (Math.abs(exactCols - roundedCols) > 0.01 || Math.abs(exactRows - roundedRows) > 0.01) {
        warnings.push(`Módulos no enteros: ${exactCols.toFixed(2)} × ${exactRows.toFixed(2)} módulos.`);
      }

      screen.cols = roundedCols;
      screen.rows = roundedRows;

      // Píxeles por módulo
      const rawModPxW = screen.widthPx / screen.cols;
      const rawModPxH = screen.heightPx / screen.rows;

      if (Math.abs(rawModPxW - Math.round(rawModPxW)) > 0.001 || Math.abs(rawModPxH - Math.round(rawModPxH)) > 0.001) {
        warnings.push(`Px por módulo no enteros: ${rawModPxW.toFixed(2)} × ${rawModPxH.toFixed(2)} px.`);
      }

      screen.modPxW = Math.round(rawModPxW);
      screen.modPxH = Math.round(rawModPxH);

      // Pitch real = tamaño del módulo en mm / px por módulo (Etapa 1.3)
      const pitchRealW = (screen.moduleWidthM * 1000) / (rawModPxW || 1);
      const pitchRealH = (screen.moduleHeightM * 1000) / (rawModPxH || 1);
      screen.pitchReal = Number(((pitchRealW + pitchRealH) / 2).toFixed(3));

      // Propiedades de tipografía y visualización por defecto si faltan
      if (!screen.labelFontWeight) screen.labelFontWeight = "300";
      if (!screen.labelColor) screen.labelColor = "#ffffff";
      if (screen.labelFontSize === undefined) screen.labelFontSize = 0;
      if (!screen.viewMode) screen.viewMode = "inherit";
      if (screen.subgridSize === undefined) screen.subgridSize = 0;

      return {
        screen,
        warnings,
        isExact: warnings.length === 0
      };
    },

    /**
     * Ingreso manual de píxeles por módulo con prioridad sobre el cálculo (Etapa 1.3).
     * @param {Object} screen 
     * @param {number} manualModPxW 
     * @param {number} manualModPxH 
     */
    setManualModPx(screen, manualModPxW, manualModPxH) {
      screen.modPxW = Math.max(1, parseInt(manualModPxW, 10) || 1);
      screen.modPxH = Math.max(1, parseInt(manualModPxH, 10) || 1);

      // Actualizar resolución total a partir de los módulos
      screen.widthPx = screen.cols * screen.modPxW;
      screen.heightPx = screen.rows * screen.modPxH;

      // Actualizar pitch real
      const pitchRealW = (screen.moduleWidthM * 1000) / screen.modPxW;
      const pitchRealH = (screen.moduleHeightM * 1000) / screen.modPxH;
      screen.pitchReal = Number(((pitchRealW + pitchRealH) / 2).toFixed(3));

      if (screen.fixedMode === "pitch_m") {
        // Si metros fijos, actualiza el pitch para reflejar el pitch real
        screen.pitch = screen.pitchReal;
      } else if (screen.fixedMode === "pitch_px") {
        // Si pitch fijo, actualiza los metros
        screen.widthM = Number(((screen.widthPx * screen.pitch) / 1000).toFixed(4));
        screen.heightM = Number(((screen.heightPx * screen.pitch) / 1000).toFixed(4));
      } else if (screen.fixedMode === "m_px") {
        screen.pitch = screen.pitchReal;
      }

      return this.recalculate(screen);
    },

    /**
     * Ajusta el tamaño en metros a partir de una cantidad exacta de módulos (columnas x filas).
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
   * 4. RENDER ENGINE (Canvas 2D, 1:1 Px Reales, Modos de Grilla y Etiquetas Planas)
   * ===========================================================================
   */
  const RenderEngine = {
    canvas: null,
    ctx: null,

    init(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext("2d", { alpha: false });
    },

    computeCanvasBounds() {
      if (state.canvas.mode === "manual") {
        state.canvas.computedWidth = Math.max(200, state.canvas.manualWidth);
        state.canvas.computedHeight = Math.max(200, state.canvas.manualHeight);
        return;
      }

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

      state.canvas.computedWidth = Math.max(800, maxX);
      state.canvas.computedHeight = Math.max(600, maxY);
    },

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
      ctx.imageSmoothingEnabled = false;

      // 1. Fondo del lienzo
      ctx.fillStyle = state.settings.exportBackground || "#000000";
      ctx.fillRect(0, 0, w, h);

      // Marco del lienzo manual
      if (state.canvas.mode === "manual") {
        ctx.strokeStyle = "#262626";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
      }

      // 2. Dibujar pantallas
      state.screens.forEach(screen => {
        const isSelected = screen.id === state.selectedScreenId;
        this.renderScreen(ctx, screen, isSelected);
      });

      // 3. Guías magnéticas
      this.renderSnapGuides(ctx);

      // 4. Actualizar HUD
      const hudResText = document.getElementById("hud-res-text");
      if (hudResText) {
        hudResText.textContent = `${w} × ${h} px`;
      }
    },

    /**
     * Dibuja una pantalla con soporte para "Módulos LED" o "Plantilla cuadriculada"
     */
    renderScreen(ctx, screen, isSelected) {
      const { x, y, widthPx, heightPx, cols, rows, color1, color2 } = screen;

      ctx.save();

      // Determinar modo de visualización efectivo (global o por pantalla)
      const effectiveMode = (screen.viewMode && screen.viewMode !== "inherit") 
        ? screen.viewMode 
        : state.settings.viewMode;

      // Determinar tamaño de subcuadrícula efectivo
      const effectiveSubgridSize = (screen.subgridSize && screen.subgridSize > 0)
        ? screen.subgridSize
        : state.settings.subgridSize;

      const colStep = widthPx / cols;
      const rowStep = heightPx / rows;

      if (effectiveMode === "subgrid") {
        // MODO PLANTILLA CUADRICULADA (Etapa 1.4)
        // Cada módulo se subdivide en cuadrados iguales de tamaño configurable en px
        const sq = Math.max(4, effectiveSubgridSize);

        for (let r = 0; r < rows; r++) {
          const modY = Math.floor(y + r * rowStep);
          const nextModY = Math.floor(y + (r + 1) * rowStep);
          const modH = nextModY - modY;

          for (let c = 0; c < cols; c++) {
            const modX = Math.floor(x + c * colStep);
            const nextModX = Math.floor(x + (c + 1) * colStep);
            const modW = nextModX - modX;

            const subCols = Math.ceil(modW / sq);
            const subRows = Math.ceil(modH / sq);

            for (let sr = 0; sr < subRows; sr++) {
              const sqY = modY + sr * sq;
              const sqH = Math.min(sq, modY + modH - sqY);

              for (let sc = 0; sc < subCols; sc++) {
                const sqX = modX + sc * sq;
                const sqW = Math.min(sq, modX + modW - sqX);

                // Damero coherente continuo
                const globalCol = Math.floor((sqX - x) / sq);
                const globalRow = Math.floor((sqY - y) / sq);
                ctx.fillStyle = ((globalCol + globalRow) % 2 === 0) ? color1 : color2;
                ctx.fillRect(sqX, sqY, sqW, sqH);
              }
            }
          }
        }

      } else {
        // MODO MÓDULOS LED (Damero estándar por módulo)
        for (let r = 0; r < rows; r++) {
          const cellY = Math.floor(y + r * rowStep);
          const nextCellY = Math.floor(y + (r + 1) * rowStep);
          const cellH = nextCellY - cellY;

          for (let c = 0; c < cols; c++) {
            const cellX = Math.floor(x + c * colStep);
            const nextCellX = Math.floor(x + (c + 1) * colStep);
            const cellW = nextCellX - cellX;

            ctx.fillStyle = ((r + c) % 2 === 0) ? color1 : color2;
            ctx.fillRect(cellX, cellY, cellW, cellH);
          }
        }
      }

      // Línea fina de 1 px que marca el borde de cada módulo real (opcional)
      if (state.settings.showModuleBorders) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;

        for (let r = 0; r < rows; r++) {
          const modY = Math.floor(y + r * rowStep);
          const nextModY = Math.floor(y + (r + 1) * rowStep);
          const modH = nextModY - modY;

          for (let c = 0; c < cols; c++) {
            const modX = Math.floor(x + c * colStep);
            const nextModX = Math.floor(x + (c + 1) * colStep);
            const modW = nextModX - modX;

            ctx.strokeRect(modX + 0.5, modY + 0.5, modW - 1, modH - 1);
          }
        }
      }

      // Borde exterior de la pantalla
      if (isSelected) {
        // Borde blanco sutil para selección
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, widthPx - 1, heightPx - 1);

        // Manijas en las esquinas
        this.drawHandle(ctx, x, y);
        this.drawHandle(ctx, x + widthPx, y);
        this.drawHandle(ctx, x, y + heightPx);
        this.drawHandle(ctx, x + widthPx, y + heightPx);
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, widthPx - 1, heightPx - 1);
      }

      // Etiquetas planas (Etapa 1.2)
      if (state.settings.showLabels) {
        this.renderScreenLabels(ctx, screen);
      }

      ctx.restore();
    },

    /**
     * Dibuja etiquetas totalmente planas: SIN sombra, SIN contorno, SIN resplandor.
     * Peso 300 por defecto, color blanco, centradas en la pantalla.
     */
    renderScreenLabels(ctx, screen) {
      const { x, y, widthPx, heightPx, label, location, cols, rows } = screen;
      const centerX = x + widthPx / 2;
      const centerY = y + heightPx / 2;

      // Tamaño de fuente manual o automático
      let fontSize = (screen.labelFontSize && screen.labelFontSize > 0)
        ? screen.labelFontSize
        : Math.max(14, Math.min(64, Math.floor(Math.min(widthPx, heightPx) / 6)));

      const fontWeight = screen.labelFontWeight || "300";
      const fontColor = screen.labelColor || "#ffffff";

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Totalmente planas: sin sombra, sin contorno
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.font = `${fontWeight} ${fontSize}px ${FONT_MAIN}`;
      ctx.fillStyle = fontColor;

      const showSub = state.settings.showSublabels && heightPx >= 70 && widthPx >= 90;
      const labelY = showSub ? centerY - fontSize * 0.45 : centerY;

      ctx.fillText(label, centerX, labelY);

      // Sub-etiqueta técnica plana (opcional)
      if (showSub) {
        const subFontSize = Math.max(10, Math.floor(fontSize * 0.38));
        ctx.font = `300 ${subFontSize}px ${FONT_MAIN}`;
        ctx.fillStyle = fontColor;
        ctx.globalAlpha = 0.8;

        const pitchText = screen.pitchReal ? `${screen.pitchReal.toFixed(3)} mm` : `${screen.pitch} mm`;
        const line1 = `${location} • P${pitchText}`;
        const line2 = `${widthPx}×${heightPx} px (${cols}×${rows} mod)`;

        ctx.fillText(line1, centerX, centerY + fontSize * 0.35);
        ctx.fillText(line2, centerX, centerY + fontSize * 0.35 + subFontSize * 1.35);
      }

      ctx.restore();
    },

    drawHandle(ctx, hx, hy) {
      const size = 5;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
    },

    renderSnapGuides(ctx) {
      if (!state.interaction.activeSnapLines || state.interaction.activeSnapLines.length === 0) return;

      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

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

      ws.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY);
        this.zoomBy(delta, e.clientX, e.clientY);
      }, { passive: false });

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
      if (e.button !== 0 || e.spaceKey) return;

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
        state.selectedScreenId = null;
        UIController.updateActiveScreenForm();
        RenderEngine.render();

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

      state.interaction.activeSnapLines = [];

      if (state.settings.snapEnabled) {
        const snapThreshold = 10;

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

        state.screens.forEach(other => {
          if (other.id === screen.id) return;

          const edgesX = [
            { val: other.x, snapTo: other.x },
            { val: other.x + other.widthPx, snapTo: other.x + other.widthPx },
            { val: other.x - screen.widthPx, snapTo: other.x },
            { val: other.x + other.widthPx - screen.widthPx, snapTo: other.x + other.widthPx }
          ];

          edgesX.forEach(edge => {
            if (Math.abs(targetX - edge.val) < snapThreshold) {
              targetX = edge.val;
              state.interaction.activeSnapLines.push({ type: "vertical", val: edge.snapTo });
            }
          });

          const edgesY = [
            { val: other.y, snapTo: other.y },
            { val: other.y + other.heightPx, snapTo: other.y + other.heightPx },
            { val: other.y - screen.heightPx, snapTo: other.y },
            { val: other.y + other.heightPx - screen.heightPx, snapTo: other.y + other.heightPx }
          ];

          edgesY.forEach(edge => {
            if (Math.abs(targetY - edge.val) < snapThreshold) {
              targetY = edge.val;
              state.interaction.activeSnapLines.push({ type: "horizontal", val: edge.snapTo });
            }
          });
        });

        if (Math.abs(targetX) < snapThreshold) {
          targetX = 0;
          state.interaction.activeSnapLines.push({ type: "vertical", val: 0 });
        }
        if (Math.abs(targetY) < snapThreshold) {
          targetY = 0;
          state.interaction.activeSnapLines.push({ type: "horizontal", val: 0 });
        }
      }

      screen.x = Math.max(0, Math.round(targetX));
      screen.y = Math.max(0, Math.round(targetY));

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
   * 7. UI CONTROLLER (Formularios, Tabla Resumen, Settings)
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
      // Modos de grilla globales (Etapa 1.4)
      const globalViewModeSelect = document.getElementById("global-view-mode-select");
      const globalSubgridConfig = document.getElementById("global-subgrid-config");
      const globalSubgridSizeSelect = document.getElementById("global-subgrid-size-select");
      const globalModuleBorders = document.getElementById("global-show-module-borders");

      globalViewModeSelect.value = state.settings.viewMode;
      globalSubgridSizeSelect.value = String(state.settings.subgridSize);
      globalModuleBorders.checked = state.settings.showModuleBorders;

      if (state.settings.viewMode === "subgrid") {
        globalSubgridConfig.classList.remove("hidden");
      } else {
        globalSubgridConfig.classList.add("hidden");
      }

      globalViewModeSelect.addEventListener("change", (e) => {
        state.settings.viewMode = e.target.value;
        if (state.settings.viewMode === "subgrid") {
          globalSubgridConfig.classList.remove("hidden");
        } else {
          globalSubgridConfig.classList.add("hidden");
        }
        RenderEngine.render();
        Persistence.saveAuto();
      });

      globalSubgridSizeSelect.addEventListener("change", (e) => {
        state.settings.subgridSize = parseInt(e.target.value, 10) || 32;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      globalModuleBorders.addEventListener("change", (e) => {
        state.settings.showModuleBorders = e.target.checked;
        RenderEngine.render();
        Persistence.saveAuto();
      });

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

      addBtn.addEventListener("click", () => this.addNewScreen());
      dupBtn.addEventListener("click", () => this.duplicateSelectedScreen());
      delBtn.addEventListener("click", () => this.deleteSelectedScreen());
    },

    bindSettingsControls() {
      const chkLabels = document.getElementById("opt-show-labels");
      const chkSublabels = document.getElementById("opt-show-sublabels");
      const selBg = document.getElementById("opt-export-bg");

      chkLabels.checked = state.settings.showLabels;
      chkSublabels.checked = state.settings.showSublabels;
      selBg.value = state.settings.exportBackground;

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
        if (confirm("¿Restaurar el layout inicial de cruz desplegada?")) {
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
     * Renderiza el formulario de la pantalla activa con todos los controles de Etapa 1
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
          <div class="editor-card" style="text-align: center; padding: 24px 16px;">
            <p style="color: var(--text-muted); margin-bottom: 12px;">No hay pantallas seleccionadas o el lienzo está vacío.</p>
            <button id="btn-add-screen-empty" class="btn btn-secondary btn-sm">Agregar Pantalla</button>
          </div>
        `;
        const addEmptyBtn = document.getElementById("btn-add-screen-empty");
        if (addEmptyBtn) {
          addEmptyBtn.addEventListener("click", () => this.addNewScreen());
        }
        return;
      }

      const { warnings, isExact } = CalcEngine.recalculate(screen);

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

        <!-- Tipografía de Etiqueta (Etapa 1.2: plana, peso, tamaño y color) -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Etiqueta en Lienzo (Plana)</span>
          </div>
          <div class="form-grid-3">
            <div class="form-group">
              <label for="screen-label-size">
                <span>Tamaño</span>
                <span class="label-unit">px (0=auto)</span>
              </label>
              <input type="number" id="screen-label-size" class="form-input" min="0" max="256" step="1" value="${screen.labelFontSize || 0}">
            </div>
            <div class="form-group">
              <label for="screen-label-weight">Peso</label>
              <select id="screen-label-weight" class="form-select">
                <option value="200" ${screen.labelFontWeight === "200" ? "selected" : ""}>200 Fino</option>
                <option value="300" ${screen.labelFontWeight === "300" || !screen.labelFontWeight ? "selected" : ""}>300 Ligero (Defecto)</option>
                <option value="400" ${screen.labelFontWeight === "400" ? "selected" : ""}>400 Regular</option>
                <option value="500" ${screen.labelFontWeight === "500" ? "selected" : ""}>500 Medio</option>
                <option value="600" ${screen.labelFontWeight === "600" ? "selected" : ""}>600 Seminegrita</option>
              </select>
            </div>
            <div class="form-group">
              <label>Color</label>
              <div class="color-picker-pair">
                <input type="color" id="screen-label-color-picker" class="color-input-native" value="${screen.labelColor || '#ffffff'}">
                <input type="text" id="screen-label-color-hex" class="color-input-hex" value="${screen.labelColor || '#ffffff'}" maxlength="7">
              </div>
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

        <!-- Variables Principales: Pitch Nominal y Real, Metros y Píxeles -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Dimensiones & Resolución</span>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-pitch">
                <span>Pitch Nominal</span>
                <span class="label-unit">mm</span>
              </label>
              <input type="number" id="screen-pitch" class="form-input" step="0.001" min="0.1" value="${screen.pitch}" ${screen.fixedMode === "m_px" ? "readonly" : ""}>
            </div>
            <div class="form-group">
              <label>
                <span>Pitch Real Calculado</span>
                <span class="label-unit">mm (mód/px)</span>
              </label>
              <input type="text" id="screen-pitch-real" class="form-input" value="${screen.pitchReal ? screen.pitchReal.toFixed(3) : screen.pitch.toFixed(3)} mm" readonly>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-width-m">
                <span>Ancho</span>
                <span class="label-unit">metros</span>
              </label>
              <input type="number" id="screen-width-m" class="form-input" step="0.001" min="0.01" value="${screen.widthM}" ${screen.fixedMode === "pitch_px" ? "readonly" : ""}>
            </div>
            <div class="form-group">
              <label for="screen-height-m">
                <span>Alto</span>
                <span class="label-unit">metros</span>
              </label>
              <input type="number" id="screen-height-m" class="form-input" step="0.001" min="0.01" value="${screen.heightM}" ${screen.fixedMode === "pitch_px" ? "readonly" : ""}>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-width-px">
                <span>Ancho Total</span>
                <span class="label-unit">píxeles enteros</span>
              </label>
              <input type="number" id="screen-width-px" class="form-input" step="1" min="1" value="${screen.widthPx}" ${screen.fixedMode === "pitch_m" ? "readonly" : ""}>
            </div>
            <div class="form-group">
              <label for="screen-height-px">
                <span>Alto Total</span>
                <span class="label-unit">píxeles enteros</span>
              </label>
              <input type="number" id="screen-height-px" class="form-input" step="1" min="1" value="${screen.heightPx}" ${screen.fixedMode === "pitch_m" ? "readonly" : ""}>
            </div>
          </div>

          <!-- Alerta de cálculo sobria: SOLO si los px no dan entero o módulos no coinciden -->
          <div id="calc-alert-box" class="calc-alert ${isExact ? "exact" : "warning"}">
            <div id="calc-alert-text">
              ${isExact 
                ? "Cálculo exacto: píxeles enteros y coincide con módulos." 
                : `${warnings.join("<br>")}`
              }
            </div>
          </div>
        </div>

        <!-- Módulos de Gabinete y Px por Módulo con Prioridad Manual (Etapa 1.3) -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Módulos de Gabinete</span>
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

          <!-- Px por módulo manuales con prioridad -->
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-mod-px-w">
                <span>Px / Módulo (W)</span>
                <span class="label-unit">prioridad manual</span>
              </label>
              <input type="number" id="screen-mod-px-w" class="form-input" step="1" min="1" value="${screen.modPxW}">
            </div>
            <div class="form-group">
              <label for="screen-mod-px-h">
                <span>Px / Módulo (H)</span>
                <span class="label-unit">prioridad manual</span>
              </label>
              <input type="number" id="screen-mod-px-h" class="form-input" step="1" min="1" value="${screen.modPxH}">
            </div>
          </div>

          <button id="btn-sync-modules" class="btn btn-secondary btn-sm" title="Ajustar metros para que coincidan con los módulos">
            Ajustar tamaño a estos módulos
          </button>
        </div>

        <!-- Modo de Visualización por Pantalla (Etapa 1.4) -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Modo de Visualización</span>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-view-mode">Modo de grilla</label>
              <select id="screen-view-mode" class="form-select">
                <option value="inherit" ${screen.viewMode === "inherit" || !screen.viewMode ? "selected" : ""}>Heredar global</option>
                <option value="modules" ${screen.viewMode === "modules" ? "selected" : ""}>Módulos LED</option>
                <option value="subgrid" ${screen.viewMode === "subgrid" ? "selected" : ""}>Plantilla cuadriculada</option>
              </select>
            </div>
            <div class="form-group">
              <label for="screen-subgrid-size">Cuadrícula (px)</label>
              <select id="screen-subgrid-size" class="form-select">
                <option value="0" ${!screen.subgridSize ? "selected" : ""}>Heredar global</option>
                <option value="16" ${screen.subgridSize === 16 ? "selected" : ""}>16 px</option>
                <option value="32" ${screen.subgridSize === 32 ? "selected" : ""}>32 px</option>
                <option value="64" ${screen.subgridSize === 64 ? "selected" : ""}>64 px</option>
                <option value="128" ${screen.subgridSize === 128 ? "selected" : ""}>128 px</option>
              </select>
            </div>
          </div>
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

        <!-- Posición en Lienzo -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Posición en Lienzo (px)</span>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-pos-x">X</label>
              <input type="number" id="screen-pos-x" class="form-input" step="1" value="${screen.x}">
            </div>
            <div class="form-group">
              <label for="screen-pos-y">Y</label>
              <input type="number" id="screen-pos-y" class="form-input" step="1" value="${screen.y}">
            </div>
          </div>
        </div>
      `;

      this.attachFormEvents(screen);
    },

    syncFormValues(screen) {
      const getEl = id => document.getElementById(id);
      const { warnings, isExact } = CalcEngine.recalculate(screen);

      const pitchEl = getEl("screen-pitch");
      const pitchRealEl = getEl("screen-pitch-real");
      const wmEl = getEl("screen-width-m");
      const hmEl = getEl("screen-height-m");
      const wpxEl = getEl("screen-width-px");
      const hpxEl = getEl("screen-height-px");
      const colsEl = getEl("screen-cols");
      const rowsEl = getEl("screen-rows");
      const modPxWEl = getEl("screen-mod-px-w");
      const modPxHEl = getEl("screen-mod-px-h");
      const alertBox = getEl("calc-alert-box");
      const alertText = getEl("calc-alert-text");

      if (pitchEl && document.activeElement !== pitchEl) pitchEl.value = screen.pitch;
      if (pitchRealEl) pitchRealEl.value = `${screen.pitchReal ? screen.pitchReal.toFixed(3) : screen.pitch.toFixed(3)} mm`;
      if (wmEl && document.activeElement !== wmEl) wmEl.value = screen.widthM;
      if (hmEl && document.activeElement !== hmEl) hmEl.value = screen.heightM;
      if (wpxEl && document.activeElement !== wpxEl) wpxEl.value = screen.widthPx;
      if (hpxEl && document.activeElement !== hpxEl) hpxEl.value = screen.heightPx;
      if (colsEl && document.activeElement !== colsEl) colsEl.value = screen.cols;
      if (rowsEl && document.activeElement !== rowsEl) rowsEl.value = screen.rows;
      if (modPxWEl && document.activeElement !== modPxWEl) modPxWEl.value = screen.modPxW;
      if (modPxHEl && document.activeElement !== modPxHEl) modPxHEl.value = screen.modPxH;

      if (alertBox && alertText) {
        alertBox.className = `calc-alert ${isExact ? "exact" : "warning"}`;
        alertText.innerHTML = isExact 
          ? "Cálculo exacto: píxeles enteros y coincide con módulos." 
          : `${warnings.join("<br>")}`;
      }

      this.updateScreensSelector();
      this.updateSummaryTable();
      RenderEngine.render();
      Persistence.saveAuto();
    },

    attachFormEvents(screen) {
      const getEl = id => document.getElementById(id);

      // Etiqueta
      getEl("screen-label").addEventListener("input", (e) => {
        screen.label = e.target.value;
        this.updateScreensSelector();
        this.updateSummaryTable();
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // Ubicación
      getEl("screen-location").addEventListener("change", (e) => {
        if (e.target.value === "__custom__") {
          const newLoc = prompt("Nombre de la nueva ubicación:");
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

      // Tipografía de etiqueta (Etapa 1.2)
      getEl("screen-label-size").addEventListener("input", (e) => {
        screen.labelFontSize = Math.max(0, parseInt(e.target.value, 10) || 0);
        RenderEngine.render();
        Persistence.saveAuto();
      });

      getEl("screen-label-weight").addEventListener("change", (e) => {
        screen.labelFontWeight = e.target.value;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      const labelColorPicker = getEl("screen-label-color-picker");
      const labelColorHex = getEl("screen-label-color-hex");

      labelColorPicker.addEventListener("input", (e) => {
        screen.labelColor = e.target.value;
        labelColorHex.value = e.target.value;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      labelColorHex.addEventListener("change", (e) => {
        const val = e.target.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          screen.labelColor = val;
          labelColorPicker.value = val;
          RenderEngine.render();
          Persistence.saveAuto();
        }
      });

      // Dato Fijo
      getEl("screen-fixed-mode").addEventListener("change", (e) => {
        screen.fixedMode = e.target.value;
        this.updateActiveScreenForm();
        this.updateSummaryTable();
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // Pitch Nominal
      getEl("screen-pitch").addEventListener("input", (e) => {
        screen.pitch = parseFloat(e.target.value) || 2.5;
        this.syncFormValues(screen);
      });

      // Metros W y H
      getEl("screen-width-m").addEventListener("input", (e) => {
        screen.widthM = parseFloat(e.target.value) || 1.0;
        this.syncFormValues(screen);
      });

      getEl("screen-height-m").addEventListener("input", (e) => {
        screen.heightM = parseFloat(e.target.value) || 1.0;
        this.syncFormValues(screen);
      });

      // Píxeles W y H
      getEl("screen-width-px").addEventListener("input", (e) => {
        screen.widthPx = parseInt(e.target.value, 10) || 100;
        this.syncFormValues(screen);
      });

      getEl("screen-height-px").addEventListener("input", (e) => {
        screen.heightPx = parseInt(e.target.value, 10) || 100;
        this.syncFormValues(screen);
      });

      // Tamaño de módulo (ancho y alto de gabinete)
      getEl("screen-mod-w").addEventListener("input", (e) => {
        screen.moduleWidthM = parseFloat(e.target.value) || 0.50;
        this.syncFormValues(screen);
      });

      getEl("screen-mod-h").addEventListener("input", (e) => {
        screen.moduleHeightM = parseFloat(e.target.value) || 1.00;
        this.syncFormValues(screen);
      });

      // Columnas y Filas
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

      // Px por Módulo con Prioridad Manual (Etapa 1.3)
      const handleManualModPx = () => {
        const pw = parseInt(getEl("screen-mod-px-w").value, 10) || screen.modPxW;
        const ph = parseInt(getEl("screen-mod-px-h").value, 10) || screen.modPxH;
        CalcEngine.setManualModPx(screen, pw, ph);
        this.syncFormValues(screen);
      };

      getEl("screen-mod-px-w").addEventListener("change", handleManualModPx);
      getEl("screen-mod-px-h").addEventListener("change", handleManualModPx);

      // Modo de visualización por pantalla (Etapa 1.4)
      getEl("screen-view-mode").addEventListener("change", (e) => {
        screen.viewMode = e.target.value;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      getEl("screen-subgrid-size").addEventListener("change", (e) => {
        screen.subgridSize = parseInt(e.target.value, 10) || 0;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // Colores Damero
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

      // Posición X e Y manual
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
     * Tabla resumen con Pitch Real con 3 decimales (Etapa 1.3)
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
          row.style.background = "#1a1a1a";
        }

        const pitchNom = `${screen.pitch.toFixed(2)} mm`;
        const pitchReal = screen.pitchReal ? `${screen.pitchReal.toFixed(3)} mm` : `${screen.pitch.toFixed(3)} mm`;

        row.innerHTML = `
          <td><span class="tag-label">${screen.label}</span></td>
          <td>${screen.location}</td>
          <td>${pitchNom}</td>
          <td><strong>${pitchReal}</strong></td>
          <td>${screen.cols} × ${screen.rows} (${modCount})</td>
          <td>${Math.round(screen.modPxW)} × ${Math.round(screen.modPxH)} px</td>
          <td>${screen.widthPx} × ${screen.heightPx} px</td>
          <td>${screen.widthM.toFixed(2)} × ${screen.heightM.toFixed(2)} m</td>
          <td>
            <span class="status-badge ${isExact ? "exact" : "warning"}" title="${warnings.join(" | ")}">
              ${isExact ? "Exacto" : "Aviso"}
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
            <span class="total-stat-lbl">Módulos</span>
          </div>
          <div class="total-stat">
            <span class="total-stat-val">${(totalPixels / 1000000).toFixed(2)} M</span>
            <span class="total-stat-lbl">Megapíxeles</span>
          </div>
          <div class="total-stat">
            <span class="total-stat-val">${totalAreaM2.toFixed(2)} m²</span>
            <span class="total-stat-lbl">Superficie Total</span>
          </div>
        `;
      }
    },

    addNewScreen() {
      const palette = DEFAULT_COLOR_PALETTES[state.screens.length % DEFAULT_COLOR_PALETTES.length];
      const newId = `screen_${Date.now()}`;
      const newLabel = `P${state.screens.length + 1}`;

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
        pitchReal: 2.500,
        widthM: 2.00,
        heightM: 1.00,
        widthPx: 800,
        heightPx: 400,
        moduleWidthM: 0.50,
        moduleHeightM: 1.00,
        cols: 4,
        rows: 1,
        modPxW: 200,
        modPxH: 400,
        fixedMode: "pitch_m",
        color1: palette.c1,
        color2: palette.c2,
        x: newX,
        y: newY,
        labelColor: "#ffffff",
        labelFontWeight: "300",
        labelFontSize: 0,
        viewMode: "inherit",
        subgridSize: 0
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
      document.getElementById("btn-export-png").addEventListener("click", () => this.exportPNG());
      document.getElementById("btn-save-json").addEventListener("click", () => this.exportJSON());
      document.getElementById("input-load-json").addEventListener("change", (e) => {
        this.importJSON(e.target.files[0]);
        e.target.value = "";
      });
    },

    exportPNG() {
      RenderEngine.computeCanvasBounds();
      const w = state.canvas.computedWidth;
      const h = state.canvas.computedHeight;

      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const oCtx = offscreen.getContext("2d", { alpha: false });
      oCtx.imageSmoothingEnabled = false;

      oCtx.fillStyle = state.settings.exportBackground || "#000000";
      oCtx.fillRect(0, 0, w, h);

      state.screens.forEach(screen => {
        RenderEngine.renderScreen(oCtx, screen, false);
      });

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
        version: "1.1",
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

            alert("Proyecto cargado exitosamente.");
          } else {
            alert("El archivo JSON no tiene un formato válido.");
          }
        } catch (err) {
          alert(`Error al leer archivo JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    },

    saveAuto() {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        try {
          const projectData = {
            version: "1.1",
            timestamp: new Date().toISOString(),
            canvas: state.canvas,
            settings: state.settings,
            locations: state.locations,
            screens: state.screens
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
          
          const statusEl = document.getElementById("autosave-status");
          if (statusEl) {
            statusEl.textContent = `Guardado: ${new Date().toLocaleTimeString()}`;
          }
        } catch (e) {
          console.warn("No se pudo autoguardar:", e);
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
        console.warn("Error leyendo localStorage, cargando layout inicial:", e);
      }

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

    RenderEngine.init(canvasEl);
    ViewportEngine.init(workspaceEl, stageEl);
    InteractionEngine.init();
    Persistence.init();
    UIController.init();

    RenderEngine.render();
    setTimeout(() => {
      ViewportEngine.zoomToFit();
    }, 120);

    window.addEventListener("resize", () => {
      RenderEngine.render();
    });
  });

})();
