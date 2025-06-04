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
    <div className="min-h-screen">
      {/* Modern Hero Header */}
      <header className="hero">
        <div className="hero-content">
          <div className="container">
            <h1 className="hero-title animate-fade-in">
              Climate Risk Analysis Platform
            </h1>
            <p className="hero-subtitle animate-fade-in">
              Advanced stress testing and portfolio risk assessment for regulatory compliance and strategic decision making
            </p>
            
            {/* Executive Compliance Indicators */}
            <div className="flex justify-center flex-wrap gap-8 animate-fade-in mt-8">
              <div className="flex items-center text-white/90 text-sm font-light">
                <div className="w-2 h-2 rounded-full bg-teal-400 mr-3"></div>
                CCAR Compliant
              </div>
              <div className="flex items-center text-white/90 text-sm font-light">
                <div className="w-2 h-2 rounded-full bg-teal-400 mr-3"></div>
                Basel III
              </div>
              <div className="flex items-center text-white/90 text-sm font-light">
                <div className="w-2 h-2 rounded-full bg-teal-400 mr-3"></div>
                Fed Scenarios
              </div>
              <div className="flex items-center text-white/90 text-sm font-light">
                <div className="w-2 h-2 rounded-full bg-teal-400 mr-3"></div>
                IFRS 9
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Modern Layout */}
      <main className="section">
        <div className="container">
          {/* Executive Summary - Always Visible */}
          <div className="animate-fade-in">
            <ExecutiveSummary />
          </div>
          
          <Tabs defaultValue="portfolio" className="space-y-8">
            {/* Modern Navigation */}
            <div className="flex justify-center animate-scale-in">
              <TabsList className="nav-tabs">
                <TabsTrigger value="portfolio">Portfolio Setup</TabsTrigger>
                <TabsTrigger value="scenarios">Climate Scenarios</TabsTrigger>
                <TabsTrigger value="calculations">Methodology</TabsTrigger>
                <TabsTrigger value="results">Executive Summary</TabsTrigger>
                <TabsTrigger value="advanced">Risk Management</TabsTrigger>
                <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="portfolio" className="space-y-8 animate-fade-in">
              <PortfolioInput onPortfolioUpdate={setPortfolio} />
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-8 animate-fade-in">
              <ScenarioSelection onScenariosChange={setSelectedScenarios} />
            </TabsContent>

            <TabsContent value="calculations" className="space-y-8 animate-fade-in">
              <CalculationWalkthrough 
                portfolio={portfolio} 
                scenarios={selectedScenarios}
              />
            </TabsContent>

            <TabsContent value="results" className="space-y-8 animate-fade-in">
              <ResultsDashboard 
                portfolio={portfolio} 
                scenarios={selectedScenarios}
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-8 animate-fade-in">
              <RiskManagementDashboard 
                portfolio={portfolio} 
                scenarios={selectedScenarios}
              />
            </TabsContent>

            <TabsContent value="regulatory" className="space-y-8 animate-fade-in">
              <RegulatoryReporting 
                portfolio={portfolio} 
                scenarios={selectedScenarios}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="section-sm" style={{borderTop: '1px solid var(--neutral-200)', background: 'var(--surface-primary)'}}>
        <div className="container">
          <div className="text-center">
            <p className="body-small mb-2">
              Professional Climate Risk Analysis Platform
            </p>
            <p className="caption">
              Designed for executive decision making and regulatory compliance
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}