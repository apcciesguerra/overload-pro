// Enhanced Progressive Overload Algorithm

/**
 * Main progressive overload algorithm
 * Focuses on rep progression first, then weight progression
 * @param {Object} params - Exercise performance parameters
 * @returns {Object} - Progression recommendation
 */
export function progressiveOverload({
  repsDone,
  weight,
  repsMin,
  repsMax,
  rir = null,
  lastProgression = null,
  previousSessions = []
}) {
  // Check if user hit max reps - time to increase weight
  if (repsDone >= repsMax) {
    const newWeight = weight + 2.5; // Default 2.5kg increment
    return {
      action: "increase_weight",
      newWeight,
      targetReps: repsMin, // Reset to minimum reps with new weight
      message: "Nice! You hit the top of your rep range. Adding weight for next session.",
      progressType: "weight"
    };
  } 
  // User is within rep range - try for more reps
  else if (repsDone >= repsMin && repsDone < repsMax) {
    return {
      action: "increase_reps",
      newWeight: weight,
      targetReps: repsDone + 1,
      message: "Good work! Try for +1 rep next session.",
      progressType: "reps"
    };
  } 
  // User didn't hit minimum reps - check for regression
  else if (repsDone < repsMin) {
    // Check if this is a pattern (2+ sessions of regression)
    const recentRegression = previousSessions.slice(-2).filter(
      session => session.repsDone < repsMin
    ).length >= 1;
    
    if (recentRegression) {
      return {
        action: "check_recovery",
        newWeight: weight,
        targetReps: repsMin,
        message: "You've struggled for multiple sessions. Let's check your recovery factors.",
        needsRecoveryCheck: true,
        progressType: "maintain"
      };
    } else {
      return {
        action: "maintain",
        newWeight: weight,
        targetReps: repsMin,
        message: "You struggled today. Check sleep, nutrition, and recovery before next session.",
        progressType: "maintain"
      };
    }
  }
}

/**
 * Calculate volume load (weight × reps × sets)
 * @param {number} weight - Weight used
 * @param {number} reps - Reps per set
 * @param {number} sets - Number of sets
 * @returns {number} - Total volume load
 */
export function calculateVolumeLoad(weight, reps, sets) {
  return weight * reps * sets;
}

/**
 * Calculate one-rep max using Epley formula
 * @param {number} weight - Weight used
 * @param {number} reps - Reps completed
 * @returns {number} - Estimated one-rep max
 */
export function calculateOneRepMax(weight, reps) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Analyze workout performance and suggest adjustments
 * @param {Object} currentSession - Current workout session data
 * @param {Array} previousSessions - Previous session history
 * @returns {Object} - Analysis and recommendations
 */
export function analyzeWorkoutPerformance(currentSession, previousSessions = []) {
  const { exercises } = currentSession;
  const recommendations = [];
  
  exercises.forEach(exercise => {
    const previousExercise = previousSessions
      .flatMap(s => s.exercises)
      .filter(e => e.name === exercise.name)
      .slice(-3); // Last 3 sessions
    
    const progression = progressiveOverload({
      repsDone: exercise.reps,
      weight: exercise.weight,
      repsMin: exercise.repsMin,
      repsMax: exercise.repsMax,
      rir: exercise.rir,
      previousSessions: previousExercise
    });
    
    recommendations.push({
      exerciseName: exercise.name,
      ...progression
    });
  });
  
  return recommendations;
}

/**
 * Recovery factors that affect performance
 */
