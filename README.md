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

## 📐 Funcionalidades y Ajustes

### 1. Dibujo Único: Módulos LED
- **Modo único y directo**: cada celda del damero representa un gabinete físico completo con colores sólidos y saturados.
- **Sin suavizado**: renderizado pixelado exacto (`image-rendering: pixelated`) con 1 píxel de lienzo = 1 píxel físico del procesador.
- **Etiquetas planas**: etiqueta centrada en color blanco sólido, sin sombras ni contornos, con tamaño, peso (200 a 600) y color personalizables por pantalla.

### 2. Lienzo Negro y Delimitación
- **Fondo de trabajo y lienzo**: negro absoluto (`#000000`).
- **Borde visible**: el lienzo está delimitado por una línea fina en gris oscuro (`#333333`) para distinguirlo claramente del espacio de trabajo.
- **Selector de fondo**: opción en la barra superior para alternar entre **Negro (#000)** y **Transparente** (con canal alfa real en el PNG exportado).

### 3. Selección Múltiple y Alineación
- **Selección múltiple**:
  - `Shift + clic` para seleccionar o deseleccionar varias pantallas.
  - **Recuadro de selección (Marquee)**: clic y arrastre sobre el fondo vacío para encerrar y seleccionar múltiples pantallas a la vez.
  - Al arrastrar cualquier pantalla de la selección, todo el grupo se desplaza conjuntamente manteniendo sus distancias relativas.
- **Barra de alineación**:
  - *Alinear*: Izquierda, Centro Horizontal, Derecha, Arriba, Centro Vertical y Abajo. Si hay varias pantallas seleccionadas, se alinean respecto a los límites del grupo; si hay una sola, respecto al lienzo.
  - *Centrar en el lienzo*: Centro Horizontal, Centro Vertical y Centro Total (aplica tanto a pantallas individuales como al grupo completo).
  - *Distribuir*: Distribuir Horizontal y Distribuir Vertical con campo numérico de separación en píxeles (por defecto `0 px` para dejarlas perfectamente unidas).
- **Guías magnéticas (Snap)**:
  - Detección automática al acercar una pantalla al borde o al centro de otra pantalla o del lienzo.
  - Línea guía visible en pantalla durante el arrastre.
  - Casilla para activar o desactivar el snap magnético en cualquier momento.
- **Desplazamiento con teclado**:
  - Flechas de dirección: mueven la selección en pasos de **1 px**.
  - `Shift + Flechas`: mueven la selección en pasos de **10 px**.
- **Coordenadas exactas**: los campos X e Y siguen siendo editables numéricamente en el panel de control.

### 4. Cálculo Bidireccional y Pitch Real
- **Fórmula base**: $\text{píxeles} = \frac{\text{metros} \times 1000}{\text{pitch}}$
- **Dato Fijo seleccionable**:
  - *Fijo Pitch + Metros* $\rightarrow$ calcula píxeles.
  - *Fijo Pitch + Px* $\rightarrow$ calcula metros.
  - *Fijo Metros + Px* $\rightarrow$ calcula pitch real.
- **Pitch Real**: cálculo continuo con 3 decimales $\left(\frac{\text{tamaño módulo (mm)}}{\text{px por módulo}}\right)$, reflejado en el editor y en la Tabla Resumen.
- **Prioridad manual de px por módulo**: posibilidad de fijar la resolución de cada gabinete (ej: 128×128, 128×256 px), prevaleciendo sobre el cálculo.
- **Avisos limpios**: solo se notifica cuando los píxeles calculados no dan enteros o la medida física no coincide con un número entero de gabinetes.

### 5. Capas de Texto y Figuras (Etapa 2)
- **Panel dedicado de Capas**:
  - Lista de capas con visualización de visibilidad (`👁`), bloqueo (`🔓`/`🔒`), tipo de capa y nombre personalizado.
  - Creación rápida: **+ Texto**, **+ Rectángulo**, **+ Círculo**, **+ Línea**, **+ Degradado**.
  - Operaciones de orden z-index: **Traer al Frente**, **Subir nivel**, **Bajar nivel**, **Enviar al Fondo**.
  - **Duplicar** y **Eliminar** capas con un solo clic.
- **Tipos de Capa y Propiedades**:
  - **Texto**: contenido editable, tamaño en px, selector de peso tipográfico (200 a 600), alineación (izquierda, centro, derecha), color y tipografía.
  - **Rectángulo y Círculo**: color de relleno, color de borde y grosor en px.
  - **Línea**: color de trazo y grosor en px.
  - **Degradado**: modos **Lineal** y **Radial**, ángulo en grados para lineal, y gestor de paradas de color dinámicas ($\ge 2$ colores) con posición porcentual (0–100%).
- **Transformación Interactiva en Lienzo**:
  - Arrastre libre con clic para reposicionar.
  - Manijas en las 4 esquinas para escalar ancho y alto proporcionalmente.
  - Manija superior circular para rotación libre (0–360°).
  - Campos numéricos bidireccionales en el panel: posición X/Y en px, ancho (W), alto (H), rotación en grados y opacidad (0–100%).
- **Tipografías Personalizadas (.ttf, .otf, .woff2)**:
  - Carga de fuentes locales directamente desde la computadora mediante la API `FontFace`.
  - Integración inmediata en el selector de fuentes de las capas de texto.
  - Almacenamiento embebido como Base64 DataURL dentro del archivo de proyecto JSON y autoguardado en `localStorage`.

### 6. Exportación y Persistencia
- **Exportar PNG**: genera una imagen en resolución nativa 1:1, con fondo negro o transparente según la elección del selector.
- **Guardar / Cargar JSON (v2.0)**: persistencia completa del proyecto, incluyendo pantallas LED, capas gráficas, fuentes tipográficas embebidas, configuraciones de lienzo y alineaciones.
- **Autoguardado en `localStorage`**: guarda en segundo plano cada cambio, movimiento o adición de capa.
