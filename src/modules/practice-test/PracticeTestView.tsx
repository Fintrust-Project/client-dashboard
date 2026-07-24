'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Question, QuestionStatus } from '@/types'

// ─── Question Bank (25 questions to match the screenshot) ────────────────────
const QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Client interaction for Person Associated with Research Services should be:',
    options: ['Predictive', 'Opinion-based', 'Advisory in nature', 'Factual and neutral'],
    correct: 3,
  },
  {
    id: 2,
    question: 'Which of the following is NOT a responsibility of a Research Analyst?',
    options: ['Maintain records', 'Disclose conflicts', 'Guarantee returns', 'Follow code of conduct'],
    correct: 2,
  },
  {
    id: 3,
    question: 'Research Analyst should:',
    options: ['Make price predictions', 'Provide investment advice', 'Offer factual analysis', 'Guarantee profits'],
    correct: 2,
  },
  {
    id: 4,
    question: 'The minimum net worth requirement for a Research Analyst is:',
    options: ['₹25 Lakhs', '₹50 Lakhs', '₹1 Crore', '₹5 Lakhs'],
    correct: 0,
  },
  {
    id: 5,
    question: 'Research reports should be:',
    options: ['Biased', 'Balanced and objective', 'Promotional', 'Exaggerated'],
    correct: 1,
  },
  // Pad the rest up to 25 questions so that the grid looks exactly like the screenshot
  ...Array.from({ length: 20 }, (_, idx) => ({
    id: idx + 6,
    question: `NISM Series Practice Question ${idx + 6}: Which of the following best describes the regulatory guidelines for research analyst publications?`,
    options: [
      'They must be approved by SEBI before publication',
      'They must contain clear disclaimers regarding potential conflicts of interest',
      'They can only be distributed to institutional clients',
      'They must guarantee minimum investment returns',
    ],
    correct: 1,
  }))
]

interface PracticeTestViewProps {
  courseId?: string
}

// Shared color language for question-status swatches (legend) and the
// numbered question-jump buttons in the sidebar grid.
const LEGEND_SWATCH_CLASSES: Record<QuestionStatus, string> = {
  selected: 'border-2 border-emerald-500 bg-white',
  answered: 'bg-emerald-500',
  review: 'bg-red-400',
  'not-attempted': 'bg-gray-200',
}

const QUESTION_NUMBER_CLASSES: Record<QuestionStatus, string> = {
  selected: 'border-2 border-emerald-500 bg-white text-gray-900',
  answered: 'bg-emerald-500 text-white',
  review: 'bg-red-400 text-white',
  'not-attempted': 'bg-gray-200 text-gray-600',
}

const PracticeTestView = ({ courseId }: PracticeTestViewProps) => {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  
  // Track selected option per question ID: { [questionIndex]: optionIndex }
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [reviewQuestions, setReviewQuestions] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(7190) // 1:59:50 in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          handleEndExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: optionIndex,
    }))
  }

  const handleMarkForReviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    setReviewQuestions((prev) => {
      const next = new Set(prev)
      if (isChecked) {
        next.add(currentQuestion)
      } else {
        next.delete(currentQuestion)
      }
      return next
    })
  }

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[currentQuestion]
      return next
    })
  }

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleQuestionJump = (index: number) => {
    setCurrentQuestion(index)
  }

  const handleEndExam = () => {
    alert('Exam ended! Your results will be displayed.')
    router.push('/dashboard')
  }

  const getQuestionStatus = (index: number): QuestionStatus => {
    if (index === currentQuestion) return 'selected'
    if (reviewQuestions.has(index)) return 'review'
    if (answers[index] !== undefined) return 'answered'
    return 'not-attempted'
  }

  const currentSelectedOption = answers[currentQuestion]
  const isMarkedForReview = reviewQuestions.has(currentQuestion)

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa] text-[#333333]">
      <header className="flex flex-col gap-3 border-b-[1.5px] border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h1 className="text-sm font-medium leading-snug text-gray-600 sm:text-base">
            Practice Test NISM-Series-XXV-A: Persons Associated with Research Services (Sales and Other Non-Core Services) Certification Examination: Practice Test NISM-...
          </h1>
        </div>
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 sm:text-xl">
            ⏱ {formatTime(timeLeft)}
          </div>
          <button
            onClick={handleEndExam}
            className="rounded-full bg-[#1e1b4b] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#312e81] sm:px-5"
          >
            End Exam
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-4 sm:p-8 lg:flex-row">
        {/* Left column - Question Panel */}
        <aside className="flex shrink-0 flex-col gap-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:w-80">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-semibold text-gray-900">Questions</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-4 w-4 rounded-sm ${LEGEND_SWATCH_CLASSES.selected}`}></span>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-4 w-4 rounded-sm ${LEGEND_SWATCH_CLASSES.answered}`}></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-4 w-4 rounded-sm ${LEGEND_SWATCH_CLASSES.review}`}></span>
              <span>Mark For Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-4 w-4 rounded-sm ${LEGEND_SWATCH_CLASSES['not-attempted']}`}></span>
              <span>Not Attempted</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {QUESTIONS.map((_, index) => (
              <button
                key={index}
                onClick={() => handleQuestionJump(index)}
                className={`aspect-square rounded text-sm font-medium transition hover:opacity-80 ${QUESTION_NUMBER_CLASSES[getQuestionStatus(index)]}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Right column - Main Question Workspace */}
        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="relative top-[1.5px] rounded-t-xl border-[1.5px] border-b-0 border-emerald-500 bg-white px-3 py-2 text-sm font-semibold text-gray-900 sm:px-5">
                Q {currentQuestion + 1}/{QUESTIONS.length}
              </div>
              <div className="text-sm font-medium text-gray-600">Mark: 1</div>
            </div>

            <div className="flex flex-1 flex-col gap-6 border-t-[1.5px] border-gray-200 pt-6 sm:pt-8">
              <h2 className="mb-2 text-base font-semibold leading-relaxed text-gray-900 sm:text-[1.05rem]">
                {QUESTIONS[currentQuestion].question}
              </h2>

              <div className="flex flex-col gap-3">
                {QUESTIONS[currentQuestion].options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border-[1.5px] px-4 py-3 transition hover:border-emerald-500 hover:bg-gray-50 sm:px-5 sm:py-4 ${
                      currentSelectedOption === index
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-option-${currentQuestion}`}
                      value={index}
                      checked={currentSelectedOption === index}
                      onChange={() => handleAnswerSelect(index)}
                      className="h-5 w-5 shrink-0 cursor-pointer accent-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls matching the screenshot */}
          <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={isMarkedForReview}
                  onChange={handleMarkForReviewChange}
                  className="h-[1.1rem] w-[1.1rem] cursor-pointer accent-[#1e1b4b]"
                />
                <span>Mark for Review</span>
              </label>

              <button
                onClick={handleClearAnswer}
                className="p-2 text-left text-sm font-semibold text-blue-700 transition hover:text-blue-800 hover:underline"
              >
                CLEAR ANSWER
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex-1 rounded-md border-[1.5px] border-gray-300 px-8 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 sm:flex-none"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestion === QUESTIONS.length - 1}
                className="flex-1 rounded-md bg-[#1e1b4b] px-8 py-2.5 text-sm font-medium text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 sm:flex-none"
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default PracticeTestView
