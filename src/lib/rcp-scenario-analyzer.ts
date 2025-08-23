import { ClimateImpactedMetrics, TimeframedAnalysis, BusinessObjective } from '@/types/loan-data';
import { ClimateXData, HazardProjection } from '@/types/climate-data';
import { LoanData } from '@/types/loan-data';
import { SensitivityAnalysis } from './geographical-optimizer';

/**
 * RCP Scenario Analysis Engine
 * 
 * Implements comprehensive climate scenario analysis using Representative Concentration Pathways (RCPs)
 * aligned with IPCC framework and regulatory requirements (CCAR, TCFD).
 * 
 * Key Features:
 * 1. RCP 2.6, 4.5, 6.0 (baseline), and 8.5 scenario modeling
 * 2. Multiple time horizons: CCAR 3-5 years, 2050, 2100
 * 3. Integrated climate-financial impact modeling
 * 4. Sensitivity analysis across multiple parameters
 * 5. Business objective alignment and risk appetite testing
 */

export interface RCPScenarioResult {
  scenario: 'rcp_26' | 'rcp_45' | 'rcp_60' | 'rcp_85';
  scenario_name: string;
  description: string;
  timeframe: TimeframedAnalysis;
  portfolio_metrics: {
    total_exposure: number;
    baseline_expected_loss: number;
    climate_adjusted_expected_loss: number;
    loss_amplification_factor: number;
    var_95: number;
    tvar_95: number;
    stressed_pd_average: number;
    stressed_lgd_average: number;
  };
  geographic_breakdown: {
    region: string;
    exposure_amount: number;
    loss_increase: number;
    risk_ranking: number;
  }[];
  sensitivity_metrics: {
    temperature_sensitivity: number;
    precipitation_sensitivity: number;
    sea_level_sensitivity: number;
    transition_risk_sensitivity: number;
  };
  business_impact: {
    regulatory_capital_impact: number;
    provision_expense_increase: number;
    net_interest_margin_impact: number;
    roe_impact: number;
  };
}

export interface CCARStressTest {
  test_name: string;
  timeframe: '3_year' | '5_year';
  scenarios: RCPScenarioResult[];
  pass_fail_analysis: {
    tier1_capital_ratio: number;
    common_equity_tier1: number;
    leverage_ratio: number;
    pass_status: boolean;
    margin_above_minimum: number;
  };
  business_plan_impact: {
    dividend_capacity: number;
    lending_capacity_change: number;
    strategic_adjustments_required: boolean;
  };
}

export class RCPScenarioAnalyzer {
  
  private static readonly RCP_DEFINITIONS = {
    rcp_26: {
      name: 'RCP 2.6 - Strong Mitigation',
      description: 'Peak and decline scenario with aggressive climate action',
      temperature_change_2100: 1.0,
      likelihood_assessment: 'Low probability without immediate global action'
    },
    rcp_45: {
      name: 'RCP 4.5 - Moderate Mitigation', 
      description: 'Stabilization scenario with gradual emissions reduction',
      temperature_change_2100: 1.8,
      likelihood_assessment: 'Moderate probability with sustained climate policies'
    },
    rcp_60: {
      name: 'RCP 6.0 - Baseline Reference',
      description: 'High emissions with limited mitigation efforts',
      temperature_change_2100: 2.2,
      likelihood_assessment: 'Current trajectory baseline for stress testing'
    },
    rcp_85: {
      name: 'RCP 8.5 - High Emissions',
      description: 'Very high greenhouse gas emissions scenario',
      temperature_change_2100: 3.7,
      likelihood_assessment: 'Tail risk scenario for extreme stress testing'
    }
  };
  
  private static readonly TIMEFRAMES: TimeframedAnalysis[] = [
    {
      timeframe: 'ccar_3yr',
      description: 'CCAR 3-Year Stress Test Horizon',
      analysis_year: 2026,
      regulatory_context: 'Federal Reserve CCAR severely adverse scenario'
    },
    {
      timeframe: 'ccar_5yr',
      description: 'CCAR 5-Year Extended Stress Test',
      analysis_year: 2028,
      regulatory_context: 'Extended supervisory stress test for climate risk'
    },
    {
      timeframe: 'medium_term_2050',
      description: 'Medium-term Climate Transition (2050)',
      analysis_year: 2050,
      regulatory_context: 'TCFD medium-term transition risk assessment'
    },
    {
      timeframe: 'long_term_2100',
      description: 'Long-term Physical Risk Assessment (2100)',
      analysis_year: 2100,
      regulatory_context: 'IPCC long-term physical risk scenario'
    }
  ];

