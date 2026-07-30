-- Help Center gap detection: search misses + article feedback.
-- Write path: authenticated users log events for their own org (fire-and-forget
-- from the help pages). Read path: owner/admin/developer only, own org.
create table if not exists help_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  event_type text not null check (event_type in ('search_miss', 'article_feedback')),
  query text,
  article_slug text,
  helpful boolean,
  created_at timestamptz not null default now(),
  constraint help_events_shape check (
    (event_type = 'search_miss' and query is not null)
    or (event_type = 'article_feedback' and article_slug is not null and helpful is not null)
  )
);

create index if not exists help_events_org_created_idx
  on help_events (organization_id, created_at desc);

alter table help_events enable row level security;

create policy "Users insert help events for own org" on help_events
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and organization_id in (select organization_id from users where id = auth.uid())
  );

create policy "Admins read own-org help events" on help_events
  for select to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.organization_id = help_events.organization_id
        and u.role in ('owner', 'admin', 'developer')
    )
  );
