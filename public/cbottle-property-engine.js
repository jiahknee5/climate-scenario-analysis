/**
 * C-bottle Property Risk Assessment Engine
 * 
 * This engine provides property-level hurricane risk assessment using
 * satellite imagery analysis, building characteristics, and localized
 * vulnerability modeling. Unlike CLIMADA (scientific modeling) or 
 * Climate-OS (statistical trends), C-bottle focuses on individual
 * property risk assessment.
 */

class CBottlePropertyEngine {
    constructor() {
        // Property vulnerability factors
        this.vulnerabilityFactors = {
            buildingType: {
                residential: { factor: 1.0, description: 'Single family home' },
                commercial: { factor: 0.8, description: 'Commercial building' },
                industrial: { factor: 0.7, description: 'Industrial facility' },
                highrise: { factor: 0.6, description: 'High-rise building' }
            },
            construction: {
                wood: { factor: 1.5, description: 'Wood frame construction' },
                masonry: { factor: 1.0, description: 'Masonry construction' },
                concrete: { factor: 0.7, description: 'Reinforced concrete' },
                steel: { factor: 0.5, description: 'Steel frame construction' }
            },
            roofType: {
                gable: { factor: 1.3, description: 'Gable roof' },
                hip: { factor: 1.0, description: 'Hip roof' },
                flat: { factor: 1.1, description: 'Flat roof' },
                reinforced: { factor: 0.6, description: 'Hurricane-reinforced' }
            },
            elevation: {
                coastal: { factor: 2.0, description: 'Coastal/Sea level' },
                low: { factor: 1.5, description: 'Low elevation (<10ft)' },
                moderate: { factor: 1.0, description: 'Moderate elevation' },
                high: { factor: 0.5, description: 'High elevation (>50ft)' }
            }
        };

        // Property database (simulated)
        this.propertyDatabase = this.generatePropertyDatabase();
    }

    /**
     * Generate property-level risk assessment data
     * This is the primary method that differentiates C-bottle
     */
    generatePropertyRiskData(location = 'miami', scenario = 'current') {
        const features = [];
        const properties = this.getPropertiesInArea(location);
        
        // Generate property-specific risk assessments
        properties.forEach((property, index) => {
            const riskAssessment = this.assessPropertyRisk(property, scenario);
            features.push(this.createPropertyFeature(property, riskAssessment, index));
        });

        // Add aggregate statistics
        const aggregateStats = this.calculateAggregateRisk(features);
        
        return {
            type: 'FeatureCollection',
            features: features,
            properties: {
                framework: 'C-bottle',
                methodology: 'Property-Level Risk Assessment',
                dataSource: 'Satellite Imagery & Building Data',
                analysisType: 'Individual Property Risk',
                location: location,
                scenario: scenario,
                aggregateStats: aggregateStats
            }
        };
    }

    /**
     * Assess individual property risk
     */
    assessPropertyRisk(property, scenario) {
        // Base hurricane exposure for the property location
        const baseExposure = this.calculateBaseExposure(property.location);
        
        // Property-specific vulnerability
        const vulnerability = this.calculatePropertyVulnerability(property);
        
        // Wind risk assessment
        const windRisk = this.assessWindRisk(property, baseExposure, vulnerability);
        
        // Flood risk assessment
        const floodRisk = this.assessFloodRisk(property, baseExposure);
        
        // Storm surge risk
        const surgeRisk = this.assessSurgeRisk(property, baseExposure);
        
        // Combined risk score
        const totalRisk = this.calculateTotalRisk(windRisk, floodRisk, surgeRisk);
        
        // Economic impact
        const economicImpact = this.calculateEconomicImpact(property, totalRisk, scenario);
        
        // Mitigation recommendations
        const mitigations = this.generateMitigationRecommendations(property, windRisk, floodRisk, surgeRisk);
        
        return {
            riskScore: totalRisk,
            windRisk: windRisk,
            floodRisk: floodRisk,
            surgeRisk: surgeRisk,
            vulnerability: vulnerability,
            economicImpact: economicImpact,
            mitigations: mitigations,
            confidence: this.calculateConfidence(property)
        };
    }

