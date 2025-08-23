import { InsurancePremium } from '@/types/climate-data';
import { LoanData } from '@/types/loan-data';

/**
 * Young (2004) Insurance Premium Calculation
 * Reference: "Catastrophe Insurance: Consumer Demand, Markets and Regulation" 
 * 
 * The Young 2004 model calculates insurance premiums based on:
 * 1. Expected Loss (Pure Premium)
 * 2. Risk Loading (uncertainty adjustment)
 * 3. Expense Ratio (operational costs)
 * 4. Profit Margin (return on capital)
 * 
 * Formula: Premium = (Expected Loss × Risk Loading) / (1 - Expense Ratio - Profit Margin)
 */

export class Young2004InsuranceCalculator {
  
  /**
   * Calculate insurance premium using Young 2004 methodology
   * @param loan Loan data with property information
   * @param expectedAnnualLoss Expected annual loss from climate hazards
   * @param riskParameters Risk parameters for the calculation
   */
  static calculatePremium(
    loan: LoanData,
    expectedAnnualLoss: number,
    riskParameters: {
      correlationFactor: number;      // Correlation with other risks (0-1)
      uncertaintyCoefficient: number; // Uncertainty in loss estimates (typically 0.1-0.3)
      expenseRatio: number;          // Operating expense ratio (typically 0.25-0.35)
      profitMargin: number;          // Profit margin (typically 0.05-0.15)
      capitalRequirement: number;    // Capital requirement as % of premium (typically 0.2-0.4)
    }
  ): InsurancePremium {
    
    // Step 1: Calculate Risk Loading using Young 2004 formula
    const riskLoading = this.calculateRiskLoading(
      expectedAnnualLoss,
      loan.property_value,
      riskParameters.correlationFactor,
      riskParameters.uncertaintyCoefficient
    );
    
    // Step 2: Calculate loaded expected loss
    const loadedExpectedLoss = expectedAnnualLoss * (1 + riskLoading);
    
    // Step 3: Calculate gross premium including expenses and profit
    const grossPremium = loadedExpectedLoss / 
      (1 - riskParameters.expenseRatio - riskParameters.profitMargin);
    
    // Step 4: Separate hazard and flood components
    const hazardComponent = this.separateHazardComponents(
      loan,
      grossPremium
    );
    
    return {
      loan_id: loan.loan_id,
      hazard_insurance: {
        coverage_amount: loan.insurance_coverage.hazard_insurance_amount,
        premium_annual: hazardComponent.hazard_premium,
        deductible: this.calculateDeductible(loan.property_value, 'hazard'),
        coverage_type: this.determineCoverageType(loan.property_value)
      },
      flood_insurance: {
        coverage_amount: loan.insurance_coverage.flood_insurance_amount,
        premium_annual: hazardComponent.flood_premium,
        deductible: this.calculateDeductible(loan.property_value, 'flood'),
        nfip_eligible: this.isNFIPEligible(loan.address.state)
      },
      young_2004_metrics: {
        expected_loss: expectedAnnualLoss,
        risk_loading: riskLoading,
        expense_ratio: riskParameters.expenseRatio,
        profit_margin: riskParameters.profitMargin
      }
    };
  }
  
  /**
   * Calculate risk loading using Young 2004 methodology
   * Risk Loading = (Variance / Expected Loss) × Correlation × Uncertainty
   */
  private static calculateRiskLoading(
    expectedLoss: number,
    propertyValue: number,
    correlationFactor: number,
    uncertaintyCoefficient: number
  ): number {
    
    // Estimate variance using property value and expected loss
    // Higher property values tend to have higher variance in losses
    const coefficientOfVariation = Math.min(2.0, 
      0.5 + (propertyValue / 1000000) * 0.3 + uncertaintyCoefficient
    );
    
    const variance = Math.pow(expectedLoss * coefficientOfVariation, 2);
    
    // Risk loading formula from Young 2004
    if (expectedLoss <= 0) return 0;
    
    const basicRiskLoading = variance / Math.pow(expectedLoss, 2);
    const adjustedRiskLoading = basicRiskLoading * correlationFactor * (1 + uncertaintyCoefficient);
    
    // Cap risk loading at reasonable levels (typically 0.1 to 1.0)
    return Math.min(1.0, Math.max(0.1, adjustedRiskLoading));
  }
  
