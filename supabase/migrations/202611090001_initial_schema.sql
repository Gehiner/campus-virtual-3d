create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.profile_role as enum ('admin', 'teacher', 'student');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.project_status as enum ('draft', 'published', 'hidden');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role public.profile_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  share_code text not null unique check (share_code ~ '^[a-z0-9-]{6,32}$'),
  created_by uuid not null references public.profiles (id),
  teacher_id uuid references public.profiles (id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_participants (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (activity_id, student_id)
);

create table if not exists public.stands (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  code text not null,
  position_x double precision not null,
  position_y double precision not null default 0,
  position_z double precision not null,
  created_at timestamptz not null default now(),
  unique (activity_id, code),
  unique (id, activity_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text not null check (char_length(description) between 10 and 5000),
  category text not null default 'Proyecto estudiantil' check (char_length(category) between 2 and 80),
  memory text not null default '',
  challenge text not null default '',
  learning text not null default '',
  cover_image_url text,
  project_url text not null,
  status public.project_status not null default 'draft',
  stand_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, student_id),
  foreign key (stand_id, activity_id) references public.stands (id, activity_id)
);

create unique index if not exists projects_stand_id_unique
  on public.projects (stand_id)
  where stand_id is not null and status = 'published';
create index if not exists projects_activity_status_idx on public.projects (activity_id, status);
create index if not exists activity_participants_student_idx on public.activity_participants (student_id, is_active);

create table if not exists public.project_likes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 2 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, author_id)
);

create table if not exists public.project_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.project_questions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 2 and 2000),
  created_at timestamptz not null default now(),
  unique (question_id, author_id)
);

create index if not exists project_likes_project_idx on public.project_likes (project_id);
create index if not exists project_questions_project_idx on public.project_questions (project_id);
create index if not exists project_answers_question_idx on public.project_answers (question_id);

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_activity_teacher(target_activity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.activities
    where id = target_activity_id and teacher_id = (select auth.uid())
  )
$$;

create or replace function public.is_activity_student(target_activity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.activity_participants
    where activity_id = target_activity_id
      and student_id = (select auth.uid())
      and is_active
  )
$$;

create or replace function public.is_project_author(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.projects
    where id = target_project_id and student_id = (select auth.uid())
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  supplied_name text := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
begin
  if char_length(supplied_name) < 2 then
    supplied_name := split_part(coalesce(new.email, ''), '@', 1);
  end if;
  if char_length(supplied_name) < 2 then
    supplied_name := 'Usuario';
  end if;
  supplied_name := left(supplied_name, 120);

  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), supplied_name);
  return new;
end
$$;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform set_config('app.sync_profile_email', 'on', true);
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row when (new.email is distinct from old.email)
  execute function public.sync_profile_email();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create or replace function public.guard_profile_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.id <> old.id then
    raise exception 'No se puede cambiar el identificador del perfil';
  end if;
  if new.email is distinct from old.email
    and current_setting('app.sync_profile_email', true) is distinct from 'on'
    and coalesce(public.current_profile_role(), 'student'::public.profile_role) <> 'admin' then
    raise exception 'El correo se administra desde Supabase Auth';
  end if;
  if new.role is distinct from old.role
    and coalesce(public.current_profile_role(), 'student'::public.profile_role) <> 'admin' then
    raise exception 'Solo un administrador puede asignar roles';
  end if;
  return new;
end
$$;

drop trigger if exists profiles_guard_changes on public.profiles;
create trigger profiles_guard_changes
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
drop trigger if exists project_questions_set_updated_at on public.project_questions;
create trigger project_questions_set_updated_at
  before update on public.project_questions
  for each row execute function public.set_updated_at();

create or replace function public.guard_project_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.profile_role := public.current_profile_role();
begin
  if actor_role = 'student' then
    if tg_op = 'UPDATE' then
      if new.student_id <> old.student_id
        or new.activity_id <> old.activity_id
        or new.status = 'hidden' then
        raise exception 'El estudiante solo puede editar su proyecto y no puede ocultarlo';
      end if;
    elsif new.student_id <> (select auth.uid()) or new.status = 'hidden' then
      raise exception 'El estudiante solo puede crear su propio proyecto';
    end if;
    if not public.is_activity_student(new.activity_id) then
      raise exception 'Debes pertenecer a la sala para publicar';
    end if;
  end if;

  if new.stand_id is not null and not exists (
    select 1 from public.stands
    where id = new.stand_id and activity_id = new.activity_id
  ) then
    raise exception 'El stand no pertenece a esta sala';
  end if;
  return new;
