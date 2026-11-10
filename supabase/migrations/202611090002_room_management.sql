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

revoke all on function public.teacher_remove_student(uuid, uuid) from public;
grant execute on function public.teacher_remove_student(uuid, uuid) to authenticated;
