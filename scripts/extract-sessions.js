const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../../May Creative Arts Session Tracker (Responses) (2).xlsx'));

// Session type mapping to service types (these need to exist in the database)
const sessionTypeMap = {
  'Group Session': { category: 'music_group', location: 'in_home', name: 'In-Home Group Music Therapy' },
  'In home music therapy': { category: 'music_individual', location: 'in_home', name: 'In-Home Individual Music Therapy' },
  'Matt\'s Music Individual session': { category: 'music_individual', location: 'matts_music', name: 'Matt\'s Music Individual' },
  'Musical Expressions': { category: 'music_individual', location: 'other', name: 'Musical Expressions' },
  'Creative Remedies': { category: 'art_individual', location: 'other', name: 'Creative Remedies (Art)' },
  'Scholarship': { category: 'music_individual', location: 'in_home', name: 'Scholarship Session' }
};

// Contractor name variations mapping
const contractorMap = {
  'Colleen': 'colleen@maycreativearts.com',
  'Jacob': 'jacob@maycreativearts.com',
  'Bryan': 'bryan@maycreativearts.com',
  'Caroline': 'caroline@maycreativearts.com',
  'Caroline West': 'caroline@maycreativearts.com',
  'Amara': 'amara@maycreativearts.com'
};

// Known session types to look for
const sessionTypes = [
  'Group Session',
  'In home music therapy',
  'Matt\'s Music Individual session',
  'Musical Expressions',
  'Creative Remedies',
  'Scholarship'
];

// Known contractors
const knownContractors = ['Colleen', 'Jacob', 'Bryan', 'Caroline West', 'Caroline', 'Amara'];

// Parse date from various formats
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Handle Excel serial dates
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
    const isoDate = date.toISOString().split('T')[0];
    // Validate the date
    if (isValidDate(isoDate)) return isoDate;
    return null;
  }

  const str = String(dateStr).trim();

  // Try MM/DD/YYYY or MM/DD/YY
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (match) {
    let [_, month, day, year] = match;
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    // Validate day and month
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
      return null;
    }
    const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    if (isValidDate(result)) return result;
    return null;
  }

  return null;
}

// Validate a date string is actually valid
function isValidDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Basic validation
  if (year < 2020 || year > 2030) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Check days in month
  const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month]) return false;
  return true;
}

// Extract client names from a string
function extractClientNames(str) {
  if (!str) return [];

  // Clean up the string
  let cleaned = String(str)
    .replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, '') // Remove dates
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split by common delimiters (comma, "and", multiple spaces)
  const parts = cleaned.split(/[,\s]+and\s+|,\s*|\s+and\s+|\s{2,}/i);

  // Further split any remaining compound names (e.g., "Tony Vernon Jo")
  const allNames = [];
  parts.forEach(p => {
    const trimmed = p.trim();
    // If it looks like multiple first names together (all caps words), split them
    if (trimmed.includes(' ') && !trimmed.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+$/)) {
      // Might be "Tony Vernon Jo" - split by space
      const words = trimmed.split(/\s+/);
      // Only split if words look like first names (capitalized, short)
      if (words.every(w => w.length < 15 && w.match(/^[A-Z]/))) {
        allNames.push(...words);
      } else {
        allNames.push(trimmed);
      }
    } else {
      allNames.push(trimmed);
    }
  });

  return allNames
    .map(p => p.trim())
    .filter(p => p.length > 1 && !p.match(/^\d+(\.\d+)?$/) && p.length < 30)
    .filter(p => !p.match(/^(the|and|or|with|for|at|in|on|to|a|an)$/i)); // Remove common words
}

// Collected sessions
const sessions = [];

// Process each sheet
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  rawData.forEach((row, rowIdx) => {
    if (!row || row.length === 0) return;

    const rowStr = row.join(' ');

    // Check for each session type
    sessionTypes.forEach(sessionType => {
      if (!rowStr.includes(sessionType)) return;

      // Found a session type - try to extract data
      let contractor = null;
      let sessionDate = null;
      let clientNames = [];
      let notes = '';

      // Find contractor
      for (const c of knownContractors) {
        if (rowStr.includes(c)) {
          contractor = c;
          break;
        }
      }

      // Find dates in the row
      const dates = [];
      row.forEach(cell => {
        const d = parseDate(cell);
        if (d) dates.push(d);

        // Also look for dates in text
        if (typeof cell === 'string') {
          const matches = cell.match(/(\d{1,2}\/\d{1,2}\/?\d{0,4})/g);
          if (matches) {
            matches.forEach(m => {
              const parsed = parseDate(m);
              if (parsed) dates.push(parsed);
            });
          }
        }
      });

      // Use the first valid date
      if (dates.length > 0) {
        // Filter to reasonable dates (2023-2024)
        const validDates = dates.filter(d => d >= '2023-01-01' && d <= '2025-12-31');
        if (validDates.length > 0) {
          sessionDate = validDates[0];
        }
      }

      // Extract client names (usually in column 2 or 6)
      if (row[2]) clientNames = extractClientNames(row[2]);
      if (clientNames.length === 0 && row[6]) clientNames = extractClientNames(row[6]);

      // Get notes from column 4 or 5
      if (row[4] && typeof row[4] === 'string' && row[4].length > 5) {
        notes = row[4].substring(0, 500);
      }

      // Only add if we have minimum required data
      if (sessionDate && contractor) {
        // Clean notes - escape quotes and remove newlines
        const cleanNotes = notes
          .replace(/'/g, "''")
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .substring(0, 200);

        // Deduplicate client names within this session
        const uniqueClients = [...new Set(clientNames.map(c => c.trim().toLowerCase()))]
          .map(c => clientNames.find(orig => orig.trim().toLowerCase() === c))
          .filter(c => c && c.length > 1);

        sessions.push({
          type: sessionType,
          date: sessionDate,
          contractor,
          clients: uniqueClients.length > 0 ? uniqueClients : ['Unknown'],
          notes: cleanNotes,
          isGroup: sessionType === 'Group Session' || uniqueClients.length > 1
        });
      }
    });
  });
});

