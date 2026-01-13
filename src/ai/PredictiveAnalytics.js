const moment = require('moment');

class PredictiveAnalytics {
    constructor(database, behaviorTracker) {
        this.db = database;
        this.behaviorTracker = behaviorTracker;
        this.predictionCache = new Map();
        this.analyticsData = new Map();
        
        // Configurações de ML básico
        this.mlConfig = {
            minDataPoints: 5,
            confidenceThreshold: 0.6,
            predictionWindow: 30, // dias
            updateInterval: 24 * 60 * 60 * 1000 // 24 horas
        };
    }

    // ========== ANÁLISE PREDITIVA DE DEMANDA ==========

    async predictDemandByTimeSlot() {
        try {
            const historicalData = await this.getHistoricalBookingData();
            const predictions = {};

            // Analisar padrões por dia da semana e horário
            for (let day = 1; day <= 6; day++) { // Segunda a sábado
                predictions[day] = {};
                
                const dayBookings = historicalData.filter(booking => {
                    const bookingDay = moment(booking.date).day();
                    return bookingDay === day;
                });

                // Agrupar por horário
                const timeSlots = this.groupBookingsByTimeSlot(dayBookings);
                
                Object.keys(timeSlots).forEach(timeSlot => {
                    const bookingCount = timeSlots[timeSlot].length;
                    const avgDemand = this.calculateAverageDemand(timeSlots[timeSlot]);
                    
                    predictions[day][timeSlot] = {
                        expectedBookings: Math.round(avgDemand),
                        confidence: this.calculateDemandConfidence(timeSlots[timeSlot]),
                        trend: this.calculateDemandTrend(timeSlots[timeSlot]),
                        peakProbability: this.calculatePeakProbability(bookingCount, avgDemand)
                    };
                });
            }

            return predictions;
        } catch (error) {
            console.error('Erro ao prever demanda por horário:', error);
            return {};
        }
    }

    async predictServiceDemand() {
        try {
            const historicalData = await this.getHistoricalBookingData();
            const serviceStats = {};

            // Agrupar por serviço
            historicalData.forEach(booking => {
                const serviceName = booking.service_name;
                if (!serviceStats[serviceName]) {
                    serviceStats[serviceName] = {
                        bookings: [],
                        totalRevenue: 0,
                        monthlyTrend: []
                    };
                }
                
                serviceStats[serviceName].bookings.push(booking);
            });

            const predictions = {};

            Object.keys(serviceStats).forEach(serviceName => {
                const serviceData = serviceStats[serviceName];
                const monthlyData = this.groupBookingsByMonth(serviceData.bookings);
                
                predictions[serviceName] = {
                    nextMonthPrediction: this.predictNextMonthDemand(monthlyData),
                    seasonalPattern: this.analyzeSeasonalPattern(monthlyData),
                    growthRate: this.calculateGrowthRate(monthlyData),
                    peakMonths: this.identifyPeakMonths(monthlyData),
                    confidence: this.calculateServicePredictionConfidence(serviceData.bookings)
                };
            });

            return predictions;
        } catch (error) {
            console.error('Erro ao prever demanda de serviços:', error);
            return {};
        }
    }

    // ========== ANÁLISE DE RECEITA PREDITIVA ==========

    async predictRevenue(timeframe = 'month') {
        try {
            const historicalData = await this.getHistoricalBookingData();
            const revenueData = this.calculateHistoricalRevenue(historicalData);
            
            let prediction;
            
            switch (timeframe) {
                case 'week':
                    prediction = this.predictWeeklyRevenue(revenueData);
                    break;
                case 'month':
                    prediction = this.predictMonthlyRevenue(revenueData);
                    break;
                case 'quarter':
                    prediction = this.predictQuarterlyRevenue(revenueData);
                    break;
                default:
                    prediction = this.predictMonthlyRevenue(revenueData);
            }

            return {
                timeframe,
                prediction: prediction.amount,
                confidence: prediction.confidence,
                factors: prediction.factors,
                scenarios: {
                    optimistic: prediction.amount * 1.2,
                    realistic: prediction.amount,
                    pessimistic: prediction.amount * 0.8
                },
                breakdown: prediction.breakdown
            };
        } catch (error) {
            console.error('Erro ao prever receita:', error);
            return null;
        }
    }

    // ========== ANÁLISE DE CHURN AVANÇADA ==========

