
-- Verify the data
SELECT 'Sessions' as table_name, COUNT(*) as count FROM sessions WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
UNION ALL
SELECT 'Session Attendees', COUNT(*) FROM session_attendees sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE s.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');