  /**
   * Perform comprehensive RCP scenario analysis across all timeframes
   * @param loans Portfolio of loans
   * @param climateData Climate-X data for properties
   * @param businessObjective Bank's business objectives and risk appetite
   */
  static performComprehensiveAnalysis(
    loans: LoanData[],
    climateData: ClimateXData[],
    businessObjective: BusinessObjective
  ): {
    scenario_results: RCPScenarioResult[];
    ccar_stress_tests: CCARStressTest[];
    sensitivity_analysis: SensitivityAnalysis[];
    business_recommendations: string[];
  } {
    
    const scenarioResults: RCPScenarioResult[] = [];
    const ccarStressTests: CCARStressTest[] = [];
    
    // Analyze each RCP scenario across all timeframes
    Object.keys(this.RCP_DEFINITIONS).forEach(rcpKey => {
      this.TIMEFRAMES.forEach(timeframe => {
        const result = this.analyzeRCPScenario(
          loans,
          climateData,
          rcpKey as keyof typeof this.RCP_DEFINITIONS,
          timeframe,
          businessObjective
        );
        scenarioResults.push(result);
      });
    });
    
    // Generate CCAR-specific stress tests
    const ccar3yr = this.generateCCARStressTest(scenarioResults, '3_year');
    const ccar5yr = this.generateCCARStressTest(scenarioResults, '5_year');
    ccarStressTests.push(ccar3yr, ccar5yr);
    
    // Perform comprehensive sensitivity analysis
    const sensitivityAnalysis = this.performComprehensiveSensitivityAnalysis();
    
    // Generate business recommendations
    const businessRecommendations = this.generateBusinessRecommendations(
      scenarioResults,
      ccarStressTests,
      sensitivityAnalysis,
      businessObjective
    );
    
    return {
      scenario_results: scenarioResults,
      ccar_stress_tests: ccarStressTests,
      sensitivity_analysis: sensitivityAnalysis,
      business_recommendations: businessRecommendations
    };
  }
  
  /**
   * Analyze individual RCP scenario for specific timeframe
   */
  private static analyzeRCPScenario(
    loans: LoanData[],
    climateData: ClimateXData[],
    rcpScenario: keyof typeof RCPScenarioAnalyzer.RCP_DEFINITIONS,
    timeframe: TimeframedAnalysis,
    _businessObjective: BusinessObjective
  ): RCPScenarioResult {
    
    const scenarioDefinition = this.RCP_DEFINITIONS[rcpScenario];
    
    // Calculate climate-adjusted loan metrics
    const climateAdjustedMetrics = this.calculateClimateAdjustedMetrics(
      loans,
      climateData,
      rcpScenario,
      timeframe.analysis_year
    );
    
    // Calculate portfolio-level metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(loans, climateAdjustedMetrics);
    
    // Geographic risk breakdown
    const geographicBreakdown = this.calculateGeographicBreakdown(loans, climateAdjustedMetrics);
    
    // Sensitivity analysis for this scenario (simplified)
    const sensitivityMetrics = {
      temperature_sensitivity: 0.1, // 10% loss increase per degree
      precipitation_sensitivity: 0.05, // 5% loss increase per 10% precipitation change
      sea_level_sensitivity: 0.2, // 20% loss increase per meter
      transition_risk_sensitivity: 0.08 // 8% loss increase per transition risk unit
    };
    
    // Business impact assessment
    const businessImpact = this.calculateBusinessImpact(portfolioMetrics);
    
    return {
      scenario: rcpScenario,
      scenario_name: scenarioDefinition.name,
      description: scenarioDefinition.description,
      timeframe: timeframe,
      portfolio_metrics: portfolioMetrics,
      geographic_breakdown: geographicBreakdown,
      sensitivity_metrics: sensitivityMetrics,
      business_impact: businessImpact
    };
  }
  
