// Improved Hurricane Data Generation with Meteorological Accuracy
// Addresses issues found in testing: Coriolis effect, realistic paths, Atlantic/Pacific basins

class ImprovedHurricaneGenerator {
    constructor() {
        // Atlantic hurricane formation zones
        this.atlanticFormationZones = {
            capeVerde: {
                lngRange: [-35, -15],  // 15°-35°W
                latRange: [10, 20],    // 10°-20°N
                probability: 0.6       // 60% of Atlantic hurricanes
            },
            gulf: {
                lngRange: [-95, -80],  // 80°-95°W
                latRange: [18, 30],    // 18°-30°N
                probability: 0.25      // 25% of Atlantic hurricanes
            },
            caribbean: {
                lngRange: [-85, -60],  // 60°-85°W
                latRange: [10, 20],    // 10°-20°N
                probability: 0.15      // 15% of Atlantic hurricanes
            }
        };
        
        // Pacific hurricane formation zones
        this.pacificFormationZones = {
            easternPacific: {
                lngRange: [-140, -90], // 90°-140°W
                latRange: [5, 25],     // 5°-25°N
                probability: 0.85      // 85% of Pacific hurricanes
            },
            centralPacific: {
                lngRange: [-180, -140], // 140°-180°W
                latRange: [5, 25],      // 5°-25°N
                probability: 0.15       // 15% of Pacific hurricanes
            }
        };
        
        // Hurricane categories with realistic wind speeds
        this.categories = {
            1: { minWind: 74, maxWind: 95, color: '#74CCFF' },   // Light blue
            2: { minWind: 96, maxWind: 110, color: '#FFD23F' },  // Yellow
            3: { minWind: 111, maxWind: 129, color: '#FF8C42' }, // Orange
            4: { minWind: 130, maxWind: 156, color: '#FF6B6B' }, // Red
            5: { minWind: 157, maxWind: 200, color: '#D63031' }  // Dark red
        };
    }
    
    // Generate realistic hurricane data with proper meteorology
    generateHurricaneData(scenario = 'baseline', basin = 'atlantic', count = null) {
        const multiplier = this.getScenarioMultiplier(scenario);
        const baseCount = basin === 'atlantic' ? 12 : 8; // Atlantic vs Pacific average
        const hurricaneCount = count || Math.floor(baseCount * multiplier);
        
        const hurricanes = [];
        
        for (let i = 0; i < hurricaneCount; i++) {
            const hurricane = basin === 'atlantic' 
                ? this.generateAtlanticHurricane(i)
                : this.generatePacificHurricane(i);
                
            hurricanes.push(hurricane);
        }
        
        return {
            type: 'FeatureCollection',
            features: hurricanes
        };
    }
    
    // Generate Atlantic hurricane with realistic path
    generateAtlanticHurricane(index) {
        // Select formation zone
        const formationZone = this.selectFormationZone(this.atlanticFormationZones);
        const startPosition = this.getRandomPosition(formationZone);
        
        // Generate realistic track
        const track = this.generateAtlanticTrack(startPosition, formationZone);
        
        // Assign realistic intensity
        const intensity = this.generateIntensity();
        const category = this.categories[intensity];
        
        return {
            type: 'Feature',
            properties: {
                name: `Hurricane ${String.fromCharCode(65 + index)} ${new Date().getFullYear()}`,
                category: intensity,
                maxWind: Math.floor(category.minWind + Math.random() * (category.maxWind - category.minWind)),
                basin: 'Atlantic',
                formationZone: Object.keys(this.atlanticFormationZones).find(key => 
                    this.atlanticFormationZones[key] === formationZone
                ),
                color: category.color
            },
            geometry: {
                type: 'LineString',
                coordinates: track
            }
        };
    }
    
    // Generate Pacific hurricane with realistic path
    generatePacificHurricane(index) {
        // Select formation zone
        const formationZone = this.selectFormationZone(this.pacificFormationZones);
        const startPosition = this.getRandomPosition(formationZone);
        
        // Generate realistic track
        const track = this.generatePacificTrack(startPosition);
        
        // Assign realistic intensity
        const intensity = this.generateIntensity();
        const category = this.categories[intensity];
        
        return {
            type: 'Feature',
            properties: {
                name: `Hurricane ${String.fromCharCode(65 + index)}E ${new Date().getFullYear()}`,
                category: intensity,
                maxWind: Math.floor(category.minWind + Math.random() * (category.maxWind - category.minWind)),
                basin: 'Eastern Pacific',
                formationZone: Object.keys(this.pacificFormationZones).find(key => 
                    this.pacificFormationZones[key] === formationZone
                ),
                color: category.color
            },
            geometry: {
                type: 'LineString',
                coordinates: track
            }
        };
    }
    
