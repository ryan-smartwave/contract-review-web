export type DocumentOut = {
  id: number;
  filename: string;
  source: 'email' | 'upload';
  mime_type: string;
  detected_at: string;
  is_contract_revision: boolean | null;
  confidence: number | null;
  reasoning: string | null;
};

export type DriveFile = {
  file_id: string;
  name: string;
  modified_time: string;
  mime_type: string;
  web_view_link: string | null;
};
