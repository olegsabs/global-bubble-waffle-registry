export const SHOP_STATUSES = ["active", "closed", "unknown"] as const;
export const SHOP_FORMATS = ["kiosk", "cafe", "truck", "restaurant", "unknown"] as const;
export const CREATED_SOURCES = ["manual", "submission", "agent"] as const;
export const SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;
export const AGENT_TYPES = ["discovery", "verification", "enrichment", "monitoring", "expansion", "promotion"] as const;
export const AGENT_RUN_STATUSES = ["running", "succeeded", "failed", "partial"] as const;
export const DISCOVERY_INGESTION_STATUSES = ["pending", "promoted", "rejected", "duplicate"] as const;
export const SHOP_MEDIA_TYPES = ["image", "menu", "video", "other"] as const;

export type ShopStatus = (typeof SHOP_STATUSES)[number];
export type ShopFormat = (typeof SHOP_FORMATS)[number];
export type CreatedSource = (typeof CREATED_SOURCES)[number];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
export type AgentType = (typeof AGENT_TYPES)[number];
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];
export type DiscoveryIngestionStatus = (typeof DISCOVERY_INGESTION_STATUSES)[number];
export type ShopMediaType = (typeof SHOP_MEDIA_TYPES)[number];

export interface Shop {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  instagram_url: string | null;
  website_url: string | null;
  status: ShopStatus;
  format: ShopFormat;
  created_at: string;
  updated_at: string;
  last_verified_at: string | null;
  created_source: CreatedSource;
  verification_confidence: number;
}

export interface ShopSubmission {
  id: string;
  name: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  instagram_url: string | null;
  website_url: string | null;
  format: ShopFormat;
  submitted_by_email: string | null;
  source_note: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface AgentRun {
  id: string;
  agent_type: AgentType;
  run_key: string | null;
  status: AgentRunStatus;
  started_at: string;
  finished_at: string | null;
  input_payload: Record<string, unknown>;
  result_payload: Record<string, unknown>;
  processed_count: number;
  inserted_count: number;
  updated_count: number;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentDiscovery {
  id: string;
  agent_run_id: string | null;
  source: string;
  external_ref: string | null;
  source_url: string | null;
  discovery_hash: string;
  name: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  instagram_url: string | null;
  website_url: string | null;
  format: ShopFormat;
  status: ShopStatus;
  discovery_confidence: number;
  raw_payload: Record<string, unknown>;
  ingestion_status: DiscoveryIngestionStatus;
  promoted_shop_id: string | null;
  discovered_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopVerificationLog {
  id: string;
  shop_id: string;
  agent_run_id: string | null;
  source: string;
  previous_status: ShopStatus | null;
  result_status: ShopStatus;
  verification_confidence: number;
  reason: string | null;
  evidence: Record<string, unknown>;
  verified_at: string;
  created_at: string;
}

export interface ShopMedia {
  id: string;
  shop_id: string;
  media_type: ShopMediaType;
  storage_path: string | null;
  source_url: string | null;
  caption: string | null;
  metadata: Record<string, unknown>;
  is_primary: boolean;
  created_source: CreatedSource;
  created_at: string;
  updated_at: string;
}
