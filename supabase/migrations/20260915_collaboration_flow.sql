begin;
alter table public.profiles
  add column interest_names text[] not null default '{}',
  add column skill_names text[] not null default '{}',
  add column desired_skills text[] not null default '{}',
  add column intent text not null default 'Co-create content',
  add column preferred_format text not null default 'Short video',
  add column availability text not null default 'Flexible',
  add column discoverable boolean not null default true,
  add column is_test boolean not null default false;
-- Preserve interest and skill selections from the original normalized schema.
update public.profiles p set interest_names = coalesce((select array_agg(i.name order by i.name) from public.user_interests u join public.interests i on i.id = u.interest_id where u.user_id = p.id), '{}'),
 skill_names = coalesce((select array_agg(s.name order by s.name) from public.user_skills u join public.skills s on s.id = u.skill_id where u.user_id = p.id), '{}');

create table public.creator_blocks (
 blocker_id uuid references public.profiles(id) on delete cascade,
 blocked_id uuid references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), primary key (blocker_id, blocked_id), check (blocker_id <> blocked_id)
);
create table public.creator_reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade,
 reported_id uuid not null references public.profiles(id) on delete cascade,
 reason text not null check (char_length(reason) between 3 and 1000), created_at timestamptz not null default now(), check (reporter_id <> reported_id)
);
create table public.collaborations (
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (char_length(title) between 3 and 140), idea text not null check (char_length(idea) between 3 and 2000),
 sender_role text not null check (char_length(sender_role) between 3 and 1000), recipient_role text not null check (char_length(recipient_role) between 3 and 1000),
 next_step text not null check (char_length(next_step) between 3 and 1000),
 status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','completed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (sender_id <> recipient_id)
);
create unique index one_active_collaboration_per_pair on public.collaborations (least(sender_id,recipient_id), greatest(sender_id,recipient_id)) where status in ('pending','accepted');
create index collaborations_sender on public.collaborations(sender_id,created_at desc);
create index collaborations_recipient on public.collaborations(recipient_id,created_at desc);
create table public.collaboration_messages (
 id uuid primary key default gen_random_uuid(), collaboration_id uuid not null references public.collaborations(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 2000), created_at timestamptz not null default now()
);
create index messages_collaboration on public.collaboration_messages(collaboration_id,created_at);
create table public.audience_plans (
 id uuid primary key default gen_random_uuid(), collaboration_id uuid not null references public.collaborations(id) on delete cascade,
 proposed_by uuid not null references public.profiles(id) on delete cascade,
 format text not null check(format in ('Shout-out','Joint post','Guest feature')),
 sender_channel text not null check(char_length(sender_channel) between 2 and 160),
 recipient_channel text not null check(char_length(recipient_channel) between 2 and 160),
 sender_commitment text not null check(char_length(sender_commitment) between 3 and 1000),
 recipient_commitment text not null check(char_length(recipient_commitment) between 3 and 1000),
 scheduled_for date not null,
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 sender_post_url text check(sender_post_url ~ '^https://[^/@[:space:]]+\.[^/@[:space:]]+(/[^[:space:]]*)?$' and char_length(sender_post_url) <= 2000),
 recipient_post_url text check(recipient_post_url ~ '^https://[^/@[:space:]]+\.[^/@[:space:]]+(/[^[:space:]]*)?$' and char_length(recipient_post_url) <= 2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_active_audience_plan on public.audience_plans(collaboration_id) where status in ('pending','accepted');
create table public.product_events (
 id bigint generated always as identity primary key, user_id uuid not null references public.profiles(id) on delete cascade,
 event text not null check(event in ('onboarding_completed','request_sent','request_accepted','collaboration_completed','audience_proposed','audience_accepted','audience_post_shared')),
 collaboration_id uuid references public.collaborations(id) on delete cascade, created_at timestamptz not null default now()
);

create function public.creators_blocked(a uuid,b uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() in(a,b) and exists(select 1 from public.creator_blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a));
$$;
create function public.can_read_collaboration(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.collaborations c where c.id=target and auth.uid() in(c.sender_id,c.recipient_id) and not public.creators_blocked(c.sender_id,c.recipient_id));
$$;
create function public.has_collaboration_with(other uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.collaborations c where (c.sender_id=auth.uid() and c.recipient_id=other) or (c.recipient_id=auth.uid() and c.sender_id=other));
$$;
drop policy "Authenticated users can view profiles" on public.profiles;
create policy "Visible creators or own profile" on public.profiles for select to authenticated using (
 id=auth.uid() or (not public.creators_blocked(auth.uid(),id) and ((is_onboarded and discoverable) or public.has_collaboration_with(id)))
);
drop policy "Authenticated users can view user interests" on public.user_interests;
create policy "Visible creator interests" on public.user_interests for select to authenticated using (exists(select 1 from public.profiles p where p.id=user_id));
drop policy "Authenticated users can view user skills" on public.user_skills;
create policy "Visible creator skills" on public.user_skills for select to authenticated using (exists(select 1 from public.profiles p where p.id=user_id));
-- All profile changes go through the validator. Clients cannot mark themselves as test users.
revoke insert,update,delete on public.profiles from anon,authenticated;
alter table public.creator_blocks enable row level security;
alter table public.creator_reports enable row level security;
alter table public.collaborations enable row level security;
alter table public.collaboration_messages enable row level security;
alter table public.audience_plans enable row level security;
alter table public.product_events enable row level security;
create policy "Own blocks" on public.creator_blocks for select to authenticated using(blocker_id=auth.uid());
create policy "Own reports" on public.creator_reports for select to authenticated using(reporter_id=auth.uid());
create policy "Participant requests" on public.collaborations for select to authenticated using(public.can_read_collaboration(id));
create policy "Participant messages" on public.collaboration_messages for select to authenticated using(public.can_read_collaboration(collaboration_id));
create policy "Participant audience plans" on public.audience_plans for select to authenticated using(public.can_read_collaboration(collaboration_id));
create policy "Own events" on public.product_events for select to authenticated using(user_id=auth.uid());
grant select on public.profiles,public.creator_blocks,public.creator_reports,public.collaborations,public.collaboration_messages,public.audience_plans,public.product_events to authenticated;
revoke insert,update,delete on public.creator_blocks,public.creator_reports,public.collaborations,public.collaboration_messages,public.audience_plans,public.product_events from anon,authenticated;

create function public.save_creator_profile(payload jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); was_onboarded boolean; interests text[]; skills text[]; wanted text[];
begin
 if uid is null then raise exception 'Sign in to save your profile.'; end if;
 select is_onboarded into was_onboarded from public.profiles where id=uid for update;
 if not found then raise exception 'Your profile is not ready. Try signing in again.'; end if;
 select array_agg(v) into interests from (select min(trim(value)) v from jsonb_array_elements_text(payload->'interest_names') group by lower(trim(value))) a;
 select coalesce(array_agg(v),'{}') into skills from (select min(trim(value)) v from jsonb_array_elements_text(payload->'skill_names') group by lower(trim(value))) a;
 select coalesce(array_agg(v),'{}') into wanted from (select min(trim(value)) v from jsonb_array_elements_text(payload->'desired_skills') group by lower(trim(value))) a;
 if coalesce(cardinality(interests),0) not between 3 and 10 or cardinality(skills) not between 1 and 10 or cardinality(wanted)>10
 or exists(select 1 from unnest(interests||skills||wanted) v where v is null or char_length(v) not between 1 and 80)
 then raise exception 'Choose 3–10 interests and at least one skill; each label must be 1–80 characters.'; end if;
 if char_length(trim(coalesce(payload->>'display_name',''))) not between 2 and 60 or coalesce(payload->>'username','') !~ '^[a-z0-9_]{3,30}$'
 then raise exception 'Use a name of 2–60 characters and a username of 3–30 lowercase letters, numbers or underscores.'; end if;
 if coalesce(payload->>'intent','') not in ('Co-create content','Exchange feedback','Guest appearance','Accountability','Audience Share')
 or coalesce(payload->>'preferred_format','') not in ('Short video','Illustrated post','Podcast','Article','Interactive project')
 or coalesce(payload->>'availability','') not in ('This week','Next week','Flexible')
 or char_length(coalesce(payload->>'bio',''))>500 or char_length(coalesce(payload->>'creative_goal',''))>500 or char_length(coalesce(payload->>'creator_type',''))>60
 then raise exception 'Please check your profile choices.'; end if;
 update public.profiles set display_name=trim(payload->>'display_name'),username=payload->>'username',bio=coalesce(payload->>'bio',''),creator_type=payload->>'creator_type',creative_goal=coalesce(payload->>'creative_goal',''),
 interest_names=interests,skill_names=skills,desired_skills=wanted,intent=payload->>'intent',preferred_format=payload->>'preferred_format',availability=payload->>'availability',discoverable=coalesce((payload->>'discoverable')::boolean,true),is_onboarded=true,updated_at=now() where id=uid;
 if not was_onboarded then insert into public.product_events(user_id,event) values(uid,'onboarding_completed'); end if;
exception when unique_violation then raise exception 'That username is already in use. Please choose another.';
end; $$;

create function public.create_collaboration(recipient uuid, brief jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); result uuid;
begin
 if uid is null or recipient=uid or public.creators_blocked(uid,recipient) then raise exception 'This collaboration is unavailable.'; end if;
 -- Serialize pair mutations with profile/block operations, in deterministic order.
 perform 1 from public.profiles where id in(uid,recipient) order by id for update;
 if not exists(select 1 from public.profiles where id=uid and is_onboarded) or not exists(select 1 from public.profiles where id=recipient and discoverable and is_onboarded) or public.creators_blocked(uid,recipient)
 then raise exception 'Complete your profile and choose an available creator.'; end if;
 insert into public.collaborations(sender_id,recipient_id,title,idea,sender_role,recipient_role,next_step)
 values(uid,recipient,trim(brief->>'title'),trim(brief->>'idea'),trim(brief->>'sender_role'),trim(brief->>'recipient_role'),trim(brief->>'next_step')) returning id into result;
 insert into public.product_events(user_id,event,collaboration_id) values(uid,'request_sent',result); return result;
exception when unique_violation then raise exception 'You already have an open collaboration with this creator. Check your collaborations.';
end; $$;

create function public.change_collaboration(target uuid, action text) returns void language plpgsql security definer set search_path = '' as $$
declare c public.collaborations; uid uuid:=auth.uid(); new_status text;
begin
 select * into c from public.collaborations where id=target for update;
 if not found or not public.can_read_collaboration(target) then raise exception 'Collaboration unavailable.'; end if;
 if c.status='pending' and uid=c.recipient_id and action in('accept','decline') then new_status:=case action when 'accept' then 'accepted' else 'declined' end;
 elsif c.status='pending' and uid=c.sender_id and action='cancel' then new_status:='cancelled';
 elsif c.status='accepted' and action='complete' then
  if exists(select 1 from public.audience_plans where collaboration_id=target and (status='pending' or (status='accepted' and (sender_post_url is null or recipient_post_url is null)))) then raise exception 'Finish or cancel the active Audience Share plan before completing the collaboration.'; end if;
  new_status:='completed';
 else raise exception 'This action is not available for the current request.'; end if;
 update public.collaborations set status=new_status,updated_at=now() where id=target;
 if action in('accept','complete') then insert into public.product_events(user_id,event,collaboration_id) values(uid,case action when 'accept' then 'request_accepted' else 'collaboration_completed' end,target); end if;
end; $$;

create function public.send_collaboration_message(target uuid, message text) returns void language plpgsql security definer set search_path = '' as $$
declare c public.collaborations;
begin
 select * into c from public.collaborations where id=target for update;
 if not found or not public.can_read_collaboration(target) or c.status<>'accepted' then raise exception 'Messages open after both creators accept.'; end if;
 insert into public.collaboration_messages(collaboration_id,author_id,body) values(target,auth.uid(),trim(message));
end; $$;

create function public.block_creator(target uuid) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null or uid=target then raise exception 'Invalid block.'; end if;
 perform 1 from public.profiles where id in(uid,target) order by id for update;
 -- Lock requests before the block becomes visible to serialize acceptance/sharing.
 perform 1 from public.collaborations where (sender_id=uid and recipient_id=target) or (sender_id=target and recipient_id=uid) order by id for update;
 insert into public.creator_blocks(blocker_id,blocked_id) values(uid,target) on conflict do nothing;
 update public.collaborations set status='cancelled',updated_at=now() where status in('pending','accepted') and ((sender_id=uid and recipient_id=target) or (sender_id=target and recipient_id=uid));
end; $$;
create function public.unblock_creator(target uuid) returns void language plpgsql security definer set search_path = '' as $$
begin delete from public.creator_blocks where blocker_id=auth.uid() and blocked_id=target; end; $$;
create function public.report_creator(target uuid, reason text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to report.'; end if;
 insert into public.creator_reports(reporter_id,reported_id,reason) values(auth.uid(),target,trim(reason));
end; $$;

create function public.propose_audience_share(target uuid, plan jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare c public.collaborations; result uuid;
begin
 select * into c from public.collaborations where id=target for update;
 if not found or not public.can_read_collaboration(target) or c.status<>'accepted' then raise exception 'Audience Share opens inside an accepted collaboration.'; end if;
 if (plan->>'scheduled_for')::date<current_date or (plan->>'scheduled_for')::date>current_date+365 then raise exception 'Choose a date within the next year.'; end if;
 insert into public.audience_plans(collaboration_id,proposed_by,format,sender_channel,recipient_channel,sender_commitment,recipient_commitment,scheduled_for)
 values(target,auth.uid(),plan->>'format',trim(plan->>'sender_channel'),trim(plan->>'recipient_channel'),trim(plan->>'sender_commitment'),trim(plan->>'recipient_commitment'),(plan->>'scheduled_for')::date) returning id into result;
 insert into public.product_events(user_id,event,collaboration_id) values(auth.uid(),'audience_proposed',target); return result;
exception when unique_violation then raise exception 'An Audience Share plan already exists. Cancel or decline it before proposing a replacement.';
end; $$;
create function public.respond_audience_share(target uuid, action text) returns void language plpgsql security definer set search_path = '' as $$
declare p public.audience_plans; c public.collaborations; new_status text;
begin
 select * into p from public.audience_plans where id=target;
 select * into c from public.collaborations where id=p.collaboration_id for update;
 select * into p from public.audience_plans where id=target for update;
 if p.id is null or not public.can_read_collaboration(p.collaboration_id) or c.status<>'accepted' then raise exception 'Audience Share unavailable.'; end if;
 if p.status='pending' and p.proposed_by<>auth.uid() and action in('accept','decline') then new_status:=case action when 'accept' then 'accepted' else 'declined' end;
 elsif p.status in('pending','accepted') and action='cancel' then new_status:='cancelled';
 else raise exception 'Only the other creator can accept a pending plan.'; end if;
 update public.audience_plans set status=new_status,updated_at=now() where id=target;
 if action='accept' then insert into public.product_events(user_id,event,collaboration_id) values(auth.uid(),'audience_accepted',p.collaboration_id); end if;
end; $$;
create function public.record_audience_post(target uuid, post_url text) returns void language plpgsql security definer set search_path = '' as $$
declare p public.audience_plans; c public.collaborations; was_empty boolean;
begin
 select * into p from public.audience_plans where id=target;
 select * into c from public.collaborations where id=p.collaboration_id for update;
 select * into p from public.audience_plans where id=target for update;
 if p.id is null or not public.can_read_collaboration(p.collaboration_id) or c.status<>'accepted' or p.status<>'accepted' then raise exception 'Both creators must accept before recording a post.'; end if;
 if post_url is null or char_length(trim(post_url)) not between 10 and 2000 or trim(post_url) !~ '^https://[^/@[:space:]]+\.[^/@[:space:]]+(/[^[:space:]]*)?$' then raise exception 'Add a valid public HTTPS post link.'; end if;
 if auth.uid()=c.sender_id then
  was_empty:=p.sender_post_url is null; update public.audience_plans set sender_post_url=trim(post_url),updated_at=now() where id=target;
 else
  was_empty:=p.recipient_post_url is null; update public.audience_plans set recipient_post_url=trim(post_url),updated_at=now() where id=target;
 end if;
 if was_empty then insert into public.product_events(user_id,event,collaboration_id) values(auth.uid(),'audience_post_shared',p.collaboration_id); end if;
end; $$;
-- Events originate from successful server mutations, not arbitrary client telemetry.
-- Analytics are service-role only and split by the server-managed test flag.
create view public.creator_outcomes as select p.is_test,e.event,count(*) as total from public.product_events e join public.profiles p on p.id=e.user_id group by p.is_test,e.event;
revoke all on public.creator_outcomes from public,anon,authenticated;
grant select on public.creator_outcomes to service_role;

revoke all on function public.creators_blocked(uuid,uuid),public.can_read_collaboration(uuid),public.has_collaboration_with(uuid),public.save_creator_profile(jsonb),public.create_collaboration(uuid,jsonb),public.change_collaboration(uuid,text),public.send_collaboration_message(uuid,text),public.block_creator(uuid),public.unblock_creator(uuid),public.report_creator(uuid,text),public.propose_audience_share(uuid,jsonb),public.respond_audience_share(uuid,text),public.record_audience_post(uuid,text) from public,anon;
grant execute on function public.creators_blocked(uuid,uuid),public.can_read_collaboration(uuid),public.has_collaboration_with(uuid),public.save_creator_profile(jsonb),public.create_collaboration(uuid,jsonb),public.change_collaboration(uuid,text),public.send_collaboration_message(uuid,text),public.block_creator(uuid),public.unblock_creator(uuid),public.report_creator(uuid,text),public.propose_audience_share(uuid,jsonb),public.respond_audience_share(uuid,text),public.record_audience_post(uuid,text) to authenticated;
commit;
