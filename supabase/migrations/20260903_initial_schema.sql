-- TrueSignal — Initial Database Schema

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text default '',
  avatar_url text,
  creator_type text,
  creative_goal text,
  is_onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text not null,
  created_at timestamptz default now()
);

create table public.user_interests (
  user_id uuid references public.profiles(id) on delete cascade,
  interest_id uuid references public.interests(id) on delete cascade,
  strength integer default 1 check (strength between 1 and 5),
  primary key (user_id, interest_id)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text,
  created_at timestamptz default now()
);

create table public.user_skills (
  user_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  level integer default 1 check (level between 1 and 5),
  primary key (user_id, skill_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'creator_' || substring(new.id::text from 1 for 8),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New Creator')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;

create policy "Authenticated users can view profiles"
on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Authenticated users can view interests"
on public.interests for select to authenticated using (true);

create policy "Authenticated users can view skills"
on public.skills for select to authenticated using (true);

create policy "Authenticated users can view user interests"
on public.user_interests for select to authenticated using (true);

create policy "Users can add own interests"
on public.user_interests for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own interests"
on public.user_interests for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove own interests"
on public.user_interests for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Authenticated users can view user skills"
on public.user_skills for select to authenticated using (true);

create policy "Users can add own skills"
on public.user_skills for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own skills"
on public.user_skills for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove own skills"
on public.user_skills for delete to authenticated
using ((select auth.uid()) = user_id);

insert into public.interests (name, category) values
('Artificial Intelligence', 'Technology'),
('Machine Learning', 'Technology'),
('Computer Vision', 'Technology'),
('Robotics', 'Technology'),
('Cybersecurity', 'Technology'),
('Web Development', 'Technology'),
('App Development', 'Technology'),
('Open Source', 'Technology'),
('Game Development', 'Technology'),
('Creative Coding', 'Technology'),
('UI/UX Design', 'Design'),
('Graphic Design', 'Design'),
('Product Design', 'Design'),
('3D Design', 'Design'),
('Animation', 'Design'),
('Illustration', 'Art'),
('Digital Art', 'Art'),
('Photography', 'Art'),
('Filmmaking', 'Art'),
('Writing', 'Writing'),
('Storytelling', 'Writing'),
('Poetry', 'Writing'),
('Blogging', 'Writing'),
('Music Production', 'Music'),
('Songwriting', 'Music'),
('Sound Design', 'Music'),
('Startups', 'Entrepreneurship'),
('Entrepreneurship', 'Entrepreneurship'),
('Product Building', 'Entrepreneurship'),
('Creator Economy', 'Entrepreneurship'),
('Science', 'Science'),
('Space', 'Science'),
('Psychology', 'Science'),
('3D Printing', 'Making'),
('Hardware', 'Making'),
('DIY', 'Making');

insert into public.skills (name, category) values
('Python', 'Development'),
('JavaScript', 'Development'),
('TypeScript', 'Development'),
('React', 'Development'),
('React Native', 'Development'),
('Machine Learning', 'AI'),
('Computer Vision', 'AI'),
('Prompt Engineering', 'AI'),
('UI Design', 'Design'),
('UX Research', 'Design'),
('Figma', 'Design'),
('Illustration', 'Creative'),
('Animation', 'Creative'),
('Video Editing', 'Creative'),
('Photography', 'Creative'),
('Writing', 'Creative'),
('Storytelling', 'Creative'),
('Music Production', 'Creative'),
('3D Modelling', 'Creative'),
('Product Strategy', 'Business');
