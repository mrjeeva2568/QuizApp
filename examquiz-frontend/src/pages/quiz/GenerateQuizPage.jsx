import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

import { quizService } from '../../services/quizService';
import { getErrorMessage } from '../../services/apiClient';

import {
  DIFFICULTY_LEVELS,
  QUESTION_TYPES,
} from '../../utils/constants';

import { ROUTE_PATHS } from '../../routes/routePaths';

import {
  validateTopic,
  validateRequiredSelect,
  validateNumberOfQuestions,
  runValidators,
} from '../../utils/validators';

import { FormField } from '../../components/common/FormField';
import { Spinner } from '../../components/common/Spinner';


/*
|--------------------------------------------------------------------------
| Exam → Subject → Topic data
|--------------------------------------------------------------------------
*/

const EXAM_DATA = {
  JEE_MAIN: {
    name: 'JEE Main',

    subjects: {
      PHYSICS: {
        name: 'Physics',
        topics: [
          'Kinematics',
          'Laws of Motion',
          'Work Energy and Power',
          'Gravitation',
          'Thermodynamics',
          'Electrostatics',
          'Current Electricity',
          'Magnetism',
          'Optics',
          'Modern Physics',
        ],
      },

      CHEMISTRY: {
        name: 'Chemistry',
        topics: [
          'Atomic Structure',
          'Chemical Bonding',
          'Thermodynamics',
          'Chemical Equilibrium',
          'Electrochemistry',
          'Organic Chemistry',
          'Coordination Compounds',
          'Biomolecules',
        ],
      },

      MATHEMATICS: {
        name: 'Mathematics',
        topics: [
          'Algebra',
          'Complex Numbers',
          'Matrices and Determinants',
          'Trigonometry',
          'Coordinate Geometry',
          'Limits and Continuity',
          'Differentiation',
          'Integration',
          'Probability',
          'Statistics',
        ],
      },
    },
  },

  JEE_ADVANCED: {
    name: 'JEE Advanced',

    subjects: {
      PHYSICS: {
        name: 'Physics',
        topics: [
          'Kinematics',
          'Newton Laws of Motion',
          'Work Energy and Power',
          'Rotational Motion',
          'Thermodynamics',
          'Electrostatics',
          'Current Electricity',
          'Magnetism',
          'Optics',
          'Modern Physics',
        ],
      },

      CHEMISTRY: {
        name: 'Chemistry',
        topics: [
          'Atomic Structure',
          'Chemical Bonding',
          'Thermodynamics',
          'Chemical Equilibrium',
          'Electrochemistry',
          'Organic Chemistry',
          'Coordination Chemistry',
          'Chemical Kinetics',
        ],
      },

      MATHEMATICS: {
        name: 'Mathematics',
        topics: [
          'Algebra',
          'Complex Numbers',
          'Sequences and Series',
          'Matrices',
          'Probability',
          'Coordinate Geometry',
          'Differential Calculus',
          'Integral Calculus',
          'Vectors',
          '3D Geometry',
        ],
      },
    },
  },

  NEET: {
    name: 'NEET',

    subjects: {
      PHYSICS: {
        name: 'Physics',
        topics: [
          'Kinematics',
          'Laws of Motion',
          'Work Energy and Power',
          'Thermodynamics',
          'Electrostatics',
          'Current Electricity',
          'Magnetism',
          'Optics',
          'Modern Physics',
        ],
      },

      CHEMISTRY: {
        name: 'Chemistry',
        topics: [
          'Atomic Structure',
          'Chemical Bonding',
          'Thermodynamics',
          'Equilibrium',
          'Electrochemistry',
          'Organic Chemistry',
          'Biomolecules',
          'Coordination Compounds',
        ],
      },

      BIOLOGY: {
        name: 'Biology',
        topics: [
          'Cell Biology',
          'Biomolecules',
          'Plant Physiology',
          'Human Physiology',
          'Genetics',
          'Evolution',
          'Ecology',
          'Human Reproduction',
          'Biotechnology',
          'Diversity in Living World',
        ],
      },
    },
  },

  CAT: {
    name: 'CAT',

    subjects: {
      QUANTITATIVE_APTITUDE: {
        name: 'Quantitative Aptitude',
        topics: [
          'Arithmetic',
          'Algebra',
          'Number System',
          'Geometry',
          'Percentages',
          'Profit and Loss',
          'Time Speed Distance',
          'Time and Work',
          'Probability',
          'Permutations and Combinations',
        ],
      },

      VARC: {
        name: 'Verbal Ability and Reading Comprehension',
        topics: [
          'Reading Comprehension',
          'Para Jumbles',
          'Para Summary',
          'Odd Sentence Out',
          'Sentence Completion',
          'Vocabulary',
          'Grammar',
        ],
      },

      DILR: {
        name: 'Data Interpretation and Logical Reasoning',
        topics: [
          'Tables',
          'Charts',
          'Graphs',
          'Caselets',
          'Seating Arrangement',
          'Blood Relations',
          'Logical Puzzles',
          'Data Sufficiency',
        ],
      },
    },
  },

  GATE: {
    name: 'GATE',

    subjects: {
      COMPUTER_SCIENCE: {
        name: 'Computer Science',
        topics: [
          'Programming',
          'Data Structures',
          'Algorithms',
          'Operating Systems',
          'DBMS',
          'Computer Networks',
          'Computer Organization',
          'Theory of Computation',
          'Compiler Design',
          'Discrete Mathematics',
        ],
      },

      ELECTRONICS: {
        name: 'Electronics and Communication',
        topics: [
          'Electronic Devices',
          'Digital Circuits',
          'Analog Circuits',
          'Signals and Systems',
          'Communication Systems',
          'Control Systems',
          'Electromagnetics',
        ],
      },
    },
  },

  UPSC_CSE: {
    name: 'UPSC CSE',

    subjects: {
      GENERAL_STUDIES: {
        name: 'General Studies',
        topics: [
          'History',
          'Geography',
          'Indian Polity',
          'Economy',
          'Environment',
          'Science and Technology',
          'International Relations',
          'Current Affairs',
        ],
      },
    },
  },

  CLAT: {
    name: 'CLAT',

    subjects: {
      ENGLISH: {
        name: 'English Language',
        topics: [
          'Reading Comprehension',
          'Vocabulary',
          'Grammar',
          'Sentence Correction',
          'Inference',
        ],
      },

      CURRENT_AFFAIRS: {
        name: 'Current Affairs',
        topics: [
          'National Affairs',
          'International Affairs',
          'Government Schemes',
          'Sports',
          'Awards',
          'Important Events',
        ],
      },

      LEGAL_REASONING: {
        name: 'Legal Reasoning',
        topics: [
          'Legal Principles',
          'Constitution',
          'Contracts',
          'Torts',
          'Criminal Law',
        ],
      },

      LOGICAL_REASONING: {
        name: 'Logical Reasoning',
        topics: [
          'Logical Puzzles',
          'Critical Reasoning',
          'Arguments',
          'Assumptions',
          'Inference',
        ],
      },

      QUANTITATIVE_TECHNIQUES: {
        name: 'Quantitative Techniques',
        topics: [
          'Percentages',
          'Ratio and Proportion',
          'Profit and Loss',
          'Data Interpretation',
          'Averages',
        ],
      },
    },
  },

  CUET: {
    name: 'CUET',

    subjects: {
      GENERAL_TEST: {
        name: 'General Test',
        topics: [
          'General Knowledge',
          'Current Affairs',
          'Quantitative Aptitude',
          'Logical Reasoning',
          'Data Interpretation',
        ],
      },

      LANGUAGE: {
        name: 'Language',
        topics: [
          'Reading Comprehension',
          'Vocabulary',
          'Grammar',
          'Verbal Ability',
        ],
      },

      DOMAIN_SUBJECTS: {
        name: 'Domain Subjects',
        topics: [
          'Concepts',
          'Application Based Questions',
          'Numerical Problems',
          'Reasoning',
        ],
      },
    },
  },

  SAT: {
    name: 'SAT',

    subjects: {
      MATH: {
        name: 'Math',
        topics: [
          'Algebra',
          'Advanced Math',
          'Problem Solving',
          'Data Analysis',
          'Geometry',
          'Trigonometry',
        ],
      },

      READING_WRITING: {
        name: 'Reading and Writing',
        topics: [
          'Reading Comprehension',
          'Grammar',
          'Vocabulary',
          'Inference',
          'Expression of Ideas',
        ],
      },
    },
  },

  GRE: {
    name: 'GRE',

    subjects: {
      VERBAL: {
        name: 'Verbal Reasoning',
        topics: [
          'Reading Comprehension',
          'Text Completion',
          'Sentence Equivalence',
          'Vocabulary',
          'Inference',
        ],
      },

      QUANTITATIVE: {
        name: 'Quantitative Reasoning',
        topics: [
          'Arithmetic',
          'Algebra',
          'Geometry',
          'Data Analysis',
          'Probability',
        ],
      },
    },
  },

  GMAT: {
    name: 'GMAT',

    subjects: {
      VERBAL: {
        name: 'Verbal',
        topics: [
          'Reading Comprehension',
          'Critical Reasoning',
          'Grammar',
          'Inference',
        ],
      },

      QUANTITATIVE: {
        name: 'Quantitative',
        topics: [
          'Arithmetic',
          'Algebra',
          'Geometry',
          'Probability',
          'Data Sufficiency',
        ],
      },

      INTEGRATED_REASONING: {
        name: 'Integrated Reasoning',
        topics: [
          'Data Interpretation',
          'Multi Source Reasoning',
          'Two Part Analysis',
          'Graphics Interpretation',
        ],
      },
    },
  },
};


