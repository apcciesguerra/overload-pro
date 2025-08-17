<template>
  <div class="workout-plan-editor">
    <div class="editor-header">
      <button @click="$emit('back')" class="btn btn-ghost">
        ← Back to Folders
      </button>
      <h2>{{ folder.name }} - Workout Plans</h2>
    </div>

    <!-- Create Plan Button -->
    <div class="actions-bar">
      <button @click="showCreatePlanModal = true" class="btn btn-primary">
        <span class="icon">+</span> Create Workout Plan
      </button>
    </div>

    <!-- Plans List -->
    <div v-if="plans.length === 0" class="empty-state">
      <h3>No workout plans yet</h3>
      <p>Create your first workout plan for this folder</p>
    </div>

    <div v-else class="plans-list">
      <div 
        v-for="plan in plans" 
        :key="plan.id"
        class="plan-card"
        :class="{ expanded: expandedPlan === plan.id }"
      >
        <div class="plan-header" @click="togglePlan(plan.id)">
          <div class="plan-info">
            <h3>{{ plan.name }}</h3>
            <p v-if="plan.description">{{ plan.description }}</p>
          </div>
          <div class="plan-actions" @click.stop>
            <button @click="startWorkout(plan)" class="btn btn-success btn-sm">
              Start Workout
            </button>
            <button @click="editPlan(plan)" class="btn btn-secondary btn-sm">
              Edit
            </button>
            <button @click="deletePlan(plan)" class="btn btn-danger btn-sm">
              Delete
            </button>
          </div>
        </div>

        <!-- Exercises List -->
        <div v-if="expandedPlan === plan.id" class="exercises-section">
          <div class="exercises-header">
            <h4>Exercises</h4>
            <button @click="showAddExercise(plan.id)" class="btn btn-primary btn-sm">
              Add Exercise
            </button>
          </div>

          <div v-if="getExercises(plan.id).length === 0" class="empty-exercises">
            No exercises added yet
          </div>

          <draggable 
            v-else
            v-model="exercisesList[plan.id]"
            @end="onExerciseReorder(plan.id)"
            handle=".drag-handle"
            class="exercises-list"
          >
            <template #item="{ element: exercise }">
              <div class="exercise-item">
                <span class="drag-handle">⋮⋮</span>
                
                <div class="exercise-details">
                  <h5>{{ exercise.name }}</h5>
                  <div class="exercise-params">
                    <span class="param">
                      Sets: {{ exercise.sets_config?.length || exercise.sets || 3 }}
                    </span>
                    <span class="param">
                      Reps: {{ exercise.reps_min }}-{{ exercise.reps_max }}
                    </span>
                    <span class="param" v-if="exercise.rest_time">
                      Rest: {{ exercise.rest_time }}s
                    </span>
                    <span class="param" v-if="exercise.equipment">
                      {{ exercise.equipment }}
                    </span>
                  </div>
                </div>

                <div class="exercise-actions">
                  <button @click="editExercise(exercise)" class="btn-icon" title="Edit">
                    ✏️
                  </button>
                  <button @click="deleteExercise(exercise)" class="btn-icon" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <!-- Create/Edit Plan Modal -->
    <div v-if="showCreatePlanModal || editingPlan" class="modal-overlay" @click="closePlanModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingPlan ? 'Edit Workout Plan' : 'Create Workout Plan' }}</h2>
        
        <form @submit.prevent="savePlan">
          <div class="form-group">
            <label for="plan-name">Plan Name *</label>
            <input 
              id="plan-name"
              v-model="planForm.name" 
              type="text" 
              required
              placeholder="e.g., Upper Body Day"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="plan-description">Description</label>
            <textarea 
              id="plan-description"
              v-model="planForm.description" 
              placeholder="Optional description"
              rows="3"
              class="form-input"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="plan-days">Training Days</label>
            <div class="days-selector">
              <label v-for="day in weekDays" :key="day" class="day-checkbox">
                <input 
                  type="checkbox" 
                  :value="day"
                  v-model="planForm.training_days"
                >
                <span>{{ day.slice(0, 3) }}</span>
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closePlanModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!planForm.name">
              {{ editingPlan ? 'Update' : 'Create' }} Plan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Exercise Editor Modal -->
    <ExerciseEditor
      v-if="showExerciseModal"
      :exercise="editingExercise"
      :plan-id="currentPlanId"
      @save="saveExercise"
      @close="closeExerciseModal"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'
import { useWorkoutStore } from '../../store/useWorkoutStore'
import ExerciseEditor from './ExerciseEditor.vue'

