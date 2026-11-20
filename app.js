/**
 * =============================================================================
 * LED GRID MAPPER - APLICACIÓN WEB DE MAPPING LED EN PÍXELES REALES
 * =============================================================================
 * Prototipo funcional estático (HTML5 + CSS3 + Vanilla JavaScript)
 * 
 * ETAPA 2: CAPAS DE TEXTO Y FIGURAS
 * - Panel de capas: mostrar/ocultar, bloquear, duplicar, borrar y orden (frente/fondo)
 * - Tipos de elemento: texto, círculo, cuadrado/rectángulo, línea y degradado (lineal y radial)
 * - Transformación interactiva en lienzo: arrastrar, escalar y rotar con manijas
 * - Campos numéricos en tiempo real para posición X/Y, tamaño, relleno, borde y opacidad
 * - Texto: contenido, tamaño, color, alineación, peso y carga de tipografías (.ttf, .otf, .woff2)
 * - Persistencia completa de capas y tipografías en JSON y localStorage
 * =============================================================================
 */

(function () {
  "use strict";

  /* ===========================================================================
   * 1. CONSTANTS & DEFAULTS
   * =========================================================================== */
  const STORAGE_KEY = "led_grid_mapper_project_v1";
  const FONT_MAIN = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';

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

  const DEFAULT_COLOR_PALETTES = [
    { c1: "#102a5c", c2: "#1d4ed8" },
    { c1: "#4c0519", c2: "#be123c" },
    { c1: "#064e3b", c2: "#047857" },
    { c1: "#451a03", c2: "#b45309" },
    { c1: "#2e1065", c2: "#6d28d9" },
    { c1: "#18181b", c2: "#3f3f46" }
  ];

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
      fixedMode: "pitch_m",
      color1: "#102a5c",
      color2: "#1d4ed8",
      x: 800,
      y: 0,
      labelColor: "#ffffff",
      labelFontWeight: "300",
      labelFontSize: 0
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
      labelFontSize: 0
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
      labelFontSize: 0
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
      labelFontSize: 0
    }
  ];


  /* ===========================================================================
   * 2. STATE MANAGEMENT (Pantallas, Capas Gráficas y Fuentes)
   * =========================================================================== */
  const state = {
    screens: [],
    selectedScreenId: null,
    selectedScreenIds: [],
    // Capas gráficas (Etapa 2)
    layers: [],
    selectedLayerId: null,
    customFonts: [], // [{ name, dataUrl }]
    locations: [...DEFAULT_LOCATIONS],
    canvas: {
      mode: "auto",
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
      displayMode: "checker",
      gradientDirection: "horizontal",
      showModuleLines: true,
      gridLineWidth: 1,
      gridLineColor: "#ffffff",
      gridBgColor: "#000000",
      testCard: {
        colorBar: true,
        bwBar: true,
        circle: true,
        cross: true,
        diagonals: true,
        circleStroke: "#ffffff",
        circleFillEnabled: false,
        circleFill: "#000000",
        lineColor: "#ffffff",
        gradCircle: true,
        gradCircleSizePct: 40,
        gradCirclePosX: 50,
        gradCirclePosY: 50,
        gradCircleInvert: false,
        gradCircleStrokeEnabled: false,
        gradCircleStrokeColor: "#ffffff",
        gradCircleStrokeWidth: 2
      },
      cellMode: "manual",
      cellModPreset: "500x500",
      cellModWidthMm: 500,
      cellModHeightMm: 500,
      cellTargetPx: 64,
      animation: {
        effect: "sequence",
        loopDuration: 6,
        seqDelay: 0.4,
        seqFade: 0.25,
        seqOffMode: "all",
        allOnDuration: 1.5,
        strobeTarget: "all",
        strobeFreq: 4,
        strobeIntensity: 100,
        strobeDuty: 50
      },
      canvasBg: "#000000",
      distributeSpacing: 0
    },
    interaction: {
      // Arrastre de pantallas
      draggingScreenId: null,
      dragInitialPositions: {},
      dragStartClientX: 0,
      dragStartClientY: 0,
      hasMoved: false,
      activeSnapLines: [],
      // Arrastre y transformación de capas (Etapa 2)
      layerAction: null, // 'move', 'rotate', 'scale-tl', 'scale-tr', 'scale-br', 'scale-bl'
      layerInitialState: null,
      layerStartPos: { x: 0, y: 0 },
      // Selección Marquee
      marquee: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        isShift: false
      }
    }
  };


  /* ===========================================================================
   * 3. CALCULATION ENGINE (Pantallas LED)
   * =========================================================================== */
  const CalcEngine = {
    recalculate(screen) {
      const warnings = [];

      screen.pitch = Math.max(0.01, Number(screen.pitch) || 2.5);
      screen.widthM = Math.max(0.001, Number(screen.widthM) || 1.0);
      screen.heightM = Math.max(0.001, Number(screen.heightM) || 1.0);
      screen.widthPx = Math.max(1, Math.round(Number(screen.widthPx) || 100));
      screen.heightPx = Math.max(1, Math.round(Number(screen.heightPx) || 100));
      screen.moduleWidthM = Math.max(0.01, Number(screen.moduleWidthM) || 0.50);
      screen.moduleHeightM = Math.max(0.01, Number(screen.moduleHeightM) || 1.00);

      const mode = screen.fixedMode || "pitch_m";

      if (mode === "pitch_m") {
        const rawPxW = (screen.widthM * 1000) / screen.pitch;
        const rawPxH = (screen.heightM * 1000) / screen.pitch;
        const roundedPxW = Math.round(rawPxW);
        const roundedPxH = Math.round(rawPxH);

        if (Math.abs(rawPxW - roundedPxW) > 0.001 || Math.abs(rawPxH - roundedPxH) > 0.001) {
          warnings.push(`Píxeles no enteros: ${rawPxW.toFixed(2)}×${rawPxH.toFixed(2)} px.`);
        }

        screen.widthPx = roundedPxW;
        screen.heightPx = roundedPxH;

      } else if (mode === "pitch_px") {
        const calcMW = (screen.widthPx * screen.pitch) / 1000;
        const calcMH = (screen.heightPx * screen.pitch) / 1000;
        screen.widthM = Number(calcMW.toFixed(4));
        screen.heightM = Number(calcMH.toFixed(4));

      } else if (mode === "m_px") {
        const calcPitchW = (screen.widthM * 1000) / screen.widthPx;
        const calcPitchH = (screen.heightM * 1000) / screen.heightPx;
        screen.pitch = Number(((calcPitchW + calcPitchH) / 2).toFixed(3));
      }

      const exactCols = screen.widthM / screen.moduleWidthM;
      const exactRows = screen.heightM / screen.moduleHeightM;
      const roundedCols = Math.max(1, Math.round(exactCols));
      const roundedRows = Math.max(1, Math.round(exactRows));

      if (Math.abs(exactCols - roundedCols) > 0.01 || Math.abs(exactRows - roundedRows) > 0.01) {
        warnings.push(`Módulos no enteros: ${exactCols.toFixed(2)} × ${exactRows.toFixed(2)}.`);
      }

      screen.cols = roundedCols;
      screen.rows = roundedRows;

      const rawModPxW = screen.widthPx / screen.cols;
      const rawModPxH = screen.heightPx / screen.rows;

      if (Math.abs(rawModPxW - Math.round(rawModPxW)) > 0.001 || Math.abs(rawModPxH - Math.round(rawModPxH)) > 0.001) {
        warnings.push(`Px por módulo no enteros: ${rawModPxW.toFixed(2)} × ${rawModPxH.toFixed(2)}.`);
      }

      screen.modPxW = Math.round(rawModPxW);
      screen.modPxH = Math.round(rawModPxH);

      const pitchRealW = (screen.moduleWidthM * 1000) / (rawModPxW || 1);
      const pitchRealH = (screen.moduleHeightM * 1000) / (rawModPxH || 1);
      screen.pitchReal = Number(((pitchRealW + pitchRealH) / 2).toFixed(3));

      if (!screen.labelFontWeight) screen.labelFontWeight = "300";
      if (!screen.labelColor) screen.labelColor = "#ffffff";
      if (screen.labelFontSize === undefined) screen.labelFontSize = 0;

      return {
        screen,
        warnings,
        isExact: warnings.length === 0
      };
    },

    setManualModPx(screen, manualModPxW, manualModPxH) {
      screen.modPxW = Math.max(1, parseInt(manualModPxW, 10) || 1);
      screen.modPxH = Math.max(1, parseInt(manualModPxH, 10) || 1);

      screen.widthPx = screen.cols * screen.modPxW;
      screen.heightPx = screen.rows * screen.modPxH;

      const pitchRealW = (screen.moduleWidthM * 1000) / screen.modPxW;
      const pitchRealH = (screen.moduleHeightM * 1000) / screen.modPxH;
      screen.pitchReal = Number(((pitchRealW + pitchRealH) / 2).toFixed(3));

      if (screen.fixedMode === "pitch_m") {
        screen.pitch = screen.pitchReal;
      } else if (screen.fixedMode === "pitch_px") {
        screen.widthM = Number(((screen.widthPx * screen.pitch) / 1000).toFixed(4));
        screen.heightM = Number(((screen.heightPx * screen.pitch) / 1000).toFixed(4));
      } else if (screen.fixedMode === "m_px") {
        screen.pitch = screen.pitchReal;
      }

      return this.recalculate(screen);
    },

    setModulesCount(screen, newCols, newRows) {
      screen.cols = Math.max(1, parseInt(newCols, 10) || 1);
      screen.rows = Math.max(1, parseInt(newRows, 10) || 1);
      screen.widthM = Number((screen.cols * screen.moduleWidthM).toFixed(4));
      screen.heightM = Number((screen.rows * screen.moduleHeightM).toFixed(4));
      return this.recalculate(screen);
    }
  };


  /* ===========================================================================
   * 4. LAYERS ENGINE (Gestión de Modelos y Creación de Capas)
   * =========================================================================== */
  const LayersEngine = {
    createLayer(type) {
      const id = `layer_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const count = state.layers.filter(l => l.type === type).length + 1;

      // Dimensiones iniciales razonables y centradas
      const cw = state.canvas.computedWidth;
      const ch = state.canvas.computedHeight;
      const initX = Math.round(cw / 2 - 150);
      const initY = Math.round(ch / 2 - 100);

      const baseLayer = {
        id,
        type,
        name: `${this.getTypeLabel(type)} ${count}`,
        visible: true,
        locked: false,
        x: initX,
        y: initY,
        width: 300,
        height: 200,
        rotation: 0,
        opacity: 1.0,
        fillColor: "#ffffff",
        strokeColor: "#333333",
        strokeWidth: 0
      };

      if (type === "text") {
        baseLayer.width = 400;
        baseLayer.height = 100;
        baseLayer.text = "Texto LED";
        baseLayer.fontSize = 48;
        baseLayer.fontFamily = FONT_MAIN;
        baseLayer.fontWeight = "400";
        baseLayer.textAlign = "center";
        baseLayer.fillColor = "#ffffff";
        baseLayer.strokeWidth = 0;
      } else if (type === "circle") {
        baseLayer.width = 240;
        baseLayer.height = 240;
        baseLayer.fillColor = "#ffffff";
        baseLayer.strokeWidth = 0;
      } else if (type === "line") {
        baseLayer.width = 300;
        baseLayer.height = 10;
        baseLayer.strokeColor = "#ffffff";
        baseLayer.strokeWidth = 3;
        baseLayer.fillColor = "transparent";
      } else if (type === "gradient") {
        baseLayer.width = 300;
        baseLayer.height = 300;
        baseLayer.gradientType = "linear"; // 'linear' o 'radial'
        baseLayer.gradientAngle = 90; // grados
        baseLayer.gradientStops = [
          { offset: 0.0, color: "#ffffff" },
          { offset: 1.0, color: "#000000" }
        ];
      }

      state.layers.push(baseLayer);
      state.selectedLayerId = id;
      state.selectedScreenIds = [];
      state.selectedScreenId = null;

      UIController.updateLayersList();
      UIController.updateActiveLayerForm();
      RenderEngine.render();
      Persistence.saveAuto();

      // Cambiar a la pestaña de capas
      UIController.switchTab("tab-layers");
      return baseLayer;
    },

    getTypeLabel(type) {
      switch (type) {
        case "text": return "Texto";
        case "rect": return "Rectángulo";
        case "circle": return "Círculo";
        case "line": return "Línea";
        case "gradient": return "Degradado";
        default: return "Capa";
      }
    },

    deleteLayer(id) {
      state.layers = state.layers.filter(l => l.id !== id);
      if (state.selectedLayerId === id) {
        state.selectedLayerId = state.layers.length > 0 ? state.layers[state.layers.length - 1].id : null;
      }
      UIController.updateLayersList();
      UIController.updateActiveLayerForm();
      RenderEngine.render();
      Persistence.saveAuto();
    },

    duplicateLayer(id) {
      const orig = state.layers.find(l => l.id === id);
      if (!orig) return;

      const clone = JSON.parse(JSON.stringify(orig));
      clone.id = `layer_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      clone.name = `${orig.name} (copia)`;
      clone.x += 30;
      clone.y += 30;

      state.layers.push(clone);
      state.selectedLayerId = clone.id;

      UIController.updateLayersList();
      UIController.updateActiveLayerForm();
      RenderEngine.render();
      Persistence.saveAuto();
    },

    toggleVisibility(id) {
      const l = state.layers.find(ly => ly.id === id);
      if (l) {
        l.visible = !l.visible;
        UIController.updateLayersList();
        RenderEngine.render();
        Persistence.saveAuto();
      }
    },

    toggleLock(id) {
      const l = state.layers.find(ly => ly.id === id);
      if (l) {
        l.locked = !l.locked;
        UIController.updateLayersList();
        UIController.updateActiveLayerForm();
        RenderEngine.render();
        Persistence.saveAuto();
      }
    },

    moveOrder(id, direction) {
      const idx = state.layers.findIndex(l => l.id === id);
      if (idx === -1) return;

      if (direction === "up" && idx < state.layers.length - 1) {
        const temp = state.layers[idx];
        state.layers[idx] = state.layers[idx + 1];
        state.layers[idx + 1] = temp;
      } else if (direction === "down" && idx > 0) {
        const temp = state.layers[idx];
        state.layers[idx] = state.layers[idx - 1];
        state.layers[idx - 1] = temp;
      } else if (direction === "front") {
        const item = state.layers.splice(idx, 1)[0];
        state.layers.push(item);
      } else if (direction === "back") {
        const item = state.layers.splice(idx, 1)[0];
        state.layers.unshift(item);
      }

      UIController.updateLayersList();
      RenderEngine.render();
      Persistence.saveAuto();
    }
  };


  /* ===========================================================================
   * 4B. ANIMATION ENGINE (Loop determinista a 30 fps por pantalla)
   * =========================================================================== */
  const AnimationEngine = {
    FPS: 30,
    status: "stopped", // "stopped" | "playing" | "paused" (no se guarda en proyecto)
    currentTime: 0,
    lastTimestamp: 0,
    lastRenderedFrame: -1,
    rafId: null,

    getSettings() {
      const def = {
        effect: "sequence",
        loopDuration: 6,
        seqDelay: 0.4,
        seqFade: 0.25,
        seqOffMode: "all",
        allOnDuration: 1.5,
        strobeTarget: "all",
        strobeFreq: 4,
        strobeIntensity: 100,
        strobeDuty: 50
      };
      const a = (state.settings && state.settings.animation) || {};
      const clamp = (v, d, min, max) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d;
      };
      const effect = ["sequence", "sequence_all", "strobe", "sequence_strobe"].includes(a.effect)
        ? a.effect : def.effect;
      return {
        effect,
        loopDuration: clamp(a.loopDuration, def.loopDuration, 0.5, 120),
        seqDelay: clamp(a.seqDelay, def.seqDelay, 0, 30),
        seqFade: clamp(a.seqFade, def.seqFade, 0, 30),
        seqOffMode: a.seqOffMode === "one_by_one" ? "one_by_one" : "all",
        allOnDuration: clamp(a.allOnDuration, def.allOnDuration, 0, 60),
        strobeTarget: a.strobeTarget === "selected" ? "selected" : "all",
        strobeFreq: clamp(a.strobeFreq, def.strobeFreq, 0.5, 15),
        strobeIntensity: clamp(a.strobeIntensity, def.strobeIntensity, 0, 100),
        strobeDuty: clamp(a.strobeDuty, def.strobeDuty, 10, 90)
      };
    },

    getOrderedActiveScreens() {
      return state.screens
        .map((s, idx) => ({ s, idx, order: Math.max(1, Math.round(Number(s.animOrder) || (idx + 1))) }))
        .filter(item => item.s.visible !== false && item.s.animIncluded !== false)
        .sort((a, b) => a.order - b.order || a.idx - b.idx);
    },

    getStrobeMeta(a, activeCount) {
      const D = a.loopDuration;
      let dur = D;
      if (a.effect === "sequence_strobe") {
        const n = Math.max(1, activeCount);
        const rawSeqEnd = (n - 1) * a.seqDelay + a.seqFade;
        const seqEnd = Math.min(rawSeqEnd, D * 0.6);
        dur = Math.max(0.1, D - seqEnd);
      }
      const minC = Math.max(1, Math.ceil(0.5 * dur));
      const maxC = Math.max(minC, Math.floor(15 * dur));
      const cycles = Math.max(minC, Math.min(maxC, Math.round(a.strobeFreq * dur)));
      return { dur, cycles, realFreq: cycles / dur };
    },

    /** Función pura y determinista: intensidad 0..1 para screenIndex en el tiempo t (s), cuantizada a 30 fps. */
    getScreenIntensity(screenIndex, t) {
      const screen = state.screens[screenIndex];
      if (!screen || screen.visible === false) return 0;
      if (screen.animIncluded === false) return 1;

      const a = this.getSettings();
      const D = a.loopDuration;
      const totalFrames = Math.max(2, Math.round(D * this.FPS));
      const frame = ((Math.floor((Number(t) || 0) * this.FPS + 1e-9) % totalFrames) + totalFrames) % totalFrames;
      const qt = (frame / totalFrames) * D;

      const ordered = this.getOrderedActiveScreens();
      const n = ordered.length;
      const pos = ordered.findIndex(item => item.idx === screenIndex);
      if (pos < 0 || n === 0) return 1;

      const env = (onS, onE, offS, offE, hasFade) => {
        if (qt < onS) return 0;
        if (hasFade && qt < onE) return (qt - onS) / Math.max(1e-6, onE - onS);
        if (qt < offS) return 1;
        if (hasFade && qt < offE) return Math.max(0, 1 - (qt - offS) / Math.max(1e-6, offE - offS));
        return 0;
      };

      const delay = a.seqDelay;
      const fade = a.seqFade;
      const hasFade = fade > 0;
      const stepEndGap = Math.min(0.25, D * 0.1);

      if (a.effect === "sequence") {
        let onS = pos * delay;
        let onE = onS + fade;
        const onPhase = (n - 1) * delay + fade;
        if (a.seqOffMode === "one_by_one") {
          const offTail = hasFade ? fade : stepEndGap;
          const offPhase = (n - 1) * delay + offTail;
          const nat = onPhase + Math.max(0.2, delay) + offPhase;
          const sc = nat > D ? D / nat : 1;
          onS *= sc; onE *= sc;
          const offBase = D - offPhase * sc;
          const offS = offBase + pos * delay * sc;
          const offE = hasFade ? offS + fade * sc : offS;
          return env(onS, onE, offS, offE, hasFade);
        } else {
          const offDur = hasFade ? fade : stepEndGap;
          const nat = onPhase + Math.max(0.2, delay * 0.5) + offDur;
          const sc = nat > D ? D / nat : 1;
          onS *= sc; onE *= sc;
          const offS = D - offDur * sc;
          const offE = hasFade ? D : offS;
          return env(onS, onE, offS, offE, hasFade);
        }
      }

      if (a.effect === "sequence_all") {
        let onS = pos * delay;
        let onE = onS + fade;
        const onPhase = (n - 1) * delay + fade;
        const offDur = hasFade ? fade : stepEndGap;
        let offS = onPhase + a.allOnDuration;
        let offE = offS + offDur;
        if (offE > D) {
          const sc = D / offE;
          onS *= sc; onE *= sc; offS *= sc; offE = hasFade ? D : offS;
        } else if (!hasFade) {
          offE = offS;
        }
        return env(onS, onE, offS, offE, hasFade);
      }

      if (a.effect === "strobe") {
        if (a.strobeTarget === "selected" && !state.selectedScreenIds.includes(screen.id)) return 0;
        const meta = this.getStrobeMeta(a, n);
        const phase = (qt * meta.realFreq) % 1;
        const duty = a.strobeDuty / 100;
        return phase < duty ? (a.strobeIntensity / 100) : 0;
      }

      // sequence_strobe
      const rawSeqEnd = (n - 1) * delay + fade;
      const sc = rawSeqEnd > D * 0.6 && rawSeqEnd > 0 ? (D * 0.6) / rawSeqEnd : 1;
      const strobeStart = rawSeqEnd * sc;
      if (qt < strobeStart) {
        const onS = pos * delay * sc;
        const onE = onS + fade * sc;
        if (qt < onS) return 0;
        if (hasFade && qt < onE) return (qt - onS) / Math.max(1e-6, onE - onS);
        return 1;
      }
      const meta = this.getStrobeMeta(a, n);
      const phase = ((qt - strobeStart) * meta.realFreq) % 1;
      return phase < (a.strobeDuty / 100) ? (a.strobeIntensity / 100) : 0;
    },

    isActive() {
      return this.status !== "stopped";
    },

    play() {
      if (this.status === "playing") return;
      this.status = "playing";
      this.lastTimestamp = performance.now();
      this.lastRenderedFrame = -1;
      UIController.syncAnimationPlaybackUI();
      RenderEngine.render();
      this.rafId = requestAnimationFrame((ts) => this.tick(ts));
    },

    pause() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.status === "playing") {
        this.status = "paused";
        UIController.syncAnimationPlaybackUI();
      }
    },

    stop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.status = "stopped";
      this.currentTime = 0;
      this.lastRenderedFrame = -1;
      UIController.syncAnimationPlaybackUI();
      RenderEngine.render();
    },

    seek(t) {
      const D = this.getSettings().loopDuration;
      const num = Math.max(0, Math.min(D, Number(t) || 0));
      this.currentTime = num >= D ? 0 : num;
      if (this.status === "stopped") this.status = "paused";
      this.lastRenderedFrame = -1;
      UIController.syncAnimationPlaybackUI();
      RenderEngine.render();
    },

    tick(now) {
      if (this.status !== "playing") return;
      const dt = Math.min(0.25, Math.max(0, (now - this.lastTimestamp) / 1000));
      this.lastTimestamp = now;
      const D = this.getSettings().loopDuration;
      this.currentTime = (this.currentTime + dt) % D;
      const frame = Math.floor(this.currentTime * this.FPS + 1e-9);
      if (frame !== this.lastRenderedFrame) {
        this.lastRenderedFrame = frame;
        UIController.syncAnimationPlaybackUI();
        RenderEngine.render();
      }
      this.rafId = requestAnimationFrame((ts) => this.tick(ts));
    }
  };

  const getScreenIntensity = (screenIndex, t) => AnimationEngine.getScreenIntensity(screenIndex, t);


  /* ===========================================================================
   * 5. RENDER ENGINE (Dibujo de Pantallas, Capas Gráficas y Manijas)
   * =========================================================================== */
  const RenderEngine = {
    canvas: null,
    ctx: null,

    init(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext("2d", { alpha: true });
    },

    computeCanvasBounds() {
      if (state.canvas.mode === "manual") {
        state.canvas.computedWidth = Math.max(200, state.canvas.manualWidth);
        state.canvas.computedHeight = Math.max(200, state.canvas.manualHeight);
        return;
      }

      if (state.screens.length === 0 && state.layers.length === 0) {
        state.canvas.computedWidth = 1920;
        state.canvas.computedHeight = 1080;
        return;
      }

      let maxX = 0;
      let maxY = 0;
      state.screens.forEach(s => {
        if (s.visible === false) return;
        const right = s.x + s.widthPx;
        const bottom = s.y + s.heightPx;
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      });

      state.layers.forEach(l => {
        const right = l.x + l.width;
        const bottom = l.y + l.height;
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      });

      state.canvas.computedWidth = Math.max(800, maxX);
      state.canvas.computedHeight = Math.max(600, maxY);
    },

    /**
     * Dibuja un cuadro completo del mapeo (fondo, pantallas animadas en t y capas gráficas).
     * Única función compartida por la vista previa y la exportación MP4.
     */
    renderFrame(ctx, w, h, t, options = {}) {
      const animate = options.animate !== undefined ? options.animate : true;
      const showOverlays = !!options.showOverlays;
      const allowTransparent = options.transparentBg !== undefined ? options.transparentBg : true;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);

      if (allowTransparent && state.settings.canvasBg === "transparent") {
        this.renderTransparencyGrid(ctx, w, h);
      } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
      }

      if (showOverlays) {
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
      }

      // Pantallas LED
      state.screens.forEach((screen, idx) => {
        if (screen.visible === false) return;
        const isSelected = showOverlays && state.selectedScreenIds.includes(screen.id);
        const isPrimary = showOverlays && screen.id === state.selectedScreenId;
        const intensity = animate ? getScreenIntensity(idx, t) : 1;
        this.renderScreen(ctx, screen, isSelected, isPrimary, intensity);
      });

      // Capas Gráficas (Texto, Figuras, Líneas, Degradados)
      state.layers.forEach(layer => {
        if (!layer.visible) return;
        const isSelected = showOverlays && layer.id === state.selectedLayerId;
        this.renderLayer(ctx, layer, isSelected);
      });
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
      const isAnim = AnimationEngine.isActive();
      this.renderFrame(ctx, w, h, isAnim ? AnimationEngine.currentTime : 0, {
        animate: isAnim,
        showOverlays: true,
        transparentBg: true
      });

      // 4. Manijas de transformación para la capa seleccionada
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.visible && !activeLayer.locked) {
        this.renderLayerTransformControls(ctx, activeLayer);
      }

      // 5. Guías magnéticas
      this.renderSnapGuides(ctx);

      // 6. Recuadro Marquee
      this.renderMarquee(ctx);

      // 7. Actualizar HUD
      const hudResText = document.getElementById("hud-res-text");
      if (hudResText) {
        hudResText.textContent = `${w} × ${h} px`;
      }
    },

    renderTransparencyGrid(ctx, w, h) {
      const size = 16;
      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          const isOdd = ((x / size) + (y / size)) % 2 === 0;
          ctx.fillStyle = isOdd ? "#0a0a0a" : "#040404";
          ctx.fillRect(x, y, Math.min(size, w - x), Math.min(size, h - y));
        }
      }
    },

    /** Modo de visualización efectivo de una pantalla (propio o global). */
    getScreenDisplayMode(screen) {
      const own = screen && screen.displayMode;
      if (own === "checker" || own === "bw" || own === "gradient" || own === "testcard") return own;
      const g = state.settings.displayMode;
      return (g === "bw" || g === "gradient" || g === "testcard") ? g : "checker";
    },

    /** Ajustes efectivos de test card (propios de la pantalla o globales). */
    getTestCardSettings(screen) {
      const def = {
        colorBar: true,
        bwBar: true,
        circle: true,
        cross: true,
        diagonals: true,
        circleStroke: "#ffffff",
        circleFillEnabled: false,
        circleFill: "#000000",
        lineColor: "#ffffff",
        gradCircle: false,
        gradCircleSizePct: 40,
        gradCirclePosX: 50,
        gradCirclePosY: 50,
        gradCircleInvert: false,
        gradCircleStrokeEnabled: false,
        gradCircleStrokeColor: "#ffffff",
        gradCircleStrokeWidth: 2
      };
      const g = (state.settings && state.settings.testCard) || {};
      const own = (screen && screen.testCard) || {};
      const src = { ...def, ...g, ...own };
      const hex = (v, d) => (typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v)) ? v : d;
      const clamp = (v, d, min, max) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d;
      };
      return {
        colorBar: src.colorBar !== false,
        bwBar: src.bwBar !== false,
        circle: src.circle !== false,
        cross: src.cross !== false,
        diagonals: src.diagonals !== false,
        circleStroke: hex(src.circleStroke, def.circleStroke),
        circleFillEnabled: !!src.circleFillEnabled,
        circleFill: hex(src.circleFill, def.circleFill),
        lineColor: hex(src.lineColor, def.lineColor),
        gradCircle: !!src.gradCircle,
        gradCircleSizePct: clamp(src.gradCircleSizePct, def.gradCircleSizePct, 5, 100),
        gradCirclePosX: clamp(src.gradCirclePosX, def.gradCirclePosX, 0, 100),
        gradCirclePosY: clamp(src.gradCirclePosY, def.gradCirclePosY, 0, 100),
        gradCircleInvert: !!src.gradCircleInvert,
        gradCircleStrokeEnabled: !!src.gradCircleStrokeEnabled,
        gradCircleStrokeColor: hex(src.gradCircleStrokeColor, def.gradCircleStrokeColor),
        gradCircleStrokeWidth: Math.round(clamp(src.gradCircleStrokeWidth, def.gradCircleStrokeWidth, 1, 20))
      };
    },

    /** Geometría del círculo con degradado radial: centro alineado a píxel, sin recortarse. */
    getGradCircleGeometry(tc, L) {
      const pad = tc.gradCircleStrokeEnabled ? tc.gradCircleStrokeWidth / 2 : 0;
      const maxD = Math.max(2, Math.min(L.sw, L.sh) - 2 * pad);
      const d = Math.max(2, Math.min(L.sh * (tc.gradCircleSizePct / 100), maxD));
      let r = d / 2;
      const minCx = Math.ceil(L.sx + pad + r);
      const maxCx = Math.floor(L.sx + L.sw - pad - r);
      const minCy = Math.ceil(L.sy + pad + r);
      const maxCy = Math.floor(L.sy + L.sh - pad - r);
      const rawCx = Math.round(L.sx + L.sw * (tc.gradCirclePosX / 100));
      const rawCy = Math.round(L.sy + L.sh * (tc.gradCirclePosY / 100));
      const cx = minCx <= maxCx ? Math.max(minCx, Math.min(maxCx, rawCx)) : Math.round(L.sx + L.sw / 2);
      const cy = minCy <= maxCy ? Math.max(minCy, Math.min(maxCy, rawCy)) : Math.round(L.sy + L.sh / 2);
      r = Math.max(1, Math.min(r, cx - L.sx - pad, L.sx + L.sw - pad - cx, cy - L.sy - pad, L.sy + L.sh - pad - cy));
      return { cx, cy, r };
    },

    /** Geometría entera y escalada de los elementos del Test Card dentro de la pantalla. */
    getTestCardLayout(screen) {
      const sx = Math.round(screen.x);
      const sy = Math.round(screen.y);
      const sw = Math.max(1, Math.round(screen.widthPx));
      const sh = Math.max(1, Math.round(screen.heightPx));
      const strokeW = Math.max(1, Math.min(8, Math.round(Math.min(sw, sh) / 250)));
      const mx = Math.min(Math.floor((sw - 2) / 2), Math.max(1, Math.round(sw * 0.10)));
      const barW = Math.max(2, sw - 2 * mx);
      const barX = sx + Math.round((sw - barW) / 2);
      const maxHalfH = Math.max(2, Math.floor(sh / 2) - 2);
      const barH = Math.min(maxHalfH, Math.max(2, Math.round(sh * 0.14)));
      const topBarY = Math.max(sy + 1, Math.min(sy + Math.floor(sh / 2) - barH - 1, Math.round(sy + sh * 0.25 - barH / 2)));
      const botBarY = Math.max(sy + Math.ceil(sh / 2) + 1, Math.min(sy + sh - barH - 1, Math.round(sy + sh * 0.75 - barH / 2)));
      const cx = Math.round(sx + sw / 2);
      const cy = Math.round(sy + sh / 2);
      const maxR = Math.max(1, Math.floor((Math.min(sw, sh) - strokeW) / 2) - 1);
      const r = Math.min(maxR, Math.max(1, Math.round(sh * 0.35)));
      return { sx, sy, sw, sh, strokeW, barX, barW, barH, topBarY, botBarY, cx, cy, r };
    },

    /** Estilo efectivo de la grilla: valores propios de la pantalla o globales. */
    getGridStyle(screen) {
      const s = state.settings;
      const hex = (v, d) => (typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v)) ? v : d;
      const wRaw = screen && screen.gridLineWidth !== undefined ? screen.gridLineWidth : s.gridLineWidth;
      const w = Math.max(1, Math.min(20, Math.round(Number(wRaw)) || 1));
      return {
        width: w,
        color: hex(screen && screen.gridLineColor !== undefined ? screen.gridLineColor : s.gridLineColor, "#ffffff"),
        bg: hex(screen && screen.gridBgColor !== undefined ? screen.gridBgColor : s.gridBgColor, "#000000")
      };
    },

    /** Presets de módulo LED (mm) para modo arquitectura. */
    CELL_MOD_PRESETS: {
      "500x500": [500, 500],
      "500x1000": [500, 1000],
      "320x160": [320, 160],
      "250x250": [250, 250]
    },

    /** Modo de celda efectivo de una pantalla (propio o global). */
    getScreenCellMode(screen) {
      const own = screen && screen.cellMode;
      if (own === "manual" || own === "led_module" || own === "square_fit") return own;
      const g = state.settings.cellMode;
      return (g === "led_module" || g === "square_fit") ? g : "manual";
    },

    /** Ajustes efectivos de celda de una pantalla (propios o globales). */
    getCellSettings(screen) {
      const s = state.settings;
      const num = (v, d, min, max) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? Math.max(min, Math.min(max, n)) : d;
      };
      const modW = num(screen && screen.cellModWidthMm !== undefined ? screen.cellModWidthMm : s.cellModWidthMm, 500, 1, 100000);
      const modH = num(screen && screen.cellModHeightMm !== undefined ? screen.cellModHeightMm : s.cellModHeightMm, 500, 1, 100000);
      const presetKey = Object.keys(this.CELL_MOD_PRESETS).find(k => {
        const [pw, ph] = this.CELL_MOD_PRESETS[k];
        return Math.abs(pw - modW) < 1e-6 && Math.abs(ph - modH) < 1e-6;
      }) || "custom";
      const targetPx = Math.round(num(screen && screen.cellTargetPx !== undefined ? screen.cellTargetPx : s.cellTargetPx, 64, 1, 4096));
      return {
        mode: this.getScreenCellMode(screen),
        modPreset: presetKey,
        modW,
        modH,
        targetPx
      };
    },

    /** Calcula cols, rows efectivos y descripción real para dibujar celdas. */
    getScreenCellGrid(screen) {
      const { widthPx, heightPx } = screen;
      const cs = this.getCellSettings(screen);
      let cols = Math.max(1, Math.round(Number(screen.cols) || 1));
      let rows = Math.max(1, Math.round(Number(screen.rows) || 1));
      let info = "";

      if (cs.mode === "led_module") {
        const physWmm = (Number(screen.widthM) || 0) * 1000;
        const physHmm = (Number(screen.heightM) || 0) * 1000;
        cols = physWmm > 0 ? Math.max(1, Math.round(physWmm / cs.modW)) : 1;
        rows = physHmm > 0 ? Math.max(1, Math.round(physHmm / cs.modH)) : 1;
        const realW = Math.round(physWmm / cols);
        const realH = Math.round(physHmm / rows);
        info = `${cols} × ${rows} módulos, ${realW} × ${realH} mm`;
      } else if (cs.mode === "square_fit") {
        const T = cs.targetPx;
        const cMid = widthPx / T;
        const rMid = heightPx / T;
        const cMin = Math.max(1, Math.floor(cMid) - 2);
        const cMax = Math.min(widthPx, Math.ceil(cMid) + 2);
        const rMin = Math.max(1, Math.floor(rMid) - 2);
        const rMax = Math.min(heightPx, Math.ceil(rMid) + 2);
        let bestScore = Infinity;
        for (let c = cMin; c <= cMax; c++) {
          const cw = widthPx / c;
          for (let r = rMin; r <= rMax; r++) {
            const ch = heightPx / r;
            const score = Math.abs(cw - T) + Math.abs(ch - T) + 0.5 * Math.abs(cw - ch);
            if (score < bestScore) {
              bestScore = score;
              cols = c;
              rows = r;
            }
          }
        }
        info = `celda ${Math.round(widthPx / cols)} × ${Math.round(heightPx / rows)} px (${cols} × ${rows})`;
      } else {
        info = `${cols} × ${rows} módulos (${Math.round(widthPx / cols)} × ${Math.round(heightPx / rows)} px)`;
      }

      return { mode: cs.mode, cols, rows, info };
    },

    /** Luminancia alta (color claro) para decidir texto negro. */
    isLightColor(hexColor) {
      const m = /^#([0-9A-Fa-f]{6})$/.exec(hexColor || "");
      if (!m) return false;
      const n = parseInt(m[1], 16);
      const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
      return lum > 0.6;
    },

    /** Dibuja el fondo y líneas de grilla alineadas a píxel entero. */
    drawGridBackground(ctx, screen, cols, rows) {
      const { x, y, widthPx, heightPx } = screen;
      const colStep = widthPx / cols;
      const rowStep = heightPx / rows;
      const gs = this.getGridStyle(screen);
      const half = Math.floor(gs.width / 2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, widthPx, heightPx);
      ctx.clip();
      ctx.fillStyle = gs.bg;
      ctx.fillRect(x, y, widthPx, heightPx);
      ctx.fillStyle = gs.color;
      // Rect de ancho w con inicio en (borde - floor(w/2)): equivale a trazo centrado
      // (+0.5 para grosor impar, sin offset para grosor par), siempre alineado a píxel.
      for (let c = 0; c <= cols; c++) {
        const ex = c === cols ? Math.round(x + widthPx) : Math.round(x + c * colStep);
        ctx.fillRect(ex - half, Math.round(y), gs.width, heightPx);
      }
      for (let r = 0; r <= rows; r++) {
        const ey = r === rows ? Math.round(y + heightPx) : Math.round(y + r * rowStep);
        ctx.fillRect(Math.round(x), ey - half, widthPx, gs.width);
      }
      ctx.restore();
    },

    /** Dibuja el modo Test card sobre la grilla de fondo (grilla, rectángulos, círculo, cruz y diagonales). */
    renderTestCard(ctx, screen, cols, rows) {
      this.drawGridBackground(ctx, screen, cols, rows);
      const tc = this.getTestCardSettings(screen);
      const L = this.getTestCardLayout(screen);

      ctx.save();
      ctx.beginPath();
      ctx.rect(L.sx, L.sy, L.sw, L.sh);
      ctx.clip();

      if (tc.colorBar) {
        const g = ctx.createLinearGradient(L.barX, L.topBarY, L.barX + L.barW, L.topBarY);
        const stops = ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff"];
        stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
        ctx.fillStyle = g;
        ctx.fillRect(L.barX, L.topBarY, L.barW, L.barH);
      }

      if (tc.bwBar) {
        const g = ctx.createLinearGradient(L.barX, L.botBarY, L.barX + L.barW, L.botBarY);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(1, "#000000");
        ctx.fillStyle = g;
        ctx.fillRect(L.barX, L.botBarY, L.barW, L.barH);
      }

      if (tc.circle) {
        ctx.beginPath();
        ctx.arc(L.cx, L.cy, L.r, 0, Math.PI * 2);
        if (tc.circleFillEnabled) {
          ctx.fillStyle = tc.circleFill;
          ctx.fill();
        }
        ctx.strokeStyle = tc.circleStroke;
        ctx.lineWidth = L.strokeW;
        ctx.stroke();
      }

      if (tc.gradCircle) {
        const gc = this.getGradCircleGeometry(tc, L);
        const g = ctx.createRadialGradient(gc.cx, gc.cy, 0, gc.cx, gc.cy, gc.r);
        g.addColorStop(0, tc.gradCircleInvert ? "#000000" : "#ffffff");
        g.addColorStop(1, tc.gradCircleInvert ? "#ffffff" : "#000000");
        ctx.beginPath();
        ctx.arc(gc.cx, gc.cy, gc.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        if (tc.gradCircleStrokeEnabled) {
          ctx.strokeStyle = tc.gradCircleStrokeColor;
          ctx.lineWidth = tc.gradCircleStrokeWidth;
          ctx.stroke();
        }
      }

      if (tc.cross) {
        const half = Math.floor(L.strokeW / 2);
        ctx.fillStyle = tc.lineColor;
        ctx.fillRect(L.sx, L.cy - half, L.sw, L.strokeW);
        ctx.fillRect(L.cx - half, L.sy, L.strokeW, L.sh);
      }

      if (tc.diagonals) {
        ctx.strokeStyle = tc.lineColor;
        ctx.lineWidth = L.strokeW;
        ctx.beginPath();
        ctx.moveTo(L.sx, L.sy);
        ctx.lineTo(L.sx + L.sw, L.sy + L.sh);
        ctx.moveTo(L.sx + L.sw, L.sy);
        ctx.lineTo(L.sx, L.sy + L.sh);
        ctx.stroke();
      }

      ctx.restore();
    },

    renderScreen(ctx, screen, isSelected, isPrimary, intensity = 1) {
      const { x, y, widthPx, heightPx, color1, color2 } = screen;
      const { cols, rows } = this.getScreenCellGrid(screen);
      const mode = this.getScreenDisplayMode(screen);

      ctx.save();
      const colStep = widthPx / cols;
      const rowStep = heightPx / rows;

      if (mode === "checker") {
        for (let r = 0; r < rows; r++) {
          const cellY = Math.round(y + r * rowStep);
          const nextCellY = Math.round(y + (r + 1) * rowStep);
          const cellH = nextCellY - cellY;

          for (let c = 0; c < cols; c++) {
            const cellX = Math.round(x + c * colStep);
            const nextCellX = Math.round(x + (c + 1) * colStep);
            const cellW = nextCellX - cellX;

            ctx.fillStyle = ((r + c) % 2 === 0) ? color1 : color2;
            ctx.fillRect(cellX, cellY, cellW, cellH);
          }
        }
      } else {
        // Líneas internas alineadas a píxel entero
        const drawModuleLines = (strokeStyle) => {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let c = 1; c < cols; c++) {
            const lx = Math.round(x + c * colStep) + 0.5;
            ctx.moveTo(lx, y);
            ctx.lineTo(lx, y + heightPx);
          }
          for (let r = 1; r < rows; r++) {
            const ly = Math.round(y + r * rowStep) + 0.5;
            ctx.moveTo(x, ly);
            ctx.lineTo(x + widthPx, ly);
          }
          ctx.stroke();
        };

        if (mode === "bw") {
          this.drawGridBackground(ctx, screen, cols, rows);
        } else if (mode === "testcard") {
          this.renderTestCard(ctx, screen, cols, rows);
        } else {
          const dir = state.settings.gradientDirection;
          let grad;
          if (dir === "vertical") {
            grad = ctx.createLinearGradient(x, y, x, y + heightPx);
          } else if (dir === "diagonal") {
            grad = ctx.createLinearGradient(x, y, x + widthPx, y + heightPx);
          } else if (dir === "radial") {
            grad = ctx.createRadialGradient(
              x + widthPx / 2, y + heightPx / 2, 0,
              x + widthPx / 2, y + heightPx / 2, Math.hypot(widthPx, heightPx) / 2
            );
          } else {
            grad = ctx.createLinearGradient(x, y, x + widthPx, y);
          }
          grad.addColorStop(0, color1);
          grad.addColorStop(1, color2);
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, widthPx, heightPx);
          if (state.settings.showModuleLines !== false) {
            drawModuleLines("rgba(0, 0, 0, 0.35)");
          }
        }
      }

      if (state.settings.showLabels) {
        this.renderScreenLabels(ctx, screen);
      }

      if (intensity < 1) {
        const dim = Math.max(0, Math.min(1, 1 - intensity));
        ctx.fillStyle = `rgba(0, 0, 0, ${dim})`;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(widthPx), Math.round(heightPx));
      }

      if (isSelected) {
        ctx.strokeStyle = isPrimary ? "#ffffff" : "#cccccc";
        ctx.lineWidth = isPrimary ? 1.5 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, widthPx - 1, heightPx - 1);

        this.drawHandle(ctx, x, y, isPrimary);
        this.drawHandle(ctx, x + widthPx, y, isPrimary);
        this.drawHandle(ctx, x, y + heightPx, isPrimary);
        this.drawHandle(ctx, x + widthPx, y + heightPx, isPrimary);
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, widthPx - 1, heightPx - 1);
      }

      ctx.restore();
    },

    renderScreenLabels(ctx, screen) {
      const { x, y, widthPx, heightPx, label, location, cols, rows } = screen;
      const centerX = x + widthPx / 2;
      const centerY = y + heightPx / 2;

      let fontSize = (screen.labelFontSize && screen.labelFontSize > 0)
        ? screen.labelFontSize
        : Math.max(14, Math.min(64, Math.floor(Math.min(widthPx, heightPx) / 6)));

      const fontWeight = screen.labelFontWeight || "300";
      const dMode = this.getScreenDisplayMode(screen);
      const fontColor = screen.labelColor || ((dMode === "bw" || dMode === "testcard") && this.isLightColor(this.getGridStyle(screen).bg) ? "#000000" : "#ffffff");

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      ctx.font = `${fontWeight} ${fontSize}px ${FONT_MAIN}`;
      ctx.fillStyle = fontColor;

      const showSub = state.settings.showSublabels && heightPx >= 70 && widthPx >= 90;
      const labelY = showSub ? centerY - fontSize * 0.45 : centerY;

      // Fondo opcional de la etiqueta (undefined = sin fondo)
      if (screen.labelBgEnabled) {
        const pad = Math.max(0, screen.labelBgPadding !== undefined ? screen.labelBgPadding : 10);
        let maxW = ctx.measureText(label).width;
        let top = labelY - fontSize / 2;
        let bottom = labelY + fontSize / 2;
        if (showSub) {
          const subFs = Math.max(10, Math.floor(fontSize * 0.38));
          const pt = screen.pitchReal ? `${screen.pitchReal.toFixed(3)} mm` : `${screen.pitch} mm`;
          ctx.font = `300 ${subFs}px ${FONT_MAIN}`;
          maxW = Math.max(
            maxW,
            ctx.measureText(`${location} • P${pt}`).width,
            ctx.measureText(`${widthPx}×${heightPx} px (${cols}×${rows} mod)`).width
          );
          bottom = centerY + fontSize * 0.35 + subFs * 1.35 + subFs / 2;
          ctx.font = `${fontWeight} ${fontSize}px ${FONT_MAIN}`;
        }
        const bx = Math.round(centerX - maxW / 2 - pad);
        const by = Math.round(top - pad);
        const bw = Math.round(maxW + pad * 2);
        const bh = Math.round(bottom - top + pad * 2);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, screen.labelBgOpacity !== undefined ? screen.labelBgOpacity : 1));
        ctx.fillStyle = screen.labelBgColor || "#000000";
        ctx.fillRect(bx, by, bw, bh);
        ctx.restore();
        ctx.fillStyle = fontColor;
      }
      ctx.fillText(label, centerX, labelY);

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

    /**
     * Dibuja una capa gráfica (Texto, Figuras, Líneas, Degradados)
     */
    renderLayer(ctx, layer, isSelected) {
      const { type, x, y, width, height, rotation, opacity } = layer;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rad = ((rotation || 0) * Math.PI) / 180;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity !== undefined ? opacity : 1));
      ctx.translate(cx, cy);
      ctx.rotate(rad);

      const halfW = width / 2;
      const halfH = height / 2;

      if (type === "rect") {
        if (layer.fillColor && layer.fillColor !== "transparent") {
          ctx.fillStyle = layer.fillColor;
          ctx.fillRect(-halfW, -halfH, width, height);
        }
        if (layer.strokeWidth > 0 && layer.strokeColor && layer.strokeColor !== "transparent") {
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth;
          ctx.strokeRect(-halfW, -halfH, width, height);
        }
      } else if (type === "circle") {
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.abs(halfW), Math.abs(halfH), 0, 0, Math.PI * 2);
        if (layer.fillColor && layer.fillColor !== "transparent") {
          ctx.fillStyle = layer.fillColor;
          ctx.fill();
        }
        if (layer.strokeWidth > 0 && layer.strokeColor && layer.strokeColor !== "transparent") {
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth;
          ctx.stroke();
        }
      } else if (type === "line") {
        ctx.beginPath();
        ctx.moveTo(-halfW, 0);
        ctx.lineTo(halfW, 0);
        ctx.strokeStyle = layer.strokeColor || "#ffffff";
        ctx.lineWidth = layer.strokeWidth || 2;
        ctx.stroke();
      } else if (type === "gradient") {
        let grad;
        if (layer.gradientType === "radial") {
          const r = Math.max(halfW, halfH);
          grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        } else {
          const angleRad = ((layer.gradientAngle || 90) * Math.PI) / 180;
          const x1 = -Math.cos(angleRad) * halfW;
          const y1 = -Math.sin(angleRad) * halfH;
          const x2 = Math.cos(angleRad) * halfW;
          const y2 = Math.sin(angleRad) * halfH;
          grad = ctx.createLinearGradient(x1, y1, x2, y2);
        }

        const stops = layer.gradientStops && layer.gradientStops.length >= 2
          ? layer.gradientStops
          : [{ offset: 0, color: "#ffffff" }, { offset: 1, color: "#000000" }];

        stops.forEach(st => {
          grad.addColorStop(Math.max(0, Math.min(1, st.offset)), st.color);
        });

        ctx.fillStyle = grad;
        ctx.fillRect(-halfW, -halfH, width, height);

        if (layer.strokeWidth > 0 && layer.strokeColor && layer.strokeColor !== "transparent") {
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth;
          ctx.strokeRect(-halfW, -halfH, width, height);
        }
      } else if (type === "text") {
        const fontSize = layer.fontSize || 36;
        const fontFam = layer.fontFamily ? `"${layer.fontFamily}", ${FONT_MAIN}` : FONT_MAIN;
        const weight = layer.fontWeight || "400";

        ctx.font = `${weight} ${fontSize}px ${fontFam}`;
        ctx.textAlign = layer.textAlign || "center";
        ctx.textBaseline = "middle";

        let textX = 0;
        if (layer.textAlign === "left") textX = -halfW;
        else if (layer.textAlign === "right") textX = halfW;

        if (layer.fillColor && layer.fillColor !== "transparent") {
          ctx.fillStyle = layer.fillColor;
          ctx.fillText(layer.text || "", textX, 0);
        }

        if (layer.strokeWidth > 0 && layer.strokeColor && layer.strokeColor !== "transparent") {
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth;
          ctx.strokeText(layer.text || "", textX, 0);
        }
      }

      ctx.restore();
    },

    /**
     * Dibuja los controles de transformación (caja delimitadora, manijas de escala y manija de rotación)
     */
    renderLayerTransformControls(ctx, layer) {
      const { x, y, width, height, rotation } = layer;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rad = ((rotation || 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rad);

      const halfW = width / 2;
      const halfH = height / 2;

      // Caja delimitadora fina
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(-halfW, -halfH, width, height);

      // Línea hacia manija de rotación
      ctx.beginPath();
      ctx.moveTo(0, -halfH);
      ctx.lineTo(0, -halfH - 22);
      ctx.strokeStyle = "#ffffff";
      ctx.setLineDash([]);
      ctx.stroke();

      // Manija de rotación (círculo)
      ctx.beginPath();
      ctx.arc(0, -halfH - 22, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Manijas de escala en las 4 esquinas (cuadrados)
      this.drawCornerHandle(ctx, -halfW, -halfH);
      this.drawCornerHandle(ctx, halfW, -halfH);
      this.drawCornerHandle(ctx, halfW, halfH);
      this.drawCornerHandle(ctx, -halfW, halfH);

      ctx.restore();
    },

    drawCornerHandle(ctx, hx, hy) {
      const size = 6;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
    },

    drawHandle(ctx, hx, hy, isPrimary) {
      const size = 5;
      ctx.fillStyle = isPrimary ? "#ffffff" : "#a3a3a3";
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
    },

    renderMarquee(ctx) {
      const m = state.interaction.marquee;
      if (!m.active) return;

      const x = Math.min(m.startX, m.currentX);
      const y = Math.min(m.startY, m.currentY);
      const w = Math.abs(m.currentX - m.startX);
      const h = Math.abs(m.currentY - m.startY);

      if (w < 2 && h < 2) return;

      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);

      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
  };


  /* ===========================================================================
   * 6. VIEWPORT ENGINE (Zoom y Pan)
   * =========================================================================== */
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
   * 7. INTERACTION ENGINE (Pantallas, Capas: Arrastrar, Escalar, Rotar)
   * =========================================================================== */
  const InteractionEngine = {
    init() {
      const stage = ViewportEngine.stage;
      const ws = ViewportEngine.workspace;
      if (!stage || !ws) return;

      stage.addEventListener("mousedown", (e) => this.onMouseDown(e));
      window.addEventListener("mousemove", (e) => this.onMouseMove(e));
      window.addEventListener("mouseup", (e) => this.onMouseUp(e));

      window.addEventListener("keydown", (e) => this.onKeyDown(e));
    },

    /**
     * Detección geométrica de clic sobre una capa con rotación
     */
    getLayerAt(canvasX, canvasY) {
      for (let i = state.layers.length - 1; i >= 0; i--) {
        const l = state.layers[i];
        if (!l.visible) continue;

        const cx = l.x + l.width / 2;
        const cy = l.y + l.height / 2;
        const rad = -((l.rotation || 0) * Math.PI) / 180;

        const dx = canvasX - cx;
        const dy = canvasY - cy;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

        const halfW = l.width / 2;
        const halfH = l.height / 2;

        if (localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH) {
          return l;
        }
      }
      return null;
    },

    /**
     * Detección de manijas de transformación en la capa seleccionada
     */
    getLayerHandleAt(canvasX, canvasY, layer) {
      if (!layer || layer.locked) return null;

      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      const rad = -((layer.rotation || 0) * Math.PI) / 180;

      const dx = canvasX - cx;
      const dy = canvasY - cy;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

      const halfW = layer.width / 2;
      const halfH = layer.height / 2;
      const tolerance = 9;

      // Manija de rotación (arriba del centro superior)
      const rotHandleY = -halfH - 22;
      if (Math.hypot(lx - 0, ly - rotHandleY) <= tolerance) {
        return "rotate";
      }

      // Manijas de esquina
      if (Math.hypot(lx - (-halfW), ly - (-halfH)) <= tolerance) return "scale-tl";
      if (Math.hypot(lx - halfW, ly - (-halfH)) <= tolerance) return "scale-tr";
      if (Math.hypot(lx - halfW, ly - halfH) <= tolerance) return "scale-br";
      if (Math.hypot(lx - (-halfW), ly - halfH) <= tolerance) return "scale-bl";

      return null;
    },

    getScreenAt(canvasX, canvasY) {
      for (let i = state.screens.length - 1; i >= 0; i--) {
        const s = state.screens[i];
        if (s.visible === false) continue;
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
      if (e.button !== 0 || e.code === "Space") return;

      const pos = ViewportEngine.clientToCanvasCoords(e.clientX, e.clientY);

      // 1. Probar manijas de transformación en la capa activa
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.visible && !activeLayer.locked) {
        const handle = this.getLayerHandleAt(pos.x, pos.y, activeLayer);
        if (handle) {
          state.interaction.layerAction = handle;
          state.interaction.layerStartPos = { x: pos.x, y: pos.y };
          state.interaction.layerInitialState = JSON.parse(JSON.stringify(activeLayer));
          return;
        }
      }

      // 2. Probar selección de capas (las capas están al frente de las pantallas)
      const clickedLayer = this.getLayerAt(pos.x, pos.y);
      if (clickedLayer) {
        state.selectedLayerId = clickedLayer.id;
        state.selectedScreenIds = [];
        state.selectedScreenId = null;

        if (!clickedLayer.locked) {
          state.interaction.layerAction = "move";
          state.interaction.layerStartPos = { x: pos.x, y: pos.y };
          state.interaction.layerInitialState = JSON.parse(JSON.stringify(clickedLayer));
        }

        UIController.updateLayersList();
        UIController.updateActiveLayerForm();
        UIController.updateActiveScreenForm();
        UIController.updateSelectionHint();
        RenderEngine.render();
        return;
      }

      // 3. Probar selección de pantallas
      const clickedScreen = this.getScreenAt(pos.x, pos.y);
      if (clickedScreen) {
        state.selectedLayerId = null;

        if (e.shiftKey) {
          if (state.selectedScreenIds.includes(clickedScreen.id)) {
            state.selectedScreenIds = state.selectedScreenIds.filter(id => id !== clickedScreen.id);
            state.selectedScreenId = state.selectedScreenIds[state.selectedScreenIds.length - 1] || null;
          } else {
            state.selectedScreenIds.push(clickedScreen.id);
            state.selectedScreenId = clickedScreen.id;
          }
        } else {
          if (!state.selectedScreenIds.includes(clickedScreen.id)) {
            state.selectedScreenIds = [clickedScreen.id];
            state.selectedScreenId = clickedScreen.id;
          }
        }

        state.interaction.draggingScreenId = clickedScreen.id;
        state.interaction.dragStartClientX = pos.x;
        state.interaction.dragStartClientY = pos.y;
        state.interaction.hasMoved = false;

        state.interaction.dragInitialPositions = {};
        state.selectedScreenIds.forEach(id => {
          const s = state.screens.find(sc => sc.id === id);
          if (s && s.visible !== false) {
            state.interaction.dragInitialPositions[id] = { x: s.x, y: s.y };
          }
        });

        UIController.updateActiveScreenForm();
        UIController.updateActiveLayerForm();
        UIController.updateSelectionHint();
        RenderEngine.render();

      } else {
        // Clic en fondo: Iniciar recuadro de selección Marquee
        state.selectedLayerId = null;
        if (!e.shiftKey) {
          state.selectedScreenIds = [];
          state.selectedScreenId = null;
        }

        state.interaction.marquee = {
          active: true,
          startX: pos.x,
          startY: pos.y,
          currentX: pos.x,
          currentY: pos.y,
          isShift: e.shiftKey
        };

        UIController.updateActiveScreenForm();
        UIController.updateActiveLayerForm();
        UIController.updateSelectionHint();
        RenderEngine.render();
      }
    },

    onMouseMove(e) {
      const pos = ViewportEngine.clientToCanvasCoords(e.clientX, e.clientY);

      // A. Transformación interactiva de capas (Mover, Rotar, Escalar)
      if (state.interaction.layerAction && state.selectedLayerId) {
        const layer = state.layers.find(l => l.id === state.selectedLayerId);
        const init = state.interaction.layerInitialState;
        if (!layer || !init) return;

        const action = state.interaction.layerAction;

        if (action === "move") {
          const dx = pos.x - state.interaction.layerStartPos.x;
          const dy = pos.y - state.interaction.layerStartPos.y;
          layer.x = Math.round(init.x + dx);
          layer.y = Math.round(init.y + dy);

        } else if (action === "rotate") {
          const cx = init.x + init.width / 2;
          const cy = init.y + init.height / 2;
          const angle = Math.atan2(pos.y - cy, pos.x - cx) * (180 / Math.PI) + 90;
          layer.rotation = Math.round((angle + 360) % 360);

        } else if (action.startsWith("scale")) {
          const cx = init.x + init.width / 2;
          const cy = init.y + init.height / 2;
          const rad = -((init.rotation || 0) * Math.PI) / 180;

          // Proyectar coordenadas del mouse al espacio local de la capa
          const dx = pos.x - cx;
          const dy = pos.y - cy;
          const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
          const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

          let newHalfW = Math.abs(lx);
          let newHalfH = Math.abs(ly);

          // Escala mínima 10px
          newHalfW = Math.max(5, newHalfW);
          newHalfH = Math.max(5, newHalfH);

          const newW = Math.round(newHalfW * 2);
          const newH = Math.round(newHalfH * 2);

          layer.width = newW;
          layer.height = newH;
          layer.x = Math.round(cx - newW / 2);
          layer.y = Math.round(cy - newH / 2);
        }

        UIController.syncActiveLayerFormValues(layer);
        RenderEngine.render();
        return;
      }

      // B. Recuadro Marquee
      if (state.interaction.marquee.active) {
        state.interaction.marquee.currentX = pos.x;
        state.interaction.marquee.currentY = pos.y;
        RenderEngine.render();
        return;
      }

      // C. Arrastre de pantallas
      if (!state.interaction.draggingScreenId) return;

      const leaderScreen = state.screens.find(s => s.id === state.interaction.draggingScreenId);
      const leaderInit = state.interaction.dragInitialPositions[leaderScreen.id];
      if (!leaderScreen || !leaderInit) return;

      state.interaction.hasMoved = true;

      let deltaX = pos.x - state.interaction.dragStartClientX;
      let deltaY = pos.y - state.interaction.dragStartClientY;

      let targetLeaderX = leaderInit.x + deltaX;
      let targetLeaderY = leaderInit.y + deltaY;

      state.interaction.activeSnapLines = [];

      if (state.settings.snapEnabled) {
        const threshold = 8;
        const cw = state.canvas.computedWidth;
        const ch = state.canvas.computedHeight;

        const leaderW = leaderScreen.widthPx;
        const leaderH = leaderScreen.heightPx;

        const snapTargetsX = [
          { val: 0, line: 0 },
          { val: cw / 2 - leaderW / 2, line: cw / 2 },
          { val: cw - leaderW, line: cw }
        ];

        const snapTargetsY = [
          { val: 0, line: 0 },
          { val: ch / 2 - leaderH / 2, line: ch / 2 },
          { val: ch - leaderH, line: ch }
        ];

        state.screens.forEach(other => {
          if (state.selectedScreenIds.includes(other.id) || other.visible === false) return;
          const ocX = other.x + other.widthPx / 2;
          const oRight = other.x + other.widthPx;
          const ocY = other.y + other.heightPx / 2;
          const oBottom = other.y + other.heightPx;

          snapTargetsX.push(
            { val: other.x, line: other.x },
            { val: oRight, line: oRight },
            { val: other.x - leaderW, line: other.x },
            { val: oRight - leaderW, line: oRight },
            { val: ocX - leaderW / 2, line: ocX }
          );

          snapTargetsY.push(
            { val: other.y, line: other.y },
            { val: oBottom, line: oBottom },
            { val: other.y - leaderH, line: other.y },
            { val: oBottom - leaderH, line: oBottom },
            { val: ocY - leaderH / 2, line: ocY }
          );
        });

        let bestDiffX = threshold + 1;
        let snapX = null;
        let lineX = null;

        snapTargetsX.forEach(target => {
          const diff = Math.abs(targetLeaderX - target.val);
          if (diff < bestDiffX) {
            bestDiffX = diff;
            snapX = target.val;
            lineX = target.line;
          }
        });

        if (snapX !== null) {
          targetLeaderX = snapX;
          state.interaction.activeSnapLines.push({ type: "vertical", val: lineX });
        }

        let bestDiffY = threshold + 1;
        let snapY = null;
        let lineY = null;

        snapTargetsY.forEach(target => {
          const diff = Math.abs(targetLeaderY - target.val);
          if (diff < bestDiffY) {
            bestDiffY = diff;
            snapY = target.val;
            lineY = target.line;
          }
        });

        if (snapY !== null) {
          targetLeaderY = snapY;
          state.interaction.activeSnapLines.push({ type: "horizontal", val: lineY });
        }
      }

      const finalDeltaX = Math.round(targetLeaderX - leaderInit.x);
      const finalDeltaY = Math.round(targetLeaderY - leaderInit.y);

      state.selectedScreenIds.forEach(id => {
        const s = state.screens.find(sc => sc.id === id);
        const initPos = state.interaction.dragInitialPositions[id];
        if (s && initPos) {
          s.x = Math.max(0, initPos.x + finalDeltaX);
          s.y = Math.max(0, initPos.y + finalDeltaY);
        }
      });

      const inputX = document.getElementById("screen-pos-x");
      const inputY = document.getElementById("screen-pos-y");
      if (inputX && leaderScreen) inputX.value = leaderScreen.x;
      if (inputY && leaderScreen) inputY.value = leaderScreen.y;

      RenderEngine.render();
    },

    onMouseUp() {
      // Finalizar transformación de capa
      if (state.interaction.layerAction) {
        state.interaction.layerAction = null;
        state.interaction.layerInitialState = null;
        RenderEngine.render();
        Persistence.saveAuto();
        return;
      }

      // Finalizar Marquee
      if (state.interaction.marquee.active) {
        const m = state.interaction.marquee;
        const x1 = Math.min(m.startX, m.currentX);
        const x2 = Math.max(m.startX, m.currentX);
        const y1 = Math.min(m.startY, m.currentY);
        const y2 = Math.max(m.startY, m.currentY);

        if (Math.abs(x2 - x1) > 4 || Math.abs(y2 - y1) > 4) {
          const selected = [];
          state.screens.forEach(s => {
            if (s.visible === false) return;
            const sx2 = s.x + s.widthPx;
            const sy2 = s.y + s.heightPx;
            const intersects = !(s.x > x2 || sx2 < x1 || s.y > y2 || sy2 < y1);
            if (intersects) selected.push(s.id);
          });

          if (m.isShift) {
            selected.forEach(id => {
              if (!state.selectedScreenIds.includes(id)) {
                state.selectedScreenIds.push(id);
              }
            });
          } else {
            state.selectedScreenIds = selected;
          }

          state.selectedScreenId = state.selectedScreenIds[0] || null;
        }

        state.interaction.marquee.active = false;
        UIController.updateActiveScreenForm();
        UIController.updateSelectionHint();
        RenderEngine.render();
        return;
      }

      // Finalizar arrastre de pantallas
      if (state.interaction.draggingScreenId) {
        state.interaction.draggingScreenId = null;
        state.interaction.activeSnapLines = [];
        RenderEngine.render();
        if (state.interaction.hasMoved) {
          Persistence.saveAuto();
        }
      }
    },

    onKeyDown(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        return;
      }

      // Atajos con Ctrl / Cmd: deshacer, rehacer, copiar, cortar, pegar, duplicar
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === "z" && !e.shiftKey) { e.preventDefault(); HistoryEngine.undo(); return; }
        if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); HistoryEngine.redo(); return; }
        if (k === "c") { if (ClipboardEngine.copy()) e.preventDefault(); return; }
        if (k === "x") { if (ClipboardEngine.hasSelection()) { e.preventDefault(); ClipboardEngine.cut(); } return; }
        if (k === "v") { e.preventDefault(); ClipboardEngine.paste(); return; }
        if (k === "d") { e.preventDefault(); ClipboardEngine.duplicateSelection(); return; }
        return;
      }

      // Suprimir / Borrar elimina la selección (se puede deshacer)
      if (e.key === "Delete" || e.key === "Backspace") {
        if (ClipboardEngine.hasSelection()) {
          e.preventDefault();
          ClipboardEngine.deleteSelection();
        }
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else return;

      e.preventDefault();

      // Si hay una capa seleccionada, mover la capa
      if (state.selectedLayerId) {
        const layer = state.layers.find(l => l.id === state.selectedLayerId);
        if (layer && !layer.locked) {
          layer.x = Math.max(0, layer.x + dx);
          layer.y = Math.max(0, layer.y + dy);
          UIController.syncActiveLayerFormValues(layer);
          RenderEngine.render();
          Persistence.saveAuto();
        }
        return;
      }

      // Si hay pantallas seleccionadas, mover pantallas
      if (state.selectedScreenIds.length > 0) {
        state.selectedScreenIds.forEach(id => {
          const s = state.screens.find(sc => sc.id === id);
          if (s) {
            s.x = Math.max(0, s.x + dx);
            s.y = Math.max(0, s.y + dy);
          }
        });

        const activeScreen = state.screens.find(s => s.id === state.selectedScreenId);
        if (activeScreen) {
          const inputX = document.getElementById("screen-pos-x");
          const inputY = document.getElementById("screen-pos-y");
          if (inputX) inputX.value = activeScreen.x;
          if (inputY) inputY.value = activeScreen.y;
        }

        RenderEngine.render();
        Persistence.saveAuto();
      }
    }
  };


  /* ===========================================================================
   * 8. ALIGNMENT & DISTRIBUTION ENGINE
   * =========================================================================== */
  const AlignmentEngine = {
    getSelectedScreens() {
      return state.screens.filter(s => s.visible !== false && state.selectedScreenIds.includes(s.id));
    },

    getSelectionBounds(selected) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      selected.forEach(s => {
        if (s.x < minX) minX = s.x;
        if (s.x + s.widthPx > maxX) maxX = s.x + s.widthPx;
        if (s.y < minY) minY = s.y;
        if (s.y + s.heightPx > maxY) maxY = s.y + s.heightPx;
      });
      return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
    },

    align(type) {
      const selected = this.getSelectedScreens();
      if (selected.length === 0) return;

      const cw = state.canvas.computedWidth;
      const ch = state.canvas.computedHeight;

      if (selected.length === 1) {
        const s = selected[0];
        if (type === "left") s.x = 0;
        else if (type === "center-h") s.x = Math.round((cw - s.widthPx) / 2);
        else if (type === "right") s.x = cw - s.widthPx;
        else if (type === "top") s.y = 0;
        else if (type === "center-v") s.y = Math.round((ch - s.heightPx) / 2);
        else if (type === "bottom") s.y = ch - s.heightPx;
      } else {
        const b = this.getSelectionBounds(selected);
        selected.forEach(s => {
          if (type === "left") s.x = b.minX;
          else if (type === "center-h") s.x = Math.round(b.minX + (b.width - s.widthPx) / 2);
          else if (type === "right") s.x = b.maxX - s.widthPx;
          else if (type === "top") s.y = b.minY;
          else if (type === "center-v") s.y = Math.round(b.minY + (b.height - s.heightPx) / 2);
          else if (type === "bottom") s.y = b.maxY - s.heightPx;
        });
      }

      this.afterTransform();
    },

    centerInCanvas(axis) {
      const selected = this.getSelectedScreens();
      if (selected.length === 0) return;

      const cw = state.canvas.computedWidth;
      const ch = state.canvas.computedHeight;
      const b = this.getSelectionBounds(selected);

      const targetX = Math.round((cw - b.width) / 2);
      const targetY = Math.round((ch - b.height) / 2);

      const dx = targetX - b.minX;
      const dy = targetY - b.minY;

      selected.forEach(s => {
        if (axis === "h" || axis === "both") s.x = Math.max(0, s.x + dx);
        if (axis === "v" || axis === "both") s.y = Math.max(0, s.y + dy);
      });

      this.afterTransform();
    },

    distribute(axis, spacing) {
      const selected = this.getSelectedScreens();
      if (selected.length < 2) return;

      const sp = Math.max(0, parseInt(spacing, 10) || 0);

      if (axis === "h") {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        let cur = sorted[0].x;
        for (let i = 1; i < sorted.length; i++) {
          cur += sorted[i - 1].widthPx + sp;
          sorted[i].x = cur;
        }
      } else if (axis === "v") {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        let cur = sorted[0].y;
        for (let i = 1; i < sorted.length; i++) {
          cur += sorted[i - 1].heightPx + sp;
          sorted[i].y = cur;
        }
      }

      this.afterTransform();
    },

    afterTransform() {
      const activeScreen = state.screens.find(s => s.id === state.selectedScreenId);
      if (activeScreen) {
        const inputX = document.getElementById("screen-pos-x");
        const inputY = document.getElementById("screen-pos-y");
        if (inputX) inputX.value = activeScreen.x;
        if (inputY) inputY.value = activeScreen.y;
      }

      RenderEngine.render();
      Persistence.saveAuto();
    }
  };


  /* ===========================================================================
   * 8.5 HISTORY ENGINE (Deshacer / Rehacer) y CLIPBOARD ENGINE (Copiar / Pegar)
   * =========================================================================== */
  const HistoryEngine = {
    stack: [],
    index: -1,
    maxSteps: 100,
    btnUndo: null,
    btnRedo: null,

    /** Serializa solo el documento (sin selección, zoom ni valores derivados). */
    serialize() {
      return JSON.stringify({
        screens: state.screens,
        layers: state.layers,
        locations: state.locations,
        canvas: {
          mode: state.canvas.mode,
          manualWidth: state.canvas.manualWidth,
          manualHeight: state.canvas.manualHeight
        },
        canvasBg: state.settings.canvasBg,
        display: {
          displayMode: state.settings.displayMode,
          gradientDirection: state.settings.gradientDirection,
          showModuleLines: state.settings.showModuleLines,
          gridLineWidth: state.settings.gridLineWidth,
          gridLineColor: state.settings.gridLineColor,
          gridBgColor: state.settings.gridBgColor,
          testCard: { ...RenderEngine.getTestCardSettings(null) },
          cellMode: state.settings.cellMode,
          cellModPreset: state.settings.cellModPreset,
          cellModWidthMm: state.settings.cellModWidthMm,
          cellModHeightMm: state.settings.cellModHeightMm,
          cellTargetPx: state.settings.cellTargetPx,
          animation: { ...AnimationEngine.getSettings() }
        }
      });
    },

    takeSnapshot() {
      return {
        doc: this.serialize(),
        sel: {
          screens: [...state.selectedScreenIds],
          screen: state.selectedScreenId,
          layer: state.selectedLayerId
        }
      };
    },

    /** Reinicia el historial con el estado actual como punto de partida. */
    reset() {
      this.initButtons();
      this.stack = [this.takeSnapshot()];
      this.index = 0;
      this.updateButtons();
    },

    /** Guarda un paso nuevo si el documento cambió. Se llama desde Persistence.saveAuto(). */
    commit() {
      const it = state.interaction;
      // No registrar pasos intermedios mientras se arrastra, escala o selecciona
      if (it.layerAction || it.draggingScreenId || it.marquee.active) return;
      if (this.index < 0) return;

      const doc = this.serialize();
      if (doc === this.stack[this.index].doc) return;

      this.stack = this.stack.slice(0, this.index + 1);
      this.stack.push(this.takeSnapshot());
      if (this.stack.length > this.maxSteps) {
        this.stack.shift();
      }
      this.index = this.stack.length - 1;
      this.updateButtons();
    },

    undo() {
      // Asegurar que lo último que se editó quede registrado antes de retroceder
      clearTimeout(Persistence.saveTimeout);
      this.commit();
      if (this.index <= 0) return;
      this.index--;
      this.apply(this.stack[this.index]);
    },

    redo() {
      clearTimeout(Persistence.saveTimeout);
      this.commit();
      if (this.index >= this.stack.length - 1) return;
      this.index++;
      this.apply(this.stack[this.index]);
    },

    apply(snap) {
      const d = JSON.parse(snap.doc);

      state.screens = d.screens;
      state.layers = d.layers;
      state.locations = d.locations;
      state.canvas = Object.assign({}, state.canvas, d.canvas);
      state.settings.canvasBg = d.canvasBg;
      if (d.display) Object.assign(state.settings, d.display);

      state.selectedScreenIds = snap.sel.screens.filter(id => state.screens.some(s => s.id === id));
      state.selectedScreenId = state.screens.some(s => s.id === snap.sel.screen)
        ? snap.sel.screen
        : (state.selectedScreenIds[0] || null);
      state.selectedLayerId = state.layers.some(l => l.id === snap.sel.layer) ? snap.sel.layer : null;

      // Sincronizar controles de la barra superior
      const bgSel = document.getElementById("canvas-bg-select");
      if (bgSel) bgSel.value = state.settings.canvasBg;
      UIController.updateDisplayModeControls();
      UIController.updateAnimationControls();
      const modeSel = document.getElementById("canvas-mode-select");
      if (modeSel) modeSel.value = state.canvas.mode;
      const manualDims = document.getElementById("manual-canvas-dimensions");
      if (manualDims) manualDims.classList.toggle("hidden", state.canvas.mode !== "manual");
      const inW = document.getElementById("canvas-width-input");
      if (inW) inW.value = state.canvas.manualWidth;
      const inH = document.getElementById("canvas-height-input");
      if (inH) inH.value = state.canvas.manualHeight;

      UIController.renderLocationsList();
      UIController.updateScreensSelector();
      UIController.updateActiveScreenForm();
      UIController.updateLayersList();
      UIController.updateActiveLayerForm();
      UIController.updateSummaryTable();
      UIController.updateSelectionHint();
      RenderEngine.render();

      // Alinear el paso actual con el estado real (por si algún cálculo redondeó algo)
      this.stack[this.index].doc = this.serialize();
      this.updateButtons();
      Persistence.saveAuto();
    },

    initButtons() {
      if (this.btnUndo) return;
      const ref = document.getElementById("btn-zoom-out");
      if (!ref || !ref.parentElement || !ref.parentElement.parentNode) return;

      const make = (text, title, handler) => {
        const b = document.createElement("button");
        b.className = "hud-btn";
        b.textContent = text;
        b.title = title;
        b.addEventListener("click", handler);
        return b;
      };

      this.btnUndo = make("\u21B6", "Deshacer (Ctrl+Z)", () => this.undo());
      this.btnRedo = make("\u21B7", "Rehacer (Ctrl+Y)", () => this.redo());

      const group = document.createElement("div");
      group.className = "hud-controls-group";
      group.appendChild(this.btnUndo);
      group.appendChild(this.btnRedo);
      ref.parentElement.parentNode.insertBefore(group, ref.parentElement);
    },

    updateButtons() {
      const setState = (btn, enabled) => {
        if (!btn) return;
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? "1" : "0.35";
        btn.style.pointerEvents = enabled ? "auto" : "none";
      };
      setState(this.btnUndo, this.index > 0);
      setState(this.btnRedo, this.index < this.stack.length - 1);
    }
  };


  const ClipboardEngine = {
    clip: null,
    pasteCount: 0,

    hasSelection() {
      if (state.selectedLayerId && state.layers.some(l => l.id === state.selectedLayerId)) return true;
      return state.selectedScreenIds.length > 0;
    },

    clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    },

    /** Copia la selección actual (capa o pantallas) al portapapeles interno. */
    copy() {
      if (state.selectedLayerId) {
        const l = state.layers.find(ly => ly.id === state.selectedLayerId);
        if (!l) return false;
        this.clip = { kind: "layer", items: [this.clone(l)] };
      } else if (state.selectedScreenIds.length > 0) {
        const items = state.screens
          .filter(s => state.selectedScreenIds.includes(s.id))
          .map(s => this.clone(s));
        if (items.length === 0) return false;
        this.clip = { kind: "screen", items };
      } else {
        return false;
      }
      this.pasteCount = 0;
      return true;
    },

    cut() {
      if (!this.copy()) return;
      this.deleteSelection();
    },

    paste() {
      if (!this.clip) return;
      this.pasteCount++;
      this.insert(this.clip.kind, this.clip.items, 20 * this.pasteCount);
    },

    /** Duplica la selección con un pequeño desplazamiento (no usa el portapapeles). */
    duplicateSelection() {
      if (state.selectedLayerId) {
        const l = state.layers.find(ly => ly.id === state.selectedLayerId);
        if (l) this.insert("layer", [this.clone(l)], 20);
      } else if (state.selectedScreenIds.length > 0) {
        const items = state.screens
          .filter(s => state.selectedScreenIds.includes(s.id))
          .map(s => this.clone(s));
        if (items.length > 0) this.insert("screen", items, 20);
      }
    },

    uniqueScreenLabel(base) {
      const root = String(base).replace(/ copia( \d+)?$/, "");
      let candidate = `${root} copia`;
      let n = 2;
      while (state.screens.some(s => s.label === candidate)) {
        candidate = `${root} copia ${n++}`;
      }
      return candidate;
    },

    uniqueLayerName(base) {
      const root = String(base).replace(/ \(copia( \d+)?\)$/, "");
      let candidate = `${root} (copia)`;
      let n = 2;
      while (state.layers.some(l => l.name === candidate)) {
        candidate = `${root} (copia ${n++})`;
      }
      return candidate;
    },

    insert(kind, items, offset) {
      const stamp = Date.now();

      if (kind === "layer") {
        let lastId = null;
        items.forEach((orig, i) => {
          const c = this.clone(orig);
          c.id = `layer_${stamp}_${i}_${Math.floor(Math.random() * 1000)}`;
          c.name = this.uniqueLayerName(orig.name);
          c.x = Math.max(0, orig.x + offset);
          c.y = Math.max(0, orig.y + offset);
          state.layers.push(c);
          lastId = c.id;
        });
        state.selectedLayerId = lastId;
        state.selectedScreenIds = [];
        state.selectedScreenId = null;
      } else {
        const newIds = [];
        items.forEach((orig, i) => {
          const c = this.clone(orig);
          c.id = `screen_${stamp}_${i}_${Math.floor(Math.random() * 1000)}`;
          c.label = this.uniqueScreenLabel(orig.label);
          c.x = Math.max(0, orig.x + offset);
          c.y = Math.max(0, orig.y + offset);
          state.screens.push(c);
          newIds.push(c.id);
        });
        state.selectedScreenIds = newIds;
        state.selectedScreenId = newIds[0] || null;
        state.selectedLayerId = null;
      }

      this.refreshUI();
    },

    deleteSelection() {
      if (state.selectedLayerId) {
        LayersEngine.deleteLayer(state.selectedLayerId);
        UIController.updateSelectionHint();
        return;
      }
      if (state.selectedScreenIds.length === 0) return;

      state.screens = state.screens.filter(s => !state.selectedScreenIds.includes(s.id));
      state.selectedScreenId = state.screens.length > 0 ? state.screens[0].id : null;
      state.selectedScreenIds = state.selectedScreenId ? [state.selectedScreenId] : [];
      this.refreshUI();
    },

    refreshUI() {
      UIController.updateScreensSelector();
      UIController.updateActiveScreenForm();
      UIController.updateLayersList();
      UIController.updateActiveLayerForm();
      UIController.updateSummaryTable();
      UIController.updateSelectionHint();
      RenderEngine.render();
      Persistence.saveAuto();
    }
  };


  /* ===========================================================================
   * 9. UI CONTROLLER (Formularios, Capas, Tipografías, Tabla Resumen)
   * =========================================================================== */
  const UIController = {
    init() {
      this.bindTabNavigation();
      this.bindTopbarControls();
      this.bindAlignmentToolbar();
      this.bindScreenListControls();
      this.bindLayersControls();
      this.bindSettingsControls();
      this.bindAnimationControls();
      this.renderLocationsList();
      this.updateScreensSelector();
      this.updateActiveScreenForm();
      this.updateLayersList();
      this.updateActiveLayerForm();
      this.updateSummaryTable();
      this.updateSelectionHint();
      this.updateFontTagsList();
    },

    switchTab(tabId) {
      document.querySelectorAll(".tab-btn").forEach(t => {
        t.classList.toggle("active", t.dataset.tab === tabId);
      });
      document.querySelectorAll(".sidebar-tab-content").forEach(c => {
        c.classList.toggle("active", c.id === tabId);
      });
      if (tabId === "tab-summary") {
        this.updateSummaryTable();
      }
    },

    updateSelectionHint() {
      const hint = document.getElementById("selection-status-hint");
      if (!hint) return;

      if (state.selectedLayerId) {
        const l = state.layers.find(ly => ly.id === state.selectedLayerId);
        hint.textContent = l ? `Capa: ${l.name}` : "Capa seleccionada";
        return;
      }

      const count = state.selectedScreenIds.length;
      hint.textContent = count === 1
        ? "1 pantalla seleccionada"
        : `${count} pantallas seleccionadas`;
    },

    bindTabNavigation() {
      const tabs = document.querySelectorAll(".tab-btn");
      tabs.forEach(tab => {
        tab.addEventListener("click", () => {
          this.switchTab(tab.dataset.tab);
        });
      });
    },

    bindTopbarControls() {
      const canvasBgSelect = document.getElementById("canvas-bg-select");
      if (canvasBgSelect) {
        canvasBgSelect.value = state.settings.canvasBg;
        canvasBgSelect.addEventListener("change", (e) => {
          state.settings.canvasBg = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
      }

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
        manualDims.classList.toggle("hidden", state.canvas.mode !== "manual");
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

      document.getElementById("btn-zoom-in").addEventListener("click", () => ViewportEngine.zoomBy(1));
      document.getElementById("btn-zoom-out").addEventListener("click", () => ViewportEngine.zoomBy(-1));
      document.getElementById("btn-zoom-100").addEventListener("click", () => ViewportEngine.zoom100());
      document.getElementById("btn-zoom-fit").addEventListener("click", () => ViewportEngine.zoomToFit());
    },

    bindAlignmentToolbar() {
      document.getElementById("btn-align-left").addEventListener("click", () => AlignmentEngine.align("left"));
      document.getElementById("btn-align-center-h").addEventListener("click", () => AlignmentEngine.align("center-h"));
      document.getElementById("btn-align-right").addEventListener("click", () => AlignmentEngine.align("right"));
      document.getElementById("btn-align-top").addEventListener("click", () => AlignmentEngine.align("top"));
      document.getElementById("btn-align-center-v").addEventListener("click", () => AlignmentEngine.align("center-v"));
      document.getElementById("btn-align-bottom").addEventListener("click", () => AlignmentEngine.align("bottom"));

      document.getElementById("btn-center-h").addEventListener("click", () => AlignmentEngine.centerInCanvas("h"));
      document.getElementById("btn-center-v").addEventListener("click", () => AlignmentEngine.centerInCanvas("v"));
      document.getElementById("btn-center-both").addEventListener("click", () => AlignmentEngine.centerInCanvas("both"));

      const spacingInput = document.getElementById("distribute-spacing-input");
      document.getElementById("btn-distribute-h").addEventListener("click", () => {
        AlignmentEngine.distribute("h", spacingInput.value);
      });
      document.getElementById("btn-distribute-v").addEventListener("click", () => {
        AlignmentEngine.distribute("v", spacingInput.value);
      });
    },

    bindScreenListControls() {
      const select = document.getElementById("active-screen-select");
      const addBtn = document.getElementById("btn-add-screen");
      const dupBtn = document.getElementById("btn-duplicate-screen");
      const delBtn = document.getElementById("btn-delete-screen");

      select.addEventListener("change", (e) => {
        state.selectedScreenId = e.target.value;
        state.selectedScreenIds = e.target.value ? [e.target.value] : [];
        state.selectedLayerId = null;
        this.updateActiveScreenForm();
        this.updateActiveLayerForm();
        this.updateSelectionHint();
        RenderEngine.render();
      });

      addBtn.addEventListener("click", () => this.addNewScreen());
      dupBtn.addEventListener("click", () => this.duplicateSelectedScreen());
      delBtn.addEventListener("click", () => this.deleteSelectedScreen());
    },

    /* =========================================================================
     * GESTIÓN DE CAPAS (UI)
     * ========================================================================= */
    bindLayersControls() {
      // Botones de creación rápida
      document.getElementById("btn-add-layer-text").addEventListener("click", () => LayersEngine.createLayer("text"));
      document.getElementById("btn-add-layer-rect").addEventListener("click", () => LayersEngine.createLayer("rect"));
      document.getElementById("btn-add-layer-circle").addEventListener("click", () => LayersEngine.createLayer("circle"));
      document.getElementById("btn-add-layer-line").addEventListener("click", () => LayersEngine.createLayer("line"));
      document.getElementById("btn-add-layer-gradient").addEventListener("click", () => LayersEngine.createLayer("gradient"));

      // Ordenación y operaciones de capa
      document.getElementById("btn-layer-bring-front").addEventListener("click", () => {
        if (state.selectedLayerId) LayersEngine.moveOrder(state.selectedLayerId, "front");
      });
      document.getElementById("btn-layer-move-up").addEventListener("click", () => {
        if (state.selectedLayerId) LayersEngine.moveOrder(state.selectedLayerId, "up");
      });
      document.getElementById("btn-layer-move-down").addEventListener("click", () => {
        if (state.selectedLayerId) LayersEngine.moveOrder(state.selectedLayerId, "down");
      });
      document.getElementById("btn-layer-send-back").addEventListener("click", () => {
        if (state.selectedLayerId) LayersEngine.moveOrder(state.selectedLayerId, "back");
      });
      document.getElementById("btn-layer-duplicate").addEventListener("click", () => {
        if (state.selectedLayerId) LayersEngine.duplicateLayer(state.selectedLayerId);
      });
      document.getElementById("btn-layer-delete").addEventListener("click", () => {
        if (state.selectedLayerId) LayersEngine.deleteLayer(state.selectedLayerId);
      });

      // Carga de tipografía personalizada (.ttf, .otf, .woff2)
      const inputCustomFont = document.getElementById("input-custom-font");
      if (inputCustomFont) {
        inputCustomFont.addEventListener("change", (e) => {
          this.handleLoadCustomFont(e.target.files[0]);
          e.target.value = "";
        });
      }
    },

    async handleLoadCustomFont(file) {
      if (!file) return;

      const rawName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fontName = `UserFont_${rawName}`;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        try {
          const fontFace = new FontFace(fontName, `url(${dataUrl})`);
          await fontFace.load();
          document.fonts.add(fontFace);

          // Guardar en estado para persistencia en JSON
          state.customFonts = state.customFonts.filter(f => f.name !== fontName);
          state.customFonts.push({ name: fontName, displayName: rawName, dataUrl });

          this.updateFontTagsList();
          this.updateActiveLayerForm();
          alert(`Tipografía "${rawName}" cargada correctamente.`);
          Persistence.saveAuto();
        } catch (err) {
          alert(`Error al registrar la tipografía: ${err.message}`);
        }
      };
      reader.readAsDataURL(file);
    },

    updateFontTagsList() {
      const container = document.getElementById("custom-fonts-list");
      if (!container) return;

      container.innerHTML = "";
      state.customFonts.forEach((f, idx) => {
        const tag = document.createElement("span");
        tag.className = "font-tag";
        tag.innerHTML = `
          <span>${f.displayName || f.name}</span>
          <button class="location-tag-remove" data-idx="${idx}" title="Quitar tipografía">×</button>
        `;
        container.appendChild(tag);
      });

      container.querySelectorAll(".location-tag-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.target.dataset.idx, 10);
          state.customFonts.splice(idx, 1);
          this.updateFontTagsList();
          this.updateActiveLayerForm();
          Persistence.saveAuto();
        });
      });
    },

    updateLayersList() {
      const container = document.getElementById("layers-list");
      const badge = document.getElementById("layers-count-badge");
      if (!container) return;

      container.innerHTML = "";
      if (badge) badge.textContent = state.layers.length;

      if (state.layers.length === 0) {
        container.innerHTML = `
          <div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 11px;">
            Sin capas añadidas. Usa los botones superiores.
          </div>
        `;
        return;
      }

      // Mostrar capas de arriba hacia abajo (orden visual z-index invertido)
      for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        const isSelected = layer.id === state.selectedLayerId;

        const row = document.createElement("div");
        row.className = `layer-item ${isSelected ? "active" : ""}`;

        row.innerHTML = `
          <button class="layer-item-btn ${layer.visible ? "" : "inactive"}" data-action="vis" data-id="${layer.id}" title="Mostrar/Ocultar">
            ${layer.visible ? "Ver" : "Oculto"}
          </button>
          <button class="layer-item-btn ${layer.locked ? "" : "inactive"}" data-action="lock" data-id="${layer.id}" title="Bloquear/Desbloquear">
            ${layer.locked ? "Bloq" : "Libre"}
          </button>
          <span class="layer-type-tag">${layer.type}</span>
          <span class="layer-name-text">${layer.name}</span>
        `;

        row.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          state.selectedLayerId = layer.id;
          state.selectedScreenIds = [];
          state.selectedScreenId = null;
          this.updateLayersList();
          this.updateActiveLayerForm();
          this.updateActiveScreenForm();
          this.updateSelectionHint();
          RenderEngine.render();
        });

        const visBtn = row.querySelector('[data-action="vis"]');
        const lockBtn = row.querySelector('[data-action="lock"]');

        visBtn.addEventListener("click", () => LayersEngine.toggleVisibility(layer.id));
        lockBtn.addEventListener("click", () => LayersEngine.toggleLock(layer.id));

        container.appendChild(row);
      }
    },

    updateActiveLayerForm() {
      const formContainer = document.getElementById("layer-editor-form");
      if (!formContainer) return;

      const layer = state.layers.find(l => l.id === state.selectedLayerId);
      if (!layer) {
        formContainer.innerHTML = `
          <div class="editor-card" style="text-align: center; padding: 20px 14px;">
            <p style="color: var(--text-muted); font-size: 11px;">Selecciona una capa en la lista o en el lienzo para editar sus propiedades.</p>
          </div>
        `;
        return;
      }

      // Opciones de tipografía (Inter + fuentes cargadas)
      let fontOptions = `<option value="${FONT_MAIN}" ${layer.fontFamily === FONT_MAIN ? "selected" : ""}>Inter (Predeterminada)</option>`;
      state.customFonts.forEach(cf => {
        fontOptions += `<option value="${cf.name}" ${layer.fontFamily === cf.name ? "selected" : ""}>${cf.displayName || cf.name} (Cargada)</option>`;
      });

      // Campos específicos según tipo de capa
      let specificFields = "";

      if (layer.type === "text") {
        specificFields = `
          <div class="editor-card">
            <div class="editor-card-title"><span>Texto & Tipografía</span></div>
            <div class="form-group">
              <label for="layer-text-content">Contenido</label>
              <textarea id="layer-text-content" class="form-textarea" rows="2">${layer.text || ""}</textarea>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="layer-text-font">Tipografía</label>
                <select id="layer-text-font" class="form-select">${fontOptions}</select>
              </div>
              <div class="form-group">
                <label for="layer-text-size"><span>Tamaño</span><span class="label-unit">px</span></label>
                <input type="number" id="layer-text-size" class="form-input" min="6" max="1000" step="1" value="${layer.fontSize || 36}">
              </div>
            </div>
            <div class="form-grid-3">
              <div class="form-group">
                <label for="layer-text-weight">Peso</label>
                <select id="layer-text-weight" class="form-select">
                  <option value="200" ${layer.fontWeight === "200" ? "selected" : ""}>200</option>
                  <option value="300" ${layer.fontWeight === "300" ? "selected" : ""}>300</option>
                  <option value="400" ${layer.fontWeight === "400" ? "selected" : ""}>400</option>
                  <option value="500" ${layer.fontWeight === "500" ? "selected" : ""}>500</option>
                  <option value="600" ${layer.fontWeight === "600" ? "selected" : ""}>600</option>
                </select>
              </div>
              <div class="form-group">
                <label for="layer-text-align">Alineación</label>
                <select id="layer-text-align" class="form-select">
                  <option value="left" ${layer.textAlign === "left" ? "selected" : ""}>Izq</option>
                  <option value="center" ${layer.textAlign === "center" ? "selected" : ""}>Centro</option>
                  <option value="right" ${layer.textAlign === "right" ? "selected" : ""}>Der</option>
                </select>
              </div>
              <div class="form-group">
                <label>Color</label>
                <div class="color-picker-pair">
                  <input type="color" id="layer-fill-picker" class="color-input-native" value="${layer.fillColor || '#ffffff'}">
                  <input type="text" id="layer-fill-hex" class="color-input-hex" value="${layer.fillColor || '#ffffff'}" maxlength="7">
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (layer.type === "rect" || layer.type === "circle") {
        specificFields = `
          <div class="editor-card">
            <div class="editor-card-title"><span>Relleno y Borde</span></div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Color Relleno</label>
                <div class="color-picker-pair">
                  <input type="color" id="layer-fill-picker" class="color-input-native" value="${layer.fillColor && layer.fillColor !== 'transparent' ? layer.fillColor : '#ffffff'}">
                  <input type="text" id="layer-fill-hex" class="color-input-hex" value="${layer.fillColor || '#ffffff'}" maxlength="7">
                </div>
              </div>
              <div class="form-group">
                <label>Color Borde</label>
                <div class="color-picker-pair">
                  <input type="color" id="layer-stroke-picker" class="color-input-native" value="${layer.strokeColor || '#333333'}">
                  <input type="text" id="layer-stroke-hex" class="color-input-hex" value="${layer.strokeColor || '#333333'}" maxlength="7">
                </div>
              </div>
            </div>
            <div class="form-group">
              <label for="layer-stroke-width"><span>Grosor de Borde</span><span class="label-unit">px (0 = sin borde)</span></label>
              <input type="number" id="layer-stroke-width" class="form-input" min="0" max="100" step="1" value="${layer.strokeWidth || 0}">
            </div>
          </div>
        `;
      } else if (layer.type === "line") {
        specificFields = `
          <div class="editor-card">
            <div class="editor-card-title"><span>Propiedades de Línea</span></div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Color</label>
                <div class="color-picker-pair">
                  <input type="color" id="layer-stroke-picker" class="color-input-native" value="${layer.strokeColor || '#ffffff'}">
                  <input type="text" id="layer-stroke-hex" class="color-input-hex" value="${layer.strokeColor || '#ffffff'}" maxlength="7">
                </div>
              </div>
              <div class="form-group">
                <label for="layer-stroke-width"><span>Grosor</span><span class="label-unit">px</span></label>
                <input type="number" id="layer-stroke-width" class="form-input" min="1" max="100" step="1" value="${layer.strokeWidth || 2}">
              </div>
            </div>
          </div>
        `;
      } else if (layer.type === "gradient") {
        const stopsHtml = (layer.gradientStops || []).map((st, sIdx) => `
          <div class="gradient-stop-row" data-sidx="${sIdx}">
            <input type="color" class="color-input-native stop-color-picker" value="${st.color}">
            <input type="text" class="color-input-hex stop-color-hex" value="${st.color}" maxlength="7">
            <input type="number" class="form-input-sm gradient-stop-offset" min="0" max="100" step="1" value="${Math.round(st.offset * 100)}" title="Posición 0-100%"> %
            ${layer.gradientStops.length > 2 ? `<button class="btn-remove-stop" title="Quitar color">×</button>` : ""}
          </div>
        `).join("");

        specificFields = `
          <div class="editor-card">
            <div class="editor-card-title"><span>Configuración de Degradado</span></div>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="layer-grad-type">Tipo</label>
                <select id="layer-grad-type" class="form-select">
                  <option value="linear" ${layer.gradientType === "linear" ? "selected" : ""}>Lineal</option>
                  <option value="radial" ${layer.gradientType === "radial" ? "selected" : ""}>Radial</option>
                </select>
              </div>
              <div class="form-group">
                <label for="layer-grad-angle"><span>Ángulo (Lineal)</span><span class="label-unit">grados</span></label>
                <input type="number" id="layer-grad-angle" class="form-input" min="0" max="360" step="1" value="${layer.gradientAngle || 90}">
              </div>
            </div>

            <div class="gradient-stops-container">
              <label>Colores del Degradado:</label>
              <div class="gradient-stops-list" id="gradient-stops-list">${stopsHtml}</div>
              <button id="btn-add-gradient-stop" class="btn btn-secondary btn-sm" style="margin-top: 4px;">+ Agregar Color</button>
            </div>
          </div>
        `;
      }

      formContainer.innerHTML = `
        <!-- Identificación y Nombre -->
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Capa: ${layer.type.toUpperCase()}</span>
            <span class="badge">${layer.locked ? "Bloqueada" : "Editable"}</span>
          </div>
          <div class="form-group">
            <label for="layer-name-input">Nombre</label>
            <input type="text" id="layer-name-input" class="form-input" value="${layer.name}">
          </div>
        </div>

        <!-- Transformación: Posición, Tamaño, Rotación, Opacidad -->
        <div class="editor-card">
          <div class="editor-card-title"><span>Posición & Transformación</span></div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="layer-pos-x"><span>X</span><span class="label-unit">px</span></label>
              <input type="number" id="layer-pos-x" class="form-input" step="1" value="${layer.x}">
            </div>
            <div class="form-group">
              <label for="layer-pos-y"><span>Y</span><span class="label-unit">px</span></label>
              <input type="number" id="layer-pos-y" class="form-input" step="1" value="${layer.y}">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="layer-width"><span>Ancho (W)</span><span class="label-unit">px</span></label>
              <input type="number" id="layer-width" class="form-input" min="2" step="1" value="${layer.width}">
            </div>
            <div class="form-group">
              <label for="layer-height"><span>Alto (H)</span><span class="label-unit">px</span></label>
              <input type="number" id="layer-height" class="form-input" min="2" step="1" value="${layer.height}">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="layer-rotation"><span>Rotación</span><span class="label-unit">grados</span></label>
              <input type="number" id="layer-rotation" class="form-input" min="0" max="360" step="1" value="${layer.rotation || 0}">
            </div>
            <div class="form-group">
              <label for="layer-opacity"><span>Opacidad</span><span class="label-unit">%</span></label>
              <input type="number" id="layer-opacity" class="form-input" min="0" max="100" step="1" value="${Math.round((layer.opacity !== undefined ? layer.opacity : 1) * 100)}">
            </div>
          </div>
        </div>

        ${specificFields}
      `;

      this.attachLayerFormEvents(layer);
    },

    syncActiveLayerFormValues(layer) {
      const getEl = id => document.getElementById(id);

      const xEl = getEl("layer-pos-x");
      const yEl = getEl("layer-pos-y");
      const wEl = getEl("layer-width");
      const hEl = getEl("layer-height");
      const rotEl = getEl("layer-rotation");
      const opEl = getEl("layer-opacity");

      if (xEl && document.activeElement !== xEl) xEl.value = layer.x;
      if (yEl && document.activeElement !== yEl) yEl.value = layer.y;
      if (wEl && document.activeElement !== wEl) wEl.value = layer.width;
      if (hEl && document.activeElement !== hEl) hEl.value = layer.height;
      if (rotEl && document.activeElement !== rotEl) rotEl.value = layer.rotation || 0;
      if (opEl && document.activeElement !== opEl) opEl.value = Math.round((layer.opacity !== undefined ? layer.opacity : 1) * 100);

      this.updateSelectionHint();
      Persistence.saveAuto();
    },

    attachLayerFormEvents(layer) {
      const getEl = id => document.getElementById(id);

      // Nombre
      const nameEl = getEl("layer-name-input");
      if (nameEl) {
        nameEl.addEventListener("input", (e) => {
          layer.name = e.target.value;
          this.updateLayersList();
          Persistence.saveAuto();
        });
      }

      // X, Y
      getEl("layer-pos-x").addEventListener("input", (e) => {
        layer.x = parseInt(e.target.value, 10) || 0;
        RenderEngine.render();
        Persistence.saveAuto();
      });
      getEl("layer-pos-y").addEventListener("input", (e) => {
        layer.y = parseInt(e.target.value, 10) || 0;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // Width, Height
      getEl("layer-width").addEventListener("input", (e) => {
        layer.width = Math.max(2, parseInt(e.target.value, 10) || 10);
        RenderEngine.render();
        Persistence.saveAuto();
      });
      getEl("layer-height").addEventListener("input", (e) => {
        layer.height = Math.max(2, parseInt(e.target.value, 10) || 10);
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // Rotación
      getEl("layer-rotation").addEventListener("input", (e) => {
        layer.rotation = parseInt(e.target.value, 10) || 0;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // Opacidad
      getEl("layer-opacity").addEventListener("input", (e) => {
        const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 100));
        layer.opacity = val / 100;
        RenderEngine.render();
        Persistence.saveAuto();
      });

      // Relleno
      const fillPicker = getEl("layer-fill-picker");
      const fillHex = getEl("layer-fill-hex");
      if (fillPicker && fillHex) {
        fillPicker.addEventListener("input", (e) => {
          layer.fillColor = e.target.value;
          fillHex.value = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        fillHex.addEventListener("change", (e) => {
          const val = e.target.value.trim();
          if (/^#[0-9A-Fa-f]{6}$/.test(val) || val === "transparent") {
            layer.fillColor = val;
            fillPicker.value = val;
            RenderEngine.render();
            Persistence.saveAuto();
          }
        });
      }

      // Borde
      const strokePicker = getEl("layer-stroke-picker");
      const strokeHex = getEl("layer-stroke-hex");
      const strokeWidthEl = getEl("layer-stroke-width");
      if (strokePicker && strokeHex) {
        strokePicker.addEventListener("input", (e) => {
          layer.strokeColor = e.target.value;
          strokeHex.value = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        strokeHex.addEventListener("change", (e) => {
          const val = e.target.value.trim();
          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            layer.strokeColor = val;
            strokePicker.value = val;
            RenderEngine.render();
            Persistence.saveAuto();
          }
        });
      }
      if (strokeWidthEl) {
        strokeWidthEl.addEventListener("input", (e) => {
          layer.strokeWidth = Math.max(0, parseInt(e.target.value, 10) || 0);
          RenderEngine.render();
          Persistence.saveAuto();
        });
      }

      // Campos de Texto
      if (layer.type === "text") {
        getEl("layer-text-content").addEventListener("input", (e) => {
          layer.text = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("layer-text-font").addEventListener("change", (e) => {
          layer.fontFamily = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("layer-text-size").addEventListener("input", (e) => {
          layer.fontSize = Math.max(6, parseInt(e.target.value, 10) || 24);
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("layer-text-weight").addEventListener("change", (e) => {
          layer.fontWeight = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("layer-text-align").addEventListener("change", (e) => {
          layer.textAlign = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
      }

      // Campos de Degradado
      if (layer.type === "gradient") {
        getEl("layer-grad-type").addEventListener("change", (e) => {
          layer.gradientType = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("layer-grad-angle").addEventListener("input", (e) => {
          layer.gradientAngle = parseInt(e.target.value, 10) || 0;
          RenderEngine.render();
          Persistence.saveAuto();
        });

        // Configurar paradas de color de degradado
        const stopsList = getEl("gradient-stops-list");
        if (stopsList) {
          stopsList.querySelectorAll(".gradient-stop-row").forEach(row => {
            const sIdx = parseInt(row.dataset.sidx, 10);
            const picker = row.querySelector(".stop-color-picker");
            const hex = row.querySelector(".stop-color-hex");
            const offsetInput = row.querySelector(".gradient-stop-offset");
            const btnRemove = row.querySelector(".btn-remove-stop");

            picker.addEventListener("input", (e) => {
              layer.gradientStops[sIdx].color = e.target.value;
              hex.value = e.target.value;
              RenderEngine.render();
              Persistence.saveAuto();
            });

            hex.addEventListener("change", (e) => {
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                layer.gradientStops[sIdx].color = e.target.value;
                picker.value = e.target.value;
                RenderEngine.render();
                Persistence.saveAuto();
              }
            });

            offsetInput.addEventListener("input", (e) => {
              const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
              layer.gradientStops[sIdx].offset = val / 100;
              RenderEngine.render();
              Persistence.saveAuto();
            });

            if (btnRemove) {
              btnRemove.addEventListener("click", () => {
                layer.gradientStops.splice(sIdx, 1);
                this.updateActiveLayerForm();
                RenderEngine.render();
                Persistence.saveAuto();
              });
            }
          });
        }

        const btnAddStop = getEl("btn-add-gradient-stop");
        if (btnAddStop) {
          btnAddStop.addEventListener("click", () => {
            layer.gradientStops.push({ offset: 0.5, color: "#777777" });
            layer.gradientStops.sort((a, b) => a.offset - b.offset);
            this.updateActiveLayerForm();
            RenderEngine.render();
            Persistence.saveAuto();
          });
        }
      }
    },

    /** Sincroniza los controles globales de visualización con state.settings. */
    updateDisplayModeControls() {
      const modeSel = document.getElementById("opt-display-mode");
      const dirSel = document.getElementById("opt-gradient-direction");
      const linesChk = document.getElementById("opt-show-module-lines");
      const box = document.getElementById("opt-gradient-options");
      if (!modeSel) return;
      modeSel.value = state.settings.displayMode || "checker";
      dirSel.value = state.settings.gradientDirection || "horizontal";
      linesChk.checked = state.settings.showModuleLines !== false;
      box.classList.toggle("hidden", modeSel.value !== "gradient");
      const gridBox = document.getElementById("opt-grid-options");
      if (gridBox) {
        gridBox.classList.toggle("hidden", modeSel.value !== "bw" && modeSel.value !== "testcard");
        const gs = RenderEngine.getGridStyle(null);
        document.getElementById("opt-grid-line-width").value = gs.width;
        document.getElementById("opt-grid-line-color").value = gs.color;
        document.getElementById("opt-grid-bg-color").value = gs.bg;
      }
      const tcBox = document.getElementById("opt-testcard-options");
      if (tcBox) {
        tcBox.classList.toggle("hidden", modeSel.value !== "testcard");
        const tc = RenderEngine.getTestCardSettings(null);
        document.getElementById("opt-tc-color-bar").checked = tc.colorBar;
        document.getElementById("opt-tc-bw-bar").checked = tc.bwBar;
        document.getElementById("opt-tc-circle").checked = tc.circle;
        document.getElementById("opt-tc-cross").checked = tc.cross;
        document.getElementById("opt-tc-diagonals").checked = tc.diagonals;
        document.getElementById("opt-tc-grad-circle").checked = tc.gradCircle;
        const gcBox = document.getElementById("opt-tc-grad-circle-options");
        if (gcBox) gcBox.classList.toggle("hidden", !tc.gradCircle);
        document.getElementById("opt-tc-gc-size").value = tc.gradCircleSizePct;
        document.getElementById("opt-tc-gc-x").value = tc.gradCirclePosX;
        document.getElementById("opt-tc-gc-y").value = tc.gradCirclePosY;
        document.getElementById("opt-tc-gc-invert").checked = tc.gradCircleInvert;
        document.getElementById("opt-tc-gc-stroke-enabled").checked = tc.gradCircleStrokeEnabled;
        document.getElementById("opt-tc-gc-stroke-color").value = tc.gradCircleStrokeColor;
        document.getElementById("opt-tc-gc-stroke-width").value = tc.gradCircleStrokeWidth;
        document.getElementById("opt-tc-circle-stroke").value = tc.circleStroke;
        document.getElementById("opt-tc-circle-fill-enabled").checked = tc.circleFillEnabled;
        document.getElementById("opt-tc-circle-fill").value = tc.circleFill;
        document.getElementById("opt-tc-line-color").value = tc.lineColor;
      }
      const cellModeSel = document.getElementById("opt-cell-mode");
      if (cellModeSel) {
        const cs = RenderEngine.getCellSettings(null);
        cellModeSel.value = cs.mode;
        const ledBox = document.getElementById("opt-cell-led-options");
        const sqBox = document.getElementById("opt-cell-square-options");
        if (ledBox) ledBox.classList.toggle("hidden", cs.mode !== "led_module");
        if (sqBox) sqBox.classList.toggle("hidden", cs.mode !== "square_fit");
        document.getElementById("opt-cell-mod-preset").value = cs.modPreset;
        document.getElementById("opt-cell-mod-w").value = cs.modW;
        document.getElementById("opt-cell-mod-h").value = cs.modH;
        document.getElementById("opt-cell-target-px").value = cs.targetPx;
      }
    },

    bindSettingsControls() {
      const chkLabels = document.getElementById("opt-show-labels");
      const chkSublabels = document.getElementById("opt-show-sublabels");

      chkLabels.checked = state.settings.showLabels;
      chkSublabels.checked = state.settings.showSublabels;

      this.updateDisplayModeControls();
      document.getElementById("opt-display-mode").addEventListener("change", (e) => {
        state.settings.displayMode = e.target.value;
        this.updateDisplayModeControls();
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      });
      document.getElementById("opt-gradient-direction").addEventListener("change", (e) => {
        state.settings.gradientDirection = e.target.value;
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      });
      document.getElementById("opt-show-module-lines").addEventListener("change", (e) => {
        state.settings.showModuleLines = e.target.checked;
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      });
      document.getElementById("opt-grid-line-width").addEventListener("input", (e) => {
        const v = parseInt(e.target.value, 10);
        if (isNaN(v)) return;
        state.settings.gridLineWidth = Math.max(1, Math.min(20, v));
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      });
      document.getElementById("opt-grid-line-color").addEventListener("input", (e) => {
        state.settings.gridLineColor = e.target.value;
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      });
      document.getElementById("opt-grid-bg-color").addEventListener("input", (e) => {
        state.settings.gridBgColor = e.target.value;
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      });
      const setGlobalTc = (key, val) => {
        state.settings.testCard = { ...RenderEngine.getTestCardSettings(null), [key]: val };
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      };
      [
        ["opt-tc-color-bar", "colorBar"],
        ["opt-tc-bw-bar", "bwBar"],
        ["opt-tc-circle", "circle"],
        ["opt-tc-cross", "cross"],
        ["opt-tc-diagonals", "diagonals"],
        ["opt-tc-grad-circle", "gradCircle"],
        ["opt-tc-gc-invert", "gradCircleInvert"],
        ["opt-tc-gc-stroke-enabled", "gradCircleStrokeEnabled"],
        ["opt-tc-circle-fill-enabled", "circleFillEnabled"]
      ].forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", (e) => {
          setGlobalTc(key, e.target.checked);
          if (key === "gradCircle") this.updateDisplayModeControls();
        });
      });
      [
        ["opt-tc-gc-size", "gradCircleSizePct", 5, 100],
        ["opt-tc-gc-x", "gradCirclePosX", 0, 100],
        ["opt-tc-gc-y", "gradCirclePosY", 0, 100],
        ["opt-tc-gc-stroke-width", "gradCircleStrokeWidth", 1, 20]
      ].forEach(([id, key, min, max]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", (e) => {
          const v = parseFloat(e.target.value);
          if (isNaN(v)) return;
          setGlobalTc(key, Math.max(min, Math.min(max, v)));
        });
      });
      [
        ["opt-tc-circle-stroke", "circleStroke"],
        ["opt-tc-circle-fill", "circleFill"],
        ["opt-tc-gc-stroke-color", "gradCircleStrokeColor"],
        ["opt-tc-line-color", "lineColor"]
      ].forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", (e) => setGlobalTc(key, e.target.value));
      });
      document.getElementById("opt-cell-mode").addEventListener("change", (e) => {
        state.settings.cellMode = e.target.value;
        this.updateDisplayModeControls();
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      });
      document.getElementById("opt-cell-mod-preset").addEventListener("change", (e) => {
        const preset = e.target.value;
        state.settings.cellModPreset = preset;
        const dims = RenderEngine.CELL_MOD_PRESETS[preset];
        if (dims) {
          state.settings.cellModWidthMm = dims[0];
          state.settings.cellModHeightMm = dims[1];
          document.getElementById("opt-cell-mod-w").value = dims[0];
          document.getElementById("opt-cell-mod-h").value = dims[1];
        }
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      });
      const onGlobalModDimInput = () => {
        const w = parseFloat(document.getElementById("opt-cell-mod-w").value);
        const h = parseFloat(document.getElementById("opt-cell-mod-h").value);
        if (!(w > 0) || !(h > 0)) return;
        state.settings.cellModWidthMm = Math.max(1, w);
        state.settings.cellModHeightMm = Math.max(1, h);
        const cs = RenderEngine.getCellSettings(null);
        state.settings.cellModPreset = cs.modPreset;
        document.getElementById("opt-cell-mod-preset").value = cs.modPreset;
        this.updateActiveScreenForm();
        RenderEngine.render();
        Persistence.saveAuto();
      };
      document.getElementById("opt-cell-mod-w").addEventListener("input", onGlobalModDimInput);
      document.getElementById("opt-cell-mod-h").addEventListener("input", onGlobalModDimInput);
      document.getElementById("opt-cell-target-px").addEventListener("input", (e) => {
        const v = parseInt(e.target.value, 10);
        if (isNaN(v)) return;
        state.settings.cellTargetPx = Math.max(1, Math.min(4096, v));
        this.updateActiveScreenForm();
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

      document.getElementById("btn-reset-layout").addEventListener("click", () => {
        if (confirm("¿Restaurar el layout inicial de cruz desplegada?")) {
          state.screens = JSON.parse(JSON.stringify(DEFAULT_INITIAL_SCREENS));
          state.screens.forEach(s => CalcEngine.recalculate(s));
          state.selectedScreenId = state.screens[0].id;
          state.selectedScreenIds = [state.screens[0].id];
          state.layers = [];
          state.selectedLayerId = null;
          AnimationEngine.stop();

          this.updateScreensSelector();
          this.updateActiveScreenForm();
          this.updateLayersList();
          this.updateActiveLayerForm();
          this.updateSummaryTable();
          this.updateSelectionHint();
          RenderEngine.render();
          ViewportEngine.zoomToFit();
          Persistence.saveAuto();
        }
      });

      document.getElementById("btn-clear-project").addEventListener("click", () => {
        if (confirm("¿Borrar todas las pantallas y capas del lienzo?")) {
          AnimationEngine.stop();
          state.screens = [];
          state.selectedScreenId = null;
          state.selectedScreenIds = [];
          state.layers = [];
          state.selectedLayerId = null;
          AnimationEngine.stop();

          this.updateScreensSelector();
          this.updateActiveScreenForm();
          this.updateLayersList();
          this.updateActiveLayerForm();
          this.updateSummaryTable();
          this.updateSelectionHint();
          RenderEngine.render();
          Persistence.saveAuto();
        }
      });
    },

    /** Sincroniza la barra de reproducción y tiempo de la animación. */
    syncAnimationPlaybackUI() {
      const dur = AnimationEngine.getSettings().loopDuration;
      const t = Math.min(dur, AnimationEngine.currentTime);
      const scrubber = document.getElementById("anim-scrubber");
      const disp = document.getElementById("anim-time-display");
      const btnPlay = document.getElementById("anim-btn-play");
      const btnPause = document.getElementById("anim-btn-pause");
      if (scrubber) {
        scrubber.max = dur;
        scrubber.step = (1 / AnimationEngine.FPS).toFixed(6);
        if (document.activeElement !== scrubber) scrubber.value = t;
      }
      if (disp) {
        const tag = AnimationEngine.status === "stopped" ? " (Stop)" : "";
        disp.textContent = `${t.toFixed(2)} / ${dur.toFixed(2)} s${tag}`;
      }
      if (btnPlay) btnPlay.disabled = AnimationEngine.status === "playing";
      if (btnPause) btnPause.disabled = AnimationEngine.status !== "playing";
    },

    /** Sincroniza los controles de animación con state.settings.animation. */
    updateAnimationControls() {
      const effEl = document.getElementById("anim-effect");
      if (!effEl) return;
      const a = AnimationEngine.getSettings();
      effEl.value = a.effect;
      document.getElementById("anim-loop-duration").value = a.loopDuration;
      document.getElementById("anim-seq-delay").value = a.seqDelay;
      document.getElementById("anim-seq-fade").value = a.seqFade;
      document.getElementById("anim-seq-off-mode").value = a.seqOffMode;
      document.getElementById("anim-all-duration").value = a.allOnDuration;
      document.getElementById("anim-strobe-target").value = a.strobeTarget;
      document.getElementById("anim-strobe-freq").value = a.strobeFreq;
      document.getElementById("anim-strobe-intensity").value = a.strobeIntensity;
      document.getElementById("anim-strobe-duty").value = a.strobeDuty;

      document.getElementById("anim-seq-params").classList.toggle("hidden", a.effect === "strobe");
      document.getElementById("anim-seq-off-group").classList.toggle("hidden", a.effect !== "sequence");
      document.getElementById("anim-all-params").classList.toggle("hidden", a.effect !== "sequence_all");
      document.getElementById("anim-strobe-params").classList.toggle("hidden", a.effect !== "strobe" && a.effect !== "sequence_strobe");
      document.getElementById("anim-strobe-target-group").classList.toggle("hidden", a.effect !== "strobe");

      const realEl = document.getElementById("anim-strobe-real-freq");
      if (realEl) {
        const activeCount = AnimationEngine.getOrderedActiveScreens().length;
        const meta = AnimationEngine.getStrobeMeta(a, activeCount);
        realEl.textContent = `Frecuencia real: ${meta.realFreq.toFixed(2)} Hz (${meta.cycles} ciclos)`;
      }
      this.syncAnimationPlaybackUI();
    },

    bindAnimationControls() {
      const btnPlay = document.getElementById("anim-btn-play");
      if (!btnPlay) return;
      this.updateAnimationControls();

      btnPlay.addEventListener("click", () => AnimationEngine.play());
      document.getElementById("anim-btn-pause").addEventListener("click", () => AnimationEngine.pause());
      document.getElementById("anim-btn-stop").addEventListener("click", () => AnimationEngine.stop());
      document.getElementById("anim-scrubber").addEventListener("input", (e) => {
        AnimationEngine.seek(parseFloat(e.target.value));
      });

      const setAnim = (key, val, refreshVis) => {
        state.settings.animation = { ...AnimationEngine.getSettings(), [key]: val };
        if (refreshVis) this.updateAnimationControls();
        else {
          const a = AnimationEngine.getSettings();
          const meta = AnimationEngine.getStrobeMeta(a, AnimationEngine.getOrderedActiveScreens().length);
          const realEl = document.getElementById("anim-strobe-real-freq");
          if (realEl) realEl.textContent = `Frecuencia real: ${meta.realFreq.toFixed(2)} Hz (${meta.cycles} ciclos)`;
          this.syncAnimationPlaybackUI();
        }
        if (AnimationEngine.isActive()) RenderEngine.render();
        Persistence.saveAuto();
      };

      document.getElementById("anim-effect").addEventListener("change", (e) => setAnim("effect", e.target.value, true));
      document.getElementById("anim-seq-off-mode").addEventListener("change", (e) => setAnim("seqOffMode", e.target.value, false));
      document.getElementById("anim-strobe-target").addEventListener("change", (e) => setAnim("strobeTarget", e.target.value, false));
      [
        ["anim-loop-duration", "loopDuration", 0.5, 120],
        ["anim-seq-delay", "seqDelay", 0, 30],
        ["anim-seq-fade", "seqFade", 0, 30],
        ["anim-all-duration", "allOnDuration", 0, 60],
        ["anim-strobe-freq", "strobeFreq", 0.5, 15],
        ["anim-strobe-intensity", "strobeIntensity", 0, 100],
        ["anim-strobe-duty", "strobeDuty", 10, 90]
      ].forEach(([id, key, min, max]) => {
        document.getElementById(id).addEventListener("input", (e) => {
          const v = parseFloat(e.target.value);
          if (isNaN(v)) return;
          setAnim(key, Math.max(min, Math.min(max, v)), false);
        });
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
        opt.textContent = `${s.label} (${s.location}) - ${s.widthPx}×${s.heightPx} px${s.visible === false ? " [oculta]" : ""}`;
        select.appendChild(opt);
      });

      if (!state.selectedScreenId && state.screens.length > 0) {
        state.selectedScreenId = state.screens[0].id;
        if (state.selectedScreenIds.length === 0) {
          state.selectedScreenIds = [state.screens[0].id];
        }
      }
      select.value = state.selectedScreenId || "";

      if (badge) {
        badge.textContent = state.screens.length;
      }
    },

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
          <div class="editor-card" style="text-align: center; padding: 20px 14px;">
            <p style="color: var(--text-muted); font-size: 11px;">No hay pantallas seleccionadas o el lienzo está vacío.</p>
            <button id="btn-add-screen-empty" class="btn btn-secondary btn-sm" style="margin-top: 8px;">Agregar Pantalla</button>
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
        <div class="editor-card">
          <div class="editor-card-title">
            <span>Identificación</span>
            <span class="badge">ID: ${screen.id}</span>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-label">Etiqueta</label>
              <input type="text" id="screen-label" class="form-input" value="${screen.label}">
            </div>
            <div class="form-group">
              <label for="screen-location">Ubicación</label>
              <select id="screen-location" class="form-select">
                ${locationOptions}
                <option value="__custom__">+ Nueva ubicación...</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2" style="margin-top:6px;">
            <label class="setting-row" style="margin:0;">
              <span>Incluir en animación</span>
              <input type="checkbox" id="screen-anim-included" ${screen.animIncluded !== false ? "checked" : ""}>
            </label>
            <div class="form-group" style="margin:0;">
              <label for="screen-anim-order"><span>Orden</span><span class="label-unit">1..${Math.max(1, state.screens.length)}</span></label>
              <input type="number" id="screen-anim-order" class="form-input" min="1" max="${Math.max(1, state.screens.length)}" step="1" value="${screen.animOrder || (state.screens.indexOf(screen) + 1)}">
            </div>
          </div>
        </div>

        <div class="editor-card">
          <div class="editor-card-title"><span>Visualización</span></div>
          <div class="form-group">
            <label for="screen-display-mode">Visualización</label>
            <select id="screen-display-mode" class="form-select">
              <option value="global" ${!screen.displayMode || screen.displayMode === "global" ? "selected" : ""}>Usar global</option>
              <option value="checker" ${screen.displayMode === "checker" ? "selected" : ""}>Damero</option>
              <option value="bw" ${screen.displayMode === "bw" ? "selected" : ""}>Grilla</option>
              <option value="gradient" ${screen.displayMode === "gradient" ? "selected" : ""}>Degradado</option>
              <option value="testcard" ${screen.displayMode === "testcard" ? "selected" : ""}>Test card</option>
            </select>
          </div>
          ${(RenderEngine.getScreenDisplayMode(screen) === "bw" || RenderEngine.getScreenDisplayMode(screen) === "testcard") ? (() => {
            const gs = RenderEngine.getGridStyle(screen);
            return `
          <div class="form-grid-3">
            <div class="form-group">
              <label for="screen-grid-line-width"><span>Grosor</span><span class="label-unit">px</span></label>
              <input type="number" id="screen-grid-line-width" class="form-input" min="1" max="20" step="1" value="${gs.width}">
            </div>
            <div class="form-group">
              <label for="screen-grid-line-color">Color línea</label>
              <input type="color" id="screen-grid-line-color" class="color-input-native" value="${gs.color}">
            </div>
            <div class="form-group">
              <label for="screen-grid-bg-color">Color fondo</label>
              <input type="color" id="screen-grid-bg-color" class="color-input-native" value="${gs.bg}">
            </div>
          </div>
          <div class="form-group">
            <button type="button" id="btn-screen-grid-global" class="btn btn-secondary btn-sm">Usar global</button>
          </div>`;
          })() : ""}
          ${RenderEngine.getScreenDisplayMode(screen) === "testcard" ? (() => {
            const tc = RenderEngine.getTestCardSettings(screen);
            return `
          <div class="form-group">
            <label>Elementos de test card</label>
            <label class="setting-row"><span>Degradado color (sup.)</span><input type="checkbox" id="screen-tc-color-bar" ${tc.colorBar ? "checked" : ""}></label>
            <label class="setting-row"><span>Degradado B/N (inf.)</span><input type="checkbox" id="screen-tc-bw-bar" ${tc.bwBar ? "checked" : ""}></label>
            <label class="setting-row"><span>Círculo central</span><input type="checkbox" id="screen-tc-circle" ${tc.circle ? "checked" : ""}></label>
            <label class="setting-row"><span>Eje en cruz</span><input type="checkbox" id="screen-tc-cross" ${tc.cross ? "checked" : ""}></label>
            <label class="setting-row"><span>Diagonales (X)</span><input type="checkbox" id="screen-tc-diagonals" ${tc.diagonals ? "checked" : ""}></label>
            <label class="setting-row"><span>Círculo con degradado</span><input type="checkbox" id="screen-tc-grad-circle" ${tc.gradCircle ? "checked" : ""}></label>
          </div>
          ${tc.gradCircle ? `
          <div class="form-grid-3">
            <div class="form-group">
              <label for="screen-tc-gc-size"><span>Diámetro</span><span class="label-unit">%</span></label>
              <input type="number" id="screen-tc-gc-size" class="form-input" min="5" max="100" step="1" value="${tc.gradCircleSizePct}">
            </div>
            <div class="form-group">
              <label for="screen-tc-gc-x"><span>Pos X</span><span class="label-unit">%</span></label>
              <input type="number" id="screen-tc-gc-x" class="form-input" min="0" max="100" step="1" value="${tc.gradCirclePosX}">
            </div>
            <div class="form-group">
              <label for="screen-tc-gc-y"><span>Pos Y</span><span class="label-unit">%</span></label>
              <input type="number" id="screen-tc-gc-y" class="form-input" min="0" max="100" step="1" value="${tc.gradCirclePosY}">
            </div>
          </div>
          <label class="setting-row"><span>Invertir degradado</span><input type="checkbox" id="screen-tc-gc-invert" ${tc.gradCircleInvert ? "checked" : ""}></label>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-tc-gc-stroke-color">Borde</label>
              <div style="display:flex;align-items:center;gap:6px;">
                <input type="checkbox" id="screen-tc-gc-stroke-enabled" ${tc.gradCircleStrokeEnabled ? "checked" : ""} title="Activar borde">
                <input type="color" id="screen-tc-gc-stroke-color" class="color-input-native" value="${tc.gradCircleStrokeColor}">
              </div>
            </div>
            <div class="form-group">
              <label for="screen-tc-gc-stroke-width"><span>Grosor borde</span><span class="label-unit">px</span></label>
              <input type="number" id="screen-tc-gc-stroke-width" class="form-input" min="1" max="20" step="1" value="${tc.gradCircleStrokeWidth}">
            </div>
          </div>` : ""}
          <div class="form-grid-3">
            <div class="form-group">
              <label for="screen-tc-circle-stroke">Borde círculo</label>
              <input type="color" id="screen-tc-circle-stroke" class="color-input-native" value="${tc.circleStroke}">
            </div>
            <div class="form-group">
              <label for="screen-tc-circle-fill">Relleno</label>
              <div style="display:flex;align-items:center;gap:6px;">
                <input type="checkbox" id="screen-tc-circle-fill-enabled" ${tc.circleFillEnabled ? "checked" : ""} title="Activar relleno">
                <input type="color" id="screen-tc-circle-fill" class="color-input-native" value="${tc.circleFill}">
              </div>
            </div>
            <div class="form-group">
              <label for="screen-tc-line-color">Color líneas</label>
              <input type="color" id="screen-tc-line-color" class="color-input-native" value="${tc.lineColor}">
            </div>
          </div>
          <div class="form-group">
            <button type="button" id="btn-screen-tc-global" class="btn btn-secondary btn-sm">Usar configuración global</button>
          </div>`;
          })() : ""}
          ${(state.settings.displayMode === "gradient" || screen.displayMode === "gradient") ? `
          <div class="form-group">
            <label for="screen-gradient-direction">Dirección del degradado (global)</label>
            <select id="screen-gradient-direction" class="form-select">
              <option value="horizontal" ${state.settings.gradientDirection === "horizontal" || !state.settings.gradientDirection ? "selected" : ""}>Horizontal</option>
              <option value="vertical" ${state.settings.gradientDirection === "vertical" ? "selected" : ""}>Vertical</option>
              <option value="diagonal" ${state.settings.gradientDirection === "diagonal" ? "selected" : ""}>Diagonal</option>
              <option value="radial" ${state.settings.gradientDirection === "radial" ? "selected" : ""}>Radial</option>
            </select>
          </div>
          <label class="setting-row">
            <span>Mostrar líneas de módulo (global)</span>
            <input type="checkbox" id="screen-module-lines" ${state.settings.showModuleLines !== false ? "checked" : ""}>
          </label>` : ""}
          ${(() => {
            const cs = RenderEngine.getCellSettings(screen);
            const gridInfo = RenderEngine.getScreenCellGrid(screen);
            return `
          <div class="form-group">
            <label for="screen-cell-mode">Modo de celda</label>
            <select id="screen-cell-mode" class="form-select">
              <option value="global" ${!screen.cellMode || screen.cellMode === "global" ? "selected" : ""}>Usar global</option>
              <option value="manual" ${screen.cellMode === "manual" ? "selected" : ""}>Módulos de pantalla (actual)</option>
              <option value="led_module" ${screen.cellMode === "led_module" ? "selected" : ""}>Módulo LED (mm)</option>
              <option value="square_fit" ${screen.cellMode === "square_fit" ? "selected" : ""}>Cuadrada ajustada (px)</option>
            </select>
          </div>
          ${cs.mode === "led_module" ? `
          <div class="form-group">
            <label for="screen-cell-mod-preset">Preset de módulo</label>
            <select id="screen-cell-mod-preset" class="form-select">
              <option value="500x500" ${cs.modPreset === "500x500" ? "selected" : ""}>500 × 500 mm</option>
              <option value="500x1000" ${cs.modPreset === "500x1000" ? "selected" : ""}>500 × 1000 mm</option>
              <option value="320x160" ${cs.modPreset === "320x160" ? "selected" : ""}>320 × 160 mm</option>
              <option value="250x250" ${cs.modPreset === "250x250" ? "selected" : ""}>250 × 250 mm</option>
              <option value="custom" ${cs.modPreset === "custom" ? "selected" : ""}>Personalizado</option>
            </select>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-cell-mod-w"><span>Ancho</span><span class="label-unit">mm</span></label>
              <input type="number" id="screen-cell-mod-w" class="form-input" min="1" max="100000" step="1" value="${cs.modW}">
            </div>
            <div class="form-group">
              <label for="screen-cell-mod-h"><span>Alto</span><span class="label-unit">mm</span></label>
              <input type="number" id="screen-cell-mod-h" class="form-input" min="1" max="100000" step="1" value="${cs.modH}">
            </div>
          </div>` : ""}
          ${cs.mode === "square_fit" ? `
          <div class="form-group">
            <label for="screen-cell-target-px"><span>Tamaño objetivo</span><span class="label-unit">px</span></label>
            <input type="number" id="screen-cell-target-px" class="form-input" min="1" max="4096" step="1" value="${cs.targetPx}">
          </div>` : ""}
          <div class="form-group">
            <small id="screen-cell-info" class="small-text">${gridInfo.info}</small>
          </div>
          ${cs.mode !== "manual" ? `
          <div class="form-group">
            <button type="button" id="btn-screen-cell-global" class="btn btn-secondary btn-sm">Usar global</button>
          </div>` : ""}`;
          })()}
        </div>

        <div class="editor-card">
          <div class="editor-card-title"><span>Etiqueta en Pantalla (Plana)</span></div>
          <div class="form-grid-3">
            <div class="form-group">
              <label for="screen-label-size"><span>Tamaño</span><span class="label-unit">px (0=auto)</span></label>
              <input type="number" id="screen-label-size" class="form-input" min="0" max="256" step="1" value="${screen.labelFontSize || 0}">
            </div>
            <div class="form-group">
              <label for="screen-label-weight">Peso</label>
              <select id="screen-label-weight" class="form-select">
                <option value="200" ${screen.labelFontWeight === "200" ? "selected" : ""}>200</option>
                <option value="300" ${screen.labelFontWeight === "300" || !screen.labelFontWeight ? "selected" : ""}>300</option>
                <option value="400" ${screen.labelFontWeight === "400" ? "selected" : ""}>400</option>
                <option value="500" ${screen.labelFontWeight === "500" ? "selected" : ""}>500</option>
                <option value="600" ${screen.labelFontWeight === "600" ? "selected" : ""}>600</option>
              </select>
            </div>
            <div class="form-group">
              <label>Color</label>
              <div class="color-picker-pair">
                <input type="color" id="screen-label-color-picker" class="color-input-native" value="${screen.labelColor || '#ffffff'}">
                <input type="text" id="screen-label-color-hex" class="color-input-hex" value="${screen.labelColor || '#ffffff'}" maxlength="7">
              </div>
            </div>
            <div class="form-group">
              <label class="setting-row">
                <span>Fondo de etiqueta</span>
                <input type="checkbox" id="screen-label-bg-enabled" ${screen.labelBgEnabled ? "checked" : ""}>
              </label>
            </div>
            ${screen.labelBgEnabled ? `
            <div class="form-grid-3">
              <div class="form-group">
                <label>Color fondo</label>
                <div class="color-picker-pair">
                  <input type="color" id="screen-label-bg-picker" class="color-input-native" value="${screen.labelBgColor || '#000000'}">
                  <input type="text" id="screen-label-bg-hex" class="color-input-hex" value="${screen.labelBgColor || '#000000'}" maxlength="7">
                </div>
              </div>
              <div class="form-group">
                <label for="screen-label-bg-opacity"><span>Opacidad</span><span class="label-unit">%</span></label>
                <input type="number" id="screen-label-bg-opacity" class="form-input" min="0" max="100" step="1" value="${Math.round((screen.labelBgOpacity !== undefined ? screen.labelBgOpacity : 1) * 100)}">
              </div>
              <div class="form-group">
                <label for="screen-label-bg-padding"><span>Padding</span><span class="label-unit">px</span></label>
                <input type="number" id="screen-label-bg-padding" class="form-input" min="0" max="500" step="1" value="${screen.labelBgPadding !== undefined ? screen.labelBgPadding : 10}">
              </div>
            </div>` : ""}
          </div>
        </div>

        <div class="editor-card fixed-mode-box">
          <div class="form-group">
            <label for="screen-fixed-mode"><span>Dato Fijo</span></label>
            <select id="screen-fixed-mode" class="form-select">
              <option value="pitch_m" ${screen.fixedMode === "pitch_m" ? "selected" : ""}>Fijo Pitch + Metros (Calcula Px)</option>
              <option value="pitch_px" ${screen.fixedMode === "pitch_px" ? "selected" : ""}>Fijo Pitch + Px (Calcula Metros)</option>
              <option value="m_px" ${screen.fixedMode === "m_px" ? "selected" : ""}>Fijo Metros + Px (Calcula Pitch real)</option>
            </select>
          </div>
        </div>

        <div class="editor-card">
          <div class="editor-card-title"><span>Dimensiones & Resolución</span></div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-pitch"><span>Pitch Nom.</span><span class="label-unit">mm</span></label>
              <input type="number" id="screen-pitch" class="form-input" step="0.001" min="0.1" value="${screen.pitch}" ${screen.fixedMode === "m_px" ? "readonly" : ""}>
            </div>
            <div class="form-group">
              <label><span>Pitch Real</span><span class="label-unit">mm</span></label>
              <input type="text" id="screen-pitch-real" class="form-input" value="${screen.pitchReal ? screen.pitchReal.toFixed(3) : screen.pitch.toFixed(3)} mm" readonly>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-width-m"><span>Ancho</span><span class="label-unit">m</span></label>
              <input type="number" id="screen-width-m" class="form-input" step="0.001" min="0.01" value="${screen.widthM}" ${screen.fixedMode === "pitch_px" ? "readonly" : ""}>
            </div>
            <div class="form-group">
              <label for="screen-height-m"><span>Alto</span><span class="label-unit">m</span></label>
              <input type="number" id="screen-height-m" class="form-input" step="0.001" min="0.01" value="${screen.heightM}" ${screen.fixedMode === "pitch_px" ? "readonly" : ""}>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-width-px"><span>Ancho Total</span><span class="label-unit">px</span></label>
              <input type="number" id="screen-width-px" class="form-input" step="1" min="1" value="${screen.widthPx}" ${screen.fixedMode === "pitch_m" ? "readonly" : ""}>
            </div>
            <div class="form-group">
              <label for="screen-height-px"><span>Alto Total</span><span class="label-unit">px</span></label>
              <input type="number" id="screen-height-px" class="form-input" step="1" min="1" value="${screen.heightPx}" ${screen.fixedMode === "pitch_m" ? "readonly" : ""}>
            </div>
          </div>

          <div id="calc-alert-box" class="calc-alert ${isExact ? "exact" : "warning"}">
            <div id="calc-alert-text">
              ${isExact ? "Cálculo exacto: píxeles enteros y coincide con módulos." : `${warnings.join("<br>")}`}
            </div>
          </div>
        </div>

        <div class="editor-card">
          <div class="editor-card-title"><span>Módulos de Gabinete</span></div>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-mod-w"><span>Gabinete Ancho</span><span class="label-unit">m</span></label>
              <input type="number" id="screen-mod-w" class="form-input" step="0.01" min="0.01" value="${screen.moduleWidthM}">
            </div>
            <div class="form-group">
              <label for="screen-mod-h"><span>Gabinete Alto</span><span class="label-unit">m</span></label>
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

          <div class="form-grid-2">
            <div class="form-group">
              <label for="screen-mod-px-w"><span>Px / Módulo (W)</span><span class="label-unit">manual</span></label>
              <input type="number" id="screen-mod-px-w" class="form-input" step="1" min="1" value="${screen.modPxW}">
            </div>
            <div class="form-group">
              <label for="screen-mod-px-h"><span>Px / Módulo (H)</span><span class="label-unit">manual</span></label>
              <input type="number" id="screen-mod-px-h" class="form-input" step="1" min="1" value="${screen.modPxH}">
            </div>
          </div>

          <button id="btn-sync-modules" class="btn btn-secondary btn-sm">Ajustar tamaño a estos módulos</button>
        </div>

        <div class="editor-card">
          <div class="editor-card-title"><span>Colores del Damero</span></div>
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

        <div class="editor-card">
          <div class="editor-card-title"><span>Posición en Lienzo (px)</span></div>
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

      this.attachScreenFormEvents(screen);
    },

    attachScreenFormEvents(screen) {
      const getEl = id => document.getElementById(id);

      getEl("screen-label").addEventListener("input", (e) => {
        screen.label = e.target.value;
        this.updateScreensSelector();
        this.updateSummaryTable();
        RenderEngine.render();
        Persistence.saveAuto();
      });

      getEl("screen-anim-included").addEventListener("change", (e) => {
        screen.animIncluded = e.target.checked;
        this.updateAnimationControls();
        if (AnimationEngine.isActive()) RenderEngine.render();
        Persistence.saveAuto();
      });

      getEl("screen-anim-order").addEventListener("input", (e) => {
        const v = parseInt(e.target.value, 10);
        if (isNaN(v)) return;
        screen.animOrder = Math.max(1, Math.min(Math.max(1, state.screens.length), v));
        if (AnimationEngine.isActive()) RenderEngine.render();
        Persistence.saveAuto();
      });

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

      getEl("screen-label-bg-enabled").addEventListener("change", (e) => {
        screen.labelBgEnabled = e.target.checked;
        if (screen.labelBgEnabled) {
          if (screen.labelBgColor === undefined) screen.labelBgColor = "#000000";
          if (screen.labelBgOpacity === undefined) screen.labelBgOpacity = 1;
          if (screen.labelBgPadding === undefined) screen.labelBgPadding = 10;
        }
        RenderEngine.render();
        Persistence.saveAuto();
        this.updateActiveScreenForm();
      });
      if (screen.labelBgEnabled) {
        const bgPicker = getEl("screen-label-bg-picker");
        const bgHex = getEl("screen-label-bg-hex");
        bgPicker.addEventListener("input", (e) => {
          screen.labelBgColor = e.target.value;
          bgHex.value = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        bgHex.addEventListener("change", (e) => {
          const val = e.target.value.trim();
          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            screen.labelBgColor = val;
            bgPicker.value = val;
            RenderEngine.render();
            Persistence.saveAuto();
          }
        });
        getEl("screen-label-bg-opacity").addEventListener("input", (e) => {
          const v = parseFloat(e.target.value);
          screen.labelBgOpacity = Math.max(0, Math.min(1, (isNaN(v) ? 100 : v) / 100));
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("screen-label-bg-padding").addEventListener("input", (e) => {
          screen.labelBgPadding = Math.max(0, parseInt(e.target.value, 10) || 0);
          RenderEngine.render();
          Persistence.saveAuto();
        });
      }

      getEl("screen-display-mode").addEventListener("change", (e) => {
        screen.displayMode = e.target.value;
        RenderEngine.render();
        Persistence.saveAuto();
        this.updateActiveScreenForm();
      });
      const scrDir = getEl("screen-gradient-direction");
      const gridW = getEl("screen-grid-line-width");
      if (gridW) {
        gridW.addEventListener("input", (e) => {
          const v = parseInt(e.target.value, 10);
          if (isNaN(v)) return;
          screen.gridLineWidth = Math.max(1, Math.min(20, v));
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("screen-grid-line-color").addEventListener("input", (e) => {
          screen.gridLineColor = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("screen-grid-bg-color").addEventListener("input", (e) => {
          screen.gridBgColor = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
        });
        getEl("btn-screen-grid-global").addEventListener("click", () => {
          delete screen.gridLineWidth;
          delete screen.gridLineColor;
          delete screen.gridBgColor;
          RenderEngine.render();
          Persistence.saveAuto();
          this.updateActiveScreenForm();
        });
      }
      const scrTcBar = getEl("screen-tc-color-bar");
      if (scrTcBar) {
        const setScreenTc = (key, val) => {
          screen.testCard = { ...RenderEngine.getTestCardSettings(screen), [key]: val };
          RenderEngine.render();
          Persistence.saveAuto();
        };
        [
          ["screen-tc-color-bar", "colorBar"],
          ["screen-tc-bw-bar", "bwBar"],
          ["screen-tc-circle", "circle"],
          ["screen-tc-cross", "cross"],
          ["screen-tc-diagonals", "diagonals"],
          ["screen-tc-grad-circle", "gradCircle"],
          ["screen-tc-gc-invert", "gradCircleInvert"],
          ["screen-tc-gc-stroke-enabled", "gradCircleStrokeEnabled"],
          ["screen-tc-circle-fill-enabled", "circleFillEnabled"]
        ].forEach(([id, key]) => {
          const el = getEl(id);
          if (el) el.addEventListener("change", (e) => {
            setScreenTc(key, e.target.checked);
            if (key === "gradCircle") this.updateActiveScreenForm();
          });
        });
        [
          ["screen-tc-gc-size", "gradCircleSizePct", 5, 100],
          ["screen-tc-gc-x", "gradCirclePosX", 0, 100],
          ["screen-tc-gc-y", "gradCirclePosY", 0, 100],
          ["screen-tc-gc-stroke-width", "gradCircleStrokeWidth", 1, 20]
        ].forEach(([id, key, min, max]) => {
          const el = getEl(id);
          if (el) el.addEventListener("input", (e) => {
            const v = parseFloat(e.target.value);
            if (isNaN(v)) return;
            setScreenTc(key, Math.max(min, Math.min(max, v)));
          });
        });
        [
          ["screen-tc-circle-stroke", "circleStroke"],
          ["screen-tc-circle-fill", "circleFill"],
          ["screen-tc-gc-stroke-color", "gradCircleStrokeColor"],
          ["screen-tc-line-color", "lineColor"]
        ].forEach(([id, key]) => {
          const el = getEl(id);
          if (el) el.addEventListener("input", (e) => setScreenTc(key, e.target.value));
        });
        getEl("btn-screen-tc-global").addEventListener("click", () => {
          delete screen.testCard;
          RenderEngine.render();
          Persistence.saveAuto();
          this.updateActiveScreenForm();
        });
      }
      if (scrDir) {
        scrDir.addEventListener("change", (e) => {
          state.settings.gradientDirection = e.target.value;
          this.updateDisplayModeControls();
          RenderEngine.render();
          Persistence.saveAuto();
        });
      }
      const scrLines = getEl("screen-module-lines");
      if (scrLines) {
        scrLines.addEventListener("change", (e) => {
          state.settings.showModuleLines = e.target.checked;
          this.updateDisplayModeControls();
          RenderEngine.render();
          Persistence.saveAuto();
        });
      }

      const scrCellMode = getEl("screen-cell-mode");
      if (scrCellMode) {
        scrCellMode.addEventListener("change", (e) => {
          if (e.target.value === "global") delete screen.cellMode;
          else screen.cellMode = e.target.value;
          RenderEngine.render();
          Persistence.saveAuto();
          this.updateActiveScreenForm();
        });
        const scrCellInfo = () => {
          const el = getEl("screen-cell-info");
          if (el) el.textContent = RenderEngine.getScreenCellGrid(screen).info;
        };
        const scrPreset = getEl("screen-cell-mod-preset");
        if (scrPreset) {
          scrPreset.addEventListener("change", (e) => {
            const preset = e.target.value;
            screen.cellModPreset = preset;
            const dims = RenderEngine.CELL_MOD_PRESETS[preset];
            if (dims) {
              screen.cellModWidthMm = dims[0];
              screen.cellModHeightMm = dims[1];
              getEl("screen-cell-mod-w").value = dims[0];
              getEl("screen-cell-mod-h").value = dims[1];
            }
            scrCellInfo();
            RenderEngine.render();
            Persistence.saveAuto();
          });
          const onScreenModDimInput = () => {
            const w = parseFloat(getEl("screen-cell-mod-w").value);
            const h = parseFloat(getEl("screen-cell-mod-h").value);
            if (!(w > 0) || !(h > 0)) return;
            screen.cellModWidthMm = Math.max(1, w);
            screen.cellModHeightMm = Math.max(1, h);
            const cs = RenderEngine.getCellSettings(screen);
            screen.cellModPreset = cs.modPreset;
            scrPreset.value = cs.modPreset;
            scrCellInfo();
            RenderEngine.render();
            Persistence.saveAuto();
          };
          getEl("screen-cell-mod-w").addEventListener("input", onScreenModDimInput);
          getEl("screen-cell-mod-h").addEventListener("input", onScreenModDimInput);
        }
        const scrTarget = getEl("screen-cell-target-px");
        if (scrTarget) {
          scrTarget.addEventListener("input", (e) => {
            const v = parseInt(e.target.value, 10);
            if (isNaN(v)) return;
            screen.cellTargetPx = Math.max(1, Math.min(4096, v));
            scrCellInfo();
            RenderEngine.render();
            Persistence.saveAuto();
          });
        }
        const btnCellGlobal = getEl("btn-screen-cell-global");
        if (btnCellGlobal) {
          btnCellGlobal.addEventListener("click", () => {
            delete screen.cellMode;
            delete screen.cellModPreset;
            delete screen.cellModWidthMm;
            delete screen.cellModHeightMm;
            delete screen.cellTargetPx;
            RenderEngine.render();
            Persistence.saveAuto();
            this.updateActiveScreenForm();
          });
        }
      }

      getEl("screen-fixed-mode").addEventListener("change", (e) => {
        screen.fixedMode = e.target.value;
        this.updateActiveScreenForm();
        this.updateSummaryTable();
        RenderEngine.render();
        Persistence.saveAuto();
      });

      getEl("screen-pitch").addEventListener("input", (e) => {
        screen.pitch = parseFloat(e.target.value) || 2.5;
        this.syncScreenFormValues(screen);
      });

      getEl("screen-width-m").addEventListener("input", (e) => {
        screen.widthM = parseFloat(e.target.value) || 1.0;
        this.syncScreenFormValues(screen);
      });

      getEl("screen-height-m").addEventListener("input", (e) => {
        screen.heightM = parseFloat(e.target.value) || 1.0;
        this.syncScreenFormValues(screen);
      });

      getEl("screen-width-px").addEventListener("input", (e) => {
        screen.widthPx = parseInt(e.target.value, 10) || 100;
        this.syncScreenFormValues(screen);
      });

      getEl("screen-height-px").addEventListener("input", (e) => {
        screen.heightPx = parseInt(e.target.value, 10) || 100;
        this.syncScreenFormValues(screen);
      });

      getEl("screen-mod-w").addEventListener("input", (e) => {
        screen.moduleWidthM = parseFloat(e.target.value) || 0.50;
        this.syncScreenFormValues(screen);
      });

      getEl("screen-mod-h").addEventListener("input", (e) => {
        screen.moduleHeightM = parseFloat(e.target.value) || 1.00;
        this.syncScreenFormValues(screen);
      });

      const btnSync = getEl("btn-sync-modules");
      const handleSyncModules = () => {
        const c = parseInt(getEl("screen-cols").value, 10) || 1;
        const r = parseInt(getEl("screen-rows").value, 10) || 1;
        CalcEngine.setModulesCount(screen, c, r);
        this.syncScreenFormValues(screen);
      };

      btnSync.addEventListener("click", handleSyncModules);
      getEl("screen-cols").addEventListener("change", handleSyncModules);
      getEl("screen-rows").addEventListener("change", handleSyncModules);

      const handleManualModPx = () => {
        const pw = parseInt(getEl("screen-mod-px-w").value, 10) || screen.modPxW;
        const ph = parseInt(getEl("screen-mod-px-h").value, 10) || screen.modPxH;
        CalcEngine.setManualModPx(screen, pw, ph);
        this.syncScreenFormValues(screen);
      };

      getEl("screen-mod-px-w").addEventListener("change", handleManualModPx);
      getEl("screen-mod-px-h").addEventListener("change", handleManualModPx);

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

    syncScreenFormValues(screen) {
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

      const cellInfoEl = getEl("screen-cell-info");
      if (cellInfoEl) cellInfoEl.textContent = RenderEngine.getScreenCellGrid(screen).info;

      this.updateScreensSelector();
      this.updateSummaryTable();
      RenderEngine.render();
      Persistence.saveAuto();
    },

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
        if (state.selectedScreenIds.includes(screen.id)) {
          row.style.background = "#1a1a1a";
        }

        const pitchNom = `${screen.pitch.toFixed(2)} mm`;
        const pitchReal = screen.pitchReal ? `${screen.pitchReal.toFixed(3)} mm` : `${screen.pitch.toFixed(3)} mm`;

        row.innerHTML = `
          <td>
            <div style="display:flex;align-items:center;gap:6px;">
              <button type="button" class="layer-item-btn screen-vis-btn ${screen.visible === false ? "inactive" : ""}" title="${screen.visible === false ? "Mostrar pantalla" : "Ocultar pantalla"}">
                ${screen.visible === false
                  ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
                  : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`}
              </button>
              <span class="tag-label" style="${screen.visible === false ? "opacity:0.4;" : ""}">${screen.label}</span>
            </div>
          </td>
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

        row.querySelector(".screen-vis-btn").addEventListener("click", (ev) => {
          ev.stopPropagation();
          screen.visible = screen.visible === false;
          this.updateSummaryTable();
          this.updateSelectionHint();
          RenderEngine.render();
          Persistence.saveAuto();
        });

        row.addEventListener("click", (e) => {
          state.selectedLayerId = null;
          if (e.shiftKey) {
            if (state.selectedScreenIds.includes(screen.id)) {
              state.selectedScreenIds = state.selectedScreenIds.filter(id => id !== screen.id);
              state.selectedScreenId = state.selectedScreenIds[0] || null;
            } else {
              state.selectedScreenIds.push(screen.id);
              state.selectedScreenId = screen.id;
            }
          } else {
            state.selectedScreenIds = [screen.id];
            state.selectedScreenId = screen.id;
          }

          this.updateScreensSelector();
          this.updateActiveScreenForm();
          this.updateActiveLayerForm();
          this.updateSummaryTable();
          this.updateSelectionHint();
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
        labelBgEnabled: false,
        labelBgColor: "#000000",
        labelBgOpacity: 1,
        labelBgPadding: 10
      };

      CalcEngine.recalculate(newScreen);
      state.screens.push(newScreen);
      state.selectedScreenId = newId;
      state.selectedScreenIds = [newId];
      state.selectedLayerId = null;

      this.updateScreensSelector();
      this.updateActiveScreenForm();
      this.updateActiveLayerForm();
      this.updateSummaryTable();
      this.updateSelectionHint();
      RenderEngine.render();
      Persistence.saveAuto();
    },

    duplicateSelectedScreen() {
      if (state.selectedScreenIds.length === 0) return;

      const newIds = [];
      state.selectedScreenIds.forEach(id => {
        const orig = state.screens.find(s => s.id === id);
        if (orig) {
          const clone = JSON.parse(JSON.stringify(orig));
          clone.id = `screen_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          clone.label = `${orig.label}_copia`;
          clone.x += 40;
          clone.y += 40;
          state.screens.push(clone);
          newIds.push(clone.id);
        }
      });

      state.selectedScreenIds = newIds;
      state.selectedScreenId = newIds[0] || null;
      state.selectedLayerId = null;

      this.updateScreensSelector();
      this.updateActiveScreenForm();
      this.updateActiveLayerForm();
      this.updateSummaryTable();
      this.updateSelectionHint();
      RenderEngine.render();
      Persistence.saveAuto();
    },

    deleteSelectedScreen() {
      if (state.selectedScreenIds.length === 0) return;

      const count = state.selectedScreenIds.length;
      if (confirm(`¿Eliminar ${count === 1 ? 'la pantalla seleccionada' : `las ${count} pantallas seleccionadas`}?`)) {
        state.screens = state.screens.filter(s => !state.selectedScreenIds.includes(s.id));
        state.selectedScreenId = state.screens.length > 0 ? state.screens[0].id : null;
        state.selectedScreenIds = state.selectedScreenId ? [state.selectedScreenId] : [];

        this.updateScreensSelector();
        this.updateActiveScreenForm();
        this.updateSummaryTable();
        this.updateSelectionHint();
        RenderEngine.render();
        Persistence.saveAuto();
      }
    }
  };


  /* ===========================================================================
   * 10. EXPORT & STORAGE (PNG 1:1, JSON con Capas/Fuentes y LocalStorage)
   * =========================================================================== */
  const Persistence = {
    saveTimeout: null,
    projectName: "led-grid-mapper",
    mp4Exporting: false,
    mp4Cancelled: false,

    init() {
      this.bindButtons();
      this.loadOnStart();
    },

    bindButtons() {
      document.getElementById("btn-export-png").addEventListener("click", () => this.exportPNG());
      document.getElementById("btn-export-svg").addEventListener("click", () => this.exportSVG());
      document.getElementById("btn-export-pdf").addEventListener("click", () => this.exportPDF());
      document.getElementById("btn-save-json").addEventListener("click", () => this.exportJSON());
      document.getElementById("input-load-json").addEventListener("change", (e) => {
        this.importJSON(e.target.files[0]);
        e.target.value = "";
      });
      const btnMp4 = document.getElementById("btn-export-mp4");
      if (btnMp4) btnMp4.addEventListener("click", () => this.exportMP4());
      const btnCancelMp4 = document.getElementById("btn-cancel-mp4");
      if (btnCancelMp4) btnCancelMp4.addEventListener("click", () => { this.mp4Cancelled = true; });
    },

    async exportMP4() {
      if (this.mp4Exporting) return;

      const btnMp4 = document.getElementById("btn-export-mp4");
      const progBox = document.getElementById("anim-mp4-progress-box");
      const progBar = document.getElementById("anim-mp4-progress");
      const progText = document.getElementById("anim-mp4-progress-text");
      const statusEl = document.getElementById("anim-mp4-status");
      const qualitySel = document.getElementById("anim-mp4-quality");

      const showError = (msg) => {
        if (statusEl) {
          statusEl.textContent = msg;
          statusEl.classList.remove("hidden");
        }
        alert(msg);
      };

      if (statusEl) statusEl.classList.add("hidden");

      const muxerLib = window.Mp4Muxer;
      if (!muxerLib || !muxerLib.Muxer || !muxerLib.ArrayBufferTarget) {
        showError("No se encontró la librería mp4-muxer. Agregá el archivo libs/mp4-muxer.js para exportar MP4.");
        return;
      }

      if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
        showError("Tu navegador no soporta WebCodecs (VideoEncoder / VideoFrame), necesario para exportar MP4.");
        return;
      }

      RenderEngine.computeCanvasBounds();
      const rawW = state.canvas.computedWidth;
      const rawH = state.canvas.computedHeight;
      const encW = rawW % 2 === 0 ? rawW : rawW + 1;
      const encH = rawH % 2 === 0 ? rawH : rawH + 1;

      const quality = qualitySel && qualitySel.value === "high" ? "high" : "normal";
      const pxScale = Math.min(1, Math.max(0, (encW * encH - 1280 * 720) / (3840 * 2160 - 1280 * 720)));
      const bitrate = quality === "high"
        ? Math.round(12_000_000 + pxScale * 8_000_000)
        : Math.round(8_000_000 + pxScale * 6_000_000);

      const FPS = AnimationEngine.FPS || 30;
      const codecs = encW * encH > 2_500_000
        ? ["avc1.640034", "avc1.640033", "avc1.64003e", "avc1.4d0034", "avc1.64002a", "avc1.4d002a", "avc1.42001f"]
        : ["avc1.64002a", "avc1.4d002a", "avc1.640033", "avc1.640034", "avc1.4d0034", "avc1.64003e", "avc1.42001f"];

      let supportedConfig = null;
      for (const codec of codecs) {
        try {
          const res = await VideoEncoder.isConfigSupported({ codec, width: encW, height: encH, bitrate, framerate: FPS });
          if (res && res.supported) {
            supportedConfig = res.config || { codec, width: encW, height: encH, bitrate, framerate: FPS };
            break;
          }
        } catch (_) { /* probar siguiente perfil */ }
      }

      if (!supportedConfig) {
        showError(`El codificador H.264 del navegador no soporta la resolución ${encW} × ${encH} px (demasiado grande para H.264).`);
        return;
      }

      const dur = AnimationEngine.getSettings().loopDuration;
      const totalFrames = Math.max(2, Math.round(dur * FPS));
      const frameDurationUs = Math.round(1_000_000 / FPS);

      const offscreen = document.createElement("canvas");
      offscreen.width = encW;
      offscreen.height = encH;
      const oCtx = offscreen.getContext("2d", { alpha: false });

      this.mp4Exporting = true;
      this.mp4Cancelled = false;
      if (btnMp4) btnMp4.disabled = true;
      if (progBox) progBox.classList.remove("hidden");
      if (progBar) progBar.value = 0;
      if (progText) progText.textContent = `0 / ${totalFrames} cuadros (0%)`;

      let encoder = null;
      let encodeError = null;
      try {
        const target = new muxerLib.ArrayBufferTarget();
        const muxer = new muxerLib.Muxer({
          target,
          video: { codec: "avc", width: encW, height: encH },
          fastStart: "in-memory"
        });

        encoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: (err) => { encodeError = err; }
        });
        encoder.configure(supportedConfig);

        for (let n = 0; n < totalFrames; n++) {
          if (this.mp4Cancelled || encodeError) break;

          const t = n / FPS;
          RenderEngine.renderFrame(oCtx, encW, encH, t, {
            animate: true,
            showOverlays: false,
            transparentBg: false
          });

          const frame = new VideoFrame(offscreen, {
            timestamp: Math.round((n * 1_000_000) / FPS),
            duration: frameDurationUs
          });
          encoder.encode(frame, { keyFrame: n % FPS === 0 });
          frame.close();

          const pct = Math.round(((n + 1) / totalFrames) * 100);
          if (progBar) progBar.value = pct;
          if (progText) progText.textContent = `${n + 1} / ${totalFrames} cuadros (${pct}%)`;

          while (encoder.encodeQueueSize > 8 && !this.mp4Cancelled && !encodeError) {
            await new Promise(r => setTimeout(r, 8));
          }
          await new Promise(r => setTimeout(r, 0));
        }

        if (encodeError) throw encodeError;

        if (this.mp4Cancelled) {
          if (encoder.state !== "closed") encoder.close();
          if (statusEl) {
            statusEl.textContent = "Exportación MP4 cancelada.";
            statusEl.classList.remove("hidden");
          }
          return;
        }

        await encoder.flush();
        encoder.close();
        muxer.finalize();

        const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = (this.projectName || "led-grid-mapper").replace(/[^A-Za-z0-9_\-]+/g, "-").replace(/^-+|-+$/g, "") || "led-grid-mapper";
        a.href = url;
        a.download = `${safeName}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        if (encoder && encoder.state !== "closed") {
          try { encoder.close(); } catch (_) { }
        }
        showError(`No se pudo exportar el MP4 (${encW} × ${encH} px): ${err && err.message ? err.message : err}`);
      } finally {
        this.mp4Exporting = false;
        if (btnMp4) btnMp4.disabled = false;
        if (progBox) progBox.classList.add("hidden");
      }
    },

    exportPNG() {
      RenderEngine.computeCanvasBounds();
      const w = state.canvas.computedWidth;
      const h = state.canvas.computedHeight;

      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const oCtx = offscreen.getContext("2d", { alpha: true });
      oCtx.imageSmoothingEnabled = false;

      if (state.settings.canvasBg === "transparent") {
        oCtx.clearRect(0, 0, w, h);
      } else {
        oCtx.fillStyle = "#000000";
        oCtx.fillRect(0, 0, w, h);
      }

      // 1. Dibujar pantallas
      state.screens.forEach(screen => {
        if (screen.visible === false) return;
        RenderEngine.renderScreen(oCtx, screen, false, false);
      });

      // 2. Dibujar capas gráficas
      state.layers.forEach(layer => {
        if (layer.visible) {
          RenderEngine.renderLayer(oCtx, layer, false);
        }
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

    /** Exporta el lienzo completo como SVG (grupos nombrados, pensado para Illustrator). */
    /** Construye el SVG del lienzo completo. Devuelve { svg, w, h }. */
    buildSVG() {
      RenderEngine.computeCanvasBounds();
      const w = state.canvas.computedWidth;
      const h = state.canvas.computedHeight;

      const esc = (s) => String(s === undefined || s === null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      const num = (n) => +(+n).toFixed(3);
      const usedIds = new Set();
      const uniqueId = (raw, fallback) => {
        let base = String(raw || fallback).trim().replace(/[^A-Za-z0-9_\-]+/g, "_").replace(/^_+|_+$/g, "");
        if (!base) base = fallback;
        if (/^[0-9\-]/.test(base)) base = "_" + base;
        let id = base, i = 2;
        while (usedIds.has(id)) id = `${base}_${i++}`;
        usedIds.add(id);
        return id;
      };
      const hasPaint = (c) => c && c !== "transparent";
      const out = [];
      const defs = [];

      // Fondo
      if (state.settings.canvasBg !== "transparent") {
        out.push(`  <rect id="${uniqueId("Fondo", "Fondo")}" x="0" y="0" width="${w}" height="${h}" fill="#000000"/>`);
      }

      // Pantallas
      state.screens.forEach((screen, idx) => {
        if (screen.visible === false) return;
        const { x, y, widthPx, heightPx, cols: physCols, rows: physRows, color1, color2 } = screen;
        const { cols, rows } = RenderEngine.getScreenCellGrid(screen);
        const mode = RenderEngine.getScreenDisplayMode(screen);
        const colStep = widthPx / cols;
        const rowStep = heightPx / rows;
        const gid = uniqueId(screen.label, `Pantalla_${idx + 1}`);
        out.push(`  <g id="${gid}" data-name="${esc(screen.label)}">`);

        if (mode === "checker") {
          out.push(`    <g id="${gid}_modulos" shape-rendering="crispEdges">`);
          for (let r = 0; r < rows; r++) {
            const cellY = Math.round(y + r * rowStep);
            const cellH = Math.round(y + (r + 1) * rowStep) - cellY;
            for (let c = 0; c < cols; c++) {
              const cellX = Math.round(x + c * colStep);
              const cellW = Math.round(x + (c + 1) * colStep) - cellX;
              out.push(`      <rect x="${cellX}" y="${cellY}" width="${cellW}" height="${cellH}" fill="${esc(((r + c) % 2 === 0) ? color1 : color2)}"/>`);
            }
          }
          out.push(`    </g>`);
        } else if (mode === "bw" || mode === "testcard") {
          const gs = RenderEngine.getGridStyle(screen);
          const half = Math.floor(gs.width / 2);
          const clipId = uniqueId(`${gid}_clip`, "clip");
          defs.push(`    <clipPath id="${clipId}"><rect x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(widthPx)}" height="${Math.round(heightPx)}"/></clipPath>`);
          out.push(`    <g id="${gid}_${mode === "testcard" ? "testcard" : "grilla"}" clip-path="url(#${clipId})">`);
          out.push(`      <g shape-rendering="crispEdges">`);
          out.push(`        <rect x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(widthPx)}" height="${Math.round(heightPx)}" fill="${esc(gs.bg)}"/>`);
          for (let c = 0; c <= cols; c++) {
            const ex = c === cols ? Math.round(x + widthPx) : Math.round(x + c * colStep);
            out.push(`        <rect x="${ex - half}" y="${Math.round(y)}" width="${gs.width}" height="${Math.round(heightPx)}" fill="${esc(gs.color)}"/>`);
          }
          for (let r = 0; r <= rows; r++) {
            const ey = r === rows ? Math.round(y + heightPx) : Math.round(y + r * rowStep);
            out.push(`        <rect x="${Math.round(x)}" y="${ey - half}" width="${Math.round(widthPx)}" height="${gs.width}" fill="${esc(gs.color)}"/>`);
          }
          out.push(`      </g>`);
          if (mode === "testcard") {
            const tc = RenderEngine.getTestCardSettings(screen);
            const L = RenderEngine.getTestCardLayout(screen);
            if (tc.colorBar) {
              const gId = uniqueId(`${gid}_tc_color`, "tc_color");
              const stops = ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff"]
                .map((c, i) => `<stop offset="${num(i / 5)}" stop-color="${c}"/>`).join("");
              defs.push(`    <linearGradient id="${gId}" gradientUnits="userSpaceOnUse" x1="${L.barX}" y1="${L.topBarY}" x2="${L.barX + L.barW}" y2="${L.topBarY}">${stops}</linearGradient>`);
              out.push(`      <rect x="${L.barX}" y="${L.topBarY}" width="${L.barW}" height="${L.barH}" fill="url(#${gId})"/>`);
            }
            if (tc.bwBar) {
              const gId = uniqueId(`${gid}_tc_bw`, "tc_bw");
              defs.push(`    <linearGradient id="${gId}" gradientUnits="userSpaceOnUse" x1="${L.barX}" y1="${L.botBarY}" x2="${L.barX + L.barW}" y2="${L.botBarY}"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#000000"/></linearGradient>`);
              out.push(`      <rect x="${L.barX}" y="${L.botBarY}" width="${L.barW}" height="${L.barH}" fill="url(#${gId})"/>`);
            }
            if (tc.circle) {
              const cFill = tc.circleFillEnabled ? esc(tc.circleFill) : "none";
              out.push(`      <circle cx="${L.cx}" cy="${L.cy}" r="${L.r}" fill="${cFill}" stroke="${esc(tc.circleStroke)}" stroke-width="${L.strokeW}"/>`);
            }
            if (tc.gradCircle) {
              const gc = RenderEngine.getGradCircleGeometry(tc, L);
              const gId = uniqueId(`${gid}_tc_gc`, "tc_gc");
              const inner = tc.gradCircleInvert ? "#000000" : "#ffffff";
              const outer = tc.gradCircleInvert ? "#ffffff" : "#000000";
              defs.push(`    <radialGradient id="${gId}" gradientUnits="userSpaceOnUse" cx="${gc.cx}" cy="${gc.cy}" r="${num(gc.r)}"><stop offset="0" stop-color="${inner}"/><stop offset="1" stop-color="${outer}"/></radialGradient>`);
              const strokeAttr = tc.gradCircleStrokeEnabled ? ` stroke="${esc(tc.gradCircleStrokeColor)}" stroke-width="${tc.gradCircleStrokeWidth}"` : "";
              out.push(`      <circle cx="${gc.cx}" cy="${gc.cy}" r="${num(gc.r)}" fill="url(#${gId})"${strokeAttr}/>`);
            }
            if (tc.cross) {
              const ch = Math.floor(L.strokeW / 2);
              out.push(`      <g shape-rendering="crispEdges" fill="${esc(tc.lineColor)}">`);
              out.push(`        <rect x="${L.sx}" y="${L.cy - ch}" width="${L.sw}" height="${L.strokeW}"/>`);
              out.push(`        <rect x="${L.cx - ch}" y="${L.sy}" width="${L.strokeW}" height="${L.sh}"/>`);
              out.push(`      </g>`);
            }
            if (tc.diagonals) {
              out.push(`      <line x1="${L.sx}" y1="${L.sy}" x2="${L.sx + L.sw}" y2="${L.sy + L.sh}" stroke="${esc(tc.lineColor)}" stroke-width="${L.strokeW}"/>`);
              out.push(`      <line x1="${L.sx + L.sw}" y1="${L.sy}" x2="${L.sx}" y2="${L.sy + L.sh}" stroke="${esc(tc.lineColor)}" stroke-width="${L.strokeW}"/>`);
            }
          }
          out.push(`    </g>`);
        } else {
          const dir = state.settings.gradientDirection;
          const gradId = uniqueId(`${gid}_grad`, "grad");
          if (dir === "radial") {
            defs.push(`    <radialGradient id="${gradId}" gradientUnits="userSpaceOnUse" cx="${num(x + widthPx / 2)}" cy="${num(y + heightPx / 2)}" r="${num(Math.hypot(widthPx, heightPx) / 2)}"><stop offset="0" stop-color="${esc(color1)}"/><stop offset="1" stop-color="${esc(color2)}"/></radialGradient>`);
          } else {
            const x2 = dir === "vertical" ? x : x + widthPx;
            const y2 = dir === "horizontal" ? y : y + heightPx;
            defs.push(`    <linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="${num(x)}" y1="${num(y)}" x2="${num(x2)}" y2="${num(y2)}"><stop offset="0" stop-color="${esc(color1)}"/><stop offset="1" stop-color="${esc(color2)}"/></linearGradient>`);
          }
          out.push(`    <rect id="${gid}_fondo" x="${num(x)}" y="${num(y)}" width="${num(widthPx)}" height="${num(heightPx)}" fill="url(#${gradId})"/>`);
          if (state.settings.showModuleLines !== false) {
            out.push(`    <g id="${gid}_lineas" stroke="#000000" stroke-opacity="0.35" stroke-width="1" shape-rendering="crispEdges">`);
            for (let c = 1; c < cols; c++) {
              const lx = Math.round(x + c * colStep) + 0.5;
              out.push(`      <line x1="${lx}" y1="${num(y)}" x2="${lx}" y2="${num(y + heightPx)}"/>`);
            }
            for (let r = 1; r < rows; r++) {
              const ly = Math.round(y + r * rowStep) + 0.5;
              out.push(`      <line x1="${num(x)}" y1="${ly}" x2="${num(x + widthPx)}" y2="${ly}"/>`);
            }
            out.push(`    </g>`);
          }
        }
        out.push(`    <rect x="${num(x + 0.5)}" y="${num(y + 0.5)}" width="${num(widthPx - 1)}" height="${num(heightPx - 1)}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>`);

        if (state.settings.showLabels) {
          const centerX = x + widthPx / 2;
          const centerY = y + heightPx / 2;
          const fontSize = (screen.labelFontSize && screen.labelFontSize > 0)
            ? screen.labelFontSize
            : Math.max(14, Math.min(64, Math.floor(Math.min(widthPx, heightPx) / 6)));
          const fontWeight = screen.labelFontWeight || "300";
          const fontColor = screen.labelColor || ((mode === "bw" || mode === "testcard") && RenderEngine.isLightColor(RenderEngine.getGridStyle(screen).bg) ? "#000000" : "#ffffff");
          const fam = esc(FONT_MAIN.replace(/"/g, "'"));
          const showSub = state.settings.showSublabels && heightPx >= 70 && widthPx >= 90;
          const labelY = showSub ? centerY - fontSize * 0.45 : centerY;
          const common = `text-anchor="middle" dominant-baseline="central" font-family="${fam}" fill="${esc(fontColor)}"`;
          out.push(`    <text id="${gid}_etiqueta" x="${num(centerX)}" y="${num(labelY)}" font-size="${fontSize}" font-weight="${esc(fontWeight)}" ${common}>${esc(screen.label)}</text>`);
          if (showSub) {
            const subFont = Math.max(10, Math.floor(fontSize * 0.38));
            const pitchText = screen.pitchReal ? `${screen.pitchReal.toFixed(3)} mm` : `${screen.pitch} mm`;
            const line1 = `${screen.location} • P${pitchText}`;
            const line2 = `${widthPx}×${heightPx} px (${physCols}×${physRows} mod)`;
            out.push(`    <text id="${gid}_info1" x="${num(centerX)}" y="${num(centerY + fontSize * 0.35)}" font-size="${subFont}" font-weight="300" fill-opacity="0.8" ${common}>${esc(line1)}</text>`);
            out.push(`    <text id="${gid}_info2" x="${num(centerX)}" y="${num(centerY + fontSize * 0.35 + subFont * 1.35)}" font-size="${subFont}" font-weight="300" fill-opacity="0.8" ${common}>${esc(line2)}</text>`);
          }
        }
        out.push(`  </g>`);
      });

      // Capas gráficas
      state.layers.forEach((layer, idx) => {
        if (!layer.visible) return;
        const { type, x, y, width, height } = layer;
        const halfW = width / 2;
        const halfH = height / 2;
        const rot = layer.rotation || 0;
        const opacity = Math.max(0, Math.min(1, layer.opacity !== undefined ? layer.opacity : 1));
        const gid = uniqueId(layer.name || `${type}_${idx + 1}`, `Capa_${idx + 1}`);
        const fillOn = hasPaint(layer.fillColor);
        const strokeOn = layer.strokeWidth > 0 && hasPaint(layer.strokeColor);
        const strokeAttr = strokeOn ? ` stroke="${esc(layer.strokeColor)}" stroke-width="${num(layer.strokeWidth)}"` : "";
        let body = "";

        if (type === "rect") {
          body = `<rect x="${num(-halfW)}" y="${num(-halfH)}" width="${num(width)}" height="${num(height)}" fill="${fillOn ? esc(layer.fillColor) : "none"}"${strokeAttr}/>`;
        } else if (type === "circle") {
          body = `<ellipse cx="0" cy="0" rx="${num(Math.abs(halfW))}" ry="${num(Math.abs(halfH))}" fill="${fillOn ? esc(layer.fillColor) : "none"}"${strokeAttr}/>`;
        } else if (type === "line") {
          body = `<line x1="${num(-halfW)}" y1="0" x2="${num(halfW)}" y2="0" fill="none" stroke="${esc(layer.strokeColor || "#ffffff")}" stroke-width="${num(layer.strokeWidth || 2)}"/>`;
        } else if (type === "gradient") {
          const stops = layer.gradientStops && layer.gradientStops.length >= 2
            ? layer.gradientStops
            : [{ offset: 0, color: "#ffffff" }, { offset: 1, color: "#000000" }];
          const stopsXml = stops.map(st =>
            `<stop offset="${num(Math.max(0, Math.min(1, st.offset)))}" stop-color="${esc(st.color)}"/>`).join("");
          const gradId = uniqueId(`${gid}_degradado`, "degradado");
          if (layer.gradientType === "radial") {
            const rr = Math.max(halfW, halfH);
            defs.push(`    <radialGradient id="${gradId}" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="${num(rr)}">${stopsXml}</radialGradient>`);
          } else {
            const a = ((layer.gradientAngle || 90) * Math.PI) / 180;
            defs.push(`    <linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="${num(-Math.cos(a) * halfW)}" y1="${num(-Math.sin(a) * halfH)}" x2="${num(Math.cos(a) * halfW)}" y2="${num(Math.sin(a) * halfH)}">${stopsXml}</linearGradient>`);
          }
          body = `<rect x="${num(-halfW)}" y="${num(-halfH)}" width="${num(width)}" height="${num(height)}" fill="url(#${gradId})"${strokeAttr}/>`;
        } else if (type === "text") {
          const fontSize = layer.fontSize || 36;
          const fam = esc((layer.fontFamily ? `'${layer.fontFamily}', ${FONT_MAIN}` : FONT_MAIN).replace(/"/g, "'"));
          const align = layer.textAlign || "center";
          const anchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
          const textX = align === "left" ? -halfW : align === "right" ? halfW : 0;
          if (!fillOn && !strokeOn) return;
          body = `<text x="${num(textX)}" y="0" text-anchor="${anchor}" dominant-baseline="central" font-family="${fam}" font-size="${fontSize}" font-weight="${esc(layer.fontWeight || "400")}" fill="${fillOn ? esc(layer.fillColor) : "none"}"${strokeAttr}>${esc(layer.text || "")}</text>`;
        } else {
          return;
        }

        const cx = x + halfW;
        const cy = y + halfH;
        const tf = `translate(${num(cx)} ${num(cy)})` + (rot ? ` rotate(${num(rot)})` : "");
        const opAttr = opacity < 1 ? ` opacity="${num(opacity)}"` : "";
        out.push(`  <g id="${gid}" transform="${tf}"${opAttr}>`);
        out.push(`    ${body}`);
        out.push(`  </g>`);
      });

      const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n` +
        (defs.length ? `  <defs>\n${defs.join("\n")}\n  </defs>\n` : "") +
        out.join("\n") + `\n</svg>\n`;

      return { svg, w, h };
    },

    /** Descarga el SVG del lienzo (usa buildSVG). */
    exportSVG() {
      const { svg, w, h } = this.buildSVG();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `led_mapping_grid_${w}x${h}px.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /** Exporta PDF vectorial: reutiliza buildSVG() y lo convierte con jsPDF + svg2pdf.js. */
    async exportPDF() {
      const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
      if (!jsPDFCtor) {
        alert("No se pudo exportar el PDF: jsPDF no está cargado (¿sin conexión a internet / CDN bloqueado?).");
        return;
      }

      const { svg, w, h } = this.buildSVG();
      const messages = [];

      // Escala si supera el límite de página (14400 unidades, límite de jsPDF / visores PDF)
      const MAX_PAGE = 14400;
      const scale = Math.min(1, MAX_PAGE / Math.max(w, h));
      const pageW = w * scale;
      const pageH = h * scale;
      if (scale < 1) {
        messages.push(`El lienzo (${w}×${h} px) supera el máximo de página del PDF (${MAX_PAGE}). Se escaló proporcionalmente con factor ${scale.toFixed(5)} (${(scale * 100).toFixed(2)}%).`);
      }

      const doc = new jsPDFCtor({
        orientation: pageW >= pageH ? "landscape" : "portrait",
        unit: "pt",
        format: [pageW, pageH]
      });

      if (typeof doc.svg !== "function" && !(window.svg2pdf && window.svg2pdf.svg2pdf)) {
        alert("No se pudo exportar el PDF: svg2pdf.js no está cargado (¿sin conexión a internet / CDN bloqueado?).");
        return;
      }

      // Registrar tipografías personalizadas (jsPDF solo admite TTF)
      const registered = new Set();
      const skipped = [];
      (state.customFonts || []).forEach(f => {
        try {
          const b64 = String(f.dataUrl || "").split(",")[1];
          if (!b64) throw new Error("sin datos");
          const head = atob(b64.slice(0, 8)).split("").map(c => c.charCodeAt(0));
          const isTTF = (head[0] === 0 && head[1] === 1 && head[2] === 0 && head[3] === 0) ||
            String.fromCharCode(...head.slice(0, 4)) === "true";
          if (!isTTF) throw new Error("formato no TTF");
          const fileName = `${f.name}.ttf`;
          doc.addFileToVFS(fileName, b64);
          ["normal", "bold", "italic", "bolditalic"].forEach(style => doc.addFont(fileName, f.name, style));
          registered.add(f.name);
        } catch (err) {
          skipped.push(f.displayName || f.name);
        }
      });
      if (skipped.length) {
        messages.push(`No se pudieron incrustar estas tipografías (jsPDF solo admite TTF): ${skipped.join(", ")}. Su texto usa una fuente de reemplazo.`);
      }

      // ¿Algún texto usa una fuente no incrustada? (las etiquetas de pantalla usan Inter → reemplazo)
      const usesReplacement =
        (state.settings.showLabels && state.screens.length > 0) ||
        state.layers.some(l => l.visible && l.type === "text" &&
          !(l.fontFamily && registered.has(l.fontFamily)));
      if (usesReplacement) {
        messages.push("Parte del texto (etiquetas de pantallas y/o textos sin tipografía personalizada incrustada) usa una fuente de reemplazo (Helvetica) porque la fuente original no está incrustada en el PDF.");
      }

      // Insertar el SVG en el DOM (oculto) para que svg2pdf pueda calcular estilos
      const holder = document.createElement("div");
      holder.style.cssText = "position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;";
      holder.innerHTML = svg.replace(/^<\?xml[^>]*\?>\s*/, "");
      document.body.appendChild(holder);
      try {
        const svgEl = holder.querySelector("svg");
        const opts = { x: 0, y: 0, width: pageW, height: pageH };
        if (typeof doc.svg === "function") await doc.svg(svgEl, opts);
        else await window.svg2pdf.svg2pdf(svgEl, doc, opts);
        doc.save(`led_mapping_grid_${w}x${h}px.pdf`);
      } catch (err) {
        alert(`Error al generar el PDF: ${err.message || err}`);
        return;
      } finally {
        document.body.removeChild(holder);
      }

      if (messages.length) alert(messages.join("\n\n"));
    },

    exportJSON() {
      const projectData = {
        version: "2.0",
        appName: "LED Grid Mapper",
        timestamp: new Date().toISOString(),
        canvas: state.canvas,
        settings: state.settings,
        locations: state.locations,
        screens: state.screens,
        layers: state.layers,
        customFonts: state.customFonts
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

    /**
     * Aplica los datos de un proyecto (JSON de importación o proyecto por defecto) al estado:
     * migraciones/valores por defecto, tipografías, recálculo y selección inicial.
     * No toca la UI. Devuelve false si el formato no es válido (sin modificar el estado).
     */
    async applyProjectData(data) {
      if (!data || !Array.isArray(data.screens)) return false;

      state.screens = data.screens;
      state.layers = Array.isArray(data.layers) ? data.layers : [];
      state.customFonts = Array.isArray(data.customFonts) ? data.customFonts : [];

      if (data.canvas) state.canvas = { ...state.canvas, ...data.canvas };
      if (data.settings) state.settings = { ...state.settings, ...data.settings };
      if (Array.isArray(data.locations)) state.locations = data.locations;

      // Restaurar tipografías registradas
      await this.restoreCustomFonts(state.customFonts);

      state.screens.forEach(s => CalcEngine.recalculate(s));
      state.selectedScreenId = state.screens.length > 0 ? state.screens[0].id : null;
      state.selectedScreenIds = state.selectedScreenId ? [state.selectedScreenId] : [];
      state.selectedLayerId = state.layers.length > 0 ? state.layers[state.layers.length - 1].id : null;
      return true;
    },

    async importJSON(file) {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (await this.applyProjectData(data)) {
            this.projectName = file.name.replace(/\.json$/i, "") || "led-grid-mapper";
            UIController.renderLocationsList();
            UIController.updateScreensSelector();
            UIController.updateActiveScreenForm();
            UIController.updateLayersList();
            UIController.updateActiveLayerForm();
            UIController.updateFontTagsList();
            UIController.updateDisplayModeControls();
            AnimationEngine.stop();
            UIController.updateAnimationControls();
            UIController.updateSummaryTable();
            UIController.updateSelectionHint();
            RenderEngine.render();
            ViewportEngine.zoomToFit();
            this.saveAuto();

            alert("Proyecto y capas cargados exitosamente.");
          } else {
            alert("El archivo JSON no tiene un formato válido.");
          }
        } catch (err) {
          alert(`Error al leer archivo JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    },

    async restoreCustomFonts(fontsList) {
      if (!Array.isArray(fontsList)) return;
      for (const f of fontsList) {
        if (f.name && f.dataUrl) {
          try {
            const fontFace = new FontFace(f.name, `url(${f.dataUrl})`);
            await fontFace.load();
            document.fonts.add(fontFace);
          } catch (e) {
            console.warn("No se pudo restaurar tipografía:", f.name, e);
          }
        }
      }
    },

    saveAuto() {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        HistoryEngine.commit();
        try {
          const projectData = {
            version: "2.0",
            timestamp: new Date().toISOString(),
            canvas: state.canvas,
            settings: state.settings,
            locations: state.locations,
            screens: state.screens,
            layers: state.layers,
            customFonts: state.customFonts
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

    async loadOnStart() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data && Array.isArray(data.screens) && data.screens.length > 0) {
            state.screens = data.screens;
            state.layers = Array.isArray(data.layers) ? data.layers : [];
            state.customFonts = Array.isArray(data.customFonts) ? data.customFonts : [];

            if (data.canvas) state.canvas = { ...state.canvas, ...data.canvas };
            if (data.settings) state.settings = { ...state.settings, ...data.settings };
            if (Array.isArray(data.locations)) state.locations = data.locations;

            await this.restoreCustomFonts(state.customFonts);
            state.screens.forEach(s => CalcEngine.recalculate(s));
            return;
          }
        }
      } catch (e) {
        console.warn("Error leyendo localStorage, cargando inicial:", e);
      }

      // Sin autoguardado: proyecto por defecto (default-project.js), con el mismo flujo que la importación
      try {
        if (window.DEFAULT_PROJECT && Array.isArray(window.DEFAULT_PROJECT.screens) && window.DEFAULT_PROJECT.screens.length > 0) {
          const copy = JSON.parse(JSON.stringify(window.DEFAULT_PROJECT));
          if (await this.applyProjectData(copy)) return;
        }
      } catch (e) {
        console.warn("No se pudo cargar el proyecto por defecto, usando el inicial:", e);
      }

      state.screens = JSON.parse(JSON.stringify(DEFAULT_INITIAL_SCREENS));
      state.screens.forEach(s => CalcEngine.recalculate(s));
    }
  };


  /* ===========================================================================
   * 11. INITIALIZATION
   * =========================================================================== */
  window.addEventListener("DOMContentLoaded", async () => {
    const canvasEl = document.getElementById("mapping-canvas");
    const workspaceEl = document.getElementById("canvas-workspace");
    const stageEl = document.getElementById("canvas-stage");

    RenderEngine.init(canvasEl);
    ViewportEngine.init(workspaceEl, stageEl);
    InteractionEngine.init();
    await Persistence.init();
    UIController.init();
    HistoryEngine.reset();

    RenderEngine.render();
    setTimeout(() => {
      ViewportEngine.zoomToFit();
    }, 120);

    window.addEventListener("resize", () => {
      RenderEngine.render();
    });
  });

})();
