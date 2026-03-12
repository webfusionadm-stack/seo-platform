import { prisma } from './src/config/database.js';

async function main() {
  const sites = await prisma.site.findMany({ select: { id: true, name: true } });
  console.log('Sites:', JSON.stringify(sites));
  process.exit(0);
}

main();
