import { Tool, ToolType, UserPlan } from './types';

export const TOOLS: Tool[] = [
  {
    type: ToolType.ImageEditor,
    title: 'Generative Image Editor',
    description: 'Edit images with text prompts. Add filters, remove objects, and more using generative AI.',
    category: 'Image Generation',
    requiredPlan: 'pro',
  },
  {
    type: ToolType.ComplexQuery,
    title: 'Complex Query Analyzer',
    description: 'Leverage deep reasoning for complex problems. Ideal for strategy, coding, and STEM.',
    category: 'Text Generation',
    requiredPlan: 'pro',
  },
  {
    type: ToolType.StandardChat,
    title: 'Standard Chatbot',
    description: 'A fast, general-purpose chatbot for a wide variety of text-based tasks and questions.',
    category: 'Custom Chat Agents',
    requiredPlan: 'starter',
  },
  {
    type: ToolType.ImageGenerator,
    title: 'Image Generator from Prompt',
    description: 'Instantly creates high-quality images from text prompts.',
    category: 'Image Generation',
    requiredPlan: 'pro',
  },
  {
    type: ToolType.VideoAnalyzer,
    title: 'Video Analyzer Agent',
    description: 'Breaks videos into summaries, key moments, and engagement highlights.',
    category: 'Video Analysis',
    requiredPlan: 'advanced',
  },
  {
    type: ToolType.GoogleSearch,
    title: 'Google Search AI',
    description: 'Chatbot grounded in real-time Google search results for up-to-date answers.',
    category: 'Web & Search',
    requiredPlan: 'pro',
  },
];