const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../supabase/seed-sessions.sql');
const outputDir = path.join(__dirname, '../supabase/sessions-parts');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const content = fs.readFileSync(inputFile, 'utf8');

// Split by "-- Session" comments
const parts = content.split(/(?=-- Session \d+:)/);

// First part contains cleanup and service types setup
const setupPart = parts[0];
fs.writeFileSync(path.join(outputDir, '00-setup.sql'), setupPart);
console.log('Created: 00-setup.sql');

// Split sessions into chunks of ~100 sessions each
const sessionsPerChunk = 100;
let chunkNum = 1;
let currentChunk = [];

for (let i = 1; i < parts.length; i++) {
  currentChunk.push(parts[i]);

  if (currentChunk.length >= sessionsPerChunk || i === parts.length - 1) {
    const chunkContent = currentChunk.join('\n');
    const filename = `${String(chunkNum).padStart(2, '0')}-sessions.sql`;
    fs.writeFileSync(path.join(outputDir, filename), chunkContent);
    console.log(`Created: ${filename} (${currentChunk.length} sessions)`);
    currentChunk = [];
    chunkNum++;
  }
}

// Add verification query to the last file
const verifySQL = `
-- Verify the data
SELECT 'Sessions' as table_name, COUNT(*) as count FROM sessions WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
UNION ALL
SELECT 'Session Attendees', COUNT(*) FROM session_attendees sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE s.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');
`;

fs.writeFileSync(path.join(outputDir, '99-verify.sql'), verifySQL);
console.log('Created: 99-verify.sql');

console.log(`\nSplit into ${chunkNum} chunk files in: ${outputDir}`);
console.log('\nRun these files in order (00, 01, 02, ..., 99) in Supabase SQL Editor');
