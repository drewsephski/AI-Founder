export enum View {
  Home = 'home',
  Marketplace = 'marketplace',
  AIHub = 'aihub',
  Dashboard = 'dashboard',
  Admin = 'admin',
}

export enum ToolType {
  ImageEditor = 'Image Editor',
  ComplexQuery = 'Complex Query Analyzer',
  StandardChat = 'Standard Chatbot',
  ImageGenerator = 'Image Generator',
  VideoAnalyzer = 'Video Analyzer',
  GoogleSearch = 'Google Search',
}

export type Tool = {
  type: ToolType;
  title: string;
  description: string;
  category: string;
};

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  sources?: { web: { uri: string; title: string } }[];
};

export type TranscriptionEntry = {
  speaker: 'user' | 'model';
  text: string;
};

export type SavedSession = {
  id: string;
  name: string;
  timestamp: string;
  transcript: TranscriptionEntry[];
};