  /**
   * Separate total premium into hazard and flood components
   */
  private static separateHazardComponents(
    loan: LoanData,
    totalPremium: number
  ): { hazard_premium: number; flood_premium: number } {
    
    // Use existing baseline premiums as proportional weights
    const baselineHazard = loan.insurance_coverage.hazard_premium_annual;
    const baselineFlood = loan.insurance_coverage.flood_premium_annual;
    const baselineTotal = baselineHazard + baselineFlood;
    
    if (baselineTotal === 0) {
      return {
        hazard_premium: totalPremium * 0.7, // Default 70% hazard
        flood_premium: totalPremium * 0.3   // Default 30% flood
      };
    }
    
    const hazardProportion = baselineHazard / baselineTotal;
    const floodProportion = baselineFlood / baselineTotal;
    
    return {
      hazard_premium: totalPremium * hazardProportion,
      flood_premium: totalPremium * floodProportion
    };
  }
  
  /**
   * Calculate appropriate deductible based on property value and coverage type
   */
  private static calculateDeductible(propertyValue: number, coverageType: 'hazard' | 'flood'): number {
    const baseDeductibleRate = coverageType === 'hazard' ? 0.01 : 0.02; // 1% for hazard, 2% for flood
    const minDeductible = coverageType === 'hazard' ? 500 : 1000;
    const maxDeductible = coverageType === 'hazard' ? 25000 : 10000;
    
    const calculatedDeductible = propertyValue * baseDeductibleRate;
    return Math.min(maxDeductible, Math.max(minDeductible, calculatedDeductible));
  }
  
  /**
   * Determine coverage type based on property value and risk profile
   */
  private static determineCoverageType(propertyValue: number): 'basic' | 'extended' | 'comprehensive' {
    if (propertyValue < 300000) return 'basic';
    if (propertyValue < 750000) return 'extended';
    return 'comprehensive';
  }
  
  /**
   * Check NFIP eligibility based on location
   */
  private static isNFIPEligible(state: string): boolean {
    // Most states participate in NFIP, with some exceptions
    const nonParticipatingStates = ['ID']; // Example - Idaho has limited participation
    return !nonParticipatingStates.includes(state);
  }
  
  /**
   * Calculate climate-adjusted premiums for different scenarios
   * @param basePremium Base premium from Young 2004 calculation
   * @param climateMultiplier Climate scenario hazard multiplier
   * @param timeHorizon Time horizon for the projection (years)
   */
  static calculateClimateAdjustedPremium(
    basePremium: InsurancePremium,
    climateMultiplier: number,
    timeHorizon: number
  ): InsurancePremium {
    
    // Apply time-adjusted climate multiplier
    const timeAdjustedMultiplier = 1 + (climateMultiplier - 1) * Math.min(timeHorizon / 30, 1);
    
    return {
      ...basePremium,
      hazard_insurance: {
        ...basePremium.hazard_insurance,
        premium_annual: basePremium.hazard_insurance.premium_annual * timeAdjustedMultiplier
      },
      flood_insurance: {
        ...basePremium.flood_insurance,
        premium_annual: basePremium.flood_insurance.premium_annual * timeAdjustedMultiplier
      },
      young_2004_metrics: {
        ...basePremium.young_2004_metrics,
        expected_loss: basePremium.young_2004_metrics.expected_loss * timeAdjustedMultiplier
      }
    };
  }
  
  /**
   * Calculate portfolio-level insurance metrics
   */
  static calculatePortfolioInsuranceMetrics(premiums: InsurancePremium[]): {
    total_premium: number;
    average_risk_loading: number;
    coverage_adequacy_ratio: number;
    expense_efficiency: number;
  } {
    
    const totalPremium = premiums.reduce((sum, p) => 
      sum + p.hazard_insurance.premium_annual + p.flood_insurance.premium_annual, 0
    );
    
    const avgRiskLoading = premiums.reduce((sum, p) => 
      sum + p.young_2004_metrics.risk_loading, 0) / premiums.length;
    
    const totalCoverage = premiums.reduce((sum, p) => 
      sum + p.hazard_insurance.coverage_amount + p.flood_insurance.coverage_amount, 0
    );
    
    const totalExpectedLoss = premiums.reduce((sum, p) => 
      sum + p.young_2004_metrics.expected_loss, 0
    );
    
    return {
      total_premium: totalPremium,
      average_risk_loading: avgRiskLoading,
      coverage_adequacy_ratio: totalCoverage / (totalExpectedLoss * 10), // 10x expected annual loss coverage
      expense_efficiency: totalExpectedLoss / totalPremium // Lower is better efficiency
    };
  }
}