    async analyzeChurnPatterns() {
        try {
            const allCustomers = await this.getAllCustomerData();
            const churnAnalysis = {
                overallChurnRate: 0,
                churnBySegment: {},
                churnFactors: {},
                riskSegments: [],
                preventionStrategies: {}
            };

            let totalCustomers = 0;
            let churnedCustomers = 0;

            allCustomers.forEach(customer => {
                totalCustomers++;
                
                const isChurned = this.isCustomerChurned(customer);
                if (isChurned) {
                    churnedCustomers++;
                }

                // Analisar fatores de churn
                const churnFactors = this.analyzeCustomerChurnFactors(customer);
                Object.keys(churnFactors).forEach(factor => {
                    if (!churnAnalysis.churnFactors[factor]) {
                        churnAnalysis.churnFactors[factor] = { churned: 0, total: 0 };
                    }
                    
                    churnAnalysis.churnFactors[factor].total++;
                    if (isChurned) {
                        churnAnalysis.churnFactors[factor].churned++;
                    }
                });

                // Segmentar por comportamento
                const segment = this.categorizeCustomer(customer);
                if (!churnAnalysis.churnBySegment[segment]) {
                    churnAnalysis.churnBySegment[segment] = { churned: 0, total: 0 };
                }
                
                churnAnalysis.churnBySegment[segment].total++;
                if (isChurned) {
                    churnAnalysis.churnBySegment[segment].churned++;
                }
            });

            // Calcular taxas
            churnAnalysis.overallChurnRate = totalCustomers > 0 ? churnedCustomers / totalCustomers : 0;

            // Calcular taxas por fator
            Object.keys(churnAnalysis.churnFactors).forEach(factor => {
                const data = churnAnalysis.churnFactors[factor];
                data.churnRate = data.total > 0 ? data.churned / data.total : 0;
            });

            // Calcular taxas por segmento
            Object.keys(churnAnalysis.churnBySegment).forEach(segment => {
                const data = churnAnalysis.churnBySegment[segment];
                data.churnRate = data.total > 0 ? data.churned / data.total : 0;
            });

            // Identificar segmentos de risco
            churnAnalysis.riskSegments = Object.entries(churnAnalysis.churnBySegment)
                .filter(([segment, data]) => data.churnRate > churnAnalysis.overallChurnRate * 1.5)
                .map(([segment, data]) => ({ segment, churnRate: data.churnRate }));

            // Gerar estratégias de prevenção
            churnAnalysis.preventionStrategies = this.generatePreventionStrategies(churnAnalysis);

            return churnAnalysis;
        } catch (error) {
            console.error('Erro ao analisar padrões de churn:', error);
            return null;
        }
    }

    // ========== OTIMIZAÇÃO DE PREÇOS ==========

    async analyzePriceOptimization() {
        try {
            const historicalData = await this.getHistoricalBookingData();
            const priceAnalysis = {};

            // Agrupar por serviço
            const serviceGroups = this.groupBookingsByService(historicalData);

            Object.keys(serviceGroups).forEach(serviceName => {
                const bookings = serviceGroups[serviceName];
                const pricePoints = this.extractPricePoints(bookings);
                
                priceAnalysis[serviceName] = {
                    currentPrice: this.getCurrentPrice(serviceName),
                    demandElasticity: this.calculateDemandElasticity(bookings, pricePoints),
                    optimalPrice: this.calculateOptimalPrice(bookings, pricePoints),
                    revenueImpact: this.calculateRevenueImpact(bookings, pricePoints),
                    competitorAnalysis: this.analyzeCompetitorPricing(serviceName),
                    recommendation: this.generatePriceRecommendation(bookings, pricePoints)
                };
            });

            return priceAnalysis;
        } catch (error) {
            console.error('Erro ao analisar otimização de preços:', error);
            return {};
        }
    }

    // ========== ANÁLISE DE SAZONALIDADE ==========

