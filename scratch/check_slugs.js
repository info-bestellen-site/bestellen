const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual .env parsing
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/["']/g, '');
const supabaseKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/["']/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('shops').select('slug');
  if (error) {
    console.error('Error fetching shops:', error);
    return;
  }
  console.log('Existing slugs:', data.map(s => s.slug));
}

check();