  /**
   * Calculate climate-adjusted PD, LGD, EAD for each loan
   */
  private static calculateClimateAdjustedMetrics(
    loans: LoanData[],
    climateData: ClimateXData[],
    rcpScenario: string,
    analysisYear: number
  ): ClimateImpactedMetrics[] {
    
    return loans.map(loan => {
      const propertyClimateData = climateData.find(cd => cd.property_id === loan.property_id);
      if (!propertyClimateData) {
        // Return baseline metrics if no climate data
        return this.createBaselineMetrics(loan, rcpScenario, analysisYear);
      }
      
      // Get RCP scenario projections
      const rcpProjection = propertyClimateData.rcp_scenarios[rcpScenario as keyof typeof propertyClimateData.rcp_scenarios];
      
      // Calculate time-adjusted climate impacts
      const timeHorizon = analysisYear - propertyClimateData.baseline_year;
      const timeAdjustmentFactor = Math.min(1.0, timeHorizon / 30); // Full impact by 2050
      
      // Calculate property value change due to climate risks
      const propertyValueChange = this.calculatePropertyValueChange(
        loan,
        rcpProjection,
        timeAdjustmentFactor
      );
      
      // Calculate LTV adjustment
      const adjustedPropertyValue = loan.property_value * (1 + propertyValueChange);
      const ltvAdjustment = loan.outstanding_balance / adjustedPropertyValue;
      
      // Calculate insurance premium increases
      const insurancePremiumIncrease = this.calculateInsurancePremiumIncrease(
        loan,
        rcpProjection,
        timeAdjustmentFactor
      );
      
      // Calculate DTI adjustment from insurance cost increases
      const monthlyIncomeImpact = (loan.insurance_coverage.total_insurance_premium * insurancePremiumIncrease) / 12;
      const dtiAdjustment = loan.dti_ratio + (monthlyIncomeImpact / (loan.borrower_income / 12));
      
      // Calculate climate-adjusted PD using enhanced model
      const pdClimateAdjusted = this.calculateClimateAdjustedPD(
        loan.risk_metrics.pd_baseline,
        ltvAdjustment,
        dtiAdjustment,
        rcpProjection,
        timeAdjustmentFactor
      );
      
      // Calculate climate-adjusted LGD
      const lgdClimateAdjusted = this.calculateClimateAdjustedLGD(
        loan.risk_metrics.lgd_baseline,
        ltvAdjustment,
        propertyValueChange,
        rcpProjection
      );
      
      // EAD adjustment based on climate stress
      const eadClimateAdjusted = loan.risk_metrics.ead * (1 + Math.max(0, ltvAdjustment - 0.9) * 0.1);
      
      // Overall stress factor
      const stressFactor = (pdClimateAdjusted / loan.risk_metrics.pd_baseline);
      
      return {
        loan_id: loan.loan_id,
        scenario: rcpScenario,
        year: analysisYear,
        climate_adjustments: {
          property_value_change: propertyValueChange,
          ltv_adjustment: ltvAdjustment,
          dti_adjustment: dtiAdjustment,
          insurance_premium_increase: insurancePremiumIncrease
        },
        adjusted_risk_metrics: {
          pd_climate_adjusted: pdClimateAdjusted,
          lgd_climate_adjusted: lgdClimateAdjusted,
          ead_climate_adjusted: eadClimateAdjusted,
          expected_loss_climate: pdClimateAdjusted * lgdClimateAdjusted * eadClimateAdjusted,
          stress_factor: stressFactor
        }
      };
    });
  }
  
  /**
   * Calculate property value change based on climate risks
   */
  private static calculatePropertyValueChange(
    loan: LoanData,
    rcpProjection: HazardProjection,
    timeAdjustmentFactor: number
  ): number {
    
    // Physical risk impact on property value
    const floodImpact = this.getLocationMultiplier(loan.address.state, 'flood') * 
                       rcpProjection.hazard_multipliers.flood * 0.15;
    const wildfireImpact = this.getLocationMultiplier(loan.address.state, 'wildfire') * 
                          rcpProjection.hazard_multipliers.wildfire * 0.12;
    const hurricaneImpact = this.getLocationMultiplier(loan.address.state, 'hurricane') * 
                           rcpProjection.hazard_multipliers.hurricane * 0.10;
    
    const totalPhysicalImpact = -(floodImpact + wildfireImpact + hurricaneImpact) * timeAdjustmentFactor;
    
    // Transition risk impact (mainly for commercial properties)
    let transitionImpact = 0;
    if (loan.property_type !== 'single_family') {
      const energyCostImpact = rcpProjection.temperature_change * 0.02; // 2% per degree
      const policyImpact = rcpProjection.precipitation_change * 0.001; // Indirect policy impact
      transitionImpact = -(energyCostImpact + policyImpact) * timeAdjustmentFactor;
    }
    
    return Math.max(-0.30, totalPhysicalImpact + transitionImpact); // Cap decline at 30%
  }
  
