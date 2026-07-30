-- Allow AI-helper questions in the help-events gap-detection table.
alter table help_events drop constraint help_events_event_type_check;
alter table help_events add constraint help_events_event_type_check
  check (event_type in ('search_miss', 'article_feedback', 'ai_question'));
alter table help_events drop constraint help_events_shape;
alter table help_events add constraint help_events_shape check (
  (event_type = 'search_miss' and query is not null)
  or (event_type = 'article_feedback' and article_slug is not null and helpful is not null)
  or (event_type = 'ai_question' and query is not null)
);
