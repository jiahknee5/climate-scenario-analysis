import { ClimateXData, HazardData } from '@/types/climate-data';
import { LoanData } from '@/types/loan-data';

export class SyntheticDataGenerator {
  private static riskRegions = {
    'high_flood': ['FL', 'LA', 'TX', 'NC', 'SC', 'NJ', 'NY'],
    'high_wildfire': ['CA', 'OR', 'WA', 'CO', 'MT', 'ID', 'AZ', 'NV'],
    'high_hurricane': ['FL', 'LA', 'TX', 'AL', 'MS', 'NC', 'SC', 'GA'],
    'coastal': ['FL', 'CA', 'TX', 'NY', 'NC', 'SC', 'GA', 'WA', 'OR', 'ME', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'VA']
  };

  private static rcpScenarios = {
    rcp_26: {
      scenario: 'RCP 2.6',
      description: 'Strong mitigation scenario - peak and decline',
      temperature_change: 1.0,
      precipitation_change: 2,
      sea_level_rise: 0.26,
      hazard_multipliers: {
        flood: 1.1,
        wildfire: 1.15,
        hurricane: 1.05,
        hail: 1.02,
        tornado: 1.03
      }
    },
    rcp_45: {
      scenario: 'RCP 4.5',
      description: 'Stabilization scenario - moderate mitigation',
      temperature_change: 1.8,
      precipitation_change: 5,
      sea_level_rise: 0.47,
      hazard_multipliers: {
        flood: 1.25,
        wildfire: 1.35,
        hurricane: 1.15,
        hail: 1.08,
        tornado: 1.10
      }
    },
    rcp_60: {
      scenario: 'RCP 6.0',
      description: 'High emission scenario - baseline reference',
      temperature_change: 2.2,
      precipitation_change: 7,
      sea_level_rise: 0.55,
      hazard_multipliers: {
        flood: 1.35,
        wildfire: 1.50,
        hurricane: 1.25,
        hail: 1.12,
        tornado: 1.15
      }
    },
    rcp_85: {
      scenario: 'RCP 8.5',
      description: 'Very high emission scenario - worst case',
      temperature_change: 3.7,
      precipitation_change: 10,
      sea_level_rise: 0.82,
      hazard_multipliers: {
        flood: 1.60,
        wildfire: 1.80,
        hurricane: 1.45,
        hail: 1.20,
        tornado: 1.25
      }
    }
  };

  static generateLoanPortfolio(size: number): LoanData[] {
    const loans: LoanData[] = [];
    const states = ['FL', 'CA', 'TX', 'NY', 'NC', 'GA', 'WA', 'CO', 'AZ', 'OR'];
    
    for (let i = 0; i < size; i++) {
      const state = states[Math.floor(Math.random() * states.length)];
      const loanAmount = this.normalRandom(400000, 150000, 100000, 2000000);
      const propertyValue = loanAmount / (0.6 + Math.random() * 0.3); // LTV 60-90%
      const ltv = loanAmount / propertyValue;
      const borrowerIncome = this.normalRandom(85000, 25000, 40000, 300000);
      const dti = (loanAmount * 0.004) / (borrowerIncome / 12); // Approx DTI
      const creditScore = Math.floor(this.normalRandom(740, 60, 580, 850));
      
      // Risk metrics based on credit score and LTV
      const pdBaseline = this.calculateBaselinePD(creditScore, ltv, dti);
      const lgdBaseline = this.calculateBaselineLGD(ltv);
      const ead = loanAmount * 0.95; // Assuming 95% drawn at default
      
      const loan: LoanData = {
        loan_id: `LOAN_${String(i + 1).padStart(6, '0')}`,
        loan_number: `${Date.now()}-${i}`,
        property_id: `PROP_${String(i + 1).padStart(6, '0')}`,
        loan_amount: loanAmount,
        outstanding_balance: loanAmount * (0.8 + Math.random() * 0.2),
        original_term_months: 360,
        remaining_term_months: Math.floor(Math.random() * 360),
        interest_rate: 3.5 + Math.random() * 2.5,
        monthly_payment: loanAmount * 0.004,
        loan_type: this.randomChoice(['conventional', 'fha', 'va', 'jumbo'], [0.6, 0.2, 0.15, 0.05]),
        property_type: this.randomChoice(['single_family', 'condo', 'townhouse'], [0.7, 0.2, 0.1]),
        property_value: propertyValue,
        ltv_ratio: ltv,
        combined_ltv: ltv + Math.random() * 0.05,
        borrower_income: borrowerIncome,
        dti_ratio: dti,
        credit_score: creditScore,
        origination_date: this.randomDate(new Date(2018, 0, 1), new Date(2023, 11, 31)),
        maturity_date: this.addYears(new Date(), 30),
        address: this.generateAddress(state),
        risk_metrics: {
          pd_baseline: pdBaseline,
          lgd_baseline: lgdBaseline,
          ead: ead,
          expected_loss: pdBaseline * lgdBaseline * ead
        },
        insurance_coverage: this.generateInsuranceCoverage(propertyValue, state)
      };
      
      loans.push(loan);
    }
    
    return loans;
  }

  static generateClimateXData(loans: LoanData[]): ClimateXData[] {
    return loans.map(loan => ({
      property_id: loan.property_id,
      baseline_year: 2023,
      projection_years: [2026, 2028, 2050, 2100],
      rcp_scenarios: this.rcpScenarios,
      hazards: this.generateHazardData(loan)
    }));
  }