  /**
   * Calculate insurance premium increases
   */
  private static calculateInsurancePremiumIncrease(
    loan: LoanData,
    rcpProjection: HazardProjection,
    timeAdjustmentFactor: number
  ): number {
    
    // Base premium increase from hazard multipliers
    const avgHazardMultiplier = Object.values(rcpProjection.hazard_multipliers)
      .reduce((sum, mult) => sum + mult, 0) / Object.values(rcpProjection.hazard_multipliers).length;
    
    const baseIncrease = (avgHazardMultiplier - 1) * 1.5; // Premium increases faster than risk
    
    // Location-specific adjustments
    const locationMultiplier = this.getLocationRiskMultiplier(loan.address.state);
    
    return Math.min(2.0, baseIncrease * locationMultiplier * timeAdjustmentFactor); // Cap at 200% increase
  }
  
  /**
   * Calculate climate-adjusted PD using enhanced logistic model
   */
  private static calculateClimateAdjustedPD(
    baselinePD: number,
    adjustedLTV: number,
    adjustedDTI: number,
    rcpProjection: HazardProjection,
    timeAdjustmentFactor: number
  ): number {
    
    // Enhanced PD model incorporating climate factors
    // PD_climate = PD_baseline × [1 + climate_stress_factor]
    
    // LTV stress component
    const ltvStress = Math.max(0, (adjustedLTV - 0.8) * 2); // Stress kicks in above 80% LTV
    
    // DTI stress component  
    const dtiStress = Math.max(0, (adjustedDTI - 0.43) * 1.5); // Stress above 43% DTI
    
    // Climate hazard stress
    const hazardStress = (rcpProjection.temperature_change * 0.1 + 
                         rcpProjection.sea_level_rise * 0.2) * timeAdjustmentFactor;
    
    // Combined stress factor with interaction effects
    const combinedStress = (ltvStress + dtiStress + hazardStress) * 
                          (1 + ltvStress * dtiStress * 0.5); // Interaction term
    
    const adjustedPD = baselinePD * (1 + combinedStress);
    
    return Math.min(0.99, adjustedPD); // Cap PD at 99%
  }
  
  /**
   * Calculate climate-adjusted LGD
   */
  private static calculateClimateAdjustedLGD(
    baselineLGD: number,
    adjustedLTV: number,
    propertyValueChange: number,
    rcpProjection: HazardProjection
  ): number {
    
    // LGD adjustment based on LTV and property value changes
    const ltvAdjustment = Math.max(0, adjustedLTV - 0.8) * 0.5; // 50% of excess LTV
    const valueAdjustment = Math.abs(propertyValueChange) * 0.3; // 30% of value decline
    
    // Climate-specific LGD increase (market liquidity impact)
    const climateAdjustment = (rcpProjection.temperature_change * 0.02 + 
                              rcpProjection.sea_level_rise * 0.05);
    
    const adjustedLGD = baselineLGD + ltvAdjustment + valueAdjustment + climateAdjustment;
    
    return Math.min(0.95, Math.max(0.1, adjustedLGD)); // Cap between 10% and 95%
  }
  
  /**
   * Calculate portfolio-level metrics
   */
  private static calculatePortfolioMetrics(
    loans: LoanData[],
    climateMetrics: ClimateImpactedMetrics[]
  ) {
    
    const totalExposure = loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0);
    const baselineExpectedLoss = loans.reduce((sum, loan) => sum + loan.risk_metrics.expected_loss, 0);
    const climateExpectedLoss = climateMetrics.reduce((sum, metric) => 
      sum + metric.adjusted_risk_metrics.expected_loss_climate, 0);
    
    const lossAmplificationFactor = baselineExpectedLoss > 0 ? 
      climateExpectedLoss / baselineExpectedLoss : 1.0;
    
    // Calculate VaR and TVaR (simplified approach)
    const lossDistribution = climateMetrics.map(m => m.adjusted_risk_metrics.expected_loss_climate);
    lossDistribution.sort((a, b) => b - a);
    
    const var95Index = Math.floor(lossDistribution.length * 0.05);
    const var95 = lossDistribution[var95Index] || 0;
    
    const tvar95 = lossDistribution.slice(0, var95Index + 1)
      .reduce((sum, loss) => sum + loss, 0) / (var95Index + 1);
    
    const avgStressedPD = climateMetrics.reduce((sum, m) => 
      sum + m.adjusted_risk_metrics.pd_climate_adjusted, 0) / climateMetrics.length;
    
