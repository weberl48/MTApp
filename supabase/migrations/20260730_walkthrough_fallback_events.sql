-- Walkthrough fallback telemetry: a guided-tour step whose target element
-- couldn't be found (UI drift, permissions, empty list) logs a help_events row
-- (article_slug = walkthrough id, query = step title) so broken tours surface
-- on the Help gaps card instead of failing silently.
--
-- Apply by hand: dev (gzrukevymmguqxuoynqk) first, verify, then prod.

alter table help_events drop constraint help_events_event_type_check;
alter table help_events add constraint help_events_event_type_check
  check (event_type in ('search_miss', 'article_feedback', 'walkthrough_fallback'));

alter table help_events drop constraint help_events_shape;
alter table help_events add constraint help_events_shape check (
  (event_type = 'search_miss' and query is not null)
  or (event_type = 'article_feedback' and article_slug is not null and helpful is not null)
  or (event_type = 'walkthrough_fallback' and article_slug is not null and query is not null)
);
