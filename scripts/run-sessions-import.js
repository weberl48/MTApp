const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const partsDir = path.join(__dirname, '../supabase/sessions-parts');

async function main() {
  console.log('Supabase Sessions Import');
  console.log('========================\n');
  console.log(`URL: ${supabaseUrl}`);

  // Get list of SQL files in order
  const files = fs.readdirSync(partsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\nFound ${files.length} SQL files to run:`);
  files.forEach(f => console.log(`  - ${f}`));

  // Try using postgres connection string instead
  console.log('\n⚠️  Direct SQL execution requires database connection.');
  console.log('The Supabase JS client cannot run raw DDL/DML statements directly.');
  console.log('\nAlternatives:');
  console.log('1. Run each file manually in Supabase SQL Editor');
  console.log('2. Use psql with the database connection string');
  console.log('3. Use Supabase CLI: npx supabase db execute --file <file>');

  // Try to get database URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
  if (projectRef) {
    console.log(`\nDatabase connection string (get password from Supabase dashboard):`);
    console.log(`postgresql://postgres.[${projectRef}]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`);
  }
}

main().catch(console.error);
