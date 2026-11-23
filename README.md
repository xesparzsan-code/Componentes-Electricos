# Taller de componentes

Web de aprendizaje con componentes eléctricos y electrónicos en 3D interactivo. Cada componente tiene un modelo que funciona, una explicación por pasos y piezas en las que se puede hacer clic para ver qué hace cada una.

## Archivos

- `index.html` — portada (catálogo) y plantilla de la ficha de cada componente. Navegación por `#id` (por ejemplo `#rele`).
- `motor.js` — motor 3D común (Three.js r128 + OrbitControls): escena, cámara, selección de piezas, etiquetas y tarjeta de descripción.
- `comp-<id>.js` — un archivo por componente.

## Añadir un componente

1. Crear `comp-<id>.js` con `COMPONENTES.push({ ... })` (usar `comp-rele.js` como plantilla).
2. Añadir `<script src="comp-<id>.js"></script>` en `index.html`, después de `comp-rele.js`.
3. Quitarlo de la lista `PROX` (próximamente) de `index.html`.

## Componentes

- [x] Relé electromecánico
- [ ] Magnetotérmico, diferencial, contactor, fusible, pulsador/seta, final de carrera, transformador, motor CC, diodo, transistor, condensador

Se publica automáticamente en Cloudflare Workers con cada cambio en `main` (configuración en `wrangler.toml`).
