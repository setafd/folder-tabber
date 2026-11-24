import { createContext, useContext } from 'react';

export type DropIntent = 'before' | 'after' | 'inside';
export interface DropData {
  type: 'item' | 'container';
  nodeId: string;
  parentId?: string;
  isFolder?: boolean;
  layout?: 'card';
}
export const DropFeedbackContext = createContext<{
  target: string | null;
  intent: DropIntent | null;
  dragging: boolean;
}>({
  target: null,
  intent: null,
  dragging: false,
});
export const useDropFeedback = (id: string) => {
  const feedback = useContext(DropFeedbackContext);
  return feedback.target === id ? (feedback.intent ?? undefined) : undefined;
};