    async analyzeSeasonalPatterns() {
        try {
            const historicalData = await this.getHistoricalBookingData();
            const seasonalAnalysis = {
                monthly: {},
                weekly: {},
                daily: {},
                seasonal: {},
                holidays: {}
            };

            // Análise mensal
            const monthlyData = this.groupBookingsByMonth(historicalData);
            Object.keys(monthlyData).forEach(month => {
                const bookings = monthlyData[month];
                seasonalAnalysis.monthly[month] = {
                    bookingCount: bookings.length,
                    revenue: this.calculateTotalRevenue(bookings),
                    avgBookingsPerDay: bookings.length / moment(month, 'YYYY-MM').daysInMonth(),
                    popularServices: this.getPopularServices(bookings)
                };
            });

            // Análise semanal (dia da semana)
            for (let day = 1; day <= 7; day++) {
                const dayBookings = historicalData.filter(booking => 
                    moment(booking.date).day() === day
                );
                
                seasonalAnalysis.weekly[day] = {
                    dayName: moment().day(day).format('dddd'),
                    bookingCount: dayBookings.length,
                    avgBookingsPerWeek: dayBookings.length / this.getWeeksInData(historicalData),
                    peakHours: this.identifyPeakHours(dayBookings),
                    popularServices: this.getPopularServices(dayBookings)
                };
            }

            // Análise por horário
            const hourlyData = this.groupBookingsByHour(historicalData);
            Object.keys(hourlyData).forEach(hour => {
                seasonalAnalysis.daily[hour] = {
                    bookingCount: hourlyData[hour].length,
                    avgBookingsPerDay: hourlyData[hour].length / this.getDaysInData(historicalData),
                    demandLevel: this.categorizeDemandLevel(hourlyData[hour].length)
                };
            });

            // Análise sazonal (estações do ano)
            seasonalAnalysis.seasonal = this.analyzeSeasonalTrends(historicalData);

            return seasonalAnalysis;
        } catch (error) {
            console.error('Erro ao analisar padrões sazonais:', error);
            return {};
        }
    }

    // ========== PREVISÃO DE CAPACIDADE ==========

    async predictCapacityNeeds() {
        try {
            const demandPrediction = await this.predictDemandByTimeSlot();
            const currentCapacity = this.getCurrentCapacity();
            
            const capacityAnalysis = {
                currentUtilization: {},
                predictedUtilization: {},
                bottlenecks: [],
                recommendations: [],
                optimalSchedule: {}
            };

            // Analisar utilização atual e prevista
            Object.keys(demandPrediction).forEach(day => {
                capacityAnalysis.currentUtilization[day] = {};
                capacityAnalysis.predictedUtilization[day] = {};
                
                Object.keys(demandPrediction[day]).forEach(timeSlot => {
                    const prediction = demandPrediction[day][timeSlot];
                    const capacity = currentCapacity[timeSlot] || 3; // 3 agendamentos por horário
                    
                    const utilization = prediction.expectedBookings / capacity;
                    
                    capacityAnalysis.predictedUtilization[day][timeSlot] = {
                        utilization: Math.min(utilization, 1),
                        expectedBookings: prediction.expectedBookings,
                        capacity: capacity,
                        status: this.getCapacityStatus(utilization)
                    };

                    // Identificar gargalos
                    if (utilization > 0.9) {
                        capacityAnalysis.bottlenecks.push({
                            day: moment().day(day).format('dddd'),
                            timeSlot,
                            utilization,
                            severity: utilization > 1.2 ? 'high' : 'medium'
                        });
                    }
                });
            });

            // Gerar recomendações
            capacityAnalysis.recommendations = this.generateCapacityRecommendations(capacityAnalysis);

            return capacityAnalysis;
        } catch (error) {
            console.error('Erro ao prever necessidades de capacidade:', error);
            return {};
        }
    }

    // ========== MÉTODOS AUXILIARES ==========

    async getHistoricalBookingData() {
        try {
            const bookings = await this.db.getAllBookings();
            
            // Filtrar apenas agendamentos dos últimos 12 meses
            const twelveMonthsAgo = moment().subtract(12, 'months');
            
            return bookings.filter(booking => 
                moment(booking.date).isAfter(twelveMonthsAgo) &&
                booking.status === 'confirmed'
            );
        } catch (error) {
            console.error('Erro ao obter dados históricos:', error);
            return [];
        }
    }

    groupBookingsByTimeSlot(bookings) {
        const timeSlots = {};
        
        bookings.forEach(booking => {
            const timeSlot = booking.time;
            if (!timeSlots[timeSlot]) {
                timeSlots[timeSlot] = [];
            }
            timeSlots[timeSlot].push(booking);
        });
        
        return timeSlots;
    }

    groupBookingsByMonth(bookings) {
        const months = {};
        
        bookings.forEach(booking => {
            const month = moment(booking.date).format('YYYY-MM');
            if (!months[month]) {
                months[month] = [];
            }
            months[month].push(booking);
        });
        
        return months;
    }

    groupBookingsByService(bookings) {
        const services = {};
        
        bookings.forEach(booking => {
            const serviceName = booking.service_name;
            if (!services[serviceName]) {
                services[serviceName] = [];
            }
            services[serviceName].push(booking);
        });
        
        return services;
    }

    groupBookingsByHour(bookings) {
        const hours = {};
        
        bookings.forEach(booking => {
            const hour = booking.time.split(':')[0];
            if (!hours[hour]) {
                hours[hour] = [];
            }
            hours[hour].push(booking);
        });
        
        return hours;
    }

