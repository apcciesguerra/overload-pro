<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>{{ exercise ? 'Edit Exercise' : 'Add Exercise' }}</h2>
      
      <form @submit.prevent="saveExercise">
        <!-- Basic Information -->
        <div class="form-section">
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

          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description"
              v-model="form.description" 
              placeholder="Optional exercise notes or instructions"
              class="form-input"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="target-sets">Number of Sets</label>
              <input 
                id="target-sets"
                v-model.number="form.target_sets" 
                type="number" 
                min="1" 
                max="20"
                required
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label for="target-reps">Target Reps</label>
              <input 
                id="target-reps"
                v-model.number="form.target_reps" 
                type="number" 
                min="1" 
                max="100"
                required
                class="form-input"
                placeholder="e.g., 8"
              >
            </div>
          </div>

          <!-- TODO: Future feature implementation
          <div class="form-row">
            <div class="form-group">
              <label for="muscle-group">Muscle Group</label>
              <select id="muscle-group" class="form-input" disabled>
                <option>Feature coming soon</option>
              </select>
            </div>
            <div class="form-group">
              <label for="equipment">Equipment Type</label>
              <select id="equipment" class="form-input" disabled>
                <option>Feature coming soon</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Rep Range & RIR Settings</label>
            <div class="disabled-feature">
              Coming soon: Min/Max rep ranges, RIR tracking, rest timers
            </div>
          </div>
          -->
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!form.name || !form.target_sets || !form.target_reps">
            {{ exercise ? 'Update' : 'Add' }} Exercise
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

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
    // Simplified form matching database schema
    const form = ref({
      name: '',
      description: '',
      target_sets: 3,
      target_reps: 8
    })

    // Initialize form with exercise data if editing
    if (props.exercise) {
      form.value = {
        name: props.exercise.name || '',
        description: props.exercise.description || '',
        target_sets: props.exercise.target_sets || 3,
        target_reps: props.exercise.target_reps || 8
      }
    }

    function saveExercise() {
      // Prepare data for saving - only fields that exist in database
      const exerciseData = {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        target_sets: form.value.target_sets,
        target_reps: form.value.target_reps
      }
      
      emit('save', exerciseData)
    }

    return {
      form,
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.form-section {
  margin-bottom: var(--spacing-lg);
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
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  transition: border-color 0.2s;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.disabled-feature {
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px dashed var(--border-medium);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-primary:disabled {
  background: var(--border-medium);
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-medium);
}

.btn-secondary:hover {
  background: var(--border-light);
}
</style>