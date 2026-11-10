do $$
declare
  admin_id uuid;
  teacher_user_id uuid;
  demo_activity_id uuid;
  stand_index integer;
begin
  select id into admin_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;
  if admin_id is null then
    raise exception 'Promueve primero tu perfil a admin; consulta la guía del README.';
  end if;

  select id into teacher_user_id
  from public.profiles
  where role = 'teacher'
  order by created_at
  limit 1;

  insert into public.activities (title, share_code, created_by, teacher_id)
  values ('Sala de demostración', 'demo-campus', admin_id, teacher_user_id)
  on conflict (share_code) do nothing;

  select id into demo_activity_id
  from public.activities
  where share_code = 'demo-campus';

  for stand_index in 0..7 loop
    insert into public.stands (activity_id, code, position_x, position_z)
    values (
      demo_activity_id,
      'stand-' || (stand_index + 1),
      case when stand_index % 2 = 0 then -5.5 else 5.5 end,
      -8 - floor(stand_index / 2.0)::integer * 8
    )
    on conflict (activity_id, code) do nothing;
  end loop;

  insert into public.activity_participants (activity_id, student_id)
  select demo_activity_id, p.id
  from public.profiles p
  where p.role = 'student'
    and p.email like 'demo+%@example.invalid'
  on conflict (activity_id, student_id) do nothing;

  with demo_students as (
    select p.id, row_number() over (order by p.email) as project_number
    from public.profiles p
    where p.role = 'student'
      and p.email like 'demo+%@example.invalid'
    order by p.email
    limit 8
  ),
  samples(project_number, title, description, category, memory, challenge, learning, project_url) as (
    values
      (1, 'Mi primera web', 'Página personal con menú, galería y formulario de contacto.', 'Desarrollo web', 'Una idea personal tomó forma en una página propia.', 'Organizar secciones sin perder una navegación sencilla.', 'Estructurar contenido con HTML semántico y estilos reutilizables.', 'https://example.com'),
      (2, 'Juego de memoria', 'Juego de parejas con contador de intentos y reinicio.', 'Juego interactivo', 'Unas tarjetas convierten el tiempo libre en un reto.', 'Mantener el estado de las parejas sin voltear una carta dos veces.', 'Modelar estados de juego y responder a eventos.', 'https://example.com'),
      (3, 'Calculadora de notas', 'Calcula el promedio ponderado y cuánto falta para aprobar.', 'Herramienta de estudio', 'Una respuesta rápida a cuánto se necesita para aprobar.', 'Aplicar correctamente los pesos de cada nota.', 'Traducir una fórmula a código y validar los valores.', 'https://example.com'),
      (4, 'Portafolio de arte', 'Galería responsiva con ilustraciones digitales.', 'Portafolio creativo', 'Un espacio para reunir ilustraciones y contar su historia.', 'Adaptar la galería a diferentes pantallas.', 'Crear composiciones responsivas y jerarquía visual.', 'https://example.com'),
      (5, 'Lista de tareas', 'Organiza tareas y filtra por estado.', 'Productividad', 'Transforma pendientes en pasos pequeños.', 'Filtrar tareas sin perder cambios.', 'Separar datos de interfaz y persistir información.', 'https://example.com'),
      (6, 'Clima de mi ciudad', 'Consulta el pronóstico actual y de los próximos días.', 'Datos y visualización', 'Una ventana al clima local y a lo que viene.', 'Resumir información cambiante con claridad.', 'Presentar datos y diseñar estados de carga y error.', 'https://example.com'),
      (7, 'Quiz de ciencias', 'Cuestionario con retroalimentación inmediata.', 'Aprendizaje', 'Cada respuesta viene acompañada de una explicación.', 'Mantener puntaje y avance entre preguntas.', 'Diseñar interacciones educativas y estados.', 'https://example.com'),
      (8, 'Reloj pomodoro', 'Temporizador con ciclos de concentración y descanso.', 'Bienestar y estudio', 'Un recordatorio para pausar después de concentrarse.', 'Alternar entre trabajo y descanso.', 'Gestionar intervalos y comunicar cambios de estado.', 'https://example.com')
  )
  insert into public.projects (
    activity_id, student_id, title, description, category, memory,
    challenge, learning, project_url, status, stand_id
  )
  select
    demo_activity_id,
    demo_students.id,
    samples.title,
    samples.description,
    samples.category,
    samples.memory,
    samples.challenge,
    samples.learning,
    samples.project_url,
    'published',
    stands.id
  from demo_students
  join samples using (project_number)
  join public.stands on stands.activity_id = demo_activity_id
    and stands.code = 'stand-' || demo_students.project_number
  on conflict (activity_id, student_id) do nothing;
end
$$;