    calculateAverageDemand(bookings) {
        if (bookings.length === 0) return 0;
        
        // Agrupar por semana e calcular média
        const weeklyData = {};
        
        bookings.forEach(booking => {
            const week = moment(booking.date).format('YYYY-WW');
            if (!weeklyData[week]) {
                weeklyData[week] = 0;
            }
            weeklyData[week]++;
        });
        
        const weeks = Object.keys(weeklyData);
        if (weeks.length === 0) return 0;
        
        const totalBookings = Object.values(weeklyData).reduce((sum, count) => sum + count, 0);
        return totalBookings / weeks.length;
    }

    calculateDemandConfidence(bookings) {
        if (bookings.length < this.mlConfig.minDataPoints) {
            return 0.3; // Baixa confiança com poucos dados
        }
        
        // Calcular variância na demanda
        const weeklyData = this.getWeeklyBookingCounts(bookings);
        const variance = this.calculateVariance(weeklyData);
        const mean = this.calculateMean(weeklyData);
        
        // Menor variância = maior confiança
        const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;
        return Math.max(0.1, Math.min(0.9, 1 - coefficientOfVariation));
    }

    calculateDemandTrend(bookings) {
        const monthlyData = this.getMonthlyBookingCounts(bookings);
        
        if (monthlyData.length < 3) {
            return 'stable'; // Poucos dados para determinar tendência
        }
        
        // Calcular tendência linear simples
        const trend = this.calculateLinearTrend(monthlyData);
        
        if (trend > 0.1) return 'growing';
        if (trend < -0.1) return 'declining';
        return 'stable';
    }

    calculatePeakProbability(currentCount, avgDemand) {
        if (avgDemand === 0) return 0;
        
        const ratio = currentCount / avgDemand;
        
        if (ratio > 1.5) return 0.8; // Alta probabilidade de pico
        if (ratio > 1.2) return 0.6; // Média probabilidade
        if (ratio > 1.0) return 0.4; // Baixa probabilidade
        return 0.2; // Muito baixa probabilidade
    }

    predictNextMonthDemand(monthlyData) {
        const months = Object.keys(monthlyData).sort();
        
        if (months.length < 3) {
            return { prediction: 0, confidence: 0.2 };
        }
        
        // Usar média móvel ponderada dos últimos 3 meses
        const recentMonths = months.slice(-3);
        const weights = [0.2, 0.3, 0.5]; // Mais peso para o mês mais recente
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        recentMonths.forEach((month, index) => {
            const bookingCount = monthlyData[month].length;
            weightedSum += bookingCount * weights[index];
            totalWeight += weights[index];
        });
        
        const prediction = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const confidence = Math.min(0.8, recentMonths.length / 3);
        
        return { prediction: Math.round(prediction), confidence };
    }

    analyzeSeasonalPattern(monthlyData) {
        const months = Object.keys(monthlyData).sort();
        const seasonalData = { spring: [], summer: [], autumn: [], winter: [] };
        
        months.forEach(month => {
            const monthNum = parseInt(month.split('-')[1]);
            const bookingCount = monthlyData[month].length;
            
            if (monthNum >= 3 && monthNum <= 5) seasonalData.spring.push(bookingCount);
            else if (monthNum >= 6 && monthNum <= 8) seasonalData.summer.push(bookingCount);
            else if (monthNum >= 9 && monthNum <= 11) seasonalData.autumn.push(bookingCount);
            else seasonalData.winter.push(bookingCount);
        });
        
        const seasonalAverages = {};
        Object.keys(seasonalData).forEach(season => {
            const data = seasonalData[season];
            seasonalAverages[season] = data.length > 0 ? 
                data.reduce((sum, count) => sum + count, 0) / data.length : 0;
        });
        
        return seasonalAverages;
    }

    calculateGrowthRate(monthlyData) {
        const months = Object.keys(monthlyData).sort();
        
        if (months.length < 2) return 0;
        
        const firstMonth = monthlyData[months[0]].length;
        const lastMonth = monthlyData[months[months.length - 1]].length;
        
        if (firstMonth === 0) return 0;
        
        const monthsSpan = months.length - 1;
        const totalGrowth = (lastMonth - firstMonth) / firstMonth;
        
        return totalGrowth / monthsSpan; // Taxa de crescimento mensal média
    }

