# Campus Virtual 3D

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Three.js-0.170-000000?style=for-the-badge&logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
</p>

<p align="center">
  <strong>Un campus académico 3D interactivo</strong> para gestionar salas compartidas, proyectos estudiantiles, likes, preguntas y permisos por rol.
</p>

## ✨ Vista general

Este proyecto convierte una experiencia de feria o showcase académico en un campus virtual en 3D, donde cada sala funciona como un espacio de exhibición compartido. Los estudiantes publican proyectos, los docentes moderan contenido y los observadores pueden entrar sin iniciar sesión para revisar la actividad pública.

La plataforma está construida con Next.js, React, Three.js y Supabase, y está pensada para funcionar como MVP de una experiencia educativa moderna y visual.

## 🧩 Funcionalidades principales

- 🏫 Salas compartidas con código único por campus
- 🧍‍♂️ Roles diferenciados: administrador, docente, estudiante y observador
- 🧭 Visualización 3D del campus con stands y espacios de exhibición
- 📦 Publicación de proyectos por estudiante con estado de borrador o publicado
- 💙 Sistema de likes por proyecto
- ❓ Preguntas por proyecto con visibilidad controlada
- 🧑‍🏫 Moderación docente para ocultar o publicar proyectos y retirar estudiantes de una sala
- 🛡️ Políticas de acceso y permisos por base de datos (RLS)
- 🔐 Autenticación con Supabase y flujo de sesión seguro

## 🏗️ Stack tecnológico

- Next.js 15
- React 19
- Three.js + React Three Fiber + Drei
- Supabase Auth + PostgreSQL + RLS
- TypeScript
- Zod

## 📁 Estructura del proyecto

```text
campus-virtual-3d/
├─ app/                     # Rutas, páginas y vistas principales de Next.js
│  ├─ admin/
│  ├─ auth/
│  ├─ docente/
│  ├─ estudiante/
│  ├─ observador/
│  ├─ s/
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/             # Componentes reutilizables de UI y 3D
├─ data/                   # Datos estáticos o mockup de contenido
├─ lib/                    # Utilidades y lógica compartida
├─ supabase/
│  ├─ migrations/          # SQL de esquema y permisos
│  └─ seed.sql            # Datos demo opcionales
├─ .gitignore
├─ next.config.mjs
├─ package.json
├─ tsconfig.json
├─ README.md
└─ ...
```

## 🚀 Primeros pasos

### Requisitos

- Node.js 18.18 o superior
- Una cuenta y proyecto en Supabase

### 1) Clonar e instalar

```bash
git clone https://github.com/Gehiner/campus-virtual-3d.git
cd campus-virtual-3d
npm install
```

### 2) Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con este contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

> Importante: usa únicamente la URL pública del proyecto y la clave anónima pública de Supabase. No utilices credenciales de servicio ni claves secretas del lado del cliente.

### 3) Preparar la base de datos

Ejecuta en el SQL editor de Supabase estas migraciones:

1. `supabase/migrations/202611090001_initial_schema.sql`
2. `supabase/migrations/202611090002_room_management.sql`

Estas migraciones crean tablas, restricciones, funciones de autorización y políticas de seguridad para controlar el acceso por rol.

### 4) Ejecutar localmente

```bash
npm run dev
```

Abre tu navegador en:

```text
http://localhost:3000
```

## 👥 Flujos de usuario

### Administrador

- Invita docentes desde Supabase
- Crea, habilita o desactiva salas
- Asigna responsables y comparte enlaces
- Gestiona la estructura general del campus

### Docente

- Revisa la sala asignada
- Consulta estudiantes y proyectos
- Responde preguntas
- Oculta o publica proyectos
- Retira estudiantes de una sala si corresponde

### Estudiante

- Registra su cuenta
- Entra a una sala
- Publica o edita un proyecto
- Envía likes y preguntas
- Gestiona su presencia dentro del campus

### Observador

- Ingresa con el código de la sala
- Consulta proyectos públicos
- Visualiza likes totales
- No accede a datos privados ni información sensible

## 🧠 Modelo de negocio y reglas del MVP

- Cada sala inicia con 8 stands disponibles
- Un estudiante puede publicar un proyecto por sala
- Los proyectos se asignan al siguiente stand libre
- Los borradores no ocupan un stand
- Los likes y preguntas están protegidos por restricciones únicas
- Las portadas se gestionan por URL, sin subir archivos binarios ni almacenar imagenes Base64

## 🔐 Seguridad y permisos

La aplicación está pensada para respetar el modelo de seguridad de Supabase:

- RLS (Row Level Security) en la base de datos
- Verificación de roles y permisos en servidor
- Separación entre vistas públicas y datos privados
- No se requieren claves secretas en el frontend

## 🛠️ Comandos útiles

```bash
npm run dev
npm run build
npm run start
```

## 🧪 Datos de prueba

El repositorio incluye `supabase/seed.sql` para crear una sala demo y preparar un entorno de prueba reproducible.

Para utilizarlo:

1. Crea cuentas de prueba si quieres poblar la sala con proyectos ficticios
2. Ejecuta el seed desde el SQL Editor de Supabase
3. Ajusta la confirmación de correo solo para entornos de pruebas

## 📌 Notas finales

Este proyecto es un MVP funcional con foco en la experiencia educativa y la interacción visual. El objetivo principal es ofrecer una versión clara, usable y extensible de un campus virtual 3D para exhibición de proyectos y actividades académicas.

Si deseas, puedo ayudarte también a:

- preparar una versión con mejor diseño visual,
- añadir una sección de screenshots reales,
- incluir un banner con logo personalizado,
- o convertir este README en una versión más premium tipo portfolio/landing page.
