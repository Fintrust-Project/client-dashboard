'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Question, QuestionStatus } from '@/types'
import '@/css/PracticeTest.css'

// ─── Static question bank (to be moved to a service/API in the future) ────────
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
]

const EXAM_DURATION_SECONDS = 7190 // ~2 hours

interface PracticeTestViewProps {
  courseId?: string
}

const PracticeTestView = ({ courseId }: PracticeTestViewProps) => {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [markedForReview, setMarkedForReview] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [reviewQuestions, setReviewQuestions] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS)

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
    setSelectedAnswer(optionIndex)
    setAnsweredQuestions((prev) => new Set(prev).add(currentQuestion))
  }

  const handleMarkForReview = () => {
    setMarkedForReview((prev) => !prev)
    setReviewQuestions((prev) => {
      const next = new Set(prev)
      if (!markedForReview) {
        next.add(currentQuestion)
      } else {
        next.delete(currentQuestion)
      }
      return next
    })
  }

  const handleClearAnswer = () => {
    setSelectedAnswer(null)
    setAnsweredQuestions((prev) => {
      const next = new Set(prev)
      next.delete(currentQuestion)
      return next
    })
  }

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setSelectedAnswer(null)
      setMarkedForReview(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
      setSelectedAnswer(null)
      setMarkedForReview(false)
    }
  }

  const handleQuestionJump = (index: number) => {
    setCurrentQuestion(index)
    setSelectedAnswer(null)
    setMarkedForReview(reviewQuestions.has(index))
  }

  const handleEndExam = () => {
    alert('Exam ended! Your results will be displayed.')
    router.push('/dashboard')
  }

  const getQuestionStatus = (index: number): QuestionStatus => {
    if (index === currentQuestion) return 'selected'
    if (reviewQuestions.has(index)) return 'review'
    if (answeredQuestions.has(index)) return 'answered'
    return 'not-attempted'
  }

  return (
    <div className="practice-test-container">
      <header className="test-header">
        <div className="header-left">
          <h1>Practice Test NISM-Series-XXV-A: Persons Associated with Research Services</h1>
          <p>Sales and Other Non-Core Services Certification Examination</p>
        </div>
        <div className="header-right">
          <div className="timer">{formatTime(timeLeft)}</div>
          <button className="end-exam-button" onClick={handleEndExam}>
            End Exam
          </button>
        </div>
      </header>

      <div className="test-content">
        <aside className="questions-panel">
          <div className="panel-header">
            <h3>Questions</h3>
          </div>
          <div className="status-legend">
            {(
              [
                ['selected', 'Selected'],
                ['answered', 'Answered'],
                ['review', 'Mark For Review'],
                ['not-attempted', 'Not Attempted'],
              ] as [QuestionStatus, string][]
            ).map(([status, label]) => (
              <div key={status} className="legend-item">
                <span className={`legend-color ${status}`}></span>
                <span>{label}</span>
              </div>
            ))}
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

        <main className="question-panel">
          <div className="question-header">
            <span className="question-counter">
              Q {currentQuestion + 1}/{QUESTIONS.length}
            </span>
            <span className="question-marks">Mark: 1</span>
          </div>

          <div className="question-content">
            <h2 className="question-text">{QUESTIONS[currentQuestion].question}</h2>

            <div className="options-container">
              {QUESTIONS[currentQuestion].options.map((option, index) => (
                <label key={index} className="option-label">
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={selectedAnswer === index}
                    onChange={() => handleAnswerSelect(index)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="question-footer">
            <button
              className={`mark-review-button ${markedForReview ? 'marked' : ''}`}
              onClick={handleMarkForReview}
            >
              {markedForReview ? '✓ Marked for Review' : 'Mark for Review'}
            </button>
            <button className="clear-answer-button" onClick={handleClearAnswer}>
              CLEAR ANSWER
            </button>
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