    // Generate realistic Atlantic hurricane track with Coriolis effect
    generateAtlanticTrack(startPosition, formationZone) {
        const track = [startPosition];
        let currentLng = startPosition[0];
        let currentLat = startPosition[1];
        
        const trackLength = 6 + Math.floor(Math.random() * 4); // 6-10 points
        
        for (let i = 1; i < trackLength; i++) {
            const progressRatio = i / (trackLength - 1);
            
            // Apply Coriolis effect and steering winds
            const movement = this.calculateAtlanticMovement(currentLng, currentLat, progressRatio, formationZone);
            
            currentLng += movement.lng;
            currentLat += movement.lat;
            
            // Add realistic variation
            currentLng += (Math.random() - 0.5) * 0.5;
            currentLat += (Math.random() - 0.5) * 0.3;
            
            track.push([currentLng, currentLat]);
        }
        
        return track;
    }
    
    // Generate realistic Pacific hurricane track
    generatePacificTrack(startPosition) {
        const track = [startPosition];
        let currentLng = startPosition[0];
        let currentLat = startPosition[1];
        
        const trackLength = 5 + Math.floor(Math.random() * 3); // 5-8 points
        
        for (let i = 1; i < trackLength; i++) {
            const progressRatio = i / (trackLength - 1);
            
            // Pacific storms generally move west-northwest
            const lngChange = -1.2 - Math.random() * 1.5; // Move westward
            const latChange = 0.4 + Math.random() * 0.8 + progressRatio * 0.5; // Slight northward curve
            
            currentLng += lngChange;
            currentLat += latChange;
            
            // Add variation
            currentLng += (Math.random() - 0.5) * 0.4;
            currentLat += (Math.random() - 0.5) * 0.3;
            
            track.push([currentLng, currentLat]);
        }
        
        return track;
    }
    
    // Calculate Atlantic hurricane movement with meteorological accuracy
    calculateAtlanticMovement(currentLng, currentLat, progressRatio, formationZone) {
        let lngChange, latChange;
        
        // Different movement patterns based on formation zone and position
        if (formationZone === this.atlanticFormationZones.capeVerde) {
            // Cape Verde hurricanes: initially west, then curve north/northeast
            if (progressRatio < 0.4) {
                // Early stage: move west-northwest
                lngChange = 2.5 + Math.random() * 1.5; // Move westward
                latChange = 0.5 + Math.random() * 0.8; // Slight northward
            } else if (progressRatio < 0.7) {
                // Middle stage: continue west but more northward
                lngChange = 1.5 + Math.random() * 1.0; // Still westward but slower
                latChange = 1.0 + Math.random() * 1.2; // More northward
            } else {
                // Late stage: curve northeast (recurvature)
                lngChange = -0.5 - Math.random() * 1.5; // Turn eastward
                latChange = 1.5 + Math.random() * 2.0; // Strong northward
            }
        } else if (formationZone === this.atlanticFormationZones.gulf) {
            // Gulf hurricanes: generally northward with slight east/west variation
            lngChange = (Math.random() - 0.5) * 2.0; // Random east/west
            latChange = 1.5 + Math.random() * 1.5; // Strong northward
        } else {
            // Caribbean hurricanes: initially northwest, then north/northeast
            if (progressRatio < 0.5) {
                lngChange = 0.8 + Math.random() * 1.2; // Northwest
                latChange = 1.0 + Math.random() * 1.0; // Northward
            } else {
                lngChange = -0.2 - Math.random() * 0.8; // Turn northeast
                latChange = 1.2 + Math.random() * 1.5; // Continue northward
            }
        }
        
        // Apply Coriolis effect (stronger at higher latitudes)
        const coriolisEffect = Math.sin(currentLat * Math.PI / 180) * 0.3;
        latChange += coriolisEffect;
        
        return { lng: lngChange, lat: latChange };
    }
    
    // Select formation zone based on probabilities
    selectFormationZone(zones) {
        const random = Math.random();
        let cumulative = 0;
        
        for (const [name, zone] of Object.entries(zones)) {
            cumulative += zone.probability;
            if (random <= cumulative) {
                return zone;
            }
        }
        
        // Fallback to first zone
        return Object.values(zones)[0];
    }
    
