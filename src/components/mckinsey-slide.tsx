"use client"

import { ReactNode } from 'react'

interface McKinseySlideProps {
  title: string
  subtitle?: string
  businessProblem?: string
  methodology?: string
  keyInsights?: string[]
  recommendations?: string[]
  children: ReactNode
}

export default function McKinseySlide({ 
  title, 
  subtitle, 
  businessProblem, 
  methodology, 
  keyInsights = [], 
  recommendations = [], 
  children 
}: McKinseySlideProps) {
  return (
    <div className="mckinsey-slide">
      {/* Slide Header - McKinsey Style */}
      <div className="mckinsey-header">
        <div className="mckinsey-title-section">
          <h1 className="mckinsey-title">{title}</h1>
          {subtitle && <p className="mckinsey-subtitle">{subtitle}</p>}
        </div>
        
        {/* McKinsey Three-Box Structure */}
        {(businessProblem || methodology) && (
          <div className="mckinsey-context-boxes">
            {businessProblem && (
              <div className="mckinsey-context-box problem">
                <div className="mckinsey-box-label">BUSINESS PROBLEM</div>
                <div className="mckinsey-box-content">{businessProblem}</div>
              </div>
            )}
            {methodology && (
              <div className="mckinsey-context-box approach">
                <div className="mckinsey-box-label">OUR APPROACH</div>
                <div className="mckinsey-box-content">{methodology}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="mckinsey-content">
        {children}
      </div>

      {/* Key Insights - Right Side */}
      {(keyInsights.length > 0 || recommendations.length > 0) && (
        <div className="mckinsey-insights-panel">
          {keyInsights.length > 0 && (
            <div className="mckinsey-insights-section">
              <div className="mckinsey-section-title">KEY INSIGHTS</div>
              <ul className="mckinsey-insights-list">
                {keyInsights.map((insight, index) => (
                  <li key={index} className="mckinsey-insight-item">
                    <span className="mckinsey-bullet">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {recommendations.length > 0 && (
            <div className="mckinsey-recommendations-section">
              <div className="mckinsey-section-title">RECOMMENDATIONS</div>
              <ul className="mckinsey-recommendations-list">
                {recommendations.map((rec, index) => (
                  <li key={index} className="mckinsey-recommendation-item">
                    <span className="mckinsey-number">{index + 1}</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

