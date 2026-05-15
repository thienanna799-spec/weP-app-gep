export class CacheEngine {
  private l1HotNodes = new Map<string, any>();
  private l2GraphFragments = new Map<string, any>();

  constructor() {
    console.log(`[CacheEngine] Multi-level cache initialized.`);
  }

  public getHotNode(id: string) {
    return this.l1HotNodes.get(id);
  }

  public setHotNode(id: string, data: any) {
    // Limit L1 size to avoid memory bloat
    if (this.l1HotNodes.size > 1000) {
      const firstKey = this.l1HotNodes.keys().next().value;
      if (firstKey) this.l1HotNodes.delete(firstKey);
    }
    this.l1HotNodes.set(id, data);
  }

  public getFragment(flowName: string) {
    return this.l2GraphFragments.get(flowName);
  }

  public setFragment(flowName: string, fragment: any) {
    this.l2GraphFragments.set(flowName, fragment);
  }

  public invalidateFile(filePath: string) {
    console.log(`[CacheEngine] Invalidating cache for ${filePath}`);
    // Simple strategy: Clear everything dependent on this file
    // For V5, we would be more precise. Here we clear keys containing the path.
    for (const key of this.l1HotNodes.keys()) {
      if (key.includes(filePath)) {
        this.l1HotNodes.delete(key);
      }
    }
    // Assume fragments are stale on any write for safety
    this.l2GraphFragments.clear();
  }
}
