-- Run in the Supabase SQL editor after the migrations.
-- Three synthetic accounts exist only inside this rolled-back transaction.
-- No Auth API calls, emails, or persistent sample rows are created.
begin;
set local statement_timeout = '15s';
set local lock_timeout = '2s';
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  person uuid;
  request_id uuid;
  plan_id uuid;
  blocked boolean;
  sample_profile jsonb := '{"display_name":"Migration smoke test","interest_names":["Poetry","Illustration","Storytelling"],"skill_names":["Writing"],"desired_skills":["Illustration"],"intent":"Audience Share","preferred_format":"Illustrated post","availability":"Flexible","creator_type":"Creator","bio":"Temporary verification fixture","creative_goal":"Make an illustrated poem","discoverable":true}'::jsonb;
  brief jsonb := '{"title":"Temporary illustrated poem","idea":"Pair a short poem with an illustration","sender_role":"Write the poem","recipient_role":"Draw the illustration","next_step":"Agree on a subject"}'::jsonb;
begin
  foreach person in array array[a,b,outsider] loop
    insert into auth.users(id,email,raw_user_meta_data)
      values(person,'smoke-'||person::text||'@example.invalid','{}'::jsonb);
  end loop;
  update public.profiles set is_test=true where id in(a,b,outsider);
  execute 'set local role authenticated';
  foreach person in array array[a,b,outsider] loop
    perform set_config('request.jwt.claim.sub',person::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',person,'role','authenticated')::text,true);
    perform public.save_creator_profile(sample_profile || jsonb_build_object('username','smoke_'||substr(replace(person::text,'-',''),1,20)));
  end loop;

  perform set_config('request.jwt.claim.sub',a::text,true);
  request_id := public.create_collaboration(b,brief);
  blocked := false;
  begin perform public.change_collaboration(request_id,'accept');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'Sender accepted their own request'; end if;
  blocked := false;
  begin perform public.send_collaboration_message(request_id,'Before acceptance');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'Messaging opened before acceptance'; end if;

  perform set_config('request.jwt.claim.sub',b::text,true);
  perform public.change_collaboration(request_id,'accept');
  perform public.send_collaboration_message(request_id,'Temporary test message');

  perform set_config('request.jwt.claim.sub',a::text,true);
  if (select count(*) from public.collaboration_messages where collaboration_id=request_id) <> 1 then
    raise exception 'Participant cannot read their conversation';
  end if;
  plan_id := public.propose_audience_share(request_id,jsonb_build_object(
    'format','Joint post','sender_channel','Test channel A','recipient_channel','Test channel B',
    'sender_commitment','Publish the poem','recipient_commitment','Publish the illustration',
    'scheduled_for',current_date+1));
  blocked := false;
  begin perform public.respond_audience_share(plan_id,'accept');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'Proposer accepted their own Audience Share'; end if;

  perform set_config('request.jwt.claim.sub',outsider::text,true);
  if exists(select 1 from public.collaborations where id=request_id)
    or exists(select 1 from public.collaboration_messages where collaboration_id=request_id)
    or exists(select 1 from public.audience_plans where id=plan_id) then
    raise exception 'Private collaboration exposed to an unrelated account';
  end if;
  blocked := false;
  begin perform public.respond_audience_share(plan_id,'accept');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'Unrelated account accepted Audience Share'; end if;

  perform set_config('request.jwt.claim.sub',b::text,true);
  perform public.respond_audience_share(plan_id,'accept');
  perform public.record_audience_post(plan_id,'https://example.com/post-b');
  if (select sender_post_url is not null or recipient_post_url <> 'https://example.com/post-b' from public.audience_plans where id=plan_id) then
    raise exception 'Recipient wrote the wrong post slot';
  end if;
  blocked := false;
  begin update public.audience_plans set sender_post_url='https://example.com/forged' where id=plan_id;
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Direct client update was permitted'; end if;

  perform set_config('request.jwt.claim.sub',a::text,true);
  perform public.record_audience_post(plan_id,'https://example.com/post-a');
  perform public.change_collaboration(request_id,'complete');
  if (select status from public.collaborations where id=request_id) <> 'completed' then
    raise exception 'Completed collaboration was not recorded';
  end if;
  perform public.report_creator(b,'Temporary report to verify privacy');
  perform public.block_creator(b);
  if exists(select 1 from public.profiles where id=b) or exists(select 1 from public.collaborations where id=request_id) then
    raise exception 'Blocked participant remains visible';
  end if;
  perform set_config('request.jwt.claim.sub',b::text,true);
  if exists(select 1 from public.profiles where id=a) or exists(select 1 from public.creator_reports where reporter_id=a) then
    raise exception 'Block or report privacy failed';
  end if;

  execute 'reset role';
  if (select count(*) from public.product_events where user_id in(a,b,outsider) and event='audience_post_shared') <> 2 then
    raise exception 'Audience post events not recorded correctly';
  end if;
  if has_table_privilege('anon','public.creator_outcomes','SELECT')
    or has_table_privilege('authenticated','public.creator_outcomes','SELECT')
    or has_function_privilege('anon','public.create_collaboration(uuid,jsonb)','EXECUTE') then
    raise exception 'Anonymous or private analytics permissions are too broad';
  end if;
end;
$$;
rollback;
select 'PASS: collaboration, Audience Share, ownership and privacy; sample rows rolled back' as result;
