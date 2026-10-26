import 'dotenv/config';
import {prisma} from '../prismaClient.js';
import {isUsingNeonPoolerInEnv} from '../lib/databaseUrl.js';
import {xaiConfigured} from '../lib/xaiClient.js';
import {
  indexAmenityRule,
  indexBuildingDocument,
} from '../services/knowledgeService.js';

if (isUsingNeonPoolerInEnv()) {
  console.log(
    '(Neon) DATABASE_URL usa pooler; Prisma usará el host directo (sin -pooler) automáticamente.',
  );
}

async function main() {
  if (!xaiConfigured()) {
    throw new Error('XAI_API_KEY is required to reindex knowledge embeddings');
  }

  const amenities = await prisma.buildingAmenity.findMany({
    where: {rules: {not: null}},
    select: {id: true, rules: true},
  });
  const amenityIds = amenities
    .filter(row => Boolean(row.rules?.trim()))
    .map(row => row.id);

  const documents = await prisma.buildingDocument.findMany({
    where: {kind: {in: ['BYLAW', 'NOTICE']}},
    select: {id: true},
  });

  console.log(
    `Reindexing ${amenityIds.length} amenity rule(s) and ${documents.length} document(s)…`,
  );

  let amenityOk = 0;
  let amenityFail = 0;
  for (const id of amenityIds) {
    try {
      await indexAmenityRule(id);
      amenityOk += 1;
      console.log(`  amenity ${id} ok`);
    } catch (err) {
      amenityFail += 1;
      console.error(`  amenity ${id} failed`, err);
    }
  }

  let documentOk = 0;
  let documentFail = 0;
  for (const doc of documents) {
    try {
      await indexBuildingDocument(doc.id);
      documentOk += 1;
      console.log(`  document ${doc.id} ok`);
    } catch (err) {
      documentFail += 1;
      console.error(`  document ${doc.id} failed`, err);
    }
  }

  console.log(
    `Done. amenities ${amenityOk}/${amenityIds.length}, documents ${documentOk}/${documents.length}` +
      (amenityFail || documentFail
        ? ` (failures: amenities=${amenityFail}, documents=${documentFail})`
        : ''),
  );

  if (amenityFail || documentFail) {
    process.exitCode = 1;
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
