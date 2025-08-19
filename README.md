# Buscador de la Ley de Tránsito Chilena

Aplicación web progresiva (PWA) para buscar y consultar artículos de la Ley de Tránsito Chilena de manera rápida y eficiente.

## Características

- 🔍 Búsqueda en tiempo real de artículos por palabras clave
- 📱 Diseño responsive que funciona en móviles, tablets y escritorio
- 📱 Instalable como aplicación en dispositivos móviles y de escritorio
- 🔄 Funcionamiento offline después de la primera carga
- 🎨 Interfaz moderna e intuitiva

## Requisitos

- Node.js (v14 o superior)
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

## Instalación

1. Clona o descarga este repositorio
2. Abre una terminal en el directorio del proyecto
3. Instala las dependencias (si es necesario):
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   node server.js
   ```
5. Abre tu navegador y ve a:
   ```
   http://localhost:3000
   ```

## Uso

1. Escribe en el campo de búsqueda para buscar artículos que contengan tus términos de búsqueda
2. Los resultados se mostrarán automáticamente mientras escribes
3. Haz clic en un resultado para ver más detalles
4. Para instalar la aplicación:
   - **En Chrome/Edge/Opera:** Haz clic en el botón "Instalar" en la esquina superior derecha
   - **En Android/Chrome:** Toca "Agregar a la pantalla de inicio" en el menú del navegador
   - **En iOS/Safari:** Toca el ícono de compartir y luego "Agregar a inicio"

## Estructura del Proyecto

- `index.html` - Página principal de la aplicación
- `app.js` - Lógica principal de la aplicación
- `sw.js` - Service Worker para funcionalidad offline
- `manifest.json` - Configuración de la PWA
- `ley_18290_articulos.ndjson` - Base de datos de artículos de la ley
- `server.js` - Servidor de desarrollo local

## Tecnologías Utilizadas

- HTML5, CSS3, JavaScript (ES6+)
- [Tailwind CSS](https://tailwindcss.com/) - Framework de estilos
- [Font Awesome](https://fontawesome.com/) - Iconos
- Service Workers - Para funcionalidad offline
- Web App Manifest - Para instalación en dispositivos

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Autor

Buscador de la Ley de Tránsito Chilena - 2025
