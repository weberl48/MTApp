const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ysmwowzxkgisshaormmf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXdvd3p4a2dpc3NoYW9ybW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA0NTcyMywiZXhwIjoyMDgwNjIxNzIzfQ.BixYcNO-X1t5vUMJSFL7Jk6a1xUwB6SSzySAAPIJZ_0'
);

async function testSignupWithOrgId() {
  // Test with an existing org ID (joining, not creating)
  const testEmail = 'jointest-' + Date.now() + '@test.com';

  console.log('Testing JOIN ORG signup with email:', testEmail);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'testPassword123!',
    email_confirm: true,
    user_metadata: {
      name: 'Test User',
      organization_id: 'a0000000-0000-0000-0000-000000000001' // May Creative Arts org
    }
  });

  console.log('\n=== AUTH CREATE RESULT ===');
  if (authError) {
    console.log('Auth Error:', JSON.stringify(authError, null, 2));
  } else {
    console.log('Success! User created:', authUser.user?.id, authUser.user?.email);

    // Check if public.users was created
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    console.log('\n=== PUBLIC.USERS CHECK ===');
    if (publicError) {
      console.log('Public user NOT created! Error:', publicError);
    } else {
      console.log('Public user created:', publicUser);
    }

    // Cleanup
    console.log('\nCleaning up test user...');
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.from('users').delete().eq('id', authUser.user.id);
    console.log('Test user deleted');
  }
}

testSignupWithOrgId();