export default {
  name: 'WorkoutPlanEditor',
  components: {
    draggable: VueDraggableNext,
    ExerciseEditor
  },
  props: {
    folder: {
      type: Object,
      required: true
    }
  },
  emits: ['back', 'start-workout'],
  setup(props, { emit }) {
    const workoutStore = useWorkoutStore()
    
    // State
    const expandedPlan = ref(null)
    const showCreatePlanModal = ref(false)
    const editingPlan = ref(null)
    const showExerciseModal = ref(false)
    const editingExercise = ref(null)
    const currentPlanId = ref(null)
    const exercisesList = ref({})
    
    const planForm = ref({
      name: '',
      description: '',
      training_days: []
    })

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Computed
    const plans = computed(() => workoutStore.plansByFolder(props.folder.id))

    // Watch for exercises changes
    watch(() => workoutStore.exercises, () => {
      updateExercisesLists()
    }, { deep: true })

    // Methods
    const getExercises = (planId) => {
      return workoutStore.exercisesByPlan(planId)
    }

    const updateExercisesLists = () => {
      plans.value.forEach(plan => {
        exercisesList.value[plan.id] = [...getExercises(plan.id)]
      })
    }

    const togglePlan = (planId) => {
      expandedPlan.value = expandedPlan.value === planId ? null : planId
      if (expandedPlan.value) {
        exercisesList.value[planId] = [...getExercises(planId)]
      }
    }

    const startWorkout = (plan) => {
      emit('start-workout', plan)
    }

    const editPlan = (plan) => {
      editingPlan.value = plan
      planForm.value = {
        name: plan.name,
        description: plan.description || '',
        training_days: plan.training_days || []
      }
    }

    const closePlanModal = () => {
      showCreatePlanModal.value = false
      editingPlan.value = null
      planForm.value = {
        name: '',
        description: '',
        training_days: []
      }
    }

    const savePlan = async () => {
      try {
        if (editingPlan.value) {
          await workoutStore.updateWorkoutPlan(editingPlan.value.id, planForm.value)
        } else {
          await workoutStore.createWorkoutPlan(props.folder.id, planForm.value)
        }
        closePlanModal()
      } catch (error) {
        console.error('Error saving plan:', error)
        alert('Failed to save plan. Please try again.')
      }
    }

    const deletePlan = async (plan) => {
      if (!confirm(`Delete "${plan.name}"? This will also delete all exercises.`)) return
      
      try {
        await workoutStore.deleteWorkoutPlan(plan.id)
      } catch (error) {
        console.error('Error deleting plan:', error)
        alert('Failed to delete plan. Please try again.')
      }
    }

    const showAddExercise = (planId) => {
      currentPlanId.value = planId
      editingExercise.value = null
      showExerciseModal.value = true
    }

    const editExercise = (exercise) => {
      currentPlanId.value = exercise.plan_id
      editingExercise.value = exercise
      showExerciseModal.value = true
    }

    const closeExerciseModal = () => {
      showExerciseModal.value = false
      editingExercise.value = null
      currentPlanId.value = null
    }

    const saveExercise = async (exerciseData) => {
      try {
        if (editingExercise.value) {
          await workoutStore.updateExercise(editingExercise.value.id, exerciseData)
        } else {
          await workoutStore.createExercise(currentPlanId.value, exerciseData)
        }
        closeExerciseModal()
        updateExercisesLists()
      } catch (error) {
        console.error('Error saving exercise:', error)
        alert('Failed to save exercise. Please try again.')
      }
    }

    const deleteExercise = async (exercise) => {
      if (!confirm(`Delete "${exercise.name}"?`)) return
      
      try {
        await workoutStore.deleteExercise(exercise.id)
        updateExercisesLists()
      } catch (error) {
        console.error('Error deleting exercise:', error)
        alert('Failed to delete exercise. Please try again.')
      }
    }

    const onExerciseReorder = async (planId) => {
      const exercises = exercisesList.value[planId]
      const exerciseIds = exercises.map(e => e.id)
      
      try {
        await workoutStore.reorderExercises(planId, exerciseIds)
      } catch (error) {
        console.error('Error reordering exercises:', error)
        // Revert on error
        updateExercisesLists()
      }
    }

    // Initialize
    updateExercisesLists()

    return {
      plans,
      expandedPlan,
      showCreatePlanModal,
      editingPlan,
      showExerciseModal,
      editingExercise,
      currentPlanId,
      planForm,
      weekDays,
      exercisesList,
      getExercises,
      togglePlan,
      startWorkout,
      editPlan,
      closePlanModal,
      savePlan,
      deletePlan,
      showAddExercise,
      editExercise,
      closeExerciseModal,
      saveExercise,
      deleteExercise,
      onExerciseReorder
    }
  }
}
</script>

<style scoped>
.workout-plan-editor {
  padding: var(--spacing-lg);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.editor-header h2 {
  margin: 0;
}

.actions-bar {
  margin-bottom: var(--spacing-xl);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.plan-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
}

.plan-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plan-header {
  padding: var(--spacing-lg);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-header:hover {
  background: var(--bg-hover);
}

.plan-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--text-primary);
}

.plan-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.plan-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.exercises-section {
  border-top: 1px solid var(--border-light);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
}

.exercises-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.exercises-header h4 {
  margin: 0;
  color: var(--text-primary);
}

.empty-exercises {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.exercise-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.drag-handle {
  cursor: move;
  color: var(--text-muted);
  user-select: none;
}

.exercise-details {
  flex: 1;
}

.exercise-details h5 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--text-primary);
}

.exercise-params {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.param {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.exercise-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  font-size: var(--font-size-lg);
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

/* Modal Styles */
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
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
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

.days-selector {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
}

.day-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
}

.icon {
  margin-right: var(--spacing-xs);
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-light);
}

.btn-ghost:hover {
  background: var(--bg-hover);
}
</style>
