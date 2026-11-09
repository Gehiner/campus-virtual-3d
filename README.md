# Campus Virtual 3D — v0.1

Primera versión local: campus 3D con avatar, movimiento y una galería cerrada de proyectos narrados como recuerdos.
**Todavía no hay base de datos, ni login, ni publicación.** Eso viene después.

## Cómo probarlo en tu PC

1. Instala **Node.js LTS** desde https://nodejs.org (si ya lo tienes, comprueba con `node -v`; necesitas 18.18 o superior).
2. Abre una terminal dentro de esta carpeta (en VS Code: menú Terminal → New Terminal).
3. Instala las dependencias (tarda un par de minutos):

   ```bash
   npm install
   ```

4. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre http://localhost:3000 en el navegador.

## Qué probar

- `/` — página de inicio con los tres accesos.
- `/estudiante` — campus 3D en primera persona. Arrastra con el mouse o el dedo para girar la mirada; camina con **W A S D** o flechas (el movimiento sigue la dirección de la mirada) y acércate a una vitrina para abrirla con **E** (o clic). El mapa muestra tu posición y el progreso.
- `/observador` — igual, pero sin botón de like (solo lectura).
- `/docente` — panel de ejemplo (aún sin protección).

## Estructura

```
app/            Páginas (cada carpeta = una ruta)
components/     Piezas de interfaz (CampusApp, ProjectModal, TouchControls)
components/GalleryMap.tsx             Mapa y posición del avatar
components/scene/CampusScene.tsx   Todo lo 3D: plaza, galería, vitrinas, avatar y cámara
data/projects.ts                   Proyectos de prueba (ficticios)
lib/                               Roles, controles y distribución de stands
```

Cada proyecto de demostración incluye una memoria, el reto y el aprendizaje. El tipo `Project`
también acepta `coverUrl`: cuando se proporciona una imagen, se muestra en la vitrina 3D y en
la ficha del proyecto. Los datos incluidos siguen siendo ficticios; conectar trabajos reales
requiere integrar una fuente de datos y definir cómo se cargarán sus imágenes.

## Estado

- [x] Campus 3D, avatar, colisiones y galería cerrada de vitrinas automáticas
- [x] Mapa, posición, progreso de exploración y retorno a la plaza
- [x] Fichas narrativas con portada opcional y controles táctiles para interactuar
- [x] Iluminación ambiental y señalización del recorrido
- [ ] Supabase (persistencia)
- [ ] Carga de proyectos y portadas reales
- [ ] Autenticación y roles reales
- [ ] Preguntas
- [ ] Despliegue en Vercel