// Deduplicate sessions (same date, contractor, type)
const uniqueSessions = [];
const seen = new Set();
sessions.forEach(s => {
  const key = `${s.date}-${s.contractor}-${s.type}-${s.clients.join(',')}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueSessions.push(s);
  }
});

console.log(`Found ${uniqueSessions.length} unique sessions`);

// Group by month for summary
const byMonth = {};
uniqueSessions.forEach(s => {
  const month = s.date.substring(0, 7);
  byMonth[month] = (byMonth[month] || 0) + 1;
});
console.log('\nSessions by month:');
Object.keys(byMonth).sort().forEach(m => console.log(`  ${m}: ${byMonth[m]}`));

// Group by contractor
const byContractor = {};
uniqueSessions.forEach(s => {
  byContractor[s.contractor] = (byContractor[s.contractor] || 0) + 1;
});
console.log('\nSessions by contractor:');
Object.keys(byContractor).forEach(c => console.log(`  ${c}: ${byContractor[c]}`));

// Group by type
const byType = {};
uniqueSessions.forEach(s => {
  byType[s.type] = (byType[s.type] || 0) + 1;
});
console.log('\nSessions by type:');
Object.keys(byType).forEach(t => console.log(`  ${t}: ${byType[t]}`));

// Generate SQL
let sql = `-- Historical Sessions Import
-- Generated from Excel data

-- Clean up any existing sessions from previous import attempts
DO $$
DECLARE
  org_id uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;

  -- Delete existing session_attendees and sessions
  DELETE FROM session_attendees WHERE session_id IN (SELECT id FROM sessions WHERE organization_id = org_id);
  DELETE FROM sessions WHERE organization_id = org_id;

  RAISE NOTICE 'Cleared existing sessions for org: %', org_id;
END $$;

-- First, ensure service types exist
DO $$
DECLARE
  org_id uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;

  -- Insert service types if they don't exist (check by name)
  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'In-Home Individual Music Therapy', 'music_individual', 'in_home', 50, 0, 23, 0, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'In-Home Group Music Therapy', 'music_group', 'in_home', 50, 20, 30, 0, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'Matt''s Music Individual' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'Matt''s Music Individual', 'music_individual', 'matts_music', 55, 0, 30, 10, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'Musical Expressions', 'music_individual', 'other', 50, 0, 23, 0, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'Creative Remedies (Art)' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'Creative Remedies (Art)', 'art_individual', 'other', 40, 0, 20, 0, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'Scholarship Session', 'music_individual', 'in_home', 50, 0, 0, 0, org_id);
  END IF;
END $$;

-- Insert sessions
`;

uniqueSessions.forEach((s, idx) => {
  const contractorEmail = contractorMap[s.contractor] || contractorMap[s.contractor.split(' ')[0]];
  const serviceTypeName = sessionTypeMap[s.type]?.name || 'In-Home Individual Music Therapy';
  const duration = 30; // Default duration
  const status = 'approved'; // Historical sessions are approved

  sql += `
-- Session ${idx + 1}: ${s.date} - ${s.contractor} - ${s.type}
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = '${contractorEmail}' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = '${serviceTypeName}' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '${s.date}', ${duration}, service_type_uuid, contractor_uuid, '${status}', '${s.notes}', org_id)
    RETURNING id INTO session_uuid;

`;

  // Add attendees (deduplicated)
  const seenClients = new Set();
  s.clients.forEach((client, cidx) => {
    const safeClient = client.replace(/'/g, "''").trim();
    const clientKey = safeClient.toLowerCase();
    if (safeClient.length > 1 && !seenClients.has(clientKey)) {
      seenClients.add(clientKey);
      sql += `    -- Attendee: ${safeClient}
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%${safeClient}%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
`;
    }
  });

  sql += `  END IF;
END $$;
`;
});

sql += `
-- Verify the data
SELECT 'Sessions' as table_name, COUNT(*) as count FROM sessions WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
UNION ALL
SELECT 'Session Attendees', COUNT(*) FROM session_attendees sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE s.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');
`;

// Write the SQL file
const outputPath = path.join(__dirname, '../supabase/seed-sessions.sql');
fs.writeFileSync(outputPath, sql);

console.log(`\nSQL file generated: ${outputPath}`);
console.log(`\nSample sessions:`);
uniqueSessions.slice(0, 5).forEach(s => {
  console.log(`  ${s.date} | ${s.contractor} | ${s.type} | Clients: ${s.clients.join(', ')}`);
});
