import { ExceedanceCurve, HazardData, ClimateXData } from '@/types/climate-data';
import { LoanData } from '@/types/loan-data';

/**
 * Exceedance Curve Analysis
 * 
 * Calculates and analyzes exceedance probability curves for climate hazards.
 * These curves show the relationship between loss amounts and their exceedance probabilities,
 * which is fundamental for catastrophe risk modeling and insurance pricing.
 * 
 * The analysis includes:
 * 1. Individual property exceedance curves
 * 2. Portfolio aggregate exceedance curves
 * 3. Tail risk metrics (VaR, TVaR)
 * 4. Return period analysis
 */

export interface ExceedanceMetrics {
  var_95: number;        // Value at Risk at 95% confidence
  var_99: number;        // Value at Risk at 99% confidence
  tvar_95: number;       // Tail Value at Risk at 95%
  tvar_99: number;       // Tail Value at Risk at 99%
  expected_loss: number; // Expected annual loss
  max_probable_loss: number; // Maximum probable loss (1000-year event)
}

export interface PortfolioExceedanceCurve {
  scenario: string;
  year: number;
  curve_points: {
    exceedance_probability: number;
    aggregate_loss: number;
    return_period: number;
  }[];
  metrics: ExceedanceMetrics;
  concentration_risk: {
    geographic_concentration: number;
    hazard_concentration: number;
    diversification_benefit: number;
  };
}

export class ExceedanceCurveAnalyzer {
  
  /**
   * Generate individual property exceedance curves
   * @param hazardData Climate-X hazard data for the property
   * @param propertyValue Property value for loss calculations
   * @param scenario RCP scenario
   * @param year Projection year
   */
  static generatePropertyExceedanceCurve(
    hazardData: HazardData[],
    propertyValue: number,
    scenario: string,
    year: number
  ): ExceedanceCurve[] {
    
    const curves: ExceedanceCurve[] = [];
    
    hazardData.forEach(hazard => {
      const dataPoints = this.calculateExceedancePoints(hazard, propertyValue, scenario, year);
      
      curves.push({
        property_id: hazard.property_id,
        hazard_type: hazard.hazard_type,
        scenario: scenario,
        year: year,
        data_points: dataPoints
      });
    });
    
    return curves;
  }
  
  /**
   * Calculate exceedance curve data points for a specific hazard
   */
  private static calculateExceedancePoints(
    hazard: HazardData,
    propertyValue: number,
    scenario: string,
    year: number
  ): { return_period: number; annual_loss: number; probability: number }[] {
    
    const returnPeriods = [10, 25, 50, 100, 250, 500, 1000];
    const climateMultiplier = this.getClimateMultiplier(scenario, hazard.hazard_type, year);
    
    return returnPeriods.map(rp => {
      const baselineLoss = this.getReturnPeriodLoss(hazard, rp);
      const climateAdjustedLoss = baselineLoss * climateMultiplier;
      
      // Apply damage function to convert hazard intensity to property loss
      const propertyLoss = this.applyDamageFunction(
        climateAdjustedLoss,
        propertyValue,
        hazard.hazard_type
      );
      
      return {
        return_period: rp,
        annual_loss: propertyLoss,
        probability: 1 / rp // Annual exceedance probability
      };
    });
  }
  
  /**
   * Generate portfolio-level aggregate exceedance curves
   * @param individualCurves Array of individual property curves
   * @param loans Loan portfolio data
   * @param scenario RCP scenario
   * @param year Projection year
   */
  static generatePortfolioExceedanceCurve(
    individualCurves: ExceedanceCurve[],
    loans: LoanData[],
    scenario: string,
    year: number
  ): PortfolioExceedanceCurve {
    
    // Group curves by return period for aggregation
    const returnPeriods = [10, 25, 50, 100, 250, 500, 1000];
    const aggregatedPoints = returnPeriods.map(rp => {
      const aggregateLoss = this.calculateAggregateloss(individualCurves, rp, loans);
      
      return {
        exceedance_probability: 1 / rp,
        aggregate_loss: aggregateLoss.total_loss,
        return_period: rp
      };
    });
    
    // Calculate portfolio metrics
    const metrics = this.calculatePortfolioMetrics(aggregatedPoints);
    const concentrationRisk = this.calculateConcentrationRisk(loans, individualCurves);
    
    return {
      scenario: scenario,
      year: year,
      curve_points: aggregatedPoints,
      metrics: metrics,
      concentration_risk: concentrationRisk
    };
  }
  
