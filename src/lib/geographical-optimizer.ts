import { LoanData } from '@/types/loan-data';
import { ClimateXData } from '@/types/climate-data';

/**
 * Geographical Portfolio Optimization Engine
 * 
 * Provides recommendations for geographical diversification and risk concentration
 * management based on climate scenario analysis and modern portfolio theory principles.
 * 
 * Key analyses:
 * 1. Geographic concentration risk assessment
 * 2. Optimal portfolio allocation recommendations
 * 3. Marginal risk contribution by geography
 * 4. Diversification opportunity identification
 */

export interface GeographicRiskMetrics {
  region_id: string;
  region_name: string;
  current_allocation: number;      // % of portfolio
  optimal_allocation: number;      // Recommended % allocation
  risk_contribution: number;       // Marginal risk contribution
  sharpe_ratio: number;           // Risk-adjusted return metric
  climate_beta: number;           // Sensitivity to climate scenarios
  diversification_benefit: number; // Benefit from including this region
}

export interface OptimizationRecommendation {
  recommendation_type: 'reduce_exposure' | 'increase_exposure' | 'maintain_allocation' | 'exit_market';
  region: string;
  current_exposure: number;
  recommended_exposure: number;
  rationale: string;
  expected_benefit: number;        // Expected reduction in portfolio risk
  implementation_priority: 'high' | 'medium' | 'low';
  time_horizon: string;
}

export interface SensitivityAnalysis {
  parameter: string;
  base_value: number;
  sensitivity_range: { min: number; max: number };
  impact_on_expected_loss: number[];
  impact_on_var_95: number[];
  impact_on_concentration: number[];
  elasticity: number;              // % change in outcome / % change in parameter
}

export class GeographicalOptimizer {
  
  /**
   * Analyze current geographical risk concentration
   * @param loans Portfolio of loans
   * @param climateData Climate-X data for all properties
   * @param scenarios Array of climate scenarios to analyze
   */
  static analyzeGeographicRisk(
    loans: LoanData[],
    climateData: ClimateXData[],
    scenarios: string[]
  ): GeographicRiskMetrics[] {
    
    // Group portfolio by geographic regions
    const regions = this.groupByGeography(loans);
    const metrics: GeographicRiskMetrics[] = [];
    
    regions.forEach((regionLoans, regionId) => {
      const regionMetrics = this.calculateRegionMetrics(
        regionId,
        regionLoans,
        loans,
        climateData,
        scenarios
      );
      metrics.push(regionMetrics);
    });
    
    return metrics.sort((a, b) => b.risk_contribution - a.risk_contribution);
  }
  
