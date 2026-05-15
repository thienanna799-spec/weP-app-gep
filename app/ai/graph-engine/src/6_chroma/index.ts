import { ChromaClient, Collection } from 'chromadb';
import { pipeline, env } from '@xenova/transformers';
import { ParsedNode } from '../2_parser/index.js';

// Setup Xenova local cache path for offline usage
// env.localModelPath = './models'; // Comment out until models are actually downloaded
env.allowRemoteModels = true; 

export class VectorEngineClient {
  private client: ChromaClient;
  private collection!: Collection;
  private embedder: any;

  constructor(url: string = 'http://localhost:8000') {
    this.client = new ChromaClient({ path: url });
  }

  public async initialize() {
    console.log(`[ChromaDB] Connecting to vector database...`);
    
    // Create or get collection
    this.collection = await this.client.getOrCreateCollection({
      name: 'gep_code_intelligence',
      metadata: { "hnsw:space": "cosine" }
    });

    console.log(`[ChromaDB] Collection initialized. Loading embedding model...`);
    
    // Load local transformer model for offline embeddings
    this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
    
    console.log(`[ChromaDB] Local embedding model ready.`);
  }

  public async embedAndUpsert(nodes: ParsedNode[]) {
    if (nodes.length === 0) return;
    
    console.log(`[ChromaDB] Embedding ${nodes.length} nodes...`);
    
    const ids: string[] = [];
    const embeddings: number[][] = [];
    const metadatas: any[] = [];
    const documents: string[] = [];

    for (const node of nodes) {
      if (!node.codeSnippet) continue; // Skip files without code

      // Construct Multi-view representation
      const multiViewText = `
        TYPE: ${node.type}
        NAME: ${node.name}
        COMPLEXITY: ${node.complexity}
        DOCSTRING: ${node.docstring}
        CODE: ${node.codeSnippet}
      `.trim();

      const output = await this.embedder(multiViewText, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data) as number[];

      ids.push(node.id);
      embeddings.push(vector);
      documents.push(multiViewText);
      metadatas.push({
        type: node.type,
        name: node.name,
        filePath: node.filePath,
        complexity: node.complexity
      });
    }

    if (ids.length > 0) {
      await this.collection.upsert({
        ids,
        embeddings,
        metadatas,
        documents
      });
      console.log(`[ChromaDB] Upserted ${ids.length} vectors successfully.`);
    }
  }

  public async searchSimilar(query: string, limit: number = 5) {
    const output = await this.embedder(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data) as number[];

    const results = await this.collection.query({
      queryEmbeddings: [queryVector],
      nResults: limit
    });

    return results;
  }
  public async deleteVectorsByFilePath(filePath: string) {
    console.log(`[ChromaDB] 🔴 ZOMBIE VECTOR SYNC: Deleting vectors for ${filePath}`);
    try {
      await this.collection.delete({
        where: { filePath: { "$eq": filePath } }
      });
      console.log(`[ChromaDB] Cleared vectors for ${filePath}`);
    } catch (e) {
      console.error(`[ChromaDB] Error clearing vectors for ${filePath}:`, e);
    }
  }
}
