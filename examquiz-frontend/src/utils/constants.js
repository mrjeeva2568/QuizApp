export const ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
};

// Must match com.examquizai.backend.model.enums.DifficultyLevel exactly -
// these are sent as-is in the generate-quiz request body.
export const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD'];

// Must match com.examquizai.backend.model.enums.QuestionType exactly.
export const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MIXED'];

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://quizapp-6-ukde.onrender.com';
