// Progressive overload calculation utilities

/**
 * Calculate the next weight based on current performance
 * @param {number} currentWeight - Current weight being used
 * @param {number} currentReps - Current reps achieved
 * @param {number} targetReps - Target reps for the exercise
 * @returns {number} - Suggested next weight
 */
export function calculateNextWeight(currentWeight, currentReps, targetReps) {
  if (currentReps >= targetReps + 2) {
    // If exceeding target by 2+ reps, increase weight by 5-10%
    return Math.round(currentWeight * 1.075)
  } else if (currentReps >= targetReps) {
    // If meeting target, increase weight by 2.5-5%
    return Math.round(currentWeight * 1.025)
  } else {
    // If below target, maintain current weight
    return currentWeight
  }
}

/**
 * Calculate one-rep max using Epley formula
 * @param {number} weight - Weight used
 * @param {number} reps - Reps completed
 * @returns {number} - Estimated one-rep max
 */
export function calculateOneRepMax(weight, reps) {
  return Math.round(weight * (1 + reps / 30))
}

/**
 * Calculate volume load (weight × reps × sets)
 * @param {number} weight - Weight used
 * @param {number} reps - Reps per set
 * @param {number} sets - Number of sets
 * @returns {number} - Total volume load
 */
export function calculateVolumeLoad(weight, reps, sets) {
  return weight * reps * sets
}

/**
 * Determine if progression is needed based on performance
 * @param {Object} exerciseLog - Exercise log entry
 * @param {number} targetReps - Target reps for the exercise
 * @returns {Object} - Progression recommendation
 */
export function analyzeProgression(exerciseLog, targetReps) {
  const { weight, reps, sets } = exerciseLog
  const volumeLoad = calculateVolumeLoad(weight, reps, sets)
  const oneRepMax = calculateOneRepMax(weight, reps)
  
  let recommendation = 'maintain'
  let nextWeight = weight
  
  if (reps >= targetReps + 2) {
    recommendation = 'increase_weight'
    nextWeight = calculateNextWeight(weight, reps, targetReps)
  } else if (reps >= targetReps) {
    recommendation = 'slight_increase'
    nextWeight = calculateNextWeight(weight, reps, targetReps)
  } else if (reps < targetReps - 2) {
    recommendation = 'decrease_weight'
    nextWeight = Math.round(weight * 0.95)
  }
  
  return {
    recommendation,
    nextWeight,
    volumeLoad,
    oneRepMax
  }
} 