    const avgStressedLGD = climateMetrics.reduce((sum, m) => 
      sum + m.adjusted_risk_metrics.lgd_climate_adjusted, 0) / climateMetrics.length;
    
    return {
      total_exposure: totalExposure,
      baseline_expected_loss: baselineExpectedLoss,
      climate_adjusted_expected_loss: climateExpectedLoss,
      loss_amplification_factor: lossAmplificationFactor,
      var_95: var95,
      tvar_95: tvar95,
      stressed_pd_average: avgStressedPD,
      stressed_lgd_average: avgStressedLGD
    };
  }
  
  /**
   * Helper methods for location-based risk adjustments
   */
  private static getLocationMultiplier(state: string, hazardType: string): number {
    const riskMaps = {
      flood: ['FL', 'LA', 'TX', 'NC', 'SC', 'NJ', 'NY'],
      wildfire: ['CA', 'OR', 'WA', 'CO', 'MT', 'ID', 'AZ'],
      hurricane: ['FL', 'LA', 'TX', 'AL', 'MS', 'NC', 'SC', 'GA']
    };
    
    const stateList = riskMaps[hazardType as keyof typeof riskMaps] || [];
    return stateList.includes(state) ? 1.5 : 0.5;
  }
  
  private static getLocationRiskMultiplier(state: string): number {
    const highRiskStates = ['FL', 'CA', 'TX', 'LA', 'NC'];
    return highRiskStates.includes(state) ? 1.3 : 1.0;
  }
  
  private static createBaselineMetrics(
    loan: LoanData,
    scenario: string,
    year: number
  ): ClimateImpactedMetrics {
    return {
      loan_id: loan.loan_id,
      scenario: scenario,
      year: year,
      climate_adjustments: {
        property_value_change: 0,
        ltv_adjustment: loan.ltv_ratio,
        dti_adjustment: loan.dti_ratio,
        insurance_premium_increase: 0
      },
      adjusted_risk_metrics: {
        pd_climate_adjusted: loan.risk_metrics.pd_baseline,
        lgd_climate_adjusted: loan.risk_metrics.lgd_baseline,
        ead_climate_adjusted: loan.risk_metrics.ead,
        expected_loss_climate: loan.risk_metrics.expected_loss,
        stress_factor: 1.0
      }
    };
  }
  
  /**
   * Additional methods for geographic breakdown, sensitivity analysis, etc.
   * (Implementation continues with remaining functionality)
   */
  private static calculateGeographicBreakdown(
    loans: LoanData[],
    climateMetrics: ClimateImpactedMetrics[]
  ) {
    const regionMap = new Map<string, { exposure: number; baseline_loss: number; climate_loss: number }>();
    
    loans.forEach(loan => {
      const region = loan.address.state;
      const metric = climateMetrics.find(m => m.loan_id === loan.loan_id);
      
      if (!regionMap.has(region)) {
        regionMap.set(region, { exposure: 0, baseline_loss: 0, climate_loss: 0 });
      }
      
      const regionData = regionMap.get(region)!;
      regionData.exposure += loan.outstanding_balance;
      regionData.baseline_loss += loan.risk_metrics.expected_loss;
      regionData.climate_loss += metric?.adjusted_risk_metrics.expected_loss_climate || 0;
    });
    
    return Array.from(regionMap.entries())
      .map(([region, data], index) => ({
        region: region,
        exposure_amount: data.exposure,
        loss_increase: ((data.climate_loss - data.baseline_loss) / data.baseline_loss) * 100,
        risk_ranking: index + 1
      }))
      .sort((a, b) => b.loss_increase - a.loss_increase)
      .map((item, index) => ({ ...item, risk_ranking: index + 1 }));
  }
  
  
  private static calculateBusinessImpact(
    portfolioMetrics: {
      climate_adjusted_expected_loss: number;
      baseline_expected_loss: number;
      total_exposure: number;
    }
  ) {
    const lossIncrease = portfolioMetrics.climate_adjusted_expected_loss - portfolioMetrics.baseline_expected_loss;
    const lossRate = lossIncrease / portfolioMetrics.total_exposure;
    
    return {
      regulatory_capital_impact: lossIncrease * 8, // 8% capital requirement
      provision_expense_increase: lossIncrease,
      net_interest_margin_impact: -lossRate * 100, // basis points
      roe_impact: -lossRate * 15 // Approximate ROE impact
    };
  }
  
  private static generateCCARStressTest(
    scenarioResults: RCPScenarioResult[],
    timeframe: '3_year' | '5_year'
  ): CCARStressTest {
    const relevantScenarios = scenarioResults.filter(s => 
      s.timeframe.timeframe === (timeframe === '3_year' ? 'ccar_3yr' : 'ccar_5yr')
    );
    
    // Use worst-case scenario for stress test
    const worstCaseScenario = relevantScenarios.reduce((worst, current) => 
      current.portfolio_metrics.loss_amplification_factor > worst.portfolio_metrics.loss_amplification_factor 
        ? current : worst
    );
    
    // Simplified capital adequacy calculation
    const stressLoss = worstCaseScenario.portfolio_metrics.climate_adjusted_expected_loss;
    const capitalImpact = stressLoss * 0.08; // 8% risk weight
    
    // Assume starting capital ratios
    const baseTier1Ratio = 0.12; // 12%
    const baseLeverageRatio = 0.08; // 8%
    
    const stressedTier1 = baseTier1Ratio - (capitalImpact / 100000000); // Simplified calculation
    
    return {
      test_name: `CCAR ${timeframe.replace('_', '-')} Climate Stress Test`,
      timeframe: timeframe,
      scenarios: relevantScenarios,
      pass_fail_analysis: {
        tier1_capital_ratio: stressedTier1,
        common_equity_tier1: stressedTier1 - 0.01,
        leverage_ratio: baseLeverageRatio - 0.005,
        pass_status: stressedTier1 > 0.045, // 4.5% minimum
        margin_above_minimum: Math.max(0, stressedTier1 - 0.045)
      },
      business_plan_impact: {
        dividend_capacity: Math.max(0, (stressedTier1 - 0.08) * 1000000000), // Simplified
        lending_capacity_change: -stressLoss * 12.5, // 1/8% risk weight
        strategic_adjustments_required: stressedTier1 < 0.06
      }
    };
  }
  
  private static performComprehensiveSensitivityAnalysis(): SensitivityAnalysis[] {
    // Implementation would include detailed sensitivity analysis
    // This is a simplified version for demonstration
    return [
      {
        parameter: 'temperature_increase',
        base_value: 2.0,
        sensitivity_range: { min: 1.0, max: 4.0 },
        impact_on_expected_loss: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7, 1.9, 2.2, 2.5, 2.8, 3.2],
        impact_on_var_95: [1.0, 1.15, 1.3, 1.5, 1.7, 2.0, 2.3, 2.7, 3.1, 3.6, 4.2],
        impact_on_concentration: [1.0, 1.05, 1.1, 1.18, 1.25, 1.35, 1.45, 1.6, 1.75, 1.9, 2.1],
        elasticity: 0.8
      }
    ];
  }
  
  private static generateBusinessRecommendations(
    scenarioResults: RCPScenarioResult[],
    ccarStressTests: CCARStressTest[],
    sensitivityAnalysis: SensitivityAnalysis[],
    businessObjective: BusinessObjective
  ): string[] {
    const recommendations: string[] = [];
    
    // Analyze stress test results
    const failedTests = ccarStressTests.filter(test => !test.pass_fail_analysis.pass_status);
    if (failedTests.length > 0) {
      recommendations.push(
        'CRITICAL: Capital adequacy concerns identified in climate stress testing. ' +
        'Consider increasing capital buffer and/or reducing geographic concentration.'
      );
    }
    
    // Check business objective alignment
    const worstCaseIncrease = Math.max(...scenarioResults.map(s => s.portfolio_metrics.loss_amplification_factor - 1));
    if (worstCaseIncrease > businessObjective.risk_appetite.max_climate_loss_increase) {
      recommendations.push(
        `Risk appetite exceeded: Climate loss increase of ${(worstCaseIncrease * 100).toFixed(1)}% ` +
        `exceeds maximum tolerance of ${(businessObjective.risk_appetite.max_climate_loss_increase * 100).toFixed(1)}%. ` +
        'Portfolio rebalancing recommended.'
      );
    }
    
    // Sensitivity-based recommendations
    const highSensitivityParams = sensitivityAnalysis.filter(s => Math.abs(s.elasticity) > 1.0);
    if (highSensitivityParams.length > 0) {
      recommendations.push(
        `High sensitivity detected to: ${highSensitivityParams.map(p => p.parameter).join(', ')}. ` +
        'Consider hedging strategies and enhanced monitoring of these risk factors.'
      );
    }
    
    return recommendations;
  }
}