    /**
     * Create property feature for visualization
     */
    createPropertyFeature(property, riskAssessment, index) {
        // Generate property boundary (simplified as point with buffer)
        const coordinates = this.generatePropertyBoundary(property.location);
        
        return {
            type: 'Feature',
            properties: {
                id: property.id,
                address: property.address,
                type: property.type,
                value: property.value,
                yearBuilt: property.yearBuilt,
                riskScore: riskAssessment.riskScore,
                riskCategory: this.getRiskCategory(riskAssessment.riskScore),
                windRisk: riskAssessment.windRisk,
                floodRisk: riskAssessment.floodRisk,
                surgeRisk: riskAssessment.surgeRisk,
                annualLoss: riskAssessment.economicImpact.expectedAnnualLoss,
                insurancePremium: riskAssessment.economicImpact.suggestedPremium,
                mitigationPotential: riskAssessment.mitigations.potentialReduction,
                satelliteImagery: this.getPropertyImageryURL(property)
            },
            geometry: {
                type: 'Polygon',
                coordinates: coordinates
            }
        };
    }

    /**
     * Generate simulated property database
     */
    generatePropertyDatabase() {
        const properties = [];
        const locations = [
            { name: 'miami', lat: 25.7617, lng: -80.1918, count: 50 },
            { name: 'houston', lat: 29.7604, lng: -95.3698, count: 40 },
            { name: 'neworleans', lat: 29.9511, lng: -90.0715, count: 35 }
        ];
        
        locations.forEach(city => {
            for (let i = 0; i < city.count; i++) {
                properties.push(this.generateProperty(city, i));
            }
        });
        
        return properties;
    }

    /**
     * Generate individual property
     */
    generateProperty(city, index) {
        const types = Object.keys(this.vulnerabilityFactors.buildingType);
        const constructions = Object.keys(this.vulnerabilityFactors.construction);
        const roofs = Object.keys(this.vulnerabilityFactors.roofType);
        const elevations = Object.keys(this.vulnerabilityFactors.elevation);
        
        return {
            id: `${city.name}_prop_${index}`,
            address: `${1000 + index} Hurricane Ave, ${city.name.charAt(0).toUpperCase() + city.name.slice(1)}, FL`,
            location: {
                lat: city.lat + (Math.random() - 0.5) * 0.1,
                lng: city.lng + (Math.random() - 0.5) * 0.1
            },
            type: types[Math.floor(Math.random() * types.length)],
            construction: constructions[Math.floor(Math.random() * constructions.length)],
            roofType: roofs[Math.floor(Math.random() * roofs.length)],
            elevation: elevations[Math.floor(Math.random() * elevations.length)],
            value: Math.floor(200000 + Math.random() * 800000),
            yearBuilt: Math.floor(1950 + Math.random() * 74),
            squareFeet: Math.floor(1000 + Math.random() * 4000),
            stories: Math.floor(1 + Math.random() * 3),
            distanceToCoast: Math.random() * 10 // miles
        };
    }

    /**
     * Get properties in specified area
     */
    getPropertiesInArea(location) {
        return this.propertyDatabase.filter(prop => 
            prop.address.toLowerCase().includes(location.toLowerCase())
        ).slice(0, 20); // Limit to 20 properties for visualization
    }

    /**
     * Calculate base hurricane exposure for location
     */
    calculateBaseExposure(location) {
        // Simplified exposure based on latitude (hurricane frequency decreases with latitude)
        const hurricaneZone = location.lat < 30 ? 'high' : location.lat < 35 ? 'moderate' : 'low';
        
        const exposureMap = {
            high: { frequency: 0.3, avgIntensity: 2.5 },
            moderate: { frequency: 0.15, avgIntensity: 2.0 },
            low: { frequency: 0.05, avgIntensity: 1.5 }
        };
        
        return exposureMap[hurricaneZone];
    }

