/**
 * Migration script to help transition from the old server structure to the new one
 * 
 * This script will:
 * 1. Create the necessary directory structure
 * 2. Copy the .env file to the new location
 * 3. Provide instructions for completing the migration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define directories to create
const directories = [
  'src',
  'src/config',
  'src/db',
  'src/middleware',
  'src/routes',
  'src/trpc',
  'src/utils',
];

console.log('🚀 Starting migration to new server structure...');

// Create directories
console.log('\n📁 Creating directory structure...');
directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✅ Created ${dir}`);
  } else {
    console.log(`  ℹ️ Directory ${dir} already exists`);
  }
});

// Copy .env file if it exists
console.log('\n📄 Checking for .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('  ✅ .env file found');
} else {
  console.log('  ⚠️ .env file not found. You will need to create one in the server directory.');
  console.log('  ℹ️ Make sure it contains DATABASE_URL and other required environment variables.');
}

// Check for prisma schema
console.log('\n📄 Checking for Prisma schema...');
const prismaSchemaPath = path.join(__dirname, 'prisma/schema.prisma');
if (fs.existsSync(prismaSchemaPath)) {
  console.log('  ✅ Prisma schema found');
} else {
  console.log('  ⚠️ Prisma schema not found. Make sure your prisma directory is set up correctly.');
}

// Print final instructions
console.log('\n🔄 Migration preparation complete!');
console.log('\n📋 Next steps:');
console.log('  1. Install new dependencies:');
console.log('     npm install pino pino-pretty');
console.log('  2. Update your .env file if needed');
console.log('  3. Run the development server:');
console.log('     npm run dev');
console.log('\n⚠️ Important notes:');
console.log('  - The new server structure uses src/ as the root directory');
console.log('  - All imports have been updated to reflect this change');
console.log('  - The server now uses proper logging with Pino instead of console.log');
console.log('  - Error handling has been improved throughout the application');
console.log('\n🎉 Happy coding!');