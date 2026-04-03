export type UserRole = "admin" | "client";

export type AssignmentStatus = "not_started" | "in_progress" | "completed";

export type MessageRole = "user" | "assistant";

export type DocumentType = "icp" | "offer" | "positioning" | "tone_of_voice";

export type InterviewType = "profile" | "content";

export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Interview {
  id: string;
  created_by: string;
  title: string;
  description: string;
  system_prompt: string;
  document_type: DocumentType | null;
  interview_type: InterviewType;
  topic: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  interview_id: string;
  client_id: string;
  assigned_by: string;
  status: AssignmentStatus;
  assigned_at: string;
  completed_at: string | null;
  progress: number;
  output_content: string | null;
}

export interface Message {
  id: string;
  assignment_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  type: DocumentType;
  title: string;
  content: string;
  version: number;
  source_assignment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentSuggestion {
  id: string;
  document_id: string;
  suggested_content: string;
  reason: string;
  source_type: "interview" | "upload";
  source_id: string | null;
  status: SuggestionStatus;
  created_at: string;
}

export interface Upload {
  id: string;
  client_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_type: string;
  description: string;
  processed: boolean;
  created_at: string;
}

// Joined types voor gebruik in de UI
export interface AssignmentWithInterview extends Assignment {
  interview: Interview;
}

export interface AssignmentWithClient extends Assignment {
  client: Profile;
  interview: Interview;
}

export interface DocumentWithSuggestions extends Document {
  suggestions: DocumentSuggestion[];
}