  /**
   * Generate portfolio optimization recommendations
   * @param currentMetrics Current geographic risk metrics
   * @param riskBudget Maximum acceptable portfolio risk level
   * @param returnRequirement Minimum required portfolio return
   */
  static generateOptimizationRecommendations(
    currentMetrics: GeographicRiskMetrics[],
    riskBudget: number,
    returnRequirement: number
  ): OptimizationRecommendation[] {
    
    const recommendations: OptimizationRecommendation[] = [];
    
    // Calculate optimal allocations using mean-variance optimization
    const optimalAllocations = this.calculateOptimalAllocations(
      currentMetrics,
      riskBudget,
      returnRequirement
    );
    
    currentMetrics.forEach((metric, index) => {
      const optimalAllocation = optimalAllocations[index];
      const allocationDelta = optimalAllocation - metric.current_allocation;
      
      let recommendationType: OptimizationRecommendation['recommendation_type'];
      let rationale: string;
      let priority: OptimizationRecommendation['implementation_priority'];
      
      if (Math.abs(allocationDelta) < 0.02) { // Less than 2% change
        recommendationType = 'maintain_allocation';
        rationale = `Current allocation is near optimal. Minor adjustments of ${(allocationDelta * 100).toFixed(1)}% recommended.`;
        priority = 'low';
      } else if (allocationDelta > 0.05) { // Increase by more than 5%
        recommendationType = 'increase_exposure';
        rationale = `Region shows attractive risk-adjusted returns. Consider increasing allocation by ${(allocationDelta * 100).toFixed(1)}%.`;
        priority = metric.sharpe_ratio > 0.5 ? 'high' : 'medium';
      } else if (allocationDelta < -0.05) { // Decrease by more than 5%
        recommendationType = 'reduce_exposure';
        rationale = `High risk concentration detected. Reduce allocation by ${(Math.abs(allocationDelta) * 100).toFixed(1)}% to improve diversification.`;
        priority = metric.risk_contribution > 0.3 ? 'high' : 'medium';
      } else {
        recommendationType = metric.climate_beta > 2.0 ? 'reduce_exposure' : 'increase_exposure';
        rationale = `Moderate adjustment needed. Climate sensitivity ${metric.climate_beta > 2.0 ? 'high' : 'acceptable'}.`;
        priority = 'medium';
      }
      
      // Special case: recommend exit for extremely high-risk regions
      if (metric.climate_beta > 3.0 && metric.risk_contribution > 0.4) {
        recommendationType = 'exit_market';
        rationale = `Extreme climate risk and concentration detected. Consider gradual exit from this market.`;
        priority = 'high';
      }
      
      recommendations.push({
        recommendation_type: recommendationType,
        region: metric.region_name,
        current_exposure: metric.current_allocation,
        recommended_exposure: optimalAllocation,
        rationale: rationale,
        expected_benefit: this.calculateExpectedBenefit(metric, allocationDelta),
        implementation_priority: priority,
        time_horizon: priority === 'high' ? '1-2 years' : priority === 'medium' ? '2-3 years' : '3-5 years'
      });
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.implementation_priority] - priorityOrder[a.implementation_priority];
    });
  }
  
  /**
   * Perform comprehensive sensitivity analysis
   * @param loans Portfolio data
   * @param baseMetrics Base case metrics
   * @param parameters Parameters to analyze
   */
  static performSensitivityAnalysis(
    loans: LoanData[],
    baseMetrics: GeographicRiskMetrics[],
    parameters: {
      climate_multiplier: { min: 0.8; max: 1.5 };
      property_value_volatility: { min: 0.1; max: 0.4 };
      correlation_factor: { min: 0.2; max: 0.8 };
      interest_rate_shock: { min: -0.02; max: 0.04 };
      insurance_cost_multiplier: { min: 0.8; max: 2.0 };
    }
  ): SensitivityAnalysis[] {
    
    const sensitivities: SensitivityAnalysis[] = [];
    const parameterNames = Object.keys(parameters);
    
    parameterNames.forEach(paramName => {
      const paramRange = parameters[paramName as keyof typeof parameters];
      const baseValue = (paramRange.min + paramRange.max) / 2;
      
      // Generate test points across the parameter range
      const testPoints = this.generateSensitivityPoints(paramRange.min, paramRange.max, 11);
      
      const impactResults = testPoints.map(testValue => {
        // Recalculate metrics with parameter shock
        const shockedMetrics = this.recalculateWithParameterShock(
          loans,
          baseMetrics,
          paramName,
          testValue
        );
        
        return {
          parameter_value: testValue,
          expected_loss: shockedMetrics.total_expected_loss,
          var_95: shockedMetrics.var_95,
          concentration: shockedMetrics.concentration_index
        };
      });
      
      // Calculate elasticity (sensitivity coefficient)
      const elasticity = this.calculateElasticity(impactResults, baseValue);
      
      sensitivities.push({
        parameter: paramName,
        base_value: baseValue,
        sensitivity_range: paramRange,
        impact_on_expected_loss: impactResults.map(r => r.expected_loss),
        impact_on_var_95: impactResults.map(r => r.var_95),
        impact_on_concentration: impactResults.map(r => r.concentration),
        elasticity: elasticity
      });
    });
    
    // Sort by elasticity (most sensitive parameters first)
    return sensitivities.sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity));
  }
  
  /**
   * Calculate optimal allocations using modern portfolio theory
   */
  private static calculateOptimalAllocations(
    metrics: GeographicRiskMetrics[],
    riskBudget: number,
    returnRequirement: number
  ): number[] {
    
    // Build covariance matrix (simplified approach)
    const covarianceMatrix = this.buildCovarianceMatrix(metrics);
    const expectedReturns = metrics.map(m => m.sharpe_ratio * 0.1); // Convert Sharpe to return proxy
    
    // Solve optimization problem using quadratic programming approximation
    // Minimize: w'Σw subject to w'μ >= return requirement and sum(w) = 1
    
    const optimalWeights = this.solvePortfolioOptimization(
      covarianceMatrix,
      expectedReturns
    );
    
    return optimalWeights;
  }
  
  /**
   * Group loans by geographic regions for analysis
   */
  private static groupByGeography(loans: LoanData[]): Map<string, LoanData[]> {
    const regions = new Map<string, LoanData[]>();
    
    loans.forEach(loan => {
      const regionKey = `${loan.address.state}-${loan.address.county}`;
      if (!regions.has(regionKey)) {
        regions.set(regionKey, []);
      }
      regions.get(regionKey)!.push(loan);
    });
    
    return regions;
  }
  
  /**
   * Calculate risk metrics for a specific geographic region
   */
  private static calculateRegionMetrics(
    regionId: string,
    regionLoans: LoanData[],
    allLoans: LoanData[],
    climateData: ClimateXData[],
    scenarios: string[]
  ): GeographicRiskMetrics {
    
    const totalPortfolioValue = allLoans.reduce((sum, loan) => sum + loan.outstanding_balance, 0);
    const regionValue = regionLoans.reduce((sum, loan) => sum + loan.outstanding_balance, 0);
    const currentAllocation = regionValue / totalPortfolioValue;
    
    // Calculate climate beta (sensitivity to climate scenarios)
    const climateBeta = this.calculateClimateBeta(regionLoans, climateData, scenarios);
    
    // Calculate risk contribution
    const riskContribution = this.calculateRiskContribution(regionLoans, allLoans);
    
    // Calculate Sharpe ratio proxy
    const sharpeRatio = this.calculateRegionSharpeRatio(regionLoans);
    
    // Calculate diversification benefit
    const diversificationBenefit = this.calculateDiversificationBenefit(regionLoans, allLoans);
    
    return {
      region_id: regionId,
      region_name: regionLoans[0].address.state + ' - ' + regionLoans[0].address.county,
      current_allocation: currentAllocation,
      optimal_allocation: currentAllocation, // Will be updated by optimization
      risk_contribution: riskContribution,
      sharpe_ratio: sharpeRatio,
      climate_beta: climateBeta,
      diversification_benefit: diversificationBenefit
    };
  }
  
  /**
   * Calculate climate beta (sensitivity to climate scenarios)
   */
  private static calculateClimateBeta(
    regionLoans: LoanData[],
    climateData: ClimateXData[],
    scenarios: string[]
  ): number {
    
    // Simplified climate beta calculation
    // Beta = Cov(region_return, climate_factor) / Var(climate_factor)
    
    const baselineExpectedLoss = regionLoans.reduce((sum, loan) => 
      sum + loan.risk_metrics.expected_loss, 0);
    
    let totalScenarioVariance = 0;
    let totalCovariance = 0;
    
    scenarios.forEach(scenario => {
      const scenarioMultiplier = this.getScenarioMultiplier(scenario);
      const scenarioExpectedLoss = baselineExpectedLoss * scenarioMultiplier;
      
      const lossDelta = scenarioExpectedLoss - baselineExpectedLoss;
      const climateDelta = scenarioMultiplier - 1.0;
      
      totalCovariance += lossDelta * climateDelta;
      totalScenarioVariance += climateDelta * climateDelta;
    });
    
    return totalScenarioVariance > 0 ? totalCovariance / totalScenarioVariance : 1.0;
  }
  
  /**
   * Calculate marginal risk contribution
   */
  private static calculateRiskContribution(regionLoans: LoanData[], allLoans: LoanData[]): number {
    const regionRisk = this.calculatePortfolioRisk(regionLoans);
    const totalRisk = this.calculatePortfolioRisk(allLoans);
    const regionWeight = regionLoans.length / allLoans.length;
    
    return (regionRisk * regionWeight) / totalRisk;
  }
  
  /**
   * Calculate portfolio risk (simplified variance measure)
   */
  private static calculatePortfolioRisk(loans: LoanData[]): number {
    const expectedLosses = loans.map(loan => loan.risk_metrics.expected_loss);
    const meanLoss = expectedLosses.reduce((sum, loss) => sum + loss, 0) / loans.length;
    
    const variance = expectedLosses.reduce((sum, loss) => 
      sum + Math.pow(loss - meanLoss, 2), 0) / loans.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Calculate region Sharpe ratio proxy
   */
  private static calculateRegionSharpeRatio(regionLoans: LoanData[]): number {
    // Simplified: (Expected Return - Risk-free Rate) / Volatility
    const avgInterestRate = regionLoans.reduce((sum, loan) => sum + loan.interest_rate, 0) / regionLoans.length;
    const riskFreeRate = 0.03; // 3% risk-free rate assumption
    const excessReturn = avgInterestRate - riskFreeRate;
    
    const portfolioRisk = this.calculatePortfolioRisk(regionLoans);
    const riskAdjustedReturn = portfolioRisk > 0 ? excessReturn / portfolioRisk : 0;
    
    return Math.max(0, Math.min(2.0, riskAdjustedReturn)); // Cap between 0 and 2
  }
  
  /**
   * Helper methods for optimization calculations
   */
  private static buildCovarianceMatrix(metrics: GeographicRiskMetrics[]): number[][] {
    const n = metrics.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    // Simplified covariance estimation
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = Math.pow(metrics[i].risk_contribution, 2);
        } else {
          // Correlation based on climate beta similarity
          const correlation = 1 / (1 + Math.abs(metrics[i].climate_beta - metrics[j].climate_beta));
          matrix[i][j] = correlation * metrics[i].risk_contribution * metrics[j].risk_contribution;
        }
      }
    }
    
    return matrix;
  }
  
  private static solvePortfolioOptimization(
    covariance: number[][],
    returns: number[]
  ): number[] {
    
    // Simplified optimization using risk parity with return adjustment
    const n = returns.length;
    const weights = Array(n).fill(1 / n); // Start with equal weights
    
    // Adjust weights based on risk-return profile
    for (let i = 0; i < n; i++) {
      const riskAdjustedReturn = returns[i] / Math.sqrt(covariance[i][i]);
      weights[i] = Math.max(0.01, Math.min(0.5, riskAdjustedReturn / 2)); // Cap between 1% and 50%
    }
    
    // Normalize to sum to 1
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => w / totalWeight);
  }
  
  private static generateSensitivityPoints(min: number, max: number, count: number): number[] {
    const points: number[] = [];
    const step = (max - min) / (count - 1);
    
    for (let i = 0; i < count; i++) {
      points.push(min + i * step);
    }
    
    return points;
  }
  
  private static recalculateWithParameterShock(
    loans: LoanData[],
    baseMetrics: GeographicRiskMetrics[],
    parameter: string,
    shockValue: number
  ): { total_expected_loss: number; var_95: number; concentration_index: number } {
    
    // Apply parameter shock and recalculate key metrics
    let totalExpectedLoss = 0;
    let concentrationIndex = 0;
    
    baseMetrics.forEach(metric => {
      let adjustmentFactor = 1.0;
      
      switch (parameter) {
        case 'climate_multiplier':
          adjustmentFactor = shockValue;
          break;
        case 'property_value_volatility':
          adjustmentFactor = 1 + (shockValue - 0.2) * metric.climate_beta;
          break;
        case 'correlation_factor':
          adjustmentFactor = 1 + (shockValue - 0.5) * 0.5;
          break;
        case 'interest_rate_shock':
          adjustmentFactor = 1 + shockValue * 2; // Interest rate sensitivity
          break;
        case 'insurance_cost_multiplier':
          adjustmentFactor = shockValue;
          break;
      }
      
      const adjustedRiskContribution = metric.risk_contribution * adjustmentFactor;
      totalExpectedLoss += adjustedRiskContribution;
      concentrationIndex += Math.pow(adjustedRiskContribution, 2);
    });
    
    return {
      total_expected_loss: totalExpectedLoss,
      var_95: totalExpectedLoss * 2.33, // Approximate 95% VaR
      concentration_index: concentrationIndex
    };
  }
  
  private static calculateElasticity(
    results: { parameter_value: number; expected_loss: number }[],
    baseValue: number
  ): number {
    
    // Calculate elasticity as % change in outcome / % change in parameter
    const baseResult = results.find(r => Math.abs(r.parameter_value - baseValue) < 0.01);
    if (!baseResult) return 0;
    
    // Use average elasticity across the range
    let totalElasticity = 0;
    let count = 0;
    
    for (let i = 1; i < results.length; i++) {
      const prevResult = results[i - 1];
      const currResult = results[i];
      
      const parameterChange = (currResult.parameter_value - prevResult.parameter_value) / prevResult.parameter_value;
      const outcomeChange = (currResult.expected_loss - prevResult.expected_loss) / prevResult.expected_loss;
      
      if (Math.abs(parameterChange) > 0.001) {
        totalElasticity += outcomeChange / parameterChange;
        count++;
      }
    }
    
    return count > 0 ? totalElasticity / count : 0;
  }
  
  private static getScenarioMultiplier(scenario: string): number {
    const multipliers = {
      'rcp_26': 1.1,
      'rcp_45': 1.25,
      'rcp_60': 1.35,
      'rcp_85': 1.6
    };
    
    return multipliers[scenario as keyof typeof multipliers] || 1.0;
  }
  
  private static calculateExpectedBenefit(
    metric: GeographicRiskMetrics,
    allocationDelta: number
  ): number {
    // Estimate risk reduction from allocation change
    return Math.abs(allocationDelta) * metric.risk_contribution * 0.5; // 50% efficiency assumption
  }
  
  private static calculateDiversificationBenefit(
    regionLoans: LoanData[],
    allLoans: LoanData[]
  ): number {
    
    const regionRisk = this.calculatePortfolioRisk(regionLoans);
    const portfolioRisk = this.calculatePortfolioRisk(allLoans);
    const regionWeight = regionLoans.length / allLoans.length;
    
    const standaloneRisk = regionRisk * regionWeight;
    const marginalRisk = portfolioRisk * regionWeight;
    
    return standaloneRisk > 0 ? (standaloneRisk - marginalRisk) / standaloneRisk : 0;
  }
}