    identifyPeakMonths(monthlyData) {
        const months = Object.keys(monthlyData);
        const avgBookings = this.calculateMean(months.map(month => monthlyData[month].length));
        
        return months
            .filter(month => monthlyData[month].length > avgBookings * 1.2)
            .map(month => ({
                month,
                bookings: monthlyData[month].length,
                ratio: monthlyData[month].length / avgBookings
            }))
            .sort((a, b) => b.ratio - a.ratio);
    }

    calculateServicePredictionConfidence(bookings) {
        if (bookings.length < this.mlConfig.minDataPoints) {
            return 0.3;
        }
        
        // Confiança baseada na quantidade de dados e consistência
        const dataPoints = bookings.length;
        const timeSpan = this.getTimeSpanInMonths(bookings);
        
        let confidence = Math.min(0.9, dataPoints / 50); // Máximo 90% com 50+ bookings
        confidence *= Math.min(1, timeSpan / 6); // Penalizar se menos de 6 meses de dados
        
        return Math.max(0.1, confidence);
    }

    // Métodos auxiliares de cálculo
    calculateMean(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }

    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        
        const mean = this.calculateMean(numbers);
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return this.calculateMean(squaredDiffs);
    }

    calculateLinearTrend(data) {
        if (data.length < 2) return 0;
        
        const n = data.length;
        const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
        const sumY = data.reduce((sum, val) => sum + val, 0);
        const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0);
        const sumX2 = data.reduce((sum, val, index) => sum + (index * index), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    getWeeklyBookingCounts(bookings) {
        const weeklyData = {};
        
        bookings.forEach(booking => {
            const week = moment(booking.date).format('YYYY-WW');
            weeklyData[week] = (weeklyData[week] || 0) + 1;
        });
        
        return Object.values(weeklyData);
    }

    getMonthlyBookingCounts(bookings) {
        const monthlyData = {};
        
        bookings.forEach(booking => {
            const month = moment(booking.date).format('YYYY-MM');
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });
        
        return Object.values(monthlyData);
    }

    getTimeSpanInMonths(bookings) {
        if (bookings.length === 0) return 0;
        
        const dates = bookings.map(b => moment(b.date));
        const earliest = moment.min(dates);
        const latest = moment.max(dates);
        
        return latest.diff(earliest, 'months');
    }

    getCurrentCapacity() {
        // Retornar capacidade atual por horário
        // Por enquanto, assumir 3 agendamentos por horário
        const capacity = {};
        
        for (let hour = 8; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                capacity[timeSlot] = 3;
            }
        }
        
        return capacity;
    }

    getCapacityStatus(utilization) {
        if (utilization > 1.0) return 'overbooked';
        if (utilization > 0.9) return 'near_capacity';
        if (utilization > 0.7) return 'high_demand';
        if (utilization > 0.4) return 'moderate_demand';
        return 'low_demand';
    }

    generateCapacityRecommendations(capacityAnalysis) {
        const recommendations = [];
        
        // Analisar gargalos
        capacityAnalysis.bottlenecks.forEach(bottleneck => {
            if (bottleneck.severity === 'high') {
                recommendations.push({
                    type: 'capacity_increase',
                    priority: 'high',
                    description: `Aumentar capacidade em ${bottleneck.day} às ${bottleneck.timeSlot}`,
                    impact: 'Reduzir lista de espera e melhorar satisfação'
                });
            }
        });
        
        // Identificar horários subutilizados
        Object.keys(capacityAnalysis.predictedUtilization).forEach(day => {
            Object.keys(capacityAnalysis.predictedUtilization[day]).forEach(timeSlot => {
                const data = capacityAnalysis.predictedUtilization[day][timeSlot];
                
                if (data.utilization < 0.3) {
                    recommendations.push({
                        type: 'promotion_opportunity',
                        priority: 'medium',
                        description: `Promover agendamentos em ${moment().day(day).format('dddd')} às ${timeSlot}`,
                        impact: 'Aumentar receita em horários ociosos'
                    });
                }
            });
        });
        
        return recommendations;
    }

    // Cache e otimização
    getCachedPrediction(key) {
        const cached = this.predictionCache.get(key);
        
        if (cached && moment().diff(cached.timestamp, 'hours') < 24) {
            return cached.data;
        }
        
        return null;
    }

    setCachedPrediction(key, data) {
        this.predictionCache.set(key, {
            data,
            timestamp: moment()
        });
    }

    clearExpiredCache() {
        const now = moment();
        
        for (let [key, cached] of this.predictionCache) {
            if (now.diff(cached.timestamp, 'hours') > 24) {
                this.predictionCache.delete(key);
            }
        }
    }
}

module.exports = PredictiveAnalytics;