import 'dotenv/config';
import { closeMongo, connectMongo, healthCheck, seedMongoData } from './mongo.js';

const force = process.argv.includes('--force');

await connectMongo();
const result = await seedMongoData(force);
const health = await healthCheck();

console.log('\nSeed result:', result);
console.log('Health:', JSON.stringify(health, null, 2));

await closeMongo();
process.exit(0);
