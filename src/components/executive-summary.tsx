"use client"

import { useState } from 'react'

export default function ExecutiveSummary() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-8">
      {/* Executive Overview Card */}
      <div className="executive-card">
        <div className="mb-6">
          <h2 className="section-title mb-4">Executive Summary</h2>
          <div className="body-text mb-4">
            This platform provides comprehensive climate risk analysis for banking portfolios, 
            designed specifically for C-suite executives and risk management teams making strategic decisions.
          </div>
        </div>

        {/* Key Context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="objective-callout">
            <div className="objective-title">Business Problem</div>
            <div className="objective-content">
              Climate change poses significant financial risks to banking portfolios through physical damage and transition costs, 
              requiring quantitative assessment for regulatory compliance and strategic planning.
            </div>
          </div>
          
          <div className="insight-callout">
            <div className="insight-title">Our Approach</div>
            <div className="insight-content">
              Advanced stress testing using Federal Reserve climate scenarios to quantify portfolio-level impacts 
              on expected losses, capital adequacy, and geographic concentration risks.
            </div>
          </div>
          
          <div className="alert-success">
            <div className="text-xs font-bold mb-1" style={{color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Expected Outcome</div>
            <div className="text-sm" style={{color: 'var(--text-primary)', lineHeight: '1.4'}}>
              Actionable insights for capital planning, portfolio optimization, and regulatory reporting 
              with specific recommendations and timelines.
            </div>
          </div>
        </div>

        {/* Platform Navigation Guide */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="subsection-title mb-0">Platform Navigation Guide</h3>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn-secondary"
            >
              {isExpanded ? 'Collapse' : 'Expand Guide'}
            </button>
          </div>
          
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="action-item action-priority-1">
                  <div className="action-title">1. Portfolio Setup</div>
                  <div className="body-text mb-2">
                    Load your loan portfolio data or use our 500-property sample dataset representing diverse geographic and asset class exposures.
                  </div>
                  <div className="action-timeline">Start Here</div>
                </div>
                
                <div className="action-item action-priority-2">
                  <div className="action-title">2. Climate Scenarios</div>
                  <div className="body-text mb-2">
                    Select Federal Reserve climate scenarios including orderly transition, disorderly transition, and hot house world pathways.
                  </div>
                  <div className="action-timeline">Configuration</div>
                </div>
                
                <div className="action-item action-priority-3">
                  <div className="action-title">3. Methodology</div>
                  <div className="body-text mb-2">
                    Detailed walkthrough of calculation methodology including climate risk adjustments, insurance modeling, and capital impact analysis.
                  </div>
                  <div className="action-timeline">Technical Detail</div>
                </div>
              </div>
              
              <div>
                <div className="action-item action-priority-1">
                  <div className="action-title">4. Executive Summary</div>
                  <div className="body-text mb-2">
                    High-level portfolio analysis with clear business objectives, key insights, and immediate action recommendations for leadership.
                  </div>
                  <div className="action-timeline">Decision Making</div>
                </div>
                
                <div className="action-item action-priority-2">
                  <div className="action-title">5. Risk Management</div>
                  <div className="body-text mb-2">
                    Advanced analytics including VaR analysis, concentration risk monitoring, and capital adequacy assessment under stress.
                  </div>
                  <div className="action-timeline">Deep Dive</div>
                </div>
                
                <div className="action-item action-priority-3">
                  <div className="action-title">6. Regulatory</div>
                  <div className="body-text mb-2">
                    CCAR-compliant reporting templates and documentation for regulatory submission and board presentation.
                  </div>
                  <div className="action-timeline">Compliance</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics to Monitor */}
        <div className="mb-6">
          <h3 className="subsection-title">Key Metrics for Executive Decision Making</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-value" style={{color: 'var(--error)'}}>VaR 99%</div>
              <div className="metric-label">Maximum Loss Exposure</div>
              <div className="caption-text mt-2">Critical for capital planning and risk appetite setting</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value" style={{color: 'var(--warning)'}}>15%</div>
              <div className="metric-label">Concentration Limit</div>
              <div className="caption-text mt-2">Geographic exposure threshold requiring board approval</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value" style={{color: 'var(--info)'}}>8%</div>
              <div className="metric-label">Capital Minimum</div>
              <div className="caption-text mt-2">Regulatory capital ratio floor under stress scenarios</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value" style={{color: 'var(--success)'}}>2.5%</div>
              <div className="metric-label">Buffer Target</div>
              <div className="caption-text mt-2">Recommended capital buffer above regulatory minimum</div>
            </div>
          </div>
        </div>

        {/* Business Context */}
        <div className="objective-callout">
          <div className="objective-title">How to Interpret Results</div>
          <div className="objective-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold mb-2" style={{color: 'var(--primary-blue)'}}>Strategic Perspective</div>
                <ul className="space-y-1 text-sm">
                  <li>• Focus on worst-case scenario impacts for capital planning</li>
                  <li>• Monitor concentration alerts for portfolio rebalancing</li>
                  <li>• Track capital buffer adequacy for dividend policy</li>
                  <li>• Assess timeline for implementing recommendations</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-2" style={{color: 'var(--primary-blue)'}}>Regulatory Context</div>
                <ul className="space-y-1 text-sm">
                  <li>• CCAR submissions require climate scenario analysis</li>
                  <li>• Basel III capital rules apply to climate-adjusted risk weights</li>
                  <li>• IFRS 9 forward-looking provisions incorporate climate factors</li>
                  <li>• Fed guidance emphasizes climate risk management frameworks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Framework */}
        <div className="mt-6 p-6 rounded-lg border" style={{borderColor: 'var(--border-light)', background: 'var(--surface)'}}>
          <h3 className="subsection-title mb-4">Executive Action Framework</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{background: 'var(--error)'}}>1</div>
              <div className="font-semibold mb-2">Immediate (Next 30 Days)</div>
              <div className="caption-text">Review high-risk assets, assess capital adequacy, prepare board materials</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{background: 'var(--warning)'}}>2</div>
              <div className="font-semibold mb-2">Short-term (90 Days)</div>
              <div className="caption-text">Implement underwriting changes, update risk policies, begin portfolio rebalancing</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{background: 'var(--info)'}}>3</div>
              <div className="font-semibold mb-2">Strategic (6+ Months)</div>
              <div className="caption-text">Execute geographic diversification, enhance risk management capabilities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}