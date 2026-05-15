import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..'); // Resolves to E:\weP-APP-main
const APP_ROOT = path.resolve(WORKSPACE_ROOT, 'app');

function runGitCommand(cmd: string): string[] {
  try {
    const output = execSync(cmd, { cwd: APP_ROOT, encoding: 'utf-8' });
    return output.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  } catch (error) {
    return [];
  }
}

function getLatestEventFile(): string | null {
  const date = new Date();
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  
  const todayDir = path.join(WORKSPACE_ROOT, 'events', year, month, day);
  
  if (!fs.existsSync(todayDir)) return null;
  
  const files = fs.readdirSync(todayDir)
    .filter(f => f.endsWith('.json'))
    .sort() // Sort alphabetically, which orders by NNN-slug
    .reverse(); // Newest first
    
  if (files.length === 0) return null;
  
  return path.join(todayDir, files[0]);
}

function validateEventSchema(event: any, isCriticalDomain: boolean): string[] {
  const errors: string[] = [];
  
  // 1. Basic Required Fields
  const requiredFields = ['why', 'root_cause', 'blast_radius', 'prevention'];
  for (const field of requiredFields) {
    const val = event[field];
    if (!val) {
      errors.push(`Missing required field: '${field}'`);
    } else if (typeof val === 'string' && val.length < 15) {
      errors.push(`Field '${field}' is too short (must be >= 15 chars).`);
    }
  }

  // 2. Blast Radius Enforcement
  if (isCriticalDomain && (!event.blast_radius || event.blast_radius.length === 0)) {
    errors.push(`Critical domains (finance/inventory/orders) CANNOT have empty 'blast_radius'.`);
  } else if (!event.blast_radius || event.blast_radius.length === 0) {
    errors.push(`Field 'blast_radius' array cannot be empty. Every change has some impact.`);
  }

  // 3. Causal Structure Validation (Semantic Memory)
  const whyText = (event.why || '').toLowerCase();
  const causalKeywords = ['because', 'caused by', 'resulted in', 'triggered by', 'prevented by', 'due to', 'bởi vì', 'nguyên nhân'];
  
  const hasCausalLogic = causalKeywords.some(kw => whyText.includes(kw));
  if (!hasCausalLogic) {
    errors.push(`Semantic Validation Failed: 'why' field lacks causal vocabulary (e.g. 'because', 'caused by'). Memory must explain mechanism, not just state facts.`);
  }
  
  return errors;
}

function runValidation() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║ 🛡️  GEP GOVERNANCE: PRE-COMMIT VALIDATION ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. Get staged files
  const stagedFiles = runGitCommand('git diff --cached --name-only');
  if (stagedFiles.length === 0) {
    console.log('✅ No files staged for commit. Passing.');
    process.exit(0);
  }

  // 2. Find latest event
  const latestEventPath = getLatestEventFile();
  if (!latestEventPath) {
    console.error('❌ FATAL: No event JSON found for today.');
    console.error('   Please run `npm run post-task` before committing to sync memory.');
    process.exit(1);
  }

  // Check event timestamp against recent modifications
  // We expect the event to be created recently, but for now we just check today's latest.
  let eventData;
  try {
    eventData = JSON.parse(fs.readFileSync(latestEventPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ FATAL: Could not parse event JSON at ${latestEventPath}`);
    process.exit(1);
  }

  console.log(`🔍 Validating Memory Event: ${eventData.event_id}`);

  // Determine Critical Domains
  const isCriticalDomainModified = stagedFiles.some(f => {
    const lower = f.toLowerCase();
    return lower.includes('finance') || lower.includes('inventory') || lower.includes('order');
  });

  // 3. Validate Event Schema
  const schemaErrors = validateEventSchema(eventData, isCriticalDomainModified);
  if (schemaErrors.length > 0) {
    console.error('❌ FATAL: Event schema validation failed:');
    schemaErrors.forEach(err => console.error(`   - ${err}`));
    console.error(`   Fix the event file at: ${latestEventPath}`);
    process.exit(1);
  }

  // 4. Validate ENGINEERING_LOG synchronization
  const engLogPath = path.join(WORKSPACE_ROOT, 'ENGINEERING_LOG.md');
  if (!fs.existsSync(engLogPath)) {
    console.error('❌ FATAL: ENGINEERING_LOG.md not found.');
    process.exit(1);
  }
  
  const engLogContent = fs.readFileSync(engLogPath, 'utf-8');
  if (!engLogContent.includes(eventData.event_id)) {
    console.error(`❌ FATAL: ENGINEERING_LOG.md is not synchronized.`);
    console.error(`   It does not contain the latest event_id: ${eventData.event_id}`);
    process.exit(1);
  }

  // 5. Critical Domain Enforcement
  if (isCriticalDomainModified) {
    console.log('⚠️ Critical domain changes detected (finance/inventory/orders). Enforcing strict policy...');
    
    if (!eventData.severity || (eventData.severity !== '0.9' && eventData.severity !== '1.0' && eventData.severity !== '0.6')) {
      console.error(`❌ FATAL: Critical domain modifications require explicit High/Medium severity. Found: ${eventData.severity}`);
      process.exit(1);
    }

    if (!eventData.rollback_strategy || eventData.rollback_strategy.length < 15) {
      console.error('❌ FATAL: Critical domain modifications MUST contain a valid `rollback_strategy` in the event JSON.');
      process.exit(1);
    }
    
    // We assume governance_approval was granted if AI reached this point and documented it.
    if (eventData.governance_approval !== true) {
      console.error('❌ FATAL: Critical domain modifications MUST contain `governance_approval: true` in the event JSON.');
      process.exit(1);
    }
  }

  console.log('✅ Governance Validation Passed. Memory is synchronized.');
  process.exit(0);
}

runValidation();
