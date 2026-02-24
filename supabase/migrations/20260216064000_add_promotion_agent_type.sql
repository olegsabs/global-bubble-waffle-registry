do $$
begin
  alter type public.agent_type add value 'promotion';
exception
  when duplicate_object then null;
end $$;
