-- Transaction-only integration check. It leaves no test comments behind.
begin;

insert into public.comments (verse_id, anonymous_id, user_name, mood, content)
values
  ('gen-1-1','v8-scope-check-1','V8 검증','검증','V8_SCOPE_GEN_1_1'),
  ('gen-1-2','v8-scope-check-2','V8 검증','검증','V8_SCOPE_GEN_1_2');

do $$
begin
  if (select count(*) from public.comments where verse_id='gen-1-1' and content='V8_SCOPE_GEN_1_1') <> 1 then
    raise exception 'gen-1-1 scoped query failed';
  end if;
  if (select count(*) from public.comments where verse_id='gen-1-2' and content='V8_SCOPE_GEN_1_2') <> 1 then
    raise exception 'gen-1-2 scoped query failed';
  end if;
  if exists (select 1 from public.comments where verse_id='gen-1-1' and content='V8_SCOPE_GEN_1_2') then
    raise exception 'cross-verse leakage: gen-1-2 content appeared in gen-1-1';
  end if;
  if exists (select 1 from public.comments where verse_id='gen-1-2' and content='V8_SCOPE_GEN_1_1') then
    raise exception 'cross-verse leakage: gen-1-1 content appeared in gen-1-2';
  end if;
end $$;

rollback;