export const RECOVERY_FACTORS = {
  SLEEP: {
    id: 'sleep',
    label: 'Sleep Quality',
    question: 'How was your sleep last night?',
    options: [
      { value: 'poor', label: 'Poor (<6 hours)', impact: -2 },
      { value: 'fair', label: 'Fair (6-7 hours)', impact: -1 },
      { value: 'good', label: 'Good (7-8 hours)', impact: 0 },
      { value: 'excellent', label: 'Excellent (8+ hours)', impact: 1 }
    ]
  },
  STRESS: {
    id: 'stress',
    label: 'Stress Level',
    question: 'How stressed are you feeling?',
    options: [
      { value: 'very_high', label: 'Very High', impact: -2 },
      { value: 'high', label: 'High', impact: -1 },
      { value: 'moderate', label: 'Moderate', impact: 0 },
      { value: 'low', label: 'Low', impact: 1 }
    ]
  },
  NUTRITION: {
    id: 'nutrition',
    label: 'Nutrition',
    question: 'How has your nutrition been?',
    options: [
      { value: 'poor', label: 'Poor (missed meals)', impact: -2 },
      { value: 'fair', label: 'Fair (some meals)', impact: -1 },
      { value: 'good', label: 'Good (regular meals)', impact: 0 },
      { value: 'excellent', label: 'Excellent (on track)', impact: 1 }
    ]
  },
  SORENESS: {
    id: 'soreness',
    label: 'Muscle Soreness',
    question: 'How sore are you from last session?',
    options: [
      { value: 'very_sore', label: 'Very Sore', impact: -2 },
      { value: 'sore', label: 'Moderately Sore', impact: -1 },
      { value: 'slight', label: 'Slightly Sore', impact: 0 },
      { value: 'none', label: 'No Soreness', impact: 1 }
    ]
  },
  ENERGY: {
    id: 'energy',
    label: 'Energy Level',
    question: 'How energetic do you feel?',
    options: [
      { value: 'exhausted', label: 'Exhausted', impact: -2 },
      { value: 'tired', label: 'Tired', impact: -1 },
      { value: 'normal', label: 'Normal', impact: 0 },
      { value: 'energetic', label: 'Energetic', impact: 1 }
    ]
  }
};

/**
 * Analyze recovery factors and provide recommendations
 * @param {Object} factors - Recovery factor responses
 * @returns {Object} - Recovery analysis and recommendations
 */
export function analyzeRecoveryFactors(factors) {
  let totalImpact = 0;
  const issues = [];
  const recommendations = [];
  
  Object.entries(factors).forEach(([key, value]) => {
    const factor = RECOVERY_FACTORS[key.toUpperCase()];
    if (factor) {
      const option = factor.options.find(o => o.value === value);
      if (option) {
        totalImpact += option.impact;
        if (option.impact < 0) {
          issues.push(factor.label);
        }
      }
    }
  });
  
  // Generate recommendations based on issues
  if (issues.includes('Sleep Quality')) {
    recommendations.push('Try to get 7-9 hours of sleep tonight');
  }
  if (issues.includes('Stress Level')) {
    recommendations.push('Consider stress management techniques (meditation, breathing exercises)');
  }
  if (issues.includes('Nutrition')) {
    recommendations.push('Focus on protein intake and proper hydration');
  }
  if (issues.includes('Muscle Soreness')) {
    recommendations.push('Consider active recovery or light cardio');
  }
  if (issues.includes('Energy Level')) {
    recommendations.push('Ensure adequate carbohydrate intake pre-workout');
  }
  
  // Overall recommendation
  let overallRecommendation;
  if (totalImpact <= -5) {
    overallRecommendation = 'Consider taking a deload week or rest day';
  } else if (totalImpact <= -3) {
    overallRecommendation = 'Reduce intensity today (use lighter weights or fewer sets)';
  } else if (totalImpact <= -1) {
    overallRecommendation = 'Proceed with caution, listen to your body';
  } else {
    overallRecommendation = 'You\'re ready to train hard today!';
  }
  
  return {
    totalImpact,
    issues,
    recommendations,
    overallRecommendation,
    shouldDeload: totalImpact <= -5
  };
}

/**
 * RIR (Reps in Reserve) explanation
 */
export const RIR_SCALE = {
  0: {
    value: 0,
    label: 'RIR 0',
    description: 'Absolute failure - could not do another rep',
    rpe: 10
  },
  1: {
    value: 1,
    label: 'RIR 1',
    description: 'Could do 1 more rep',
    rpe: 9
  },
  2: {
    value: 2,
    label: 'RIR 2',
    description: 'Could do 2 more reps',
    rpe: 8
  },
  3: {
    value: 3,
    label: 'RIR 3',
    description: 'Could do 3 more reps',
    rpe: 7
  },
  4: {
    value: 4,
    label: 'RIR 4+',
    description: 'Could do 4 or more reps',
    rpe: 6
  }
};

/**
 * Get weight increment based on exercise type
 * @param {string} exerciseType - Type of exercise (barbell, dumbbell, machine, cable)
 * @param {string} unit - Weight unit (kg or lbs)
 * @returns {number} - Suggested weight increment
 */
export function getWeightIncrement(exerciseType, unit = 'kg') {
  const increments = {
    kg: {
      barbell: 2.5,
      dumbbell: 2.0,
      machine: 2.5,
      cable: 2.5,
      bodyweight: 0
    },
    lbs: {
      barbell: 5,
      dumbbell: 5,
      machine: 5,
      cable: 5,
      bodyweight: 0
    }
  };
  
  return increments[unit][exerciseType] || increments[unit].barbell;
}