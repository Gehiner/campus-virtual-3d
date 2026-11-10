# Campus Virtual 3D

Campus 3D en primera persona con salas compartibles, proyectos persistentes y permisos para administrador, docentes, estudiantes y observadores.

## Requisitos

- Node.js 18.18 o superior.
- Un proyecto Supabase.

## Configuración inicial de Supabase

1. Crea un proyecto en Supabase y guarda la contraseña de la base de datos en un administrador de contraseñas; no la pongas en el repositorio ni en el chat.
2. En **Project Settings → API Keys** copia la Project URL y la clave **Publishable** (`sb_publishable_...`) o la antigua clave pública `anon` (JWT con rol `anon`). Nunca uses `sb_secret_...` ni `service_role` en la aplicación o en una variable `NEXT_PUBLIC_*`.
3. En **Authentication → URL Configuration**, configura el Site URL local como `http://localhost:3000` y agrega `http://localhost:3000/auth/callback` como URL de redirección permitida. Añade también la URL de producción cuando exista.
4. Para permitir que los estudiantes entren sin confirmar el correo durante esta prueba, abre **Authentication → Sign In / Providers → Email** y desactiva **Confirm email**. Esto afecta a los nuevos registros por correo del proyecto (que en este flujo son estudiantes); vuelve a activarlo cuando termine la prueba. Con la confirmación desactivada, Supabase inicia la sesión al registrar la cuenta.
5. Copia `.env.example` a `.env.local` y completa solo las dos variables públicas:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
   ```

6. En **SQL Editor**, copia y ejecuta el contenido completo de `supabase/migrations/202611090001_initial_schema.sql`. La migración crea las tablas, las restricciones, las funciones de autorización y las políticas RLS; se puede volver a ejecutar si el SQL Editor se detiene a mitad del proceso.
7. En **SQL Editor**, ejecuta también `supabase/migrations/202611090002_room_management.sql` para que el docente pueda retirar a un estudiante y borrar sus proyectos e interacciones solo dentro de su sala.
8. Ejecuta `npm install` y `npm run dev`. Abre `http://localhost:3000/auth?mode=register` y crea tu cuenta personal con nombre, correo y contraseña.
9. En **SQL Editor**, promueve únicamente tu perfil de administrador. Como el trigger impide cambios de rol aunque se ejecuten desde SQL Editor, desactiva temporalmente solo ese trigger dentro de una transacción. Sustituye el correo por el que registraste:

   ```sql
   begin;

   alter table public.profiles disable trigger profiles_guard_changes;

   update public.profiles
   set role = 'admin'
   where email = lower('tu-correo@ejemplo.com')
   returning email, role;

   alter table public.profiles enable trigger profiles_guard_changes;

   commit;
   ```

10. Abre `http://localhost:3000/admin`. Para crear un docente, invítalo desde **Authentication → Users** en Supabase; después actualiza su nombre, asígnale el rol `teacher` y vincúlalo a una sala desde el panel.

El proyecto no necesita una clave de servicio en Next.js. Los roles y permisos se verifican en el servidor y en RLS. El rol de administrador se asigna inicialmente desde SQL para evitar que alguien se lo conceda mediante el navegador.

## Flujo del MVP

- **Administrador:** invita docentes desde Supabase, crea, desactiva y reactiva salas, asigna docentes y comparte el enlace `/s/<código>`. Desactivar una sala conserva sus datos.
- **Docente:** comparte el enlace de su sala, consulta estudiantes, revisa quién dio likes y qué preguntas dejaron, responde y oculta o vuelve a publicar proyectos. Puede retirar a un estudiante de la sala; se borran sus proyectos e interacciones de esa sala, pero se conserva su cuenta.
- **Estudiante:** crea una cuenta con nombre, correo y contraseña; entra desde el enlace de su docente; publica o edita un proyecto, da un like por proyecto y deja una pregunta por proyecto.
- **Observador:** entra con el enlace sin registrarse. Solo consulta los proyectos publicados y el total de likes; no ve correos, autores de likes ni preguntas privadas.

Una sala inicia con ocho stands. Cada estudiante puede entregar un proyecto por sala. Publicar asigna el siguiente stand libre; guardar como borrador no lo ocupa. Si se llenan los ocho stands, no se aceptan más publicaciones hasta que se libere uno. Las portadas se guardan por URL; no se suben archivos ni se guardan imágenes Base64.

## Prueba de datos ficticios (opcional)

Después de ejecutar la migración y promover tu perfil a administrador, puedes ejecutar `supabase/seed.sql` en SQL Editor. Crea la sala `demo-campus` y sus ocho stands de forma idempotente.

Para poblarla además con los ocho proyectos ficticios, crea primero hasta ocho cuentas de prueba con correos `demo+1@example.invalid` a `demo+8@example.invalid`. Solo en un proyecto de prueba, desactiva temporalmente la confirmación de correo o crea las cuentas desde el panel de Supabase; no desactives la confirmación en producción. No uses cuentas reales para los datos de demostración. Vuelve a ejecutar el seed; si hay menos cuentas, inserta los proyectos correspondientes. Las cuentas de prueba no incluyen contraseñas en el repositorio.

## Desarrollo local

```powershell
npm install
npm run dev
```

Rutas principales:

- `/` — acceso a estudiante, observador y docente.
- `/estudiante` — acceso o listado de salas del estudiante.
- `/auth?mode=register` y `/auth?mode=login` — registro e inicio de sesión.
- `/observador` — entrada de solo lectura mediante código de sala.
- `/docente` — panel protegido para salas asignadas.
- `/admin` — administración protegida de salas y roles.
- `/s/<código>` — campus de una sala.
- `/s/<código>/proyecto` — formulario de publicación/edición del estudiante.

Para restablecer la contraseña se usa el enlace **Olvidé mi contraseña** de inicio de sesión. El remitente de correos y los límites de Auth dependen de la configuración y del plan gratuito de Supabase.

## Notas de seguridad y límites actuales

- La base de datos impone unicidad de proyecto por estudiante/sala, stand publicado por sala, likes por usuario/proyecto y pregunta por usuario/proyecto.
- El observador consulta proyectos mediante una función SQL que solo devuelve campos públicos; RLS impide leer las tablas privadas de interacciones.
- Los docentes ven los datos de estudiantes inscritos en sus salas. No hay acceso multijugador ni sincronización en tiempo real.
- Las imágenes usan enlaces HTTPS opcionales; integración de Supabase Storage y carga de archivos queda fuera de esta primera entrega.
- No se ha conectado este repositorio a tu proyecto Supabase ni se ha desplegado. Debes configurar las variables y ejecutar la migración siguiendo los pasos anteriores.
