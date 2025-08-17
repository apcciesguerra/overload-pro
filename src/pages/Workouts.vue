<template>
  <div class="workouts-page">
    <!-- Main View Switcher -->
    <div v-if="!activeWorkout">
      <!-- Folder View -->
      <FolderManager
        v-if="currentView === 'folders'"
        @folder-selected="selectFolder"
      />

      <!-- Workout Plans View -->
      <WorkoutPlanEditor
        v-else-if="currentView === 'plans' && selectedFolder"
        :folder="selectedFolder"
        @back="backToFolders"
        @start-workout="startWorkout"
      />
    </div>

    <!-- Active Workout View -->
    <ActiveWorkout
      v-else
      :workout="activeWorkout"
      @complete="onWorkoutComplete"
      @cancel="onWorkoutCancel"
    />

    <!-- Progress Notification -->
    <transition name="slide-up">
      <div v-if="progressNotification" class="progress-notification">
        <div class="notification-content">
          <h4>{{ progressNotification.title }}</h4>
          <p>{{ progressNotification.message }}</p>
        </div>
        <button @click="progressNotification = null" class="close-btn">×</button>
      </div>
    </transition>

    <!-- Settings Button -->
    <button 
      v-if="!activeWorkout"
      @click="showSettings = true" 
      class="settings-fab"
      title="Workout Settings"
    >
      ⚙️
    </button>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
      <div class="modal-content" @click.stop>
        <h2>Workout Settings</h2>
        
        <div class="settings-form">
          <div class="form-group">
            <label for="default-rest">Default Rest Time (seconds)</label>
            <input 
              id="default-rest"
              v-model.number="settings.defaultRestTime" 
              type="number" 
              min="0" 
              max="600"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="weight-unit">Weight Unit</label>
            <select id="weight-unit" v-model="settings.weightUnit" class="form-input">
              <option value="kg">Kilograms (kg)</option>
              <option value="lbs">Pounds (lbs)</option>
            </select>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="settings.enableNotifications">
              Enable Notifications
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="settings.soundEnabled">
              Enable Sound Effects
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="settings.autoProgress">
              Auto-apply Progressive Overload
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="showSettings = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="saveSettings" class="btn btn-primary">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useWorkoutStore } from '../store/useWorkoutStore'
import FolderManager from '../components/workouts/FolderManager.vue'
import WorkoutPlanEditor from '../components/workouts/WorkoutPlanEditor.vue'
import ActiveWorkout from '../components/workouts/ActiveWorkout.vue'

export default {
  name: 'Workouts',
  components: {
    FolderManager,
    WorkoutPlanEditor,
    ActiveWorkout
  },
  setup() {
    const workoutStore = useWorkoutStore()
    
    // State
    const currentView = ref('folders')
    const selectedFolder = ref(null)
    const activeWorkout = ref(null)
    const showSettings = ref(false)
    const progressNotification = ref(null)
    const settings = ref({
      defaultRestTime: 90,
      weightUnit: 'kg',
      enableNotifications: true,
      soundEnabled: true,
      autoProgress: true
    })

    // Initialize
    onMounted(async () => {
      await workoutStore.init()
      
      // Load settings
      settings.value = { ...workoutStore.workoutSettings }
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          showProgressNotification('Welcome!', 'Notifications enabled for workout progress')
        }
      }
      
      // Check if there's an active workout to resume
      if (workoutStore.activeWorkout) {
        activeWorkout.value = workoutStore.activeWorkout
      }
    })

    // Methods
    function selectFolder(folder) {
      selectedFolder.value = folder
      currentView.value = 'plans'
    }

    function backToFolders() {
      selectedFolder.value = null
      currentView.value = 'folders'
    }

    async function startWorkout(plan) {
      try {
        activeWorkout.value = await workoutStore.startWorkout(plan.id)
        showProgressNotification('Workout Started', `Let's crush ${plan.name}!`)
      } catch (error) {
        console.error('Error starting workout:', error)
        alert('Failed to start workout. Please try again.')
      }
    }

    function onWorkoutComplete(workout) {
      activeWorkout.value = null
      
      // Calculate stats
      const duration = Math.floor((new Date(workout.completed_at) - new Date(workout.started_at)) / 1000)
      const minutes = Math.floor(duration / 60)
      
      showProgressNotification(
        'Workout Complete! 💪',
        `Great job! You completed ${workout.total_sets || 0} sets in ${minutes} minutes.`
      )
      
      // Navigate back to plans
      currentView.value = 'plans'
    }

    function onWorkoutCancel() {
      activeWorkout.value = null
      currentView.value = 'plans'
    }

    function saveSettings() {
      workoutStore.saveSettings(settings.value)
      showSettings.value = false
      showProgressNotification('Settings Saved', 'Your workout preferences have been updated')
    }

    function showProgressNotification(title, message) {
      progressNotification.value = { title, message }
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        progressNotification.value = null
      }, 5000)
      
      // Also show browser notification if enabled
      if (settings.value.enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/icon.png',
          tag: 'workout-progress'
        })
      }
    }

    // Watch for progress events from store
    watch(() => workoutStore.exerciseLogs, (newLogs, oldLogs) => {
      if (newLogs.length > oldLogs?.length) {
        const latestLog = newLogs[0]
        if (latestLog?.progression_data?.progressType === 'weight') {
          showProgressNotification(
            'Weight Increased! 🎉',
            latestLog.progression_data.message
          )
        } else if (latestLog?.progression_data?.progressType === 'reps') {
          showProgressNotification(
            'Rep Progress! 💪',
            latestLog.progression_data.message
          )
        }
      }
    }, { deep: true })

    return {
      workoutStore,
      currentView,
      selectedFolder,
      activeWorkout,
      showSettings,
      progressNotification,
      settings,
      selectFolder,
      backToFolders,
      startWorkout,
      onWorkoutComplete,
      onWorkoutCancel,
      saveSettings,
      showProgressNotification
    }
  }
}
</script>

<style scoped>
.workouts-page {
  min-height: 100vh;
  position: relative;
}

/* Settings FAB */
.settings-fab {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 100;
}

.settings-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

/* Progress Notification */
.progress-notification {
  position: fixed;
  bottom: var(--spacing-xl);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  border: 2px solid var(--primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  z-index: 1000;
  max-width: 400px;
  width: 90%;
}

.notification-content h4 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--primary);
}

.notification-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: var(--font-size-xl);
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary);
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translate(-50%, 100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}

/* Settings Modal */
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
  color: var(--text-primary);
}

.settings-form {
  margin-bottom: var(--spacing-xl);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
}

.form-group label input[type="checkbox"] {
  margin-right: var(--spacing-sm);
  cursor: pointer;
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

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}
</style>