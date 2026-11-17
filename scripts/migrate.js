const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const candidates = [
  // Direct connection
  {
    host: 'db.ulrrjbsjcssxwdjivrzc.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'cX0g8umNdaSCSLC5',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  // Pooler ap-south-1 (Mumbai, India)
  {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ulrrjbsjcssxwdjivrzc',
    password: 'cX0g8umNdaSCSLC5',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  // Pooler us-east-1
  {
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ulrrjbsjcssxwdjivrzc',
    password: 'cX0g8umNdaSCSLC5',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  // Pooler eu-central-1
  {
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ulrrjbsjcssxwdjivrzc',
    password: 'cX0g8umNdaSCSLC5',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  // Pooler ap-southeast-1 (Singapore)
  {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ulrrjbsjcssxwdjivrzc',
    password: 'cX0g8umNdaSCSLC5',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  }
];

async function run() {
  let client = null;
  let connectedConfig = null;

  for (const config of candidates) {
    try {
      console.log(`Attempting connection to ${config.host}:${config.port}...`);
      const testClient = new Client({ ...config, connectionTimeoutMillis: 7000 });
      await testClient.connect();
      console.log(`Connected successfully to ${config.host}!`);
      client = testClient;
      connectedConfig = config;
      break;
    } catch (err) {
      console.log(`Failed on ${config.host}: ${err.message}`);
    }
  }

  if (!client) {
    console.error('Could not connect to any Supabase Postgres endpoint.');
    process.exit(1);
  }

  const migrations = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_quiz_rpc_functions.sql',
    'supabase/migrations/003_seed_amr_data.sql'
  ];

  for (const mig of migrations) {
    const fullPath = path.join(__dirname, '..', mig);
    console.log(`Running migration: ${mig}...`);
    const sql = fs.readFileSync(fullPath, 'utf8');
    try {
      await client.query(sql);
      console.log(`✓ Migration ${mig} applied successfully.`);
    } catch (migErr) {
      console.error(`Error applying ${mig}:`, migErr.message);
    }
  }

  // Verify questions count
  const res = await client.query('SELECT count(*) FROM question_bank;');
  console.log(`Total questions in question_bank: ${res.rows[0].count}`);

  const compRes = await client.query('SELECT title, status FROM competitions LIMIT 1;');
  console.log(`Active competition:`, compRes.rows[0]);

  await client.end();
  console.log('Database migration complete!');
}

run();
