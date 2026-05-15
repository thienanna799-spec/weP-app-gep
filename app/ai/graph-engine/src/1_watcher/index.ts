import chokidar from 'chokidar';
import path from 'path';
import { EventEmitter } from 'events';

// Debounce settings
const DEBOUNCE_MS = 2000;

export class FileSystemWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private pendingChanges = new Map<string, 'add' | 'change' | 'unlink'>();
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(private watchPaths: string[]) {
    super();
  }

  public start() {
    console.log(`[Watcher] Starting file watcher on: ${this.watchPaths.join(', ')}`);
    
    this.watcher = chokidar.watch(this.watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (filePath) => this.queueChange(filePath, 'add'))
      .on('change', (filePath) => this.queueChange(filePath, 'change'))
      .on('unlink', (filePath) => this.queueChange(filePath, 'unlink'));
      
    console.log(`[Watcher] Chokidar initialized successfully.`);
  }

  public stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log(`[Watcher] Stopped.`);
    }
  }

  private queueChange(filePath: string, eventType: 'add' | 'change' | 'unlink') {
    // Only care about .ts and .tsx files for AST parsing
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return;
    }

    console.log(`[Watcher] Detected ${eventType}: ${filePath}`);
    this.pendingChanges.set(filePath, eventType);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushChanges();
    }, DEBOUNCE_MS);
  }

  private flushChanges() {
    if (this.pendingChanges.size === 0) return;

    const filesToProcess = Array.from(this.pendingChanges.entries()).map(([filePath, type]) => ({ filePath, type }));
    this.pendingChanges.clear();

    console.log(`[Watcher] Debounce complete. Emitting sync event for ${filesToProcess.length} files.`);
    this.emit('sync_required', filesToProcess);
  }
}
