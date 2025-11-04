import { Tool, ToolType } from './types';

export const TOOLS: Tool[] = [
  {
    type: ToolType.ImageEditor,
    title: 'Generative Image Editor',
    description: 'Edit images with text prompts. Add filters, remove objects, and more using generative AI.',
    category: 'Image Generation',
  },
  {
    type: ToolType.ComplexQuery,
    title: 'Complex Query Analyzer',
    description: 'Leverage deep reasoning for complex problems. Ideal for strategy, coding, and STEM.',
    category: 'Text Generation',
  },
  {
    type: ToolType.StandardChat,
    title: 'Standard Chatbot',
    description: 'A fast, general-purpose chatbot for a wide variety of text-based tasks and questions.',
    category: 'Custom Chat Agents',
  },
];
