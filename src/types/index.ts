export type Mode = 'casual' | 'timeTrial';
export type Screen = 'start' | 'quiz';
export type ResultStatus = 'completed' | 'timedOut' | 'gaveUp';
export type DisplayMode = 'name' | 'image' | 'both';
export type LayoutDirection = 'row' | 'column';

export interface QuizResult {
  status: ResultStatus;
  timeMs?: number;
  solvedCount: number;
  total: number;
  isNewBest: boolean;
}