  /**
   * Calculate aggregate portfolio loss for a given return period
   * Uses copula-based correlation modeling for geographic and hazard dependencies
   */
  private static calculateAggregateloss(
    curves: ExceedanceCurve[],
    returnPeriod: number,
    loans: LoanData[]
  ): { total_loss: number; diversification_benefit: number } {
    
    // Get individual losses for this return period
    const individualLosses = curves.map(curve => {
      const point = curve.data_points.find(p => p.return_period === returnPeriod);
      return {
        property_id: curve.property_id,
        hazard_type: curve.hazard_type,
        loss: point?.annual_loss || 0
      };
    });
    
    // Sum by property (multiple hazards per property)
    const propertyLosses = new Map<string, number>();
    individualLosses.forEach(loss => {
      const currentLoss = propertyLosses.get(loss.property_id) || 0;
      propertyLosses.set(loss.property_id, currentLoss + loss.loss);
    });
    
    // Calculate correlation adjustments
    const independentSum = Array.from(propertyLosses.values()).reduce((sum, loss) => sum + loss, 0);
    const correlationAdjustment = this.calculateCorrelationAdjustment(loans, returnPeriod);
    
    const correlatedSum = independentSum * correlationAdjustment;
    const diversificationBenefit = (independentSum - correlatedSum) / independentSum;
    
    return {
      total_loss: correlatedSum,
      diversification_benefit: diversificationBenefit
    };
  }
  
  /**
   * Calculate correlation adjustment factor based on geographic and temporal correlations
   */
  private static calculateCorrelationAdjustment(loans: LoanData[], returnPeriod: number): number {
    // Geographic correlation: higher for extreme events
    const geographicCorrelation = Math.min(0.8, 0.2 + (returnPeriod / 1000) * 0.6);
    
    // Count unique states and counties for diversification
    const uniqueStates = new Set(loans.map(loan => loan.address.state)).size;
    const uniqueCounties = new Set(loans.map(loan => loan.address.county)).size;
    
    // Diversification factor (more diversification = lower correlation)
    const diversificationFactor = Math.min(1.0, 1 - (uniqueStates / 50) * 0.3 - (uniqueCounties / 3000) * 0.2);
    
    // Tail correlation increases for extreme events
    const tailCorrelation = geographicCorrelation * diversificationFactor;
    
    // Convert correlation to aggregation factor
    const portfolioSize = loans.length;
    const correlationFactor = Math.sqrt(1 + (portfolioSize - 1) * tailCorrelation);
    
    return correlationFactor / Math.sqrt(portfolioSize);
  }
  
  /**
   * Calculate portfolio risk metrics from exceedance curve
   */
  private static calculatePortfolioMetrics(
    curvePoints: { exceedance_probability: number; aggregate_loss: number; return_period: number }[]
  ): ExceedanceMetrics {
    
    // Sort by loss amount for calculations
    const sortedPoints = [...curvePoints].sort((a, b) => a.aggregate_loss - b.aggregate_loss);
    
    // VaR calculations (linear interpolation)
    const var95 = this.interpolateVaR(sortedPoints, 0.05); // 95% VaR = 5% tail
    const var99 = this.interpolateVaR(sortedPoints, 0.01); // 99% VaR = 1% tail
    
    // TVaR calculations (expected loss in tail)
    const tvar95 = this.calculateTVaR(sortedPoints, 0.05);
    const tvar99 = this.calculateTVaR(sortedPoints, 0.01);
    
    // Expected loss (integral under curve)
    const expectedLoss = this.calculateExpectedLoss(sortedPoints);
    
    // Maximum probable loss (1000-year event)
    const maxProbableLoss = sortedPoints.find(p => p.return_period === 1000)?.aggregate_loss || 0;
    
    return {
      var_95: var95,
      var_99: var99,
      tvar_95: tvar95,
      tvar_99: tvar99,
      expected_loss: expectedLoss,
      max_probable_loss: maxProbableLoss
    };
  }
  
  /**
   * Interpolate Value at Risk for given confidence level
   */
  private static interpolateVaR(
    sortedPoints: { exceedance_probability: number; aggregate_loss: number }[],
    tailProbability: number
  ): number {
    
    // Find points around the target probability
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i].exceedance_probability;
      const p2 = sortedPoints[i + 1].exceedance_probability;
      
