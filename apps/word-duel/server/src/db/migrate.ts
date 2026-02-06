// Database migration script
import { initDatabase, closeDatabase } from './index';

console.log('Running database migration...');
initDatabase();
console.log('Migration complete!');
closeDatabase();
