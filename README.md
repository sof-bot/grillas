# LED Grid Mapper (Generador de Grillas de Mapping LED)

Prototipo funcional de aplicación web estática (HTML5 + CSS3 + Vanilla JavaScript puro, sin dependencias, sin frameworks, sin backend ni etapas de build) diseñada para generar grillas de mapping para pantallas LED en **píxeles reales 1:1**.

---

## 🚀 Cómo abrir y probar localmente

Tienes varias formas muy sencillas de ejecutar y probar el prototipo:

### Opción 1: Abrir directamente en el navegador (Sin servidor)
1. Ve a la carpeta del proyecto: `c:\Programacion\TestGit`
2. Haz **doble clic en `index.html`** (o clic derecho > *Abrir con* > Google Chrome / Microsoft Edge / Firefox).
3. La aplicación funciona al 100% como archivo local (`file:///...`), incluyendo el motor de cálculo, el renderizado de píxeles reales en Canvas, el zoom/pan y el autoguardado en `localStorage`.

### Opción 2: Desde la terminal de Windows (PowerShell)
Ejecuta:
```powershell
Start-Process "index.html"
```
Esto abrirá de inmediato tu navegador predeterminado cargando la aplicación.

### Opción 3: Con la extensión Live Server de VS Code (Recomendado para desarrollo)
1. Abre la carpeta `TestGit` en Visual Studio Code.
2. Si tienes la extensión **Live Server**, haz clic en el botón **"Go Live"** en la esquina inferior derecha (o clic derecho en `index.html` > *Open with Live Server*).
3. Se abrirá en `http://127.0.0.1:5500`.

---

## 🌐 Publicación en GitHub Pages

Al ser 100% estática:
1. Sube los archivos (`index.html`, `style.css`, `app.js`, `README.md`) a tu repositorio en GitHub.
2. En GitHub, entra a **Settings** > **Pages**.
3. En **Source**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
4. Haz clic en **Save**. En un minuto estará disponible en `https://<tu-usuario>.github.io/<nombre-repo>/`.

---

## 📐 Características implementadas en el prototipo

### 1. Portada y Modo Herramienta
- **Portada de inicio:** Pantalla de bienvenida con título, descripción técnica, lista de características clave y botón **"Abrir generador"**.
- Acceso permanente: Desde la barra superior puedes volver a consultar la portada en cualquier momento haciendo clic en el logo.

### 2. Gestión de Pantallas
- **Agregar, duplicar y eliminar:** Botones rápidos para crear nuevas pantallas o clonar existentes con offset.
- **Variables dinámicas:**
  - **Etiqueta:** Identificador editable (ej: `C`, `i1`, `d1`, `fondo`).
  - **Ubicación:** Lista editable con gestión de etiquetas y opción `+ Nueva ubicación...` (ej: Central, Izquierda, Derecha, Fondo, Techo, Piso, Tótem, etc.).
  - **Pixel Pitch (mm):** Editable en cualquier momento.
  - **Ancho y Alto en metros:** Con precisión decimal.
  - **Ancho y Alto en píxeles:** Siempre redondeados a valores enteros.
  - **Módulos:** Tamaño por defecto `0.50 × 1.00 m` (editable) y cálculo de módulos en columnas × filas con botón de ajuste sincronizado.
  - **Damero:** Dos selectores de color independientes (con rueda nativa y código hexadecimal) por cada pantalla.
  - **Sin rotación:** Dimensiones directas finales tal como se ingresan.

### 3. Vínculo y Cálculo Bidireccional
Fórmula base: $$\text{píxeles} = \frac{\text{metros} \times 1000}{\text{pitch}}$$
Selector de **Dato Fijo**:
1. **Fijo pitch + metros** $\rightarrow$ calcula píxeles.
2. **Fijo pitch + píxeles** $\rightarrow$ calcula metros.
3. **Fijo metros + píxeles** $\rightarrow$ calcula el pitch real.
- **Avisos automáticos:** Indicador en tiempo real si el resultado no es entero (redondeo de px) o si la medida no coincide con múltiplos enteros de gabinetes/módulos.
- **Tabla Resumen:** Pestaña con detalle por pantalla (etiqueta, ubicación, pitch, columnas × filas, px por módulo, resolución total en px, tamaño en metros y estado de exactitud), más estadísticas globales de megapíxeles y área.

### 4. Lienzo en Píxeles Reales (1:1)
- **Renderizado exacto:** 1 píxel del canvas = 1 píxel físico del LED (`image-rendering: pixelated; ctx.imageSmoothingEnabled = false`).
- **Damero:** Cada módulo es una celda que alterna entre los dos colores elegidos.
- **Etiquetas legibles:** Texto blanco centrado con contorno oscuro para alta visibilidad sobre cualquier tono de damero.
- **Posicionamiento libre:** Arrastre interactivo con el cursor o ingreso numérico exacto de coordenadas X/Y en píxeles.
- **Snap magnético:** Atracción magnética a módulos, origen `(0,0)` y bordes adyacentes de otras pantallas, con líneas guía visuales en cian.
- **Tamaño del lienzo:**
  - **Automático:** Se ajusta al conjunto total de pantallas.
  - **Manual:** Dimensiones libres en px con presets (FHD 1080p, 4K UHD, 2K DCI, 4K DCI, WUXGA, Dual FHD).
- **Layout inicial:** Configuración de ejemplo en **cruz desplegada** (Central arriba, Izquierda y Derecha a los costados, Fondo abajo), lista para modificar.
- **Zoom & Pan:** Rueda del mouse (zoom hacia el cursor), arrastre con botón central o Espacio + clic izquierdo, y botones HUD flotantes (1:1, Ajustar a pantalla).

### 5. Exportación y Almacenamiento
- **Exportar PNG:** Genera y descarga una imagen PNG con las dimensiones nativas exactas del lienzo en píxeles, sin interpolación.
- **Guardar / Cargar JSON:** Guarda la configuración completa del proyecto y permite cargar archivos previamente exportados.
- **Autoguardado en localStorage:** Guarda los cambios en tiempo real automáticamente cada vez que editas o mueves una pantalla.

---

## 🛠️ Arquitectura de Código (Preparada para V2)

El archivo [`app.js`](file:///c:/Programacion/TestGit/app.js) está estructurado en módulos desacoplados:
1. `CONSTANTS & DEFAULTS`: Configuración y layout de cruz inicial.
2. `STATE`: Estado global reactivo (pantallas, lienzo, viewport, ajustes).
3. `CALCULATION ENGINE`: Lógica matemática y validaciones.
4. `RENDER ENGINE`: Motor de dibujo 2D (separado de la interfaz). En la V2 se pueden conectar fácilmente los exportadores SVG/PDF y capas de formas.
5. `VIEWPORT ENGINE`: Transformaciones de matriz de pantalla (zoom, pan, coordenadas relativas).
6. `INTERACTION ENGINE`: Eventos del mouse, detección de pantallas y algoritmo de snapping magnético.
7. `UI CONTROLLER`: Formularios, enlace de eventos y renderizado de la tabla resumen.
8. `EXPORT & STORAGE`: Generación de Blob PNG a escala real, serializador JSON y `localStorage`.
