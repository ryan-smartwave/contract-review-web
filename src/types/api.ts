export type DocumentOut = {
  id: number;
  filename: string;
  source: 'email' | 'upload' | 'drive';
  mime_type: string;
  detected_at: string;
  is_contract_revision: boolean | null;
  confidence: number | null;
  reasoning: string | null;
  review_seconds: number | null;
};

export type DriveFile = {
  file_id: string;
  name: string;
  modified_time: string;
  mime_type: string;
  web_view_link: string | null;
};

export type Suggestion = {
  id: number;
  clause: string;
  original_text: string;
  replacement_text: string;
  rationale: string;
  status: 'pending' | 'applied' | 'rejected' | 'stale';
};

export type VersionInfo = {
  version_number: number;
  source_suggestion_id: number | null;
  created_at: string;
};

export type DocumentDetail = DocumentOut & {
  text: string;
  suggestions: Suggestion[];
  versions: VersionInfo[];
};

export type DriveSearch = {
  results: DriveFile[];
  clarifying_question: string | null;
};