    /**
     * Calculate property-specific vulnerability
     */
    calculatePropertyVulnerability(property) {
        let vulnerability = 1.0;
        
        // Building type factor
        vulnerability *= this.vulnerabilityFactors.buildingType[property.type].factor;
        
        // Construction material factor
        vulnerability *= this.vulnerabilityFactors.construction[property.construction].factor;
        
        // Roof type factor
        vulnerability *= this.vulnerabilityFactors.roofType[property.roofType].factor;
        
        // Elevation factor
        vulnerability *= this.vulnerabilityFactors.elevation[property.elevation].factor;
        
        // Age factor (older buildings are more vulnerable)
        const age = new Date().getFullYear() - property.yearBuilt;
        vulnerability *= 1 + (age / 100);
        
        // Distance to coast factor
        vulnerability *= Math.max(0.5, 1 - (property.distanceToCoast / 20));
        
        return Math.min(5, vulnerability); // Cap at 5
    }

    /**
     * Assess wind risk for property
     */
    assessWindRisk(property, baseExposure, vulnerability) {
        const baseWindRisk = baseExposure.avgIntensity * baseExposure.frequency;
        
        // Adjust for property characteristics
        let windRisk = baseWindRisk * vulnerability;
        
        // Height adjustment (taller buildings have higher wind exposure)
        windRisk *= (1 + property.stories * 0.1);
        
        // Construction quality adjustment
        if (property.construction === 'steel' || property.construction === 'concrete') {
            windRisk *= 0.7;
        }
        
        return Math.min(10, windRisk * 2); // Scale to 0-10
    }

    /**
     * Assess flood risk for property
     */
    assessFloodRisk(property, baseExposure) {
        let floodRisk = baseExposure.frequency * 3; // Base flood risk
        
        // Elevation is critical for flood risk
        if (property.elevation === 'coastal') {
            floodRisk *= 4;
        } else if (property.elevation === 'low') {
            floodRisk *= 2.5;
        } else if (property.elevation === 'high') {
            floodRisk *= 0.3;
        }
        
        // Distance to coast
        floodRisk *= Math.max(0.2, 1 - (property.distanceToCoast / 10));
        
        return Math.min(10, floodRisk);
    }

    /**
     * Assess storm surge risk
     */
    assessSurgeRisk(property, baseExposure) {
        let surgeRisk = 0;
        
        // Only coastal and low elevation properties have surge risk
        if (property.elevation === 'coastal') {
            surgeRisk = baseExposure.frequency * 5;
        } else if (property.elevation === 'low' && property.distanceToCoast < 2) {
            surgeRisk = baseExposure.frequency * 2;
        }
        
        return Math.min(10, surgeRisk);
    }

    /**
     * Calculate total risk score
     */
    calculateTotalRisk(windRisk, floodRisk, surgeRisk) {
        // Weighted average with wind being most important
        return (windRisk * 0.5 + floodRisk * 0.3 + surgeRisk * 0.2);
    }

    /**
     * Calculate economic impact
     */
    calculateEconomicImpact(property, totalRisk, scenario) {
        const baseRate = 0.002; // 0.2% base rate
        
        // Scenario multipliers
        const scenarioMultipliers = {
            current: 1.0,
            moderate: 1.3,
            severe: 1.8
        };
        
        const multiplier = scenarioMultipliers[scenario] || 1.0;
        
        // Expected annual loss
        const expectedAnnualLoss = property.value * baseRate * totalRisk * multiplier;
        
        // Insurance premium (includes overhead and profit)
        const suggestedPremium = expectedAnnualLoss * 2.5;
        
        // Maximum probable loss (1-in-100 year event)
        const maxProbableLoss = property.value * Math.min(0.8, totalRisk / 10);
        
        return {
            expectedAnnualLoss: Math.round(expectedAnnualLoss),
            suggestedPremium: Math.round(suggestedPremium),
            maxProbableLoss: Math.round(maxProbableLoss),
            deductible: Math.round(property.value * 0.02) // 2% deductible
        };
    }

