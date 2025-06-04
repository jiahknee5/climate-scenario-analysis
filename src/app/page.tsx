"use client"

import { useState } from 'react'
import { LoanPortfolio, ClimateScenario } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PortfolioInput from '@/components/portfolio-input'
import ScenarioSelection from '@/components/scenario-selection'
import ResultsDashboard from '@/components/results-dashboard'
import RegulatoryReporting from '@/components/regulatory-reporting'
import CalculationWalkthrough from '@/components/calculation-walkthrough'
import RiskManagementDashboard from '@/components/risk-management-dashboard'
import ExecutiveSummary from '@/components/executive-summary'

export default function Home() {
  const [portfolio, setPortfolio] = useState<LoanPortfolio[]>([])
  const [selectedScenarios, setSelectedScenarios] = useState<ClimateScenario[]>([])

  return (
    <div className="min-h-screen" style={{background: 'var(--background)'}}>
      {/* Executive Header */}
      <header className="bg-white border-b" style={{borderColor: 'var(--border-light)', boxShadow: 'var(--shadow-light)'}}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Executive Title Section */}
          <div className="text-center mb-6">
            <h1 className="executive-title">
              Climate Risk Analysis Platform
            </h1>
            <div className="body-text max-w-3xl mx-auto mb-6">
              Advanced stress testing and portfolio risk assessment for regulatory compliance and strategic decision making
            </div>
            
            {/* Compliance Badges */}
            <div className="flex justify-center flex-wrap gap-3">
              <div className="flex items-center px-4 py-2 rounded-lg border" style={{borderColor: 'var(--border-light)', background: 'var(--surface)'}}>
                <div className="w-2 h-2 rounded-full mr-2" style={{background: 'var(--success)'}}></div>
                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>CCAR Compliant</span>
              </div>
              <div className="flex items-center px-4 py-2 rounded-lg border" style={{borderColor: 'var(--border-light)', background: 'var(--surface)'}}>
                <div className="w-2 h-2 rounded-full mr-2" style={{background: 'var(--info)'}}></div>
                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Basel III</span>
              </div>
              <div className="flex items-center px-4 py-2 rounded-lg border" style={{borderColor: 'var(--border-light)', background: 'var(--surface)'}}>
                <div className="w-2 h-2 rounded-full mr-2" style={{background: 'var(--primary-blue)'}}></div>
                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Fed Scenarios</span>
              </div>
              <div className="flex items-center px-4 py-2 rounded-lg border" style={{borderColor: 'var(--border-light)', background: 'var(--surface)'}}>
                <div className="w-2 h-2 rounded-full mr-2" style={{background: 'var(--accent-orange)'}}></div>
                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>IFRS 9</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Executive Summary - Always Visible */}
        <ExecutiveSummary />
        
        <Tabs defaultValue="portfolio" className="space-y-8">
          {/* Executive Navigation */}
          <div className="flex justify-center">
            <TabsList className="inline-flex bg-white border rounded-lg p-1" style={{borderColor: 'var(--border-light)', boxShadow: 'var(--shadow-light)'}}>
              <TabsTrigger value="portfolio" className="px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Portfolio Setup</TabsTrigger>
              <TabsTrigger value="scenarios" className="px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Climate Scenarios</TabsTrigger>
              <TabsTrigger value="calculations" className="px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Methodology</TabsTrigger>
              <TabsTrigger value="results" className="px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Executive Summary</TabsTrigger>
              <TabsTrigger value="advanced" className="px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Risk Management</TabsTrigger>
              <TabsTrigger value="regulatory" className="px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Regulatory</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioInput onPortfolioUpdate={setPortfolio} />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <ScenarioSelection onScenariosChange={setSelectedScenarios} />
          </TabsContent>

          <TabsContent value="calculations" className="space-y-6">
            <CalculationWalkthrough 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultsDashboard 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <RiskManagementDashboard 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>

          <TabsContent value="regulatory" className="space-y-6">
            <RegulatoryReporting 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Executive Footer */}
      <footer className="mt-16 pt-8" style={{borderTop: '1px solid var(--border-light)'}}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="caption-text mb-2">
              Professional Climate Risk Analysis Platform
            </div>
            <div className="caption-text">
              Designed for executive decision making and regulatory compliance
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}