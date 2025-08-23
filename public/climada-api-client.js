/**
 * CLIMADA API Client
 * Connects to the Python backend running actual CLIMADA calculations
 */

class ClimadaAPIClient {
    constructor(baseURL = 'http://localhost:5555/api/climada') {
        this.baseURL = baseURL;
        this.cache = new Map();
    }

    /**
     * Check if CLIMADA backend is available
     */
    async checkStatus() {
        try {
            const response = await fetch(`${this.baseURL}/version`);
            const data = await response.json();
            console.log('CLIMADA Backend Status:', data);
            return data.status === 'operational';
        } catch (error) {
            console.error('CLIMADA backend not available:', error);
            return false;
        }
    }

    /**
     * Get historical hurricane tracks from IBTrACS
     */
    async getHistoricalTracks(basin = 'NA', yearMin = 2010, yearMax = 2020) {
        const cacheKey = `historical_${basin}_${yearMin}_${yearMax}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${this.baseURL}/historical-tracks?basin=${basin}&year_min=${yearMin}&year_max=${yearMax}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching historical tracks:', error);
            // Return empty FeatureCollection if backend is not available
            return {
                type: 'FeatureCollection',
                features: [],
                properties: {
                    error: 'Backend not available',
                    message: 'Using fallback data'
                }
            };
        }
    }

    /**
     * Generate synthetic hurricane tracks
     */
    async getSyntheticTracks(scenario = 'historical', years = 100, basin = 'NA') {
        try {
            const response = await fetch(`${this.baseURL}/synthetic-tracks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    scenario: scenario,
                    years: years,
                    basin: basin
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error generating synthetic tracks:', error);
            return {
                type: 'FeatureCollection',
                features: [],
                properties: {
                    error: 'Backend not available'
                }
            };
        }
    }

    /**
     * Calculate wind field for a specific hurricane
     */
    async getWindField(trackId, resolution = 10) {
        try {
            const response = await fetch(`${this.baseURL}/wind-field`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    track_id: trackId,
                    resolution: resolution
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error calculating wind field:', error);
            return null;
        }
    }

    /**
     * Calculate economic impact
     */
    async getImpact(country = 'USA', scenario = 'historical') {
        try {
            const response = await fetch(`${this.baseURL}/impact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    country: country,
                    scenario: scenario
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error calculating impact:', error);
            return null;
        }
    }

    /**
     * Get return period statistics
     */
    async getReturnPeriods(lat, lon, metric = 'wind_speed') {
        try {
            const response = await fetch(
                `${this.baseURL}/return-periods?location=${lat},${lon}&metric=${metric}`
            );
            
            return await response.json();
        } catch (error) {
            console.error('Error getting return periods:', error);
            return null;
        }
    }

    /**
     * Convert scenario names to CLIMADA format
     */
    mapScenarioName(scenario) {
        const scenarioMap = {
            'baseline': 'historical',
            '2c': 'rcp26',
            '4c': 'rcp85'
        };
        return scenarioMap[scenario] || scenario;
    }
}

// Create global instance
const climadaAPI = new ClimadaAPIClient();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClimadaAPIClient;
}