end
$$;

drop trigger if exists projects_guard_changes on public.projects;
create trigger projects_guard_changes
  before insert or update on public.projects
  for each row execute function public.guard_project_changes();

create or replace function public.enroll_in_activity(input_share_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_activity_id uuid;
begin
  if (select auth.uid()) is null
    or public.current_profile_role() <> 'student' then
    raise exception 'Debes iniciar sesión como estudiante para unirte a una sala';
  end if;

  select id into target_activity_id
  from public.activities
  where share_code = lower(trim(input_share_code)) and is_active;
  if target_activity_id is null then
    raise exception 'La sala no existe o está cerrada';
  end if;

  insert into public.activity_participants (activity_id, student_id)
  values (target_activity_id, (select auth.uid()))
  on conflict (activity_id, student_id) do update
    set is_active = activity_participants.is_active;

  if not exists (
    select 1 from public.activity_participants
    where activity_id = target_activity_id
      and student_id = (select auth.uid())
      and is_active
  ) then
    raise exception 'Tu acceso a esta sala fue desactivado por el docente';
  end if;

  return target_activity_id;
end
$$;

create or replace function public.create_activity(input_title text, input_teacher_id uuid)
returns table (id uuid, title text, share_code text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_activity_id uuid;
  new_share_code text;
  stand_index integer;
begin
  if public.current_profile_role() <> 'admin' then
    raise exception 'Solo un administrador puede crear salas';
  end if;
  if input_teacher_id is not null and not exists (
    select 1 from public.profiles
    where profiles.id = input_teacher_id and role = 'teacher'
  ) then
    raise exception 'El docente asignado no existe o no tiene el rol correcto';
  end if;
  if char_length(trim(input_title)) not between 2 and 120 then
    raise exception 'El nombre de la sala debe tener entre 2 y 120 caracteres';
  end if;

  new_share_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  insert into public.activities (title, share_code, created_by, teacher_id)
  values (trim(input_title), new_share_code, (select auth.uid()), input_teacher_id)
  returning activities.id into new_activity_id;

  for stand_index in 0..7 loop
    insert into public.stands (activity_id, code, position_x, position_z)
    values (
      new_activity_id,
      'stand-' || (stand_index + 1),
      case when stand_index % 2 = 0 then -5.5 else 5.5 end,
      -8 - floor(stand_index / 2.0)::integer * 8
    );
  end loop;

  return query select new_activity_id, trim(input_title), new_share_code;
end
$$;

create or replace function public.admin_set_user_role(input_user_id uuid, input_role public.profile_role)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.current_profile_role() <> 'admin' then
    raise exception 'Solo un administrador puede asignar roles';
  end if;
  if input_role = 'admin' then
    raise exception 'El rol de administrador se asigna manualmente desde Supabase';
  end if;
  if input_user_id = (select auth.uid()) then
    raise exception 'No puedes cambiar tu propio rol';
  end if;
  update public.profiles set role = input_role where id = input_user_id;
  if not found then
    raise exception 'No se encontró el perfil';
  end if;
end
$$;

create or replace function public.admin_assign_activity_teacher(input_activity_id uuid, input_teacher_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.current_profile_role() <> 'admin' then
    raise exception 'Solo un administrador puede asignar docentes';
  end if;
  if input_teacher_id is not null and not exists (
    select 1 from public.profiles
    where id = input_teacher_id and role = 'teacher'
  ) then
    raise exception 'El usuario seleccionado no es docente';
  end if;
  update public.activities
  set teacher_id = input_teacher_id
  where id = input_activity_id;
  if not found then
    raise exception 'No se encontró la sala';
  end if;
end
$$;

create or replace function public.admin_update_profile_name(input_user_id uuid, input_full_name text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.current_profile_role() <> 'admin' then
    raise exception 'Solo un administrador puede actualizar perfiles';
  end if;
  if char_length(trim(input_full_name)) not between 2 and 120 then
    raise exception 'El nombre debe tener entre 2 y 120 caracteres';
  end if;
  update public.profiles
  set full_name = trim(input_full_name)
  where id = input_user_id;
  if not found then
    raise exception 'No se encontró el perfil';
  end if;
end
$$;

create or replace function public.public_activity_by_code(input_share_code text)
returns table (id uuid, title text, share_code text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select activities.id, activities.title, activities.share_code
  from public.activities
  where activities.share_code = lower(trim(input_share_code))
    and activities.is_active
$$;

create or replace function public.public_project_like_counts(input_project_ids uuid[])
returns table (project_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, count(l.id)
  from public.projects p
  left join public.project_likes l on l.project_id = p.id
  join public.activities a on a.id = p.activity_id and a.is_active
  where p.id = any(input_project_ids) and p.status = 'published'
  group by p.id
$$;

create or replace function public.teacher_remove_student(input_activity_id uuid, input_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.current_profile_role() <> 'admin'
    and not public.is_activity_teacher(input_activity_id) then
    raise exception 'No tienes permiso para administrar esta sala';
  end if;
  delete from public.project_likes l
  using public.projects p
  where l.project_id = p.id
    and p.activity_id = input_activity_id
    and l.user_id = input_student_id;
  delete from public.project_answers a
  using public.project_questions q, public.projects p
  where a.question_id = q.id
    and q.project_id = p.id
    and p.activity_id = input_activity_id
    and a.author_id = input_student_id;
  delete from public.project_questions q
  using public.projects p
  where q.project_id = p.id
    and p.activity_id = input_activity_id
    and q.author_id = input_student_id;
  delete from public.projects
  where activity_id = input_activity_id
    and student_id = input_student_id;
  update public.activity_participants
  set is_active = false
  where activity_id = input_activity_id and student_id = input_student_id;
end
$$;

create or replace function public.teacher_set_project_status(
  input_project_id uuid,
  input_status public.project_status
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  project_activity_id uuid;
  project_stand_id uuid;
begin
  select activity_id, stand_id into project_activity_id, project_stand_id
  from public.projects where id = input_project_id;
  if project_activity_id is null then
    raise exception 'No se encontró el proyecto';
  end if;
  if public.current_profile_role() <> 'admin'
    and not public.is_activity_teacher(project_activity_id) then
    raise exception 'No tienes permiso para moderar este proyecto';
  end if;
  if public.current_profile_role() <> 'admin' and input_status = 'draft' then
    raise exception 'El docente solo puede ocultar o volver a publicar un proyecto';
  end if;
  if input_status = 'published' and (
    project_stand_id is null
    or exists (
      select 1 from public.projects
      where stand_id = project_stand_id and status = 'published' and id <> input_project_id
    )
  ) then
    select s.id into project_stand_id
    from public.stands s
    where s.activity_id = project_activity_id
      and not exists (
        select 1 from public.projects p
        where p.stand_id = s.id and p.status = 'published' and p.id <> input_project_id
      )
    order by s.code
    limit 1
    for update skip locked;
    if project_stand_id is null then
      raise exception 'No quedan stands disponibles para volver a publicar';
    end if;
  end if;
  update public.projects
  set status = input_status,
    stand_id = case when input_status = 'published' then project_stand_id else null end
  where id = input_project_id;
end
$$;

create or replace function public.public_projects_by_code(input_share_code text)
returns table (
  id uuid,
  title text,
  description text,
  category text,
  memory text,
  challenge text,
  learning text,
  cover_image_url text,
  project_url text,
  author_name text,
  stand_code text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.title, p.description, p.category, p.memory, p.challenge,
    p.learning, p.cover_image_url, p.project_url, profile.full_name, s.code
  from public.projects p
  join public.activities a on a.id = p.activity_id
  join public.profiles profile on profile.id = p.student_id
  left join public.stands s on s.id = p.stand_id
  where a.share_code = lower(trim(input_share_code))
    and a.is_active
    and p.status = 'published'
  order by s.code nulls last, p.created_at, p.id
$$;

create or replace function public.submit_project(
  input_activity_id uuid,
  input_title text,
  input_description text,
  input_category text,
  input_memory text,
  input_challenge text,
  input_learning text,
  input_cover_image_url text,
  input_project_url text,
  input_publish boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  project_id uuid;
  selected_stand_id uuid;
begin
  if actor_id is null or public.current_profile_role() <> 'student' then
    raise exception 'Solo estudiantes pueden publicar proyectos';
  end if;
  if not public.is_activity_student(input_activity_id)
    or not exists (
      select 1 from public.activities
      where id = input_activity_id and is_active
    ) then
    raise exception 'No tienes acceso a esta sala';
  end if;
  if exists (
    select 1 from public.projects
    where activity_id = input_activity_id
      and student_id = actor_id
      and status = 'hidden'
  ) then
    raise exception 'Tu proyecto fue ocultado por el docente; contáctalo antes de editarlo';
  end if;
  if char_length(trim(input_title)) not between 2 and 120
    or char_length(trim(input_description)) not between 10 and 5000
    or char_length(trim(input_category)) not between 2 and 80 then
    raise exception 'Revisa el título, descripción y categoría del proyecto';
  end if;
  if input_project_url !~* '^https?://' then
    raise exception 'El enlace del proyecto debe comenzar con http:// o https://';
  end if;
  if input_cover_image_url is not null
    and input_cover_image_url !~* '^https?://' then
    raise exception 'La portada debe ser una URL http:// o https://';
  end if;
  if input_publish then
    select s.id into selected_stand_id
    from public.stands s
    where s.activity_id = input_activity_id
      and not exists (
        select 1 from public.projects p
        where p.stand_id = s.id
          and p.status = 'published'
          and p.student_id <> actor_id
      )
    order by s.code
    limit 1
    for update skip locked;
    if selected_stand_id is null then
      raise exception 'No quedan stands disponibles en esta sala';
    end if;
  end if;

  insert into public.projects (
    activity_id, student_id, title, description, category, memory,
    challenge, learning, cover_image_url, project_url, status, stand_id
  )
  values (
    input_activity_id, actor_id, trim(input_title), trim(input_description),
    trim(input_category), trim(coalesce(input_memory, '')),
    trim(coalesce(input_challenge, '')), trim(coalesce(input_learning, '')),
    nullif(trim(coalesce(input_cover_image_url, '')), ''),
    trim(input_project_url),
    case when input_publish then 'published'::public.project_status else 'draft'::public.project_status end,
    selected_stand_id
  )
  on conflict (activity_id, student_id) do update set
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    memory = excluded.memory,
    challenge = excluded.challenge,
    learning = excluded.learning,
    cover_image_url = excluded.cover_image_url,
    project_url = excluded.project_url,
    status = excluded.status,
    stand_id = case
      when input_publish then coalesce(public.projects.stand_id, excluded.stand_id)
      else null
    end
  returning id into project_id;

  return project_id;
end
$$;

alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_participants enable row level security;
alter table public.stands enable row level security;
alter table public.projects enable row level security;
alter table public.project_likes enable row level security;
alter table public.project_questions enable row level security;
alter table public.project_answers enable row level security;

drop policy if exists "Profiles are visible to their owner, admins, and assigned teachers" on public.profiles;
create policy "Profiles are visible to their owner, admins, and assigned teachers"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or public.current_profile_role() = 'admin'
    or exists (
      select 1 from public.activity_participants ap
      where ap.student_id = profiles.id
        and ap.is_active
        and public.is_activity_teacher(ap.activity_id)
    )
  );
drop policy if exists "Users update only their own name" on public.profiles;
create policy "Users update only their own name"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = public.current_profile_role()
  );
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "Active activities are publicly discoverable" on public.activities;
create policy "Active activities are publicly discoverable"
  on public.activities for select to anon, authenticated
  using (
    is_active
    or created_by = (select auth.uid())
    or teacher_id = (select auth.uid())
    or public.current_profile_role() = 'admin'
  );
drop policy if exists "Admins create activities" on public.activities;
create policy "Admins create activities"
  on public.activities for insert to authenticated
  with check (
    public.current_profile_role() = 'admin'
    and created_by = (select auth.uid())
  );
drop policy if exists "Admins and assigned teachers update their activities" on public.activities;
create policy "Admins and assigned teachers update their activities"
  on public.activities for update to authenticated
  using (public.current_profile_role() = 'admin' or public.is_activity_teacher(id))
  with check (public.current_profile_role() = 'admin' or public.is_activity_teacher(id));
drop policy if exists "Admins delete activities" on public.activities;
create policy "Admins delete activities"
  on public.activities for delete to authenticated
  using (public.current_profile_role() = 'admin');

drop policy if exists "Participants and assigned teachers read rosters" on public.activity_participants;
create policy "Participants and assigned teachers read rosters"
  on public.activity_participants for select to authenticated
  using (
    student_id = (select auth.uid())
    or public.current_profile_role() = 'admin'
    or public.is_activity_teacher(activity_id)
  );
drop policy if exists "Admins manage activity participants" on public.activity_participants;
create policy "Admins manage activity participants"
  on public.activity_participants for all to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "Stands are public for active activities" on public.stands;
create policy "Stands are public for active activities"
  on public.stands for select to anon, authenticated
  using (
    exists (select 1 from public.activities a where a.id = activity_id and a.is_active)
    or public.current_profile_role() = 'admin'
    or public.is_activity_teacher(activity_id)
  );
drop policy if exists "Admins manage stands" on public.stands;
create policy "Admins manage stands"
  on public.stands for all to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "Published projects are public; members see their own drafts" on public.projects;
create policy "Published projects are public; members see their own drafts"
  on public.projects for select to anon, authenticated
  using (
    (
      status = 'published'
      and exists (select 1 from public.activities a where a.id = activity_id and a.is_active)
    )
    or student_id = (select auth.uid())
    or public.is_activity_teacher(activity_id)
    or public.current_profile_role() = 'admin'
  );
drop policy if exists "Students create their own project in an active room" on public.projects;
create policy "Students create their own project in an active room"
  on public.projects for insert to authenticated
  with check (
    public.current_profile_role() = 'student'
    and student_id = (select auth.uid())
    and status in ('draft', 'published')
    and public.is_activity_student(activity_id)
    and exists (select 1 from public.activities a where a.id = activity_id and a.is_active)
  );
drop policy if exists "Students edit their project; teachers moderate assigned rooms" on public.projects;
create policy "Students edit their project; teachers moderate assigned rooms"
  on public.projects for update to authenticated
  using (
    (student_id = (select auth.uid()) and public.current_profile_role() = 'student')
    or public.is_activity_teacher(activity_id)
    or public.current_profile_role() = 'admin'
  )
  with check (
    (student_id = (select auth.uid()) and public.current_profile_role() = 'student' and status <> 'hidden')
    or public.is_activity_teacher(activity_id)
    or public.current_profile_role() = 'admin'
  );
drop policy if exists "Students and admins can delete projects" on public.projects;
create policy "Students and admins can delete projects"
  on public.projects for delete to authenticated
  using (
    (student_id = (select auth.uid()) and public.current_profile_role() = 'student')
    or public.current_profile_role() = 'admin'
  );

drop policy if exists "Like records are visible only to the liker, assigned teachers, and admins" on public.project_likes;
create policy "Like records are visible only to the liker, assigned teachers, and admins"
  on public.project_likes for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.current_profile_role() = 'admin'
    or exists (
      select 1 from public.projects p
      where p.id = project_id and public.is_activity_teacher(p.activity_id)
    )
  );
drop policy if exists "Students like published projects from others in their room" on public.project_likes;
create policy "Students like published projects from others in their room"
  on public.project_likes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.current_profile_role() = 'student'
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.status = 'published'
        and p.student_id <> (select auth.uid())
        and public.is_activity_student(p.activity_id)
    )
  );
drop policy if exists "Students remove their own likes" on public.project_likes;
create policy "Students remove their own likes"
  on public.project_likes for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Questions are visible to their author, project owner, and teacher" on public.project_questions;
create policy "Questions are visible to their author, project owner, and teacher"
  on public.project_questions for select to authenticated
  using (
    author_id = (select auth.uid())
    or public.is_project_author(project_id)
    or public.current_profile_role() = 'admin'
    or exists (
      select 1 from public.projects p
      where p.id = project_id and public.is_activity_teacher(p.activity_id)
    )
  );
drop policy if exists "Students ask one question on another published project" on public.project_questions;
create policy "Students ask one question on another published project"
  on public.project_questions for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.current_profile_role() = 'student'
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.status = 'published'
        and p.student_id <> (select auth.uid())
        and public.is_activity_student(p.activity_id)
    )
  );
drop policy if exists "Authors and admins remove questions" on public.project_questions;
create policy "Authors and admins remove questions"
  on public.project_questions for delete to authenticated
  using (
    author_id = (select auth.uid())
    or public.is_project_author(project_id)
    or public.current_profile_role() = 'admin'
  );

drop policy if exists "Answers follow question visibility" on public.project_answers;
create policy "Answers follow question visibility"
  on public.project_answers for select to authenticated
  using (
    exists (
      select 1 from public.project_questions q
      where q.id = question_id
        and (
          q.author_id = (select auth.uid())
          or public.is_project_author(q.project_id)
          or public.current_profile_role() = 'admin'
          or exists (
            select 1 from public.projects p
            where p.id = q.project_id and public.is_activity_teacher(p.activity_id)
          )
        )
    )
  );
drop policy if exists "Project owners and assigned teachers answer questions" on public.project_answers;
create policy "Project owners and assigned teachers answer questions"
  on public.project_answers for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.project_questions q
      join public.projects p on p.id = q.project_id
      where q.id = question_id
        and (
          p.student_id = (select auth.uid())
          or public.current_profile_role() = 'admin'
          or public.is_activity_teacher(p.activity_id)
        )
    )
  );

revoke all on function public.current_profile_role() from public;
revoke all on function public.is_activity_teacher(uuid) from public;
revoke all on function public.is_activity_student(uuid) from public;
revoke all on function public.is_project_author(uuid) from public;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_activity_teacher(uuid) to authenticated;
grant execute on function public.is_activity_student(uuid) to authenticated;
grant execute on function public.is_project_author(uuid) to authenticated;

revoke all on function public.enroll_in_activity(text) from public;
revoke all on function public.create_activity(text, uuid) from public;
revoke all on function public.admin_set_user_role(uuid, public.profile_role) from public;
revoke all on function public.admin_assign_activity_teacher(uuid, uuid) from public;
revoke all on function public.admin_update_profile_name(uuid, text) from public;
revoke all on function public.public_activity_by_code(text) from public;
revoke all on function public.public_project_like_counts(uuid[]) from public;
revoke all on function public.public_projects_by_code(text) from public;
revoke all on function public.teacher_remove_student(uuid, uuid) from public;
revoke all on function public.teacher_set_project_status(uuid, public.project_status) from public;
revoke all on function public.submit_project(uuid, text, text, text, text, text, text, text, text, boolean) from public;
grant execute on function public.enroll_in_activity(text) to authenticated;
grant execute on function public.create_activity(text, uuid) to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.profile_role) to authenticated;
grant execute on function public.admin_assign_activity_teacher(uuid, uuid) to authenticated;
grant execute on function public.admin_update_profile_name(uuid, text) to authenticated;
grant execute on function public.public_activity_by_code(text) to anon, authenticated;
grant execute on function public.public_project_like_counts(uuid[]) to anon, authenticated;
grant execute on function public.public_projects_by_code(text) to anon, authenticated;
grant execute on function public.teacher_remove_student(uuid, uuid) to authenticated;
grant execute on function public.teacher_set_project_status(uuid, public.project_status) to authenticated;
grant execute on function public.submit_project(uuid, text, text, text, text, text, text, text, text, boolean) to authenticated;

revoke all on public.profiles, public.activities, public.activity_participants,
  public.stands, public.projects, public.project_likes, public.project_questions,
  public.project_answers from public, anon, authenticated;
grant select on public.activities, public.stands, public.projects to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.activity_participants to authenticated;
grant select, insert, delete on public.project_likes to authenticated;
grant select, insert, delete on public.project_questions to authenticated;
grant select, insert on public.project_answers to authenticated;
grant execute on function public.current_profile_role() to anon;
grant execute on function public.is_activity_teacher(uuid) to anon;
grant execute on function public.is_activity_student(uuid) to anon;
grant execute on function public.is_project_author(uuid) to anon;