      if (p1 >= tailProbability && p2 <= tailProbability) {
        // Linear interpolation
        const weight = (tailProbability - p2) / (p1 - p2);
        return sortedPoints[i].aggregate_loss * weight + 
               sortedPoints[i + 1].aggregate_loss * (1 - weight);
      }
    }
    
    // If not found, return highest loss
    return sortedPoints[sortedPoints.length - 1].aggregate_loss;
  }
  
  /**
   * Calculate Tail Value at Risk (expected loss in tail)
   */
  private static calculateTVaR(
    sortedPoints: { exceedance_probability: number; aggregate_loss: number }[],
    tailProbability: number
  ): number {
    
    const tailPoints = sortedPoints.filter(p => p.exceedance_probability <= tailProbability);
    
    if (tailPoints.length === 0) return 0;
    
    const totalProbability = tailPoints.reduce((sum, p) => sum + p.exceedance_probability, 0);
    const weightedLoss = tailPoints.reduce((sum, p) => 
      sum + p.aggregate_loss * p.exceedance_probability, 0);
    
    return totalProbability > 0 ? weightedLoss / totalProbability : 0;
  }
  
  /**
   * Calculate expected annual loss (integral under exceedance curve)
   */
  private static calculateExpectedLoss(
    curvePoints: { exceedance_probability: number; aggregate_loss: number; return_period: number }[]
  ): number {
    
    // Sort by return period for integration
    const sorted = [...curvePoints].sort((a, b) => a.return_period - b.return_period);
    
    let expectedLoss = 0;
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i].exceedance_probability;
      const p2 = sorted[i + 1].exceedance_probability;
      const l1 = sorted[i].aggregate_loss;
      const l2 = sorted[i + 1].aggregate_loss;
      
      // Trapezoidal integration
      expectedLoss += (p1 - p2) * (l1 + l2) / 2;
    }
    
    return expectedLoss;
  }
  
  /**
   * Calculate concentration risk metrics
   */
  private static calculateConcentrationRisk(
    loans: LoanData[],
    curves: ExceedanceCurve[]
  ): { geographic_concentration: number; hazard_concentration: number; diversification_benefit: number } {
    
    // Geographic concentration (Herfindahl index by state)
    const stateExposure = new Map<string, number>();
    const totalExposure = loans.reduce((sum, loan) => {
      const exposure = loan.outstanding_balance;
      stateExposure.set(loan.address.state, (stateExposure.get(loan.address.state) || 0) + exposure);
      return sum + exposure;
    }, 0);
    
    const geographicHerfindahl = Array.from(stateExposure.values())
      .reduce((sum, exposure) => sum + Math.pow(exposure / totalExposure, 2), 0);
    
    // Hazard concentration (by primary hazard type)
    const hazardExposure = new Map<string, number>();
    curves.forEach(curve => {
      const loan = loans.find(l => l.property_id === curve.property_id);
      if (loan) {
        const exposure = loan.outstanding_balance;
        hazardExposure.set(curve.hazard_type, 
          (hazardExposure.get(curve.hazard_type) || 0) + exposure);
      }
    });
    
    const hazardHerfindahl = Array.from(hazardExposure.values())
      .reduce((sum, exposure) => sum + Math.pow(exposure / totalExposure, 2), 0);
    
    // Diversification benefit (1 - concentration)
    const diversificationBenefit = 1 - Math.max(geographicHerfindahl, hazardHerfindahl);
    
    return {
      geographic_concentration: geographicHerfindahl,
      hazard_concentration: hazardHerfindahl,
      diversification_benefit: diversificationBenefit
    };
  }
  
  /**
   * Helper methods for climate scenario adjustments
   */
  private static getClimateMultiplier(scenario: string, hazardType: string, year: number): number {
    const baseMultipliers = {
      'rcp_26': { flood: 1.1, wildfire: 1.15, hurricane: 1.05, hail: 1.02, tornado: 1.03 },
      'rcp_45': { flood: 1.25, wildfire: 1.35, hurricane: 1.15, hail: 1.08, tornado: 1.10 },
      'rcp_60': { flood: 1.35, wildfire: 1.50, hurricane: 1.25, hail: 1.12, tornado: 1.15 },
      'rcp_85': { flood: 1.60, wildfire: 1.80, hurricane: 1.45, hail: 1.20, tornado: 1.25 }
    };
    
    const scenarioMultipliers = baseMultipliers[scenario as keyof typeof baseMultipliers];
    const baseMultiplier = scenarioMultipliers?.[hazardType as keyof typeof scenarioMultipliers] || 1.0;
    
    // Time progression factor (full impact by 2100)
    const timeProgression = Math.min(1.0, (year - 2023) / (2100 - 2023));
    
    return 1 + (baseMultiplier - 1) * timeProgression;
  }
  
  private static getReturnPeriodLoss(hazard: HazardData, returnPeriod: number): number {
    const rpMap = {
      10: hazard.return_periods.rp_10,
      25: hazard.return_periods.rp_25,
      50: hazard.return_periods.rp_50,
      100: hazard.return_periods.rp_100,
      250: hazard.return_periods.rp_250,
      500: hazard.return_periods.rp_500,
      1000: hazard.return_periods.rp_1000
    };
    
    return rpMap[returnPeriod as keyof typeof rpMap] || 0;
  }
  
  private static applyDamageFunction(
    hazardIntensity: number,
    propertyValue: number,
    hazardType: string
  ): number {
    // Simplified damage functions by hazard type
    const damageFunctions = {
      flood: (intensity: number) => Math.min(1.0, intensity / propertyValue * 2),
      wildfire: (intensity: number) => Math.min(1.0, intensity / propertyValue * 1.5),
      hurricane: (intensity: number) => Math.min(1.0, intensity / propertyValue * 1.2),
      hail: (intensity: number) => Math.min(0.5, intensity / propertyValue * 0.8),
      tornado: (intensity: number) => Math.min(0.8, intensity / propertyValue * 1.0)
    };
    
    const damageFunction = damageFunctions[hazardType as keyof typeof damageFunctions];
    const damageRatio = damageFunction ? damageFunction(hazardIntensity) : 0;
    
    return propertyValue * damageRatio;
  }
}