    /**
     * Generate mitigation recommendations
     */
    generateMitigationRecommendations(property, windRisk, floodRisk, surgeRisk) {
        const recommendations = [];
        let potentialReduction = 0;
        
        // Wind mitigation
        if (windRisk > 5) {
            if (property.roofType !== 'reinforced') {
                recommendations.push({
                    type: 'Hurricane straps and clips',
                    cost: 3000,
                    reduction: 0.15
                });
                potentialReduction += 0.15;
            }
            
            recommendations.push({
                type: 'Impact-resistant windows',
                cost: 15000,
                reduction: 0.20
            });
            potentialReduction += 0.20;
        }
        
        // Flood mitigation
        if (floodRisk > 5) {
            recommendations.push({
                type: 'Elevate utilities',
                cost: 5000,
                reduction: 0.10
            });
            
            if (property.elevation === 'low' || property.elevation === 'coastal') {
                recommendations.push({
                    type: 'Elevate structure',
                    cost: 80000,
                    reduction: 0.40
                });
                potentialReduction += 0.40;
            }
        }
        
        // Surge mitigation
        if (surgeRisk > 3) {
            recommendations.push({
                type: 'Flood vents',
                cost: 8000,
                reduction: 0.15
            });
            potentialReduction += 0.15;
        }
        
        return {
            recommendations: recommendations,
            totalCost: recommendations.reduce((sum, r) => sum + r.cost, 0),
            potentialReduction: Math.min(0.7, potentialReduction)
        };
    }

    /**
     * Calculate confidence in assessment
     */
    calculateConfidence(property) {
        let confidence = 0.8; // Base confidence
        
        // Newer buildings have better documentation
        const age = new Date().getFullYear() - property.yearBuilt;
        if (age < 10) confidence += 0.1;
        if (age > 50) confidence -= 0.1;
        
        // Coastal properties have more data
        if (property.distanceToCoast < 5) confidence += 0.05;
        
        return Math.min(0.95, Math.max(0.6, confidence));
    }

    /**
     * Get risk category
     */
    getRiskCategory(riskScore) {
        if (riskScore < 2) return 'Low';
        if (riskScore < 4) return 'Moderate';
        if (riskScore < 6) return 'High';
        if (riskScore < 8) return 'Very High';
        return 'Extreme';
    }

    /**
     * Generate property boundary coordinates
     */
    generatePropertyBoundary(location) {
        const size = 0.0002; // Roughly 20 meters
        
        return [[
            [location.lng - size, location.lat - size],
            [location.lng + size, location.lat - size],
            [location.lng + size, location.lat + size],
            [location.lng - size, location.lat + size],
            [location.lng - size, location.lat - size]
        ]];
    }

    /**
     * Get property imagery URL (simulated)
     */
    getPropertyImageryURL(property) {
        // In real implementation, this would return actual satellite imagery
        return `https://maps.googleapis.com/maps/api/staticmap?center=${property.location.lat},${property.location.lng}&zoom=19&size=400x400&maptype=satellite`;
    }

    /**
     * Calculate aggregate risk statistics
     */
    calculateAggregateRisk(features) {
        const riskScores = features.map(f => f.properties.riskScore);
        const totalValue = features.reduce((sum, f) => sum + f.properties.value, 0);
        const totalAnnualLoss = features.reduce((sum, f) => sum + f.properties.annualLoss, 0);
        
        return {
            propertyCount: features.length,
            totalValue: totalValue,
            totalAnnualLoss: totalAnnualLoss,
            avgRiskScore: (riskScores.reduce((a, b) => a + b, 0) / riskScores.length).toFixed(2),
            highRiskProperties: features.filter(f => f.properties.riskScore > 6).length,
            riskDistribution: {
                low: features.filter(f => f.properties.riskCategory === 'Low').length,
                moderate: features.filter(f => f.properties.riskCategory === 'Moderate').length,
                high: features.filter(f => f.properties.riskCategory === 'High').length,
                veryHigh: features.filter(f => f.properties.riskCategory === 'Very High').length,
                extreme: features.filter(f => f.properties.riskCategory === 'Extreme').length
            }
        };
    }
}

// Create global instance
const cbottleEngine = new CBottlePropertyEngine();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CBottlePropertyEngine;
}