const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual .env parsing
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim().replace(/["']/g, '') : '';
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const targetEmail = 'paulsimon112@gmail.com';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Supabase environment variables missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function promote() {
  console.log(`Searching for user: ${targetEmail}...`);
  
  // 1. Get user by email
  // First try admin list
  let targetUserId = null;
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (!listError) {
    const user = listData.users.find(u => u.email === targetEmail);
    if (user) targetUserId = user.id;
  } else {
    console.warn('Admin listUsers failed, trying fallback via shops table...', listError.message);
  }

  // Fallback: search in shops table
  if (!targetUserId) {
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('owner_id')
      .ilike('name', '%Hallo Döner%')
      .limit(1);
    
    if (shops && shops[0]) {
      targetUserId = shops[0].owner_id;
      console.log(`Found owner_id from shops table: ${targetUserId}`);
    }
  }

  if (!targetUserId) {
    console.error(`Could not find user ID for ${targetEmail}.`);
    return;
  }

  console.log(`Promoting user ${targetUserId} to super_admin...`);

  // 2. Set role in app_metadata (secure, not editable by user)
  const { data, error } = await supabase.auth.admin.updateUserById(
    targetUserId,
    { app_metadata: { role: 'super_admin' } }
  );

  if (error) {
    console.error('Error updating user:', error.message);
  } else {
    console.log('Successfully promoted user to super_admin!');
    console.log('App Metadata:', data.user.app_metadata);
  }
}

promote();
