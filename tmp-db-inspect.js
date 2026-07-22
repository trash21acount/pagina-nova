const Database = require('better-sqlite3');
const db = new Database('dev.db', { readonly: true });
const row = db.prepare('SELECT username, displayName, passwordHash, role, status FROM "User" WHERE username = ?').get('luiz');
console.log(row);
db.close();
