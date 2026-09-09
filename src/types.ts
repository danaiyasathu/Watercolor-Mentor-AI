export interface UserProfile {
  name: string;
  priorExperience: string;
  supplies: {
    paintType: string; // tube, pan, student grade, artist grade, etc.
    brushes: string; // round, flat, size
    paper: string; // 190gsm, 300gsm, cellulose, cotton
    waterContainers: boolean;
    tissue: boolean;
  };
  goal: string; // relax, creative, hobby, healing
  practiceTimePerWeek: string; // e.g. "2-3 ชม./สัปดาห์"
  isOnboarded: boolean;
}

export interface Lesson {
  id: number;
  title: string;
  thaiTitle: string;
  subtitle: string;
  objective: string;
  concepts: {
    title: string;
    description: string;
    techniqueTip?: string;
  }[];
  homework: {
    title: string;
    instruction: string;
    deliverable: string;
    starterPrompt: string;
    evaluationChecklist: string[];
    easierAlternative?: string;
  };
  iconName: string;
  colorAccent: string;
  tips: string[];
}

export interface CheckpointEvaluation {
  lessonId: number;
  passed: boolean;
  praise: string;
  improvementPoints: string[];
  decisionSummary: string;
  nextStepsOrRetryPlan: string;
  timestamp: number;
  imageUrl: string;
  imageUrls?: string[];
  userNotes?: string;
  mentorFullMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  imageUrl?: string;
  imageUrls?: string[];
  evaluation?: CheckpointEvaluation;
}

export interface Submission {
  id: string;
  lessonId: number;
  imageUrl: string;
  imageUrls?: string[];
  userNotes: string;
  evaluation: CheckpointEvaluation;
  createdAt: number;
}

export interface LessonDraft {
  lessonId: number;
  notes: string;
  lastUpdated: number;
}

export interface ActivityLogItem {
  id: string;
  type: 'start_lesson' | 'save_notes' | 'chat' | 'submit_homework' | 'pass_checkpoint' | 'onboard' | 'resume';
  lessonId?: number;
  title: string;
  detail?: string;
  timestamp: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  englishTitle: string;
  description: string;
  iconName: string;
  category: 'milestone' | 'skill' | 'habit';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: number;
}

export interface LearningStateBackup {
  version: string;
  exportedAt: number;
  userProfile: UserProfile;
  currentLessonId: number;
  completedLessons: number[];
  submissions: Submission[];
  messages: ChatMessage[];
  lessonDrafts: Record<number, LessonDraft>;
  activityLogs: ActivityLogItem[];
}
