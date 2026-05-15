import { GraphDatabaseClient } from './4_memgraph/index.js';
import fs from 'fs';
import path from 'path';

async function runIncrementalHydration() {
  const startTime = Date.now();
  
  const eventFilePath = process.argv[2];
  if (!eventFilePath || !fs.existsSync(eventFilePath)) {
    console.error('❌ ERROR: Must provide a valid event JSON file path.');
    process.exit(1);
  }

  console.log(`\n=================================================`);
  console.log(`💧 INITIATING INCREMENTAL HYDRATION`);
  console.log(`Event File: ${eventFilePath}`);
  console.log(`=================================================\n`);

  let eventData;
  try {
    eventData = JSON.parse(fs.readFileSync(eventFilePath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed to parse event JSON`, e);
    process.exit(1);
  }

  const graphDb = new GraphDatabaseClient();
  await graphDb.initializeSchema();

  try {
    // 1. Create Event Node
    console.log(`[Incremental] Upserting Event Node: ${eventData.event_id}`);
    const queryEvent = `
      MERGE (e:Event {id: $id})
      SET e.title = $title,
          e.type = $type,
          e.severity = $severity,
          e.timestamp = $timestamp,
          e.root_cause = $root_cause
      RETURN e
    `;
    await graphDb.runQuery(queryEvent, {
      id: eventData.event_id,
      title: eventData.title || '',
      type: eventData.type || 'UNKNOWN',
      severity: eventData.severity || '0.1',
      timestamp: eventData.timestamp || new Date().toISOString(),
      root_cause: eventData.root_cause || ''
    });

    // 2. Link Domains
    if (eventData.affected_domains && Array.isArray(eventData.affected_domains)) {
      for (const domain of eventData.affected_domains) {
        console.log(`[Incremental] Linking Domain: ${domain}`);
        const queryDomain = `
          MERGE (d:Domain {id: $domain})
          MERGE (e:Event {id: $eventId})
          MERGE (e)-[:IMPACTS]->(d)
        `;
        await graphDb.runQuery(queryDomain, {
          domain,
          eventId: eventData.event_id
        });
      }
    }

    // 3. Link Files
    if (eventData.affected_files && Array.isArray(eventData.affected_files)) {
      for (const file of eventData.affected_files) {
        console.log(`[Incremental] Linking File: ${file}`);
        const queryFile = `
          MERGE (f:File {id: $file})
          MERGE (e:Event {id: $eventId})
          MERGE (e)-[:MODIFIES]->(f)
        `;
        await graphDb.runQuery(queryFile, {
          file,
          eventId: eventData.event_id
        });
      }
    }

    // 4. Causal Chain (Caused By)
    if (eventData.caused_by && Array.isArray(eventData.caused_by)) {
      for (const causeId of eventData.caused_by) {
        console.log(`[Incremental] Linking Cause: ${causeId}`);
        const queryCause = `
          MERGE (e1:Event {id: $eventId})
          MERGE (e2:Event {id: $causeId})
          MERGE (e1)-[:CAUSED_BY]->(e2)
        `;
        await graphDb.runQuery(queryCause, {
          eventId: eventData.event_id,
          causeId
        });
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`\n✅ Incremental Hydration Complete for ${eventData.event_id}`);
    
    // Meta-Governance Log
    const metaLog = {
      actor: "post-task-hook",
      action: "incremental_hydrate",
      inputs: [eventFilePath],
      outputs: [`EventNode:${eventData.event_id}`],
      duration_ms: durationMs,
      success: true
    };
    console.log(`\n[META-GOVERNANCE] Trace generated:`);
    console.log(JSON.stringify(metaLog, null, 2));

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`❌ Graph operations failed:`, error);
    
    // Meta-Governance Log (Failure)
    const metaLog = {
      actor: "post-task-hook",
      action: "incremental_hydrate",
      inputs: [eventFilePath],
      outputs: [],
      duration_ms: durationMs,
      success: false,
      error: String(error)
    };
    console.log(`\n[META-GOVERNANCE] Trace generated (FAILED):`);
    console.log(JSON.stringify(metaLog, null, 2));
    
  } finally {
    await graphDb.close();
  }
}

runIncrementalHydration().catch(console.error);
