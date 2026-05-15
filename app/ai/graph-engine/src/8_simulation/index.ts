import { GraphDatabaseClient } from '../4_memgraph/index.js';

export class ImpactSimulationEngine {
  constructor(private graphDb: GraphDatabaseClient) {}

  public async simulateImpact(changedNodeId: string) {
    console.log(`[SimulationEngine] Simulating blast radius for ${changedNodeId}...`);
    
    const session = (this.graphDb as any).driver.session();
    try {
      // Traverse downstream in Data Flow
      const result = await session.run(
        `MATCH (n {id: $changedNodeId})-[*1..5]->(downstream)
         RETURN collect(distinct downstream.name) as affected`,
        { changedNodeId }
      );
      
      const affectedModules = result.records[0]?.get('affected') || [];
      
      let riskLevel = 'LOW';
      if (affectedModules.length > 10) {
        riskLevel = 'HIGH';
      } else if (affectedModules.length > 3) {
        riskLevel = 'MEDIUM';
      }

      // Check for critical domains
      const criticalDomains = ['finance', 'payment', 'ledger'];
      const hitsCritical = affectedModules.some((m: string) => 
        criticalDomains.some(d => m.toLowerCase().includes(d))
      );
      
      if (hitsCritical) riskLevel = 'HIGH';

      return {
        affectedModules,
        riskLevel
      };
    } catch (e) {
      console.error(`[SimulationEngine] Error simulating impact:`, e);
      return { affectedModules: [], riskLevel: 'UNKNOWN' };
    } finally {
      await session.close();
    }
  }
}