  private static generateHazardData(loan: LoanData): HazardData[] {
    const hazards: HazardData[] = [];
    const state = loan.address.state;
    const propertyValue = loan.property_value;
    
    // Generate different hazards based on location
    const applicableHazards = this.getApplicableHazards(state);
    
    applicableHazards.forEach(hazardType => {
      const baselineAAL = this.calculateBaselineAAL(hazardType, state, propertyValue);
      
      hazards.push({
        property_id: loan.property_id,
        latitude: loan.address.latitude,
        longitude: loan.address.longitude,
        county: loan.address.county,
        state: loan.address.state,
        zip_code: loan.address.zip_code,
        hazard_type: hazardType,
        return_periods: {
          rp_10: baselineAAL * 0.1,
          rp_25: baselineAAL * 0.2,
          rp_50: baselineAAL * 0.4,
          rp_100: baselineAAL * 0.8,
          rp_250: baselineAAL * 1.5,
          rp_500: baselineAAL * 2.2,
          rp_1000: baselineAAL * 3.0
        },
        confidence_interval: {
          p5: baselineAAL * 0.3,
          p50: baselineAAL,
          p95: baselineAAL * 2.1
        }
      });
    });
    
    return hazards;
  }

  private static getApplicableHazards(state: string): ('flood' | 'wildfire' | 'hurricane' | 'hail' | 'tornado')[] {
    const hazards: ('flood' | 'wildfire' | 'hurricane' | 'hail' | 'tornado')[] = ['hail', 'tornado']; // Base hazards everywhere
    
    if (this.riskRegions.high_flood.includes(state)) hazards.push('flood');
    if (this.riskRegions.high_wildfire.includes(state)) hazards.push('wildfire');
    if (this.riskRegions.high_hurricane.includes(state)) hazards.push('hurricane');
    
    return hazards;
  }

  private static calculateBaselineAAL(hazardType: string, state: string, propertyValue: number): number {
    const baseRates = {
      flood: 0.001,
      wildfire: 0.0008,
      hurricane: 0.002,
      hail: 0.0005,
      tornado: 0.0003
    };
    
    let multiplier = 1.0;
    
    // Adjust based on location risk
    if (hazardType === 'flood' && this.riskRegions.high_flood.includes(state)) multiplier = 2.5;
    if (hazardType === 'wildfire' && this.riskRegions.high_wildfire.includes(state)) multiplier = 3.0;
    if (hazardType === 'hurricane' && this.riskRegions.high_hurricane.includes(state)) multiplier = 2.0;
    
    return propertyValue * baseRates[hazardType as keyof typeof baseRates] * multiplier;
  }

  private static calculateBaselinePD(creditScore: number, ltv: number, dti: number): number {
    // Logistic regression approximation for PD
    const score = 8.5 - 0.01 * creditScore + 5 * ltv + 2 * dti;
    return 1 / (1 + Math.exp(-score)) * 0.05; // Scale to reasonable PD range
  }

  private static calculateBaselineLGD(ltv: number): number {
    // LGD increases with LTV, with some recovery assumptions
    return Math.min(0.8, Math.max(0.2, ltv - 0.2));
  }

  private static generateAddress(state: string) {
    const counties = {
      'FL': ['Miami-Dade', 'Broward', 'Orange', 'Hillsborough'],
      'CA': ['Los Angeles', 'Orange', 'San Diego', 'Santa Clara'],
      'TX': ['Harris', 'Dallas', 'Travis', 'Bexar'],
      'NY': ['Kings', 'Queens', 'New York', 'Suffolk'],
      'NC': ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth']
    };
    
    const stateCounties = counties[state as keyof typeof counties] || ['Unknown'];
    const county = stateCounties[Math.floor(Math.random() * stateCounties.length)];
    
    return {
      street: `${Math.floor(Math.random() * 9999) + 1} ${this.randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Maple'])} ${this.randomChoice(['St', 'Ave', 'Ln', 'Dr'])}`,
      city: county.replace(' County', ''),
      state: state,
      zip_code: String(Math.floor(Math.random() * 90000) + 10000),
      county: county,
      latitude: 25 + Math.random() * 25, // Rough US latitude range
      longitude: -125 + Math.random() * 50 // Rough US longitude range
    };
  }

  private static generateInsuranceCoverage(propertyValue: number, state: string) {
    const hazardCoverage = propertyValue * (0.8 + Math.random() * 0.2);
    const floodCoverage = this.riskRegions.high_flood.includes(state) ? 
      Math.min(250000, propertyValue * 0.8) : 0;
    
    const hazardPremium = hazardCoverage * (0.003 + Math.random() * 0.002);
    const floodPremium = floodCoverage * (0.005 + Math.random() * 0.005);
    
    return {
      hazard_insurance_amount: hazardCoverage,
      flood_insurance_amount: floodCoverage,
      hazard_premium_annual: hazardPremium,
      flood_premium_annual: floodPremium,
      total_insurance_premium: hazardPremium + floodPremium
    };
  }

  private static normalRandom(mean: number, std: number, min: number, max: number): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const value = mean + std * normal;
    return Math.max(min, Math.min(max, value));
  }

  private static randomChoice<T>(choices: T[], weights?: number[]): T {
    if (!weights) return choices[Math.floor(Math.random() * choices.length)];
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < choices.length; i++) {
      if (random < weights[i]) return choices[i];
      random -= weights[i];
    }
    
    return choices[choices.length - 1];
  }

  private static randomDate(start: Date, end: Date): string {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  }

  private static addYears(date: Date, years: number): string {
    const newDate = new Date(date);
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate.toISOString().split('T')[0];
  }
}