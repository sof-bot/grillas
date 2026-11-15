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

### 5. Exportación y Persistencia
- **Exportar PNG**: genera una imagen en resolución nativa 1:1, con fondo negro o transparente según la elección del selector.
- **Guardar / Cargar JSON**: persistencia completa del proyecto.
- **Autoguardado en `localStorage`**: guarda en segundo plano cada cambio o movimiento.
