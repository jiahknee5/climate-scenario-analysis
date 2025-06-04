import { LoanPortfolio, ClimateScenario, ScenarioResult } from '@/types';

export class ScenarioCalculator {
  static calculateScenarioImpact(
    loan: LoanPortfolio,
    scenario: ClimateScenario
  ): ScenarioResult {
    const baselinePD = this.getBaselinePD(loan);
    const baselineLGD = this.getBaselineLGD(loan);
    
    const physicalRiskMultiplier = this.calculatePhysicalRiskMultiplier(
      loan,
      scenario.physical_risks
    );
    
    const transitionRiskMultiplier = this.calculateTransitionRiskMultiplier(
      loan,
      scenario.transition_risks
    );
    
    const combinedStressFactor = Math.max(
      physicalRiskMultiplier,
      transitionRiskMultiplier
    );
    
    const stressedPD = Math.min(baselinePD * combinedStressFactor, 1.0);
    const stressedLGD = Math.min(baselineLGD * (1 + combinedStressFactor * 0.2), 1.0);
    
    const propertyValueChange = this.calculatePropertyValueChange(
      loan,
      scenario
    );
    
    const expectedLoss = loan.outstanding_balance * stressedPD * stressedLGD;
    
    return {
      loan_id: loan.id,
      scenario_id: scenario.id,
      probability_of_default: stressedPD,
      loss_given_default: stressedLGD,
      expected_loss: expectedLoss,
      property_value_change: propertyValueChange,
      risk_rating_change: this.getRiskRatingChange(combinedStressFactor),
      stress_factor: combinedStressFactor,
    };
  }

  private static getBaselinePD(loan: LoanPortfolio): number {
    const riskFactors = {
      'AAA': 0.001,
      'AA': 0.002,
      'A': 0.005,
      'BBB': 0.015,
      'BB': 0.035,
      'B': 0.08,
      'CCC': 0.15,
      'CC': 0.25,
      'C': 0.35,
    };
    
    return riskFactors[loan.risk_rating as keyof typeof riskFactors] || 0.05;
  }

  private static getBaselineLGD(loan: LoanPortfolio): number {
    const ltvAdjustment = Math.max(0.3, Math.min(0.8, loan.ltv_ratio));
    return loan.type === 'RRE' ? ltvAdjustment * 0.6 : ltvAdjustment * 0.7;
  }

  private static calculatePhysicalRiskMultiplier(
    loan: LoanPortfolio,
    physicalRisks: ClimateScenario['physical_risks']
  ): number {
    const locationRiskMap = this.getLocationRiskFactors(loan.location);
    
    let riskMultiplier = 1.0;
    
    if (locationRiskMap.flood_prone) {
      riskMultiplier += physicalRisks.flood_probability_increase * 2;
    }
    
    if (locationRiskMap.wildfire_prone) {
      riskMultiplier += physicalRisks.wildfire_probability_increase * 1.5;
    }
    
    if (locationRiskMap.hurricane_prone) {
      riskMultiplier += physicalRisks.hurricane_probability_increase * 1.8;
    }
    
    if (locationRiskMap.coastal) {
      riskMultiplier += physicalRisks.sea_level_rise * 0.5;
    }
    
    return riskMultiplier;
  }

  private static calculateTransitionRiskMultiplier(
    loan: LoanPortfolio,
    transitionRisks: ClimateScenario['transition_risks']
  ): number {
    let riskMultiplier = 1.0;
    
    if (loan.type === 'CRE') {
      const energyIntensityFactor = this.getEnergyIntensityFactor(loan.property_type);
      riskMultiplier += (transitionRisks.energy_cost_increase * energyIntensityFactor);
      riskMultiplier += (transitionRisks.policy_stringency * energyIntensityFactor * 0.5);
    }
    
    riskMultiplier += (transitionRisks.carbon_price / 1000) * 0.1;
    
    return riskMultiplier;
  }

  private static calculatePropertyValueChange(
    loan: LoanPortfolio,
    scenario: ClimateScenario
  ): number {
    const physicalImpact = -Math.min(
      0.3,
      (scenario.physical_risks.flood_probability_increase +
        scenario.physical_risks.wildfire_probability_increase +
        scenario.physical_risks.hurricane_probability_increase) * 0.15
    );
    
    const transitionImpact = loan.type === 'CRE' 
      ? -Math.min(0.2, scenario.transition_risks.energy_cost_increase * 0.3)
      : -Math.min(0.1, scenario.transition_risks.energy_cost_increase * 0.1);
    
    return physicalImpact + transitionImpact;
  }

  private static getLocationRiskFactors(location: LoanPortfolio['location']) {
    const highRiskStates = {
      flood_prone: ['FL', 'LA', 'TX', 'NC', 'SC', 'NJ', 'NY'],
      wildfire_prone: ['CA', 'OR', 'WA', 'CO', 'MT', 'ID', 'AZ'],
      hurricane_prone: ['FL', 'LA', 'TX', 'AL', 'MS', 'NC', 'SC', 'GA'],
      coastal: ['FL', 'CA', 'TX', 'NY', 'NC', 'SC', 'GA', 'WA', 'OR', 'ME', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'VA'],
    };
    
    return {
      flood_prone: highRiskStates.flood_prone.includes(location.state),
      wildfire_prone: highRiskStates.wildfire_prone.includes(location.state),
      hurricane_prone: highRiskStates.hurricane_prone.includes(location.state),
      coastal: highRiskStates.coastal.includes(location.state),
    };
  }

  private static getEnergyIntensityFactor(propertyType: string): number {
    const intensityMap: Record<string, number> = {
      'office': 1.2,
      'retail': 1.0,
      'industrial': 1.8,
      'warehouse': 0.8,
      'hotel': 1.5,
      'multifamily': 0.9,
      'single_family': 0.7,
    };
    
    return intensityMap[propertyType] || 1.0;
  }

  private static getRiskRatingChange(stressFactor: number): string {
    if (stressFactor < 1.1) return 'No Change';
    if (stressFactor < 1.3) return 'One Notch Down';
    if (stressFactor < 1.6) return 'Two Notches Down';
    return 'Three+ Notches Down';
  }
}