import { runQuery, getQuery } from './db.js';

const targetUsername = process.argv[2] || 'admin';

async function seedAdmin() {
  console.log(`Searching for user: "${targetUsername}"...`);

  // Wait 1 sec for DB to initialize tables if running directly
  await new Promise(r => setTimeout(r, 1000));

  const user = await getQuery('SELECT id, username, role FROM users WHERE username = ?', [targetUsername]);

  if (!user) {
    console.error(`User "${targetUsername}" not found in database.`);
    console.log('Available users:');
    const allUsers = await getQuery('SELECT GROUP_CONCAT(username) as names FROM users');
    console.log(allUsers?.names || 'None');
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`User "${targetUsername}" is already an admin.`);
    process.exit(0);
  }

  await runQuery('UPDATE users SET role = "admin" WHERE id = ?', [user.id]);
  console.log(`SUCCESS: User "${targetUsername}" (ID: ${user.id}) has been promoted to ADMIN!`);
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
