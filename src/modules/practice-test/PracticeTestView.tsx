'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Question, QuestionStatus } from '@/types'
import '@/css/PracticeTest.css'

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
    <div className="practice-test-container">
      <header className="test-header">
        <div className="header-left">
          <h1>
            Practice Test NISM-Series-XXV-A: Persons Associated with Research Services (Sales and Other Non-Core Services) Certification Examination: Practice Test NISM-...
          </h1>
        </div>
        <div className="header-right">
          <div className="timer">
            ⏱ {formatTime(timeLeft)}
          </div>
          <button className="end-exam-button" onClick={handleEndExam}>
            End Exam
          </button>
        </div>
      </header>

      <div className="test-content">
        {/* Left column - Question Panel */}
        <aside className="questions-panel">
          <div className="panel-header">
            <h3>Questions</h3>
          </div>
          
          <div className="status-legend">
            <div className="legend-item">
              <span className="legend-color selected"></span>
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <span className="legend-color answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-color review"></span>
              <span>Mark For Review</span>
            </div>
            <div className="legend-item">
              <span className="legend-color not-attempted"></span>
              <span>Not Attempted</span>
            </div>
          </div>

          <div className="questions-grid">
            {QUESTIONS.map((_, index) => (
              <button
                key={index}
                className={`question-number ${getQuestionStatus(index)}`}
                onClick={() => handleQuestionJump(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Right column - Main Question Workspace */}
        <main className="question-panel">
          <div className="question-card-wrapper">
            <div className="question-header">
              <div className="question-counter">
                Q {currentQuestion + 1}/{QUESTIONS.length}
              </div>
              <div className="question-marks">
                Mark: 1
              </div>
            </div>

            <div className="question-content">
              <h2 className="question-text">
                {QUESTIONS[currentQuestion].question}
              </h2>

              <div className="options-container">
                {QUESTIONS[currentQuestion].options.map((option, index) => (
                  <label
                    key={index}
                    className={`option-label ${currentSelectedOption === index ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-option-${currentQuestion}`}
                      value={index}
                      checked={currentSelectedOption === index}
                      onChange={() => handleAnswerSelect(index)}
                    />
                    <span className="option-text">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls matching the screenshot */}
          <div className="question-footer">
            <div className="footer-left">
              <label className="review-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={isMarkedForReview}
                  onChange={handleMarkForReviewChange}
                />
                <span>Mark for Review</span>
              </label>

              <button className="clear-answer-button" onClick={handleClearAnswer}>
                CLEAR ANSWER
              </button>
            </div>

            <div className="navigation-buttons">
              <button
                className="nav-button previous"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </button>
              <button
                className="nav-button next"
                onClick={handleNext}
                disabled={currentQuestion === QUESTIONS.length - 1}
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
