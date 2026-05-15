// ============================================================
// OpenClaw – Core Type Definitions
// All domain types, orchestration types, and provider types
// ============================================================

// ── Domain Criticality ──────────────────────────────────────

export type DomainPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type GovernanceLevel = 'LOCKED' | 'GUARDED' | 'CAREFUL' | 'FREE';
export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DomainConfig {
  name: string;
  priority: DomainPriority;
  governance: GovernanceLevel;
  requiresTransaction: boolean;
  requiresAuditLog: boolean;
  requiresRealtimeEvent: boolean;
  canRollback: boolean;
  constraints: string[];
  mustNot: string[];
  relatedDomains: string[];
  memoryPaths: {
    skill: string;
    workflow?: string;
    states?: string;
    permissions?: string;
    [key: string]: string | undefined;
  };
}

// ── Risk Types ───────────────────────────────────────────────

export type RiskType =
  | 'data_loss'
  | 'audit_break'
  | 'financial_mismatch'
  | 'stock_corruption'
  | 'hidden_mutation'
  | 'queue_loss'
  | 'realtime_desync'
  | 'duplicate_processing'
  | 'fraud_bypass'
  | 'stale_cache';

export interface Risk {
  id: string;
  type: RiskType;
  severity: RiskSeverity;
  description: string;
  impactedDomains: string[];
  detectionStrategy: string;
  mitigation: string;
}

// ── Memory Types ─────────────────────────────────────────────

export interface MemoryFile {
  path: string;
  domain: string;
  type: 'skill' | 'workflow' | 'states' | 'permissions' | 'rules' | 'system' | 'shared' | 'prompt';
  content: string;
  lastModified: Date;
}

export interface DomainMemory {
  domain: string;
  files: MemoryFile[];
  apis: ApiEndpoint[];
  states: StateDefinition[];
  workflows: WorkflowStep[];
  events: SocketEvent[];
  risks: Risk[];
}

export interface ContextGraph {
  domains: Map<string, DomainMemory>;
  crossDomainLinks: CrossDomainLink[];
  activeRisks: Risk[];
  systemRules: string[];
  builtAt: Date;
}

export interface CrossDomainLink {
  fromDomain: string;
  toDomain: string;
  trigger: string;
  impact: string;
  criticality: DomainPriority;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requiresAuth: boolean;
  roles: string[];
}

export interface StateDefinition {
  name: string;
  label: string;
  terminal: boolean;
  allowedTransitions: string[];
}

export interface WorkflowStep {
  step: number;
  name: string;
  description: string;
  actor: string;
  api?: string;
  triggers?: string[];
  sideEffects?: string[];
}

export interface SocketEvent {
  name: string;
  trigger: string;
  payload: string;
  cacheImpact?: string[];
  status: 'implemented' | 'missing';
}

// ── Orchestration Types ───────────────────────────────────────

export interface OpenClawRequest {
  id: string;
  userRequest: string;
  targetDomain?: string;
  requestType: 'build' | 'review' | 'refactor' | 'audit' | 'sync';
  timestamp: Date;
}

export interface ImpactAnalysis {
  primaryDomain: string;
  secondaryDomains: string[];
  crossDomainRisks: CrossDomainLink[];
  governanceLevel: GovernanceLevel;
  requiresPreCheck: boolean;
  blockers: string[];
}

export interface RiskAnalysis {
  identifiedRisks: Risk[];
  riskScore: number; // 0-100
  requiresEscalation: boolean;
  mitigations: string[];
}

export interface ExecutionPlan {
  phases: ExecutionPhase[];
  estimatedComplexity: 'trivial' | 'low' | 'medium' | 'high' | 'critical';
  filesToCreate: string[];
  filesToModify: string[];
  memoryFilesToUpdate: string[];
  preChecklist: string[];
  postChecklist: string[];
}

export interface ExecutionPhase {
  order: number;
  name: string;
  description: string;
  domain: string;
  actions: string[];
  dependencies: string[];
  risks: string[];
}

export interface BuilderPrompt {
  systemContext: string;
  domainMemory: string;
  governanceRules: string;
  taskDescription: string;
  constraints: string[];
  postBuildChecklist: string[];
  fullPrompt: string;
}

// ── Review Types ─────────────────────────────────────────────

export type ViolationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Violation {
  id: string;
  type: string;
  severity: ViolationSeverity;
  domain: string;
  message: string;
  file?: string;
  line?: number;
  suggestion: string;
}

export interface ReviewResult {
  requestId: string;
  domain: string;
  reviewedAt: Date;
  passed: boolean;
  complianceScore: number; // 0-100
  violations: Violation[];
  warnings: string[];
  recommendations: string[];
}

export interface GovernanceReport {
  requestId: string;
  timestamp: Date;
  request: string;
  impactAnalysis: ImpactAnalysis;
  riskAnalysis: RiskAnalysis;
  executionPlan: ExecutionPlan;
  reviewResults: ReviewResult[];
  overallComplianceScore: number;
  approved: boolean;
  blockers: string[];
  summary: string;
}

// ── Memory Sync Types ─────────────────────────────────────────

export interface MemoryDrift {
  file: string;
  driftType: 'workflow_changed' | 'api_changed' | 'state_changed' | 'event_changed' | 'new_domain';
  description: string;
  suggestedUpdate: string;
  urgency: 'immediate' | 'soon' | 'backlog';
}

export interface MemorySyncReport {
  scannedAt: Date;
  driftsDetected: MemoryDrift[];
  upToDate: string[];
  totalFiles: number;
  requiresAction: boolean;
}

// ── Provider Types ────────────────────────────────────────────

export type ProviderName = 'gemini' | 'openai' | 'openrouter';

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderRequest {
  messages: ProviderMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json';
}

export interface ProviderResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  provider: ProviderName;
  latencyMs: number;
}

// ── Log Types ─────────────────────────────────────────────────

export type LogType = 'execution' | 'governance' | 'review' | 'violation' | 'sync';

export interface LogEntry {
  timestamp: string;
  type: LogType;
  requestId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}