    // Get random position within formation zone
    getRandomPosition(zone) {
        const lng = zone.lngRange[0] + Math.random() * (zone.lngRange[1] - zone.lngRange[0]);
        const lat = zone.latRange[0] + Math.random() * (zone.latRange[1] - zone.latRange[0]);
        return [lng, lat];
    }
    
    // Generate realistic hurricane intensity
    generateIntensity() {
        // Hurricane intensity distribution (based on historical data)
        const intensityProbabilities = {
            1: 0.4,  // 40% Category 1
            2: 0.25, // 25% Category 2
            3: 0.2,  // 20% Category 3
            4: 0.1,  // 10% Category 4
            5: 0.05  // 5% Category 5
        };
        
        const random = Math.random();
        let cumulative = 0;
        
        for (const [category, probability] of Object.entries(intensityProbabilities)) {
            cumulative += probability;
            if (random <= cumulative) {
                return parseInt(category);
            }
        }
        
        return 1; // Fallback
    }
    
    // Get scenario multiplier for climate projections
    getScenarioMultiplier(scenario) {
        const multipliers = {
            'baseline': 1.0,
            'historical': 1.0,
            'rcp26': 1.1,    // 10% increase
            'rcp45': 1.3,    // 30% increase
            'rcp85': 1.6     // 60% increase
        };
        
        return multipliers[scenario] || 1.0;
    }
    
    // Generate combined Atlantic and Pacific data
    generateCombinedBasinData(scenario = 'baseline') {
        const atlanticData = this.generateHurricaneData(scenario, 'atlantic');
        const pacificData = this.generateHurricaneData(scenario, 'pacific');
        
        return {
            type: 'FeatureCollection',
            features: [...atlanticData.features, ...pacificData.features]
        };
    }
    
    // Validate hurricane path meteorological accuracy
    validatePath(hurricane) {
        const coordinates = hurricane.geometry.coordinates;
        const validations = {
            hasNorthwardMovement: false,
            hasRealisticOrigin: false,
            hasCoriolisEffect: false,
            pathLength: coordinates.length
        };
        
        // Check northward movement (Coriolis effect)
        const startLat = coordinates[0][1];
        const endLat = coordinates[coordinates.length - 1][1];
        validations.hasNorthwardMovement = endLat > startLat;
        
        // Check realistic origin
        const basin = hurricane.properties.basin;
        const startLng = coordinates[0][0];
        startLat = coordinates[0][1];
        
        if (basin === 'Atlantic') {
            validations.hasRealisticOrigin = (
                (startLng >= -95 && startLng <= -15 && startLat >= 10 && startLat <= 30)
            );
        } else {
            validations.hasRealisticOrigin = (
                (startLng >= -180 && startLng <= -90 && startLat >= 5 && startLat <= 25)
            );
        }
        
        // Check for Coriolis effect (increasing northward movement)
        let northwardSections = 0;
        for (let i = 1; i < coordinates.length; i++) {
            if (coordinates[i][1] > coordinates[i-1][1]) {
                northwardSections++;
            }
        }
        validations.hasCoriolisEffect = northwardSections >= coordinates.length * 0.6;
        
        return validations;
    }
}

// Global functions for compatibility with existing code
const hurricaneGenerator = new ImprovedHurricaneGenerator();

function generateHurricaneData(scenario = 'baseline') {
    return hurricaneGenerator.generateHurricaneData(scenario, 'atlantic');
}

function generatePacificHurricaneData(scenario = 'baseline') {
    return hurricaneGenerator.generateHurricaneData(scenario, 'pacific');
}

function generateCombinedHurricaneData(scenario = 'baseline') {
    return hurricaneGenerator.generateCombinedBasinData(scenario);
}

function generateRealisticHurricanePaths() {
    const data = hurricaneGenerator.generateHurricaneData('baseline', 'atlantic', 10);
    return data.features;
}

function generatePacificHurricanePaths() {
    const data = hurricaneGenerator.generateHurricaneData('baseline', 'pacific', 8);
    return data.features;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ImprovedHurricaneGenerator,
        generateHurricaneData,
        generatePacificHurricaneData,
        generateCombinedHurricaneData,
        generateRealisticHurricanePaths,
        generatePacificHurricanePaths
    };
}