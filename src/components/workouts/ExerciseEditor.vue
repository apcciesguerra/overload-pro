<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content large" @click.stop>
      <h2>{{ exercise ? 'Edit Exercise' : 'Add Exercise' }}</h2>
      
      <form @submit.prevent="saveExercise">
        <!-- Basic Info -->
        <div class="form-section">
          <h3>Basic Information</h3>
          
          <div class="form-group">
            <label for="exercise-name">Exercise Name *</label>
            <input 
              id="exercise-name"
              v-model="form.name" 
              type="text" 
              required
              placeholder="e.g., Barbell Bench Press"
              class="form-input"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="muscle-group">Muscle Group</label>
              <select 
                id="muscle-group"
                v-model="form.muscle_group" 
                class="form-input"
              >
                <option value="">Select muscle group</option>
                <option value="chest">Chest</option>
                <option value="back">Back</option>
                <option value="shoulders">Shoulders</option>
                <option value="biceps">Biceps</option>
                <option value="triceps">Triceps</option>
                <option value="legs">Legs</option>
                <option value="core">Core</option>
                <option value="full_body">Full Body</option>
              </select>
            </div>

            <div class="form-group">
              <label for="equipment">Equipment Type</label>
              <select 
                id="equipment"
                v-model="form.equipment_type" 
                class="form-input"
              >
                <option value="barbell">Barbell</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="machine">Machine</option>
                <option value="cable">Cable</option>
                <option value="bodyweight">Bodyweight</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Sets Configuration -->
        <div class="form-section">
          <h3>Sets Configuration</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>Number of Sets</label>
              <input 
                v-model.number="numberOfSets" 
                type="number" 
                min="1" 
                max="10"
                class="form-input"
                @change="updateSetsConfig"
              >
            </div>

            <div class="form-group">
              <label>
                <input 
                  type="checkbox" 
                  v-model="useGlobalSettings"
                  @change="toggleGlobalSettings"
                >
                Use same settings for all sets
              </label>
            </div>
          </div>

          <!-- Global Settings (if enabled) -->
          <div v-if="useGlobalSettings" class="global-settings">
            <div class="form-row">
              <div class="form-group">
                <label>Rep Range</label>
                <div class="rep-range">
                  <input 
                    v-model.number="globalSettings.reps_min" 
                    type="number" 
                    min="1" 
                    max="50"
                    placeholder="Min"
                    class="form-input"
                  >
                  <span>to</span>
                  <input 
                    v-model.number="globalSettings.reps_max" 
                    type="number" 
                    min="1" 
                    max="50"
                    placeholder="Max"
                    class="form-input"
                  >
                </div>
              </div>

              <div class="form-group">
                <label>Rest Time (seconds)</label>
                <input 
                  v-model.number="globalSettings.rest_time" 
                  type="number" 
                  min="0" 
                  max="600"
                  placeholder="90"
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    v-model="globalSettings.is_amrap"
                  >
                  AMRAP (As Many Reps As Possible)
                </label>
              </div>
            </div>
          </div>

          <!-- Individual Set Settings -->
          <div v-else class="sets-list">
            <div 
              v-for="(set, index) in form.sets_config" 
              :key="index"
              class="set-item"
            >
              <h4>Set {{ index + 1 }}</h4>
              
              <div class="set-config">
                <div class="form-group">
                  <label>Type</label>
                  <select v-model="set.type" class="form-input">
                    <option value="working">Working Set</option>
                    <option value="warmup">Warm-up</option>
                    <option value="drop">Drop Set</option>
                    <option value="failure">To Failure</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Rep Range</label>
                  <div class="rep-range">
                    <input 
                      v-model.number="set.reps_min" 
                      type="number" 
                      min="1" 
                      max="50"
                      placeholder="Min"
                      class="form-input"
                      :disabled="set.is_amrap"
                    >
                    <span>to</span>
                    <input 
                      v-model.number="set.reps_max" 
                      type="number" 
                      min="1" 
                      max="50"
                      placeholder="Max"
                      class="form-input"
                      :disabled="set.is_amrap"
                    >
                  </div>
                </div>

                <div class="form-group">
                  <label>Rest (s)</label>
                  <input 
                    v-model.number="set.rest_time" 
                    type="number" 
                    min="0" 
                    max="600"
                    placeholder="90"
                    class="form-input"
                  >
                </div>

                <div class="form-group">
                  <label>
                    <input 
                      type="checkbox" 
                      v-model="set.is_amrap"
                      @change="() => handleAmrapToggle(set)"
                    >
                    AMRAP
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIR Settings -->
        <div class="form-section">
          <h3>
            Intensity (RIR)
            <button type="button" @click="showRirHelp = !showRirHelp" class="help-button">
              ?
            </button>
          </h3>
          
          <div v-if="showRirHelp" class="help-box">
            <h4>RIR (Reps in Reserve)</h4>
            <p>RIR indicates how many more reps you could have done:</p>
            <ul>
              <li><strong>RIR 0:</strong> Absolute failure - couldn't do another rep</li>
              <li><strong>RIR 1:</strong> Could do 1 more rep</li>
              <li><strong>RIR 2:</strong> Could do 2 more reps</li>
              <li><strong>RIR 3:</strong> Could do 3 more reps</li>
              <li><strong>RIR 4+:</strong> Could do 4 or more reps</li>
            </ul>
          </div>

          <div class="form-group">
            <label>Target RIR</label>
            <select v-model.number="form.target_rir" class="form-input">
              <option :value="null">Not specified</option>
              <option value="0">RIR 0 - Absolute failure</option>
              <option value="1">RIR 1 - Could do 1 more rep</option>
              <option value="2">RIR 2 - Could do 2 more reps</option>
              <option value="3">RIR 3 - Could do 3 more reps</option>
              <option value="4">RIR 4+ - Could do 4+ more reps</option>
            </select>
          </div>
        </div>

        <!-- Rest Timer Settings -->
        <div class="form-section">
          <h3>Rest Timer Settings</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>
                <input 
                  type="checkbox" 
                  v-model="form.use_default_rest"
                >
                Use global rest timer settings
              </label>
            </div>

            <div v-if="!form.use_default_rest" class="form-group">
              <label>Default Rest Time (seconds)</label>
              <input 
                v-model.number="form.default_rest_time" 
                type="number" 
                min="0" 
                max="600"
                placeholder="90"
                class="form-input"
              >
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-section">
          <h3>Notes</h3>
          <div class="form-group">
            <textarea 
              v-model="form.notes" 
              placeholder="Optional notes or instructions for this exercise"
              rows="3"
              class="form-input"
            ></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!form.name">
            {{ exercise ? 'Update' : 'Add' }} Exercise
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'ExerciseEditor',
  props: {
    exercise: {
      type: Object,
      default: null
    },
    planId: {
      type: String,
      required: true
    }
  },
  emits: ['save', 'close'],
  setup(props, { emit }) {
    // State
    const showRirHelp = ref(false)
    const numberOfSets = ref(3)
    const useGlobalSettings = ref(true)
    
    const globalSettings = ref({
      reps_min: 8,
      reps_max: 12,
      rest_time: 90,
      is_amrap: false
    })

    const form = ref({
      name: '',
      muscle_group: '',
      equipment_type: 'barbell',
      sets_config: [],
      target_rir: 2,
      use_default_rest: true,
      default_rest_time: 90,
      notes: ''
    })

    // Initialize form with exercise data if editing
    if (props.exercise) {
      form.value = {
        ...props.exercise,
        sets_config: props.exercise.sets_config || generateSetsConfig(props.exercise.sets || 3)
      }
      numberOfSets.value = form.value.sets_config.length
      
      // Check if all sets have same config
      const firstSet = form.value.sets_config[0]
      const allSame = form.value.sets_config.every(set => 
        set.reps_min === firstSet.reps_min &&
        set.reps_max === firstSet.reps_max &&
        set.rest_time === firstSet.rest_time &&
        set.is_amrap === firstSet.is_amrap
      )
      
      useGlobalSettings.value = allSame
      if (allSame) {
        globalSettings.value = {
          reps_min: firstSet.reps_min,
          reps_max: firstSet.reps_max,
          rest_time: firstSet.rest_time,
          is_amrap: firstSet.is_amrap
        }
      }
    } else {
      // Initialize with default sets
      form.value.sets_config = generateSetsConfig(numberOfSets.value)
    }

    // Methods
    function generateSetsConfig(count) {
      const config = []
      for (let i = 0; i < count; i++) {
        config.push({
          type: 'working',
          reps_min: globalSettings.value.reps_min,
          reps_max: globalSettings.value.reps_max,
          rest_time: globalSettings.value.rest_time,
          is_amrap: false
        })
      }
      return config
    }

    function updateSetsConfig() {
      const currentCount = form.value.sets_config.length
      
      if (numberOfSets.value > currentCount) {
        // Add sets
        for (let i = currentCount; i < numberOfSets.value; i++) {
          form.value.sets_config.push({
            type: 'working',
            reps_min: globalSettings.value.reps_min,
            reps_max: globalSettings.value.reps_max,
            rest_time: globalSettings.value.rest_time,
            is_amrap: false
          })
        }
      } else if (numberOfSets.value < currentCount) {
        // Remove sets
        form.value.sets_config = form.value.sets_config.slice(0, numberOfSets.value)
      }
    }

    function toggleGlobalSettings() {
      if (useGlobalSettings.value) {
        // Apply global settings to all sets
        form.value.sets_config = form.value.sets_config.map(set => ({
          ...set,
          reps_min: globalSettings.value.reps_min,
          reps_max: globalSettings.value.reps_max,
          rest_time: globalSettings.value.rest_time,
          is_amrap: globalSettings.value.is_amrap
        }))
      }
    }

    function handleAmrapToggle(set) {
      if (set.is_amrap) {
        set.reps_min = 0
        set.reps_max = 999
      } else {
        set.reps_min = globalSettings.value.reps_min
        set.reps_max = globalSettings.value.reps_max
      }
    }

    // Watch global settings changes
    watch(globalSettings, (newVal) => {
      if (useGlobalSettings.value) {
        form.value.sets_config = form.value.sets_config.map(set => ({
          ...set,
          ...newVal
        }))
      }
    }, { deep: true })

    function saveExercise() {
      // Prepare data for saving
      const exerciseData = {
        ...form.value,
        sets: numberOfSets.value,
        reps_min: useGlobalSettings.value ? globalSettings.value.reps_min : form.value.sets_config[0]?.reps_min,
        reps_max: useGlobalSettings.value ? globalSettings.value.reps_max : form.value.sets_config[0]?.reps_max,
        rest_time: useGlobalSettings.value ? globalSettings.value.rest_time : form.value.sets_config[0]?.rest_time
      }
      
      emit('save', exerciseData)
    }

    return {
      form,
      showRirHelp,
      numberOfSets,
      useGlobalSettings,
      globalSettings,
      generateSetsConfig,
      updateSetsConfig,
      toggleGlobalSettings,
      handleAmrapToggle,
      saveExercise
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
}

.form-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--border-light);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.rep-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.rep-range input {
  flex: 1;
}

.global-settings {
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-md);
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.set-item {
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.set-item h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.set-config {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.help-button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.help-button:hover {
  opacity: 0.9;
}

.help-box {
  background: var(--bg-info);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.help-box h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--primary);
}

.help-box p {
  margin-bottom: var(--spacing-sm);
}

.help-box ul {
  margin: 0;
  padding-left: var(--spacing-lg);
}

.help-box li {
  margin-bottom: var(--spacing-xs);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-light);
}
</style>