/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const VALIDATORS = {
  exam: validateRequiredSelect('Entrance exam'),
  subject: validateRequiredSelect('Subject'),
  topic: validateTopic,
  difficulty: validateRequiredSelect('Difficulty'),
  questionType: validateRequiredSelect('Question type'),
  numberOfQuestions: validateNumberOfQuestions,
};


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export function GenerateQuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    exam: searchParams.get('exam') || '',
    topic: searchParams.get('topic') || '',
    subject: searchParams.get('subject') || '',
    difficulty: 'MEDIUM',
    questionType: 'MULTIPLE_CHOICE',
    numberOfQuestions: 5,
    additionalInstructions: '',
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Current exam
  |--------------------------------------------------------------------------
  */

  const selectedExam = EXAM_DATA[form.exam];

  const subjects = selectedExam
    ? Object.entries(selectedExam.subjects)
    : [];

  const selectedSubject =
    selectedExam?.subjects?.[form.subject];

  const topics = selectedSubject?.topics || [];


  /*
  |--------------------------------------------------------------------------
  | Change handler
  |--------------------------------------------------------------------------
  */

  function handleChange(event) {
    const { name, value } = event.target;

    setServerError('');

    if (name === 'exam') {
      setForm((prev) => ({
        ...prev,
        exam: value,
        subject: '',
        topic: '',
      }));

      setErrors((prev) => ({
        ...prev,
        exam: validateRequiredSelect('Entrance exam')(value),
        subject: '',
        topic: '',
      }));

      return;
    }

    if (name === 'subject') {
      setForm((prev) => ({
        ...prev,
        subject: value,
        topic: '',
      }));

      setErrors((prev) => ({
        ...prev,
        subject: validateRequiredSelect('Subject')(value),
        topic: '',
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name] && VALIDATORS[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: VALIDATORS[name](value),
      }));
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Blur handler
  |--------------------------------------------------------------------------
  */

  function handleBlur(event) {
    const { name, value } = event.target;

    if (!VALIDATORS[name]) {
      return;
    }

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: VALIDATORS[name](value),
    }));
  }


  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event) {
    event.preventDefault();

    setServerError('');

    const validationErrors = runValidators(VALIDATORS, form);

    setErrors(validationErrors);

    setTouched({
      exam: true,
      subject: true,
      topic: true,
      difficulty: true,
      questionType: true,
      numberOfQuestions: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const quiz = await quizService.generateQuiz({
        exam: form.exam,
        subject: form.subject,
        topic: form.topic,
        difficulty: form.difficulty,
        questionType: form.questionType,
        numberOfQuestions: Number(form.numberOfQuestions),
        additionalInstructions: form.additionalInstructions,
      });

      navigate(
        ROUTE_PATHS.quizTake(quiz.id),
        {
          replace: true,
        }
      );
    } catch (err) {
      setServerError(
        getErrorMessage(
          err,
          'Could not generate a quiz right now. Please try again.'
        )
      );

      setIsSubmitting(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | JSX
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">

      <div>
        <h1 className="text-2xl font-bold">
          Generate a Quiz
        </h1>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Select your entrance exam, subject, and topic.
          Our AI agent will build the quiz for you.
        </p>
      </div>


      {serverError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-danger-500/10"
        >
          {serverError}
        </div>
      )}


      <form
        onSubmit={handleSubmit}
        noValidate
        className="card mt-6 space-y-5 p-5 sm:p-6"
      >

        {/* ============================================================
            EXAM
        ============================================================ */}

        <FormField
          id="exam"
          label="Entrance Exam"
          error={errors.exam}
          touched={touched.exam}
        >
          <select
            id="exam"
            name="exam"
            className="input"
            value={form.exam}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="">
              Select entrance exam
            </option>

            {Object.entries(EXAM_DATA).map(
              ([value, exam]) => (
                <option
                  key={value}
                  value={value}
                >
                  {exam.name}
                </option>
              )
            )}
          </select>
        </FormField>


        {/* ============================================================
            SUBJECT
        ============================================================ */}

        <FormField
          id="subject"
          label="Subject"
          error={errors.subject}
          touched={touched.subject}
        >
          <select
            id="subject"
            name="subject"
            className="input"
            value={form.subject}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={!form.exam}
          >
            <option value="">
              {form.exam
                ? 'Select subject'
                : 'Select an exam first'}
            </option>

            {subjects.map(
              ([value, subject]) => (
                <option
                  key={value}
                  value={value}
                >
                  {subject.name}
                </option>
              )
            )}
          </select>
        </FormField>


        {/* ============================================================
            TOPIC
        ============================================================ */}

        <FormField
          id="topic"
          label="Topic"
          error={errors.topic}
          touched={touched.topic}
        >
          <select
            id="topic"
            name="topic"
            className="input"
            value={form.topic}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={!form.subject}
          >
            <option value="">
              {form.subject
                ? 'Select topic'
                : 'Select a subject first'}
            </option>

            {topics.map((topic) => (
              <option
                key={topic}
                value={topic}
              >
                {topic}
              </option>
            ))}

            {form.subject && (
              <option value="ALL_TOPICS">
                All Topics
              </option>
            )}
          </select>
        </FormField>


        {/* ============================================================
            DIFFICULTY + QUESTION TYPE
        ============================================================ */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <FormField
            id="difficulty"
            label="Difficulty"
            error={errors.difficulty}
            touched={touched.difficulty}
          >
            <select
              id="difficulty"
              name="difficulty"
              className="input"
              value={form.difficulty}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {DIFFICULTY_LEVELS.map(
                (level) => (
                  <option
                    key={level}
                    value={level}
                  >
                    {level.charAt(0) +
                      level.slice(1).toLowerCase()}
                  </option>
                )
              )}
            </select>
          </FormField>


          <FormField
            id="questionType"
            label="Question type"
            error={errors.questionType}
            touched={touched.questionType}
          >
            <select
              id="questionType"
              name="questionType"
              className="input"
              value={form.questionType}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {QUESTION_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type
                      .replace('_', ' ')
                      .replace(
                        /\b\w/g,
                        (c) => c.toUpperCase()
                      )}
                  </option>
                )
              )}
            </select>
          </FormField>

        </div>


        {/* ============================================================
            NUMBER OF QUESTIONS
        ============================================================ */}

        <FormField
          id="numberOfQuestions"
          name="numberOfQuestions"
          type="number"
          min={1}
          max={100}
          label="Number of questions"
          value={form.numberOfQuestions}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.numberOfQuestions}
          touched={touched.numberOfQuestions}
        />


        {/* ============================================================
            ADDITIONAL INSTRUCTIONS
        ============================================================ */}

        <div>
          <label
            htmlFor="additionalInstructions"
            className="label"
          >
            Additional instructions (optional)
          </label>

          <textarea
            id="additionalInstructions"
            name="additionalInstructions"
            rows={3}
            className="input"
            placeholder="e.g. Focus on numerical problems and concept application."
            value={form.additionalInstructions}
            onChange={handleChange}
          />
        </div>


        {/* ============================================================
            SUMMARY
        ============================================================ */}

        {form.exam &&
          form.subject &&
          form.topic && (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">
                Quiz Summary
              </p>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Exam:</strong>{' '}
                  {selectedExam?.name}
                </p>

                <p>
                  <strong>Subject:</strong>{' '}
                  {selectedSubject?.name}
                </p>

                <p>
                  <strong>Topic:</strong>{' '}
                  {form.topic === 'ALL_TOPICS'
                    ? 'All Topics'
                    : form.topic}
                </p>

                <p>
                  <strong>Difficulty:</strong>{' '}
                  {form.difficulty}
                </p>

                <p>
                  <strong>Questions:</strong>{' '}
                  {form.numberOfQuestions}
                </p>
              </div>
            </div>
          )}


        {/* ============================================================
            GENERATE BUTTON
        ============================================================ */}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full sm:w-auto"
        >
          {isSubmitting ? (
            <Spinner
              size="sm"
              className="border-white border-t-transparent"
            />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}

          {isSubmitting
            ? 'Generating...'
            : 'Generate Quiz'}
        </button>

      </form>
    </div>
  );
}