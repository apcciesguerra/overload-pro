<template>
  <div class="active-workout">
    <div class="workout-header">
      <button @click="cancelWorkout" class="btn btn-ghost">
        ← Cancel Workout
      </button>
      <h2>{{ workout.plan.name }}</h2>
      <div class="workout-timer">
        {{ formatDuration(workoutDuration) }}
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: `${progressPercentage}%` }"
      ></div>
      <span class="progress-text">
        Exercise {{ currentExerciseIndex + 1 }} of {{ workout.exercises.length }}
      </span>
    </div>

    <!-- Current Exercise -->
    <div class="current-exercise">
      <h3>{{ currentExercise.name }}</h3>
      
      <div class="exercise-info">
        <span v-if="currentExercise.muscle_group" class="info-badge">
          {{ currentExercise.muscle_group }}
        </span>
        <span v-if="currentExercise.equipment_type" class="info-badge">
          {{ currentExercise.equipment_type }}
        </span>
        <span v-if="currentExercise.target_rir !== null" class="info-badge">
          RIR {{ currentExercise.target_rir }}
          <button @click="showRirHelp = !showRirHelp" class="help-btn">?</button>
        </span>
      </div>

      <!-- RIR Help -->
      <div v-if="showRirHelp" class="help-box">
        <h4>RIR (Reps in Reserve)</h4>
        <ul>
          <li><strong>RIR 0:</strong> Absolute failure</li>
          <li><strong>RIR 1:</strong> Could do 1 more rep</li>
          <li><strong>RIR 2:</strong> Could do 2 more reps</li>
          <li><strong>RIR 3:</strong> Could do 3 more reps</li>
        </ul>
      </div>

      <!-- Last Session Info -->
      <div v-if="lastSession" class="last-session">
        <h4>Last Session</h4>
        <div class="last-session-stats">
          <span>Weight: {{ lastSession.weight }}{{ workoutStore.workoutSettings.weightUnit }}</span>
          <span>Reps: {{ lastSession.reps }}</span>
          <span v-if="lastSession.progression_data">
            {{ lastSession.progression_data.message }}
          </span>
        </div>
      </div>

      <!-- Sets Tracker -->
      <div class="sets-tracker">
        <h4>Sets ({{ completedSetsForExercise }}/{{ currentExerciseSets.length }})</h4>
        
        <div class="sets-grid">
          <div 
            v-for="(set, index) in currentExerciseSets" 
            :key="index"
            class="set-card"
            :class="{ 
              completed: set.completed,
              active: currentSetIndex === index 
            }"
          >
            <div class="set-header">
              <h5>Set {{ index + 1 }} 
                <span v-if="set.type !== 'working'" class="set-type">
                  ({{ set.type }})
                </span>
              </h5>
              <span v-if="set.is_amrap" class="amrap-badge">AMRAP</span>
            </div>

            <div v-if="!set.completed" class="set-inputs">
              <div class="input-group">
                <label>Weight ({{ workoutStore.workoutSettings.weightUnit }})</label>
                <input 
                  v-model.number="set.weight" 
                  type="number" 
                  min="0" 
                  step="2.5"
                  :placeholder="suggestedWeight"
                  class="form-input"
                >
              </div>

              <div class="input-group">
                <label>
                  Reps 
                  <span v-if="!set.is_amrap" class="rep-target">
                    ({{ set.reps_min }}-{{ set.reps_max }})
                  </span>
                </label>
                <input 
                  v-model.number="set.reps" 
                  type="number" 
                  min="0"
                  :placeholder="set.is_amrap ? 'AMRAP' : `${set.reps_min}-${set.reps_max}`"
                  class="form-input"
                >
              </div>

              <div class="input-group">
                <label>RIR</label>
                <select v-model.number="set.rir" class="form-input">
                  <option :value="null">-</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>

              <button 
                @click="completeSet(index)" 
                class="btn btn-primary"
                :disabled="!set.weight || !set.reps"
              >
                Complete Set
              </button>
            </div>

            <div v-else class="set-completed">
              <div class="completed-stats">
                <span>{{ set.weight }}{{ workoutStore.workoutSettings.weightUnit }} × {{ set.reps }} reps</span>
                <span v-if="set.rir !== null">RIR {{ set.rir }}</span>
              </div>
              <div v-if="set.progression" class="progression-message">
                {{ set.progression.message }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="currentExercise.notes" class="exercise-notes">
        <h4>Notes</h4>
        <p>{{ currentExercise.notes }}</p>
      </div>

      <!-- Action Buttons -->
      <div class="exercise-actions">
        <button 
          v-if="currentExerciseIndex > 0"
          @click="previousExercise" 
          class="btn btn-secondary"
        >
          Previous Exercise
        </button>
        <button 
          v-if="currentExerciseIndex < workout.exercises.length - 1"
          @click="nextExercise" 
          class="btn btn-primary"
          :disabled="completedSetsForExercise === 0"
        >
          Next Exercise
        </button>
        <button 
          v-else
          @click="finishWorkout" 
          class="btn btn-success"
          :disabled="completedSetsForExercise === 0"
        >
          Finish Workout
        </button>
      </div>
    </div>

    <!-- Rest Timer Modal -->
    <RestTimer
      v-if="showRestTimer"
      :duration="restDuration"
      :exercise-name="currentExercise.name"
      :next-set="currentSetIndex + 1"
      @complete="onRestComplete"
      @skip="onRestSkip"
    />

    <!-- Recovery Check Modal -->
    <RecoveryCheck
      v-if="showRecoveryCheck"
      @complete="onRecoveryCheckComplete"
      @skip="showRecoveryCheck = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWorkoutStore } from '../../store/useWorkoutStore'
import RestTimer from './RestTimer.vue'
import RecoveryCheck from './RecoveryCheck.vue'

export default {
  name: 'ActiveWorkout',
  components: {
    RestTimer,
    RecoveryCheck
  },
  props: {
    workout: {
      type: Object,
      required: true
    }
  },
  emits: ['complete', 'cancel'],
  setup(props, { emit }) {
    const workoutStore = useWorkoutStore()
    
    // State
    const currentExerciseIndex = ref(0)
    const currentSetIndex = ref(0)
    const workoutDuration = ref(0)
    const showRestTimer = ref(false)
    const restDuration = ref(90)
    const showRirHelp = ref(false)
    const showRecoveryCheck = ref(false)
    const currentExerciseSets = ref([])
    const suggestedWeight = ref(0)
    
    let durationInterval = null

    // Computed
    const currentExercise = computed(() => 
      props.workout.exercises[currentExerciseIndex.value]
    )

    const lastSession = computed(() => 
      workoutStore.lastWorkoutForExercise(currentExercise.value.id)
    )

    const progressPercentage = computed(() => {
      const total = props.workout.exercises.length
      const completed = currentExerciseIndex.value
      return Math.round((completed / total) * 100)
    })

    const completedSetsForExercise = computed(() => 
      currentExerciseSets.value.filter(s => s.completed).length
    )

    // Initialize exercise sets
    function initializeExerciseSets() {
      const exercise = currentExercise.value
      const sets = exercise.sets_config || []
      
      // Get last session data for weight suggestion
      const last = lastSession.value
      if (last?.progression_data) {
        suggestedWeight.value = last.progression_data.newWeight || last.weight
      } else if (last) {
        suggestedWeight.value = last.weight
      } else {
        suggestedWeight.value = 0
      }
      
      // Initialize sets
      currentExerciseSets.value = sets.map(setConfig => ({
        ...setConfig,
        weight: suggestedWeight.value,
        reps: null,
        rir: exercise.target_rir,
        completed: false,
        progression: null
      }))
      
      currentSetIndex.value = 0
    }

    // Complete a set
    async function completeSet(setIndex) {
      const set = currentExerciseSets.value[setIndex]
      
      try {
        // Log the set and get progression recommendation
        const result = await workoutStore.logExerciseSet(currentExercise.value.id, {
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
          set_number: setIndex + 1,
          set_type: set.type
        })
        
        // Mark set as completed
        set.completed = true
        set.progression = result.progression
        
        // Check if we need recovery assessment
        if (result.progression?.needsRecoveryCheck) {
          showRecoveryCheck.value = true
        }
        
        // Start rest timer if not the last set
        if (setIndex < currentExerciseSets.value.length - 1) {
          const nextSet = currentExerciseSets.value[setIndex + 1]
          restDuration.value = set.rest_time || currentExercise.value.default_rest_time || 90
          currentSetIndex.value = setIndex + 1
          showRestTimer.value = true
        } else {
          // Show progress notification
          showProgressNotification(result.progression)
        }
      } catch (error) {
        console.error('Error logging set:', error)
        alert('Failed to log set. Please try again.')
      }
    }

    // Show progress notification
    function showProgressNotification(progression) {
      if (!progression) return
      
      // Create notification
      const notification = new Notification('Progressive Overload', {
        body: progression.message,
        icon: '/icon.png',
        tag: 'workout-progress'
      })
      
      // Also show in-app notification
      if (workoutStore.workoutSettings.soundEnabled) {
        playNotificationSound()
      }
    }

    // Play notification sound
    function playNotificationSound() {
      const audio = new Audio('/notification.mp3')
      audio.play().catch(e => console.log('Could not play sound:', e))
    }

    // Navigation
    function nextExercise() {
      if (currentExerciseIndex.value < props.workout.exercises.length - 1) {
        currentExerciseIndex.value++
        initializeExerciseSets()
      }
    }

    function previousExercise() {
      if (currentExerciseIndex.value > 0) {
        currentExerciseIndex.value--
        initializeExerciseSets()
      }
    }

    // Rest timer handlers
    function onRestComplete() {
      showRestTimer.value = false
      if (workoutStore.workoutSettings.soundEnabled) {
        playNotificationSound()
      }
    }

    function onRestSkip() {
      showRestTimer.value = false
    }

    // Recovery check handler
    async function onRecoveryCheckComplete(factors) {
      showRecoveryCheck.value = false
      const analysis = await workoutStore.checkRecoveryFactors(factors)
      
      if (analysis.shouldDeload) {
        alert(analysis.overallRecommendation)
      }
    }

    // Finish workout
    async function finishWorkout() {
      try {
        const completed = await workoutStore.completeWorkout()
        emit('complete', completed)
      } catch (error) {
        console.error('Error completing workout:', error)
        alert('Failed to complete workout. Please try again.')
      }
    }

    // Cancel workout
    async function cancelWorkout() {
      if (!confirm('Are you sure you want to cancel this workout? Progress will be saved.')) {
        return
      }
      
      try {
        await workoutStore.cancelWorkout()
        emit('cancel')
      } catch (error) {
        console.error('Error cancelling workout:', error)
      }
    }

    // Format duration
    function formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    // Lifecycle
    onMounted(() => {
      // Initialize first exercise
      initializeExerciseSets()
      
      // Start duration timer
      durationInterval = setInterval(() => {
        workoutDuration.value++
      }, 1000)
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    })

    onUnmounted(() => {
      if (durationInterval) {
        clearInterval(durationInterval)
      }
    })

    return {
      workoutStore,
      currentExerciseIndex,
      currentSetIndex,
      currentExercise,
      currentExerciseSets,
      lastSession,
      workoutDuration,
      progressPercentage,
      completedSetsForExercise,
      showRestTimer,
      restDuration,
      showRirHelp,
      showRecoveryCheck,
      suggestedWeight,
      formatDuration,
      completeSet,
      nextExercise,
      previousExercise,
      finishWorkout,
      cancelWorkout,
      onRestComplete,
      onRestSkip,
      onRecoveryCheckComplete
    }
  }
}
</script>

<style scoped>
.active-workout {
  padding: var(--spacing-lg);
  max-width: 1000px;
  margin: 0 auto;
}

.workout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.workout-header h2 {
  margin: 0;
}

.workout-timer {
  font-size: var(--font-size-xl);
  font-weight: bold;
  color: var(--primary);
}

.progress-bar {
  position: relative;
  height: 30px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 500;
  color: var(--text-primary);
  z-index: 1;
}

.current-exercise {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.current-exercise h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.exercise-info {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.info-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.help-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.help-box {
  background: var(--bg-info);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.help-box h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--primary);
}

.help-box ul {
  margin: 0;
  padding-left: var(--spacing-lg);
}

.last-session {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.last-session h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.last-session-stats {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  font-size: var(--font-size-sm);
}

.sets-tracker {
  margin-bottom: var(--spacing-lg);
}

.sets-tracker h4 {
  margin-bottom: var(--spacing-md);
}

.sets-grid {
  display: grid;
  gap: var(--spacing-md);
}

.set-card {
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
}

.set-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
}

.set-card.completed {
  background: var(--bg-success);
  border-color: var(--success);
}

.set-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.set-header h5 {
  margin: 0;
}

.set-type {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.amrap-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--danger);
  color: white;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: bold;
}

.set-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--spacing-md);
  align-items: end;
}

.input-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.rep-target {
  color: var(--text-muted);
  font-weight: normal;
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
}

.set-completed {
  padding: var(--spacing-sm);
}

.completed-stats {
  display: flex;
  gap: var(--spacing-md);
  font-weight: 500;
  color: var(--success);
}

.progression-message {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-info);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--primary);
}

.exercise-notes {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.exercise-notes h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.exercise-notes p {
  margin: 0;
  color: var(--text-primary);
}

.exercise-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: space-between;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-light);
}

.btn-ghost:hover {
  background: var(--bg-hover);
}
</style>
