const path = require('path');
const fs = require('fs');

// Known contractors from the data
const contractors = [
  { name: 'Colleen O\'Brien', email: 'colleen@maycreativearts.com' },
  { name: 'Jacob Weber', email: 'jacob@maycreativearts.com' },
  { name: 'Bryan Palmer', email: 'bryan@maycreativearts.com' },
  { name: 'Caroline West', email: 'caroline@maycreativearts.com' },
  { name: 'Amara Johnson', email: 'amara@maycreativearts.com' }
];

// Extract all potential client names from Table 40 (the largest table with most data)
const clientSet = new Set();

// Manual curation of clear individual client names found in the data
const individualClients = [
  'Anthony', 'Bentley', 'Brendan O\'Connell', 'Claire Syracuse', 'Dan',
  'Devon', 'Eric', 'Ethan', 'Faith', 'Ikenna', 'Jessica', 'Josiah',
  'Julie', 'Karen', 'Lexi', 'Linda', 'Lizzie', 'Madisyn', 'Nicolas',
  'Rachel', 'Sylvia', 'Zack', 'Austin', 'Ayub', 'Tyler', 'Olivia',
  'Matt', 'Bryce', 'Emma', 'Devyn', 'Joseph', 'Weston', 'Lincoln',
  'Kristin', 'Harold McCown', 'Janet', 'Sandy Baker', 'Derek',
  'Courtney Jordan', 'David Harrington', 'Elijah Siever', 'Aden Finkas',
  'Maeve Hathaway', 'Molly Hathaway', 'Lizziey Hauser', 'Arnold Cook',
  'Bryan Palmer', 'Gianna', 'Vic', 'Angie', 'Cindy', 'Jeanie', 'Jordan',
  'Mikey', 'Nick', 'Hope', 'Pam', 'Tom', 'Francis', 'Michael', 'John',
  'Liz', 'Nancy', 'Gretchen', 'Thatius', 'James', 'Bernie', 'DJ',
  'Vernon', 'Tony', 'Jimmy', 'Hillary', 'Patty', 'Laurie', 'Vicky',
  'Brittany', 'Kobe', 'Caleb', 'Annie', 'Kayla', 'Owen', 'Mark',
  'Shannon', 'Michelle', 'Emily', 'Tajwar', 'Tasheen'
];

// Deduplicate and clean
individualClients.forEach(name => {
  if (name && name.length > 1) {
    clientSet.add(name.trim());
  }
});

const clients = [...clientSet].sort().map((name, idx) => ({
  name,
  email: `client${idx + 1}@example.com`,
  phone: `716-555-${String(1000 + idx).slice(-4)}`
}));

console.log(`Found ${contractors.length} contractors`);
console.log(`Found ${clients.length} unique clients`);

// Generate SQL
let sql = `-- Database Seed Script for May Creative Arts
-- Generated from Excel data
-- Run this in Supabase SQL Editor

-- First, get the organization ID (assuming single org setup)
DO $$
DECLARE
  org_id uuid;
  owner_id uuid;
BEGIN
  -- Get or create the organization
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;

  IF org_id IS NULL THEN
    INSERT INTO organizations (name, slug, settings)
    VALUES ('May Creative Arts', 'may-creative-arts', '{}')
    RETURNING id INTO org_id;
  END IF;

  -- Get the owner user (first admin/owner in the org)
  SELECT id INTO owner_id FROM users
  WHERE organization_id = org_id AND role IN ('owner', 'developer')
  LIMIT 1;

  -- Delete existing data (in correct order due to foreign keys)
  DELETE FROM session_attendees WHERE session_id IN (SELECT id FROM sessions WHERE organization_id = org_id);
  DELETE FROM invoices WHERE organization_id = org_id;
  DELETE FROM sessions WHERE organization_id = org_id;
  DELETE FROM clients WHERE organization_id = org_id;
  -- Don't delete users - we'll update existing contractors or create new ones

  RAISE NOTICE 'Cleared existing data for org: %', org_id;

END $$;

-- Insert/Update Contractors
`;

contractors.forEach((c, idx) => {
  const safeName = c.name.replace(/'/g, "''");
  sql += `
-- Contractor: ${c.name}
INSERT INTO users (id, email, name, role, organization_id)
SELECT
  gen_random_uuid(),
  '${c.email}',
  '${safeName}',
  'contractor',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = '${c.email}'
);
`;
});

sql += `

-- Insert Clients
`;

clients.forEach((c, idx) => {
  // Escape single quotes in names
  const safeName = c.name.replace(/'/g, "''");
  sql += `
INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  '${safeName}',
  '${c.email}',
  '${c.phone}',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);
`;
});

sql += `

-- Verify the data
SELECT 'Users' as table_name, COUNT(*) as count FROM users WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');
`;

// Write the SQL file
const outputPath = path.join(__dirname, '../supabase/seed-data.sql');
fs.writeFileSync(outputPath, sql);

console.log(`\nSQL file generated: ${outputPath}`);
console.log('\nContractors:');
contractors.forEach(c => console.log(`  - ${c.name} (${c.email})`));
console.log('\nClients (first 20):');
clients.slice(0, 20).forEach(c => console.log(`  - ${c.name}`));
console.log(`  ... and ${clients.length - 20} more`);
