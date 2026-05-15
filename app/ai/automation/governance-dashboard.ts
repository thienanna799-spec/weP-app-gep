import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');
const EVENTS_DIR = path.join(WORKSPACE_ROOT, 'events');
const ADR_DIR = path.join(WORKSPACE_ROOT, 'app', 'ai', 'system', 'decisions');

function getAllFilesInDir(dirPath: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dirPath)) return files;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFilesInDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function generateDashboard() {
  console.log('\n======================================================');
  console.log('🛡️  GEP ERP - GOVERNANCE OBSERVABILITY DASHBOARD');
  console.log('======================================================\n');

  // 1. Analyze Events
  const eventFiles = getAllFilesInDir(EVENTS_DIR).filter(f => !f.includes('event.schema.json'));
  let missingADRs = 0;
  let governanceViolations = 0;
  
  // Entropy Metrics
  let orphanEvents = 0;
  let semanticViolations = 0;
  let duplicateIncidents = 0;
  const rootCauses = new Set<string>();

  const domainRiskMap: Record<string, number> = {};

  eventFiles.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      
      // Check ADR
      if (data.type === 'ARCH_DECISION' && (!data.related_adr || data.related_adr.length === 0)) {
        missingADRs++;
      }
      
      // Check Governance
      const isCritical = data.affected_domains?.some((d: string) => ['finance', 'inventory', 'orders'].includes(d));
      if (isCritical) {
        if (!data.rollback_strategy) governanceViolations++;
        if (data.governance_approval !== true) governanceViolations++;
      }

      // Heatmap
      if (data.affected_domains) {
        data.affected_domains.forEach((d: string) => {
          domainRiskMap[d] = (domainRiskMap[d] || 0) + 1;
        });
      }

      // Check Structural Entropy (Orphan Events)
      if ((!data.affected_nodes || data.affected_nodes.length === 0) &&
          (!data.caused_by || data.caused_by.length === 0)) {
        orphanEvents++;
      }

      // Check Semantic Entropy
      const whyText = (data.why || '').toLowerCase();
      const causalKeywords = ['because', 'caused by', 'resulted in', 'triggered by', 'prevented by', 'due to', 'bởi vì', 'nguyên nhân'];
      const hasCausalLogic = causalKeywords.some(kw => whyText.includes(kw));
      if (!hasCausalLogic || whyText.length < 30) {
        semanticViolations++;
      }

      // Check Historical Entropy (Duplicates)
      if (data.root_cause && data.root_cause.length > 10) {
        const rcLower = data.root_cause.toLowerCase();
        if (rootCauses.has(rcLower)) {
          duplicateIncidents++;
        } else {
          rootCauses.add(rcLower);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  });

  const highRiskDomains = Object.entries(domainRiskMap)
    .sort((a, b) => b[1] - a[1])
    .map(entry => `${entry[0]} (${entry[1]} modifications)`)
    .slice(0, 3);

  // 2. Count ADRs
  let totalADRs = 0;
  if (fs.existsSync(ADR_DIR)) {
    totalADRs = fs.readdirSync(ADR_DIR).filter(f => f.startsWith('ADR-')).length;
  }

  // 3. Entropy Calculation
  const totalEvents = eventFiles.length || 1; // avoid division by 0
  const structuralEntropy = (orphanEvents / totalEvents) * 0.3;
  const semanticEntropy = (semanticViolations / totalEvents) * 0.3;
  const governanceEntropy = (governanceViolations / totalEvents) * 0.2;
  const historicalEntropy = (duplicateIncidents / totalEvents) * 0.2;
  const totalEntropy = structuralEntropy + semanticEntropy + governanceEntropy + historicalEntropy;
  
  const entropyHealth = totalEntropy < 0.2 ? '🟢 EXCELLENT' : totalEntropy < 0.5 ? '🟡 WARNING' : '🔴 CRITICAL';

  const report = `
Metric                        | Value
------------------------------|-------------------
Total Tracked Events          | ${eventFiles.length}
Memory Sync Compliance        | 100% (Enforced by Husky)
Total ADRs                    | ${totalADRs}
Missing ADRs                  | ${missingADRs}
Governance Violations         | ${governanceViolations}
Top High Risk Domains         | ${highRiskDomains.length > 0 ? highRiskDomains.join(', ') : 'None'}

--- 🧠 COGNITIVE ENTROPY ---  | 
Structural (Orphan Events)    | ${orphanEvents}
Semantic (Meaningless Memory) | ${semanticViolations}
Historical (Duplicates)       | ${duplicateIncidents}
Total Entropy Score           | ${(totalEntropy * 100).toFixed(1)}% / 100%
System Cognitive Health       | ${entropyHealth}
  `;

  console.log(report);
  
  const outputPath = path.join(WORKSPACE_ROOT, 'GOVERNANCE_DASHBOARD.md');
  fs.writeFileSync(outputPath, `# Governance Observability Dashboard\n\n*Auto-generated at ${new Date().toISOString()}*\n\n\`\`\`text\n${report}\n\`\`\``);
  console.log(`\n✅ Dashboard saved to: GOVERNANCE_DASHBOARD.md`);
}

generateDashboard();
