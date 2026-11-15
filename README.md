# LED Grid Mapper

Herramienta técnica web estática (HTML5 + CSS3 + Vanilla JavaScript puro, sin frameworks, sin backend y sin herramientas de build) diseñada para generar grillas de mapping para pantallas LED en **píxeles reales 1:1**.

---

## 🚀 Cómo abrir y probar localmente

1. Abre la carpeta `c:\Programacion\TestGit`.
2. Haz doble clic en [`index.html`](file:///c:/Programacion/TestGit/index.html) o ejecútalo en PowerShell:
   ```powershell
   Start-Process "index.html"
   ```
3. O ábrelo mediante Live Server en Visual Studio Code.

---

## 📐 Funcionalidades (Etapa 1 Implementada)

### 1. Estética Sobria y Minimalista
- Paleta visual profesional: fondo negro absoluto (`#000000`), paneles en grises oscuros, bordes finos de 1 px y textos neutros.
- Sin sombras, sin degradados decorativos ni elementos distractores o emojis en la interfaz.
- Portada minimalista con acceso directo al generador.

### 2. Tipografía Unificada (Inter)
- Tipografía principal **Inter** cargada desde Google Fonts (pesos 200, 300, 400, 500, 600) con fallback `Helvetica Neue, Arial, sans-serif`.
- Definida de forma centralizada mediante la variable CSS `--font-main` y la constante `FONT_MAIN` en `app.js`.
- Títulos de interfaz ligeros (peso 300).
- **Etiquetas de pantallas planas**: dibujadas en el lienzo de forma plana, en color blanco sólido, sin sombras, sin contornos, sin resplandores ni degradados.
- Tamaño (px o auto), peso tipográfico (200, 300, 400, 500, 600) y color totalmente configurables por cada pantalla.

### 3. Cálculo Bidireccional y Pitch Real
- **Fórmula base**: $\text{píxeles} = \frac{\text{metros} \times 1000}{\text{pitch}}$
- Selector de **Dato Fijo**:
  - *Fijo Pitch + Metros* $\rightarrow$ calcula píxeles.
  - *Fijo Pitch + Px* $\rightarrow$ calcula metros.
  - *Fijo Metros + Px* $\rightarrow$ calcula pitch real.
- **Pitch Real**: cálculo con 3 decimales $\left(\frac{\text{tamaño módulo (mm)}}{\text{px por módulo}}\right)$, reflejado en la tarjeta de edición y en la Tabla Resumen.
- **Avisos limpios**: solo se notifica cuando los píxeles calculados no son enteros o la medida física no coincide con un número entero de gabinetes.
- **Prioridad manual de px por módulo**: es posible ingresar directamente la resolución en píxeles de cada gabinete (ej: 128×128, 128×256 px), prevaleciendo sobre el cálculo automático.

### 4. Modos de Visualización de Grilla
- **Módulos LED**: damero estándar donde cada celda corresponde a un gabinete físico.
- **Plantilla cuadriculada**: subdivisión de cada gabinete en cuadrados uniformes con tamaño configurable en px (16, 32, 64, 128 px) siguiendo el damero de los dos colores de la pantalla.
- **Bordes de módulo (1 px)**: opción para mostrar u ocultar una línea fina que demarca el contorno de cada módulo físico, ideal sobre la plantilla cuadriculada.
- Modos seleccionables globalmente desde la barra superior y sobrescribibles individualmente por pantalla.
- Renderizado exacto sin interpolación (`image-rendering: pixelated`).

### 5. Lienzo y Exportación
- Navegación con Pan y Zoom (rueda del mouse, botón central o Espacio + arrastre).
- Snap magnético a módulos y bordes adyacentes.
- Exportación PNG a escala real exacta 1:1.
- Guardado y carga de proyectos en formato JSON, con autoguardado continuo en `localStorage`.
