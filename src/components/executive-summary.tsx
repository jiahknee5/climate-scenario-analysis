"use client"

import { useState } from 'react'
import McKinseySlide from './mckinsey-slide'

export default function ExecutiveSummary() {
  const [isExpanded, setIsExpanded] = useState(false)

  const keyInsights = [
    "Climate risk stress testing reveals portfolio vulnerability to 2.3% baseline scenario impact",
    "Geographic concentration in high-risk coastal markets exceeds 15% board-approved limit", 
    "Current capital buffers adequate for orderly transition, insufficient for disorderly scenarios",
    "Insurance modeling shows 45% premium increases under hot house world pathway"
  ]

  const recommendations = [
    "Implement immediate geographic diversification strategy targeting 10% coastal exposure reduction",
    "Establish $125M additional capital buffer for climate scenario stress coverage", 
    "Update underwriting criteria to incorporate forward-looking climate risk adjustments",
    "Execute quarterly stress testing and reporting framework for regulatory compliance"
  ]

  return (
    <McKinseySlide
      title="Climate Risk Analysis Platform"
      subtitle="Executive insights for strategic decision making and regulatory compliance in banking portfolios"
      businessProblem="Climate change poses significant financial risks to banking portfolios through physical damage and transition costs, requiring quantitative assessment for CCAR compliance and strategic capital planning"
      methodology="Advanced stress testing using Federal Reserve climate scenarios to quantify portfolio-level impacts on expected losses, capital adequacy, and geographic concentration risks"
      keyInsights={keyInsights}
      recommendations={recommendations}
    >
      <div className="space-y-8">

      {/* Platform Navigation Guide */}
      <div className="card animate-scale-in">
        <div className="flex items-center justify-between card-header">
          <h3 className="headline-3 mb-0">Platform Navigation Guide</h3>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-secondary"
          >
            {isExpanded ? 'Collapse' : 'Expand Guide'}
          </button>
        </div>
          
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div>
              <div className="card card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-900 flex items-center justify-center font-bold text-sm mr-3">1</div>
                  <h4 className="headline-4 mb-0">Portfolio Setup</h4>
                </div>
                <p className="body-base mb-3">
                  Load your loan portfolio data or use our 500-property sample dataset representing diverse geographic and asset class exposures.
                </p>
                <div className="status status-error">Start Here</div>
              </div>
                
              <div className="card card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-900 flex items-center justify-center font-bold text-sm mr-3">2</div>
                  <h4 className="headline-4 mb-0">Climate Scenarios</h4>
                </div>
                <p className="body-base mb-3">
                  Select Federal Reserve climate scenarios including orderly transition, disorderly transition, and hot house world pathways.
                </p>
                <div className="status status-warning">Configuration</div>
              </div>
                
              <div className="card card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-sm mr-3">3</div>
                  <h4 className="headline-4 mb-0">Methodology</h4>
                </div>
                <p className="body-base mb-3">
                  Detailed walkthrough of calculation methodology including climate risk adjustments, insurance modeling, and capital impact analysis.
                </p>
                <div className="status status-info">Technical Detail</div>
              </div>
            </div>
              
            <div>
              <div className="card card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-900 flex items-center justify-center font-bold text-sm mr-3">4</div>
                  <h4 className="headline-4 mb-0">Executive Summary</h4>
                </div>
                <p className="body-base mb-3">
                  High-level portfolio analysis with clear business objectives, key insights, and immediate action recommendations for leadership.
                </p>
                <div className="status status-error">Decision Making</div>
              </div>
                
              <div className="card card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-900 flex items-center justify-center font-bold text-sm mr-3">5</div>
                  <h4 className="headline-4 mb-0">Risk Management</h4>
                </div>
                <p className="body-base mb-3">
                  Advanced analytics including VaR analysis, concentration risk monitoring, and capital adequacy assessment under stress.
                </p>
                <div className="status status-warning">Deep Dive</div>
              </div>
                
              <div className="card card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-sm mr-3">6</div>
                  <h4 className="headline-4 mb-0">Regulatory</h4>
                </div>
                <p className="body-base mb-3">
                  CCAR-compliant reporting templates and documentation for regulatory submission and board presentation.
                </p>
                <div className="status status-info">Compliance</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics to Monitor */}
      <div className="card animate-scale-in">
        <div className="card-header">
          <h3 className="headline-3">Key Metrics for Executive Decision Making</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="metric-value" style={{color: 'var(--error-600)'}}>VaR 99%</div>
            <div className="metric-label">Maximum Loss Exposure</div>
            <p className="caption mt-2">Critical for capital planning and risk appetite setting</p>
          </div>
          
          <div className="metric-card">
            <div className="metric-value" style={{color: 'var(--warning-600)'}}>15%</div>
            <div className="metric-label">Concentration Limit</div>
            <p className="caption mt-2">Geographic exposure threshold requiring board approval</p>
          </div>
          
          <div className="metric-card">
            <div className="metric-value" style={{color: 'var(--info-600)'}}>8%</div>
            <div className="metric-label">Capital Minimum</div>
            <p className="caption mt-2">Regulatory capital ratio floor under stress scenarios</p>
          </div>
          
          <div className="metric-card">
            <div className="metric-value" style={{color: 'var(--success-600)'}}>2.5%</div>
            <div className="metric-label">Buffer Target</div>
            <p className="caption mt-2">Recommended capital buffer above regulatory minimum</p>
          </div>
        </div>

        {/* Business Context */}
        <div className="alert alert-info">
          <div className="alert-title">How to Interpret Results</div>
          <div className="alert-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="headline-4 mb-3">Strategic Perspective</div>
                <ul className="space-y-2 body-small">
                  <li>• Focus on worst-case scenario impacts for capital planning</li>
                  <li>• Monitor concentration alerts for portfolio rebalancing</li>
                  <li>• Track capital buffer adequacy for dividend policy</li>
                  <li>• Assess timeline for implementing recommendations</li>
                </ul>
              </div>
              <div>
                <div className="headline-4 mb-3">Regulatory Context</div>
                <ul className="space-y-2 body-small">
                  <li>• CCAR submissions require climate scenario analysis</li>
                  <li>• Basel III capital rules apply to climate-adjusted risk weights</li>
                  <li>• IFRS 9 forward-looking provisions incorporate climate factors</li>
                  <li>• Fed guidance emphasizes climate risk management frameworks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Framework */}
      <div className="card animate-scale-in">
        <div className="card-header">
          <h3 className="headline-3">Executive Action Framework</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{background: 'var(--error-600)'}}>1</div>
            <h4 className="headline-4 mb-2">Immediate (Next 30 Days)</h4>
            <p className="body-small">Review high-risk assets, assess capital adequacy, prepare board materials</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{background: 'var(--warning-600)'}}>2</div>
            <h4 className="headline-4 mb-2">Short-term (90 Days)</h4>
            <p className="body-small">Implement underwriting changes, update risk policies, begin portfolio rebalancing</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{background: 'var(--info-600)'}}>3</div>
            <h4 className="headline-4 mb-2">Strategic (6+ Months)</h4>
            <p className="body-small">Execute geographic diversification, enhance risk management capabilities</p>
          </div>
        </div>
      </div>
      </div>
    </McKinseySlide>
  )
}