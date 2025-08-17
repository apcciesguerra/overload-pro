<template>
  <div class="rest-timer-overlay">
    <div class="rest-timer-modal">
      <h2>Rest Timer</h2>
      
      <div class="timer-display">
        <svg class="timer-ring" viewBox="0 0 200 200">
          <circle
            class="timer-ring-bg"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke-width="10"
          />
          <circle
            class="timer-ring-progress"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke-width="10"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
          />
        </svg>
        
        <div class="timer-text">
          <div class="time-remaining">{{ formatTime(timeRemaining) }}</div>
          <div class="timer-label">Rest Time</div>
        </div>
      </div>

      <div class="timer-info">
        <p>Rest for <strong>{{ exerciseName }}</strong></p>
        <p>Next: Set {{ nextSet }}</p>
      </div>

      <div class="timer-actions">
        <button @click="skipRest" class="btn btn-secondary">
          Skip Rest
        </button>
        <button @click="addTime(30)" class="btn btn-secondary">
          +30s
        </button>
        <button @click="pauseResume" class="btn btn-primary">
          {{ isPaused ? 'Resume' : 'Pause' }}
        </button>
      </div>

      <!-- Quick time adjustments -->
      <div class="quick-adjustments">
        <button 
          v-for="time in quickTimes" 
          :key="time"
          @click="setTime(time)"
          class="time-btn"
        >
          {{ time }}s
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useWorkoutStore } from '../../store/useWorkoutStore'

export default {
  name: 'RestTimer',
  props: {
    duration: {
      type: Number,
      required: true
    },
    exerciseName: {
      type: String,
      required: true
    },
    nextSet: {
      type: Number,
      required: true
    }
  },
  emits: ['complete', 'skip'],
  setup(props, { emit }) {
    const workoutStore = useWorkoutStore()
    
    // State
    const timeRemaining = ref(props.duration)
    const isPaused = ref(false)
    const circumference = 2 * Math.PI * 90
    const quickTimes = [30, 60, 90, 120, 180]
    
    let interval = null
    let wakeLock = null

    // Computed
    const progressOffset = computed(() => {
      const progress = (props.duration - timeRemaining.value) / props.duration
      return circumference - (progress * circumference)
    })

    // Methods
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    function startTimer() {
      if (interval) clearInterval(interval)
      
      interval = setInterval(() => {
        if (!isPaused.value) {
          timeRemaining.value--
          
          // Play sound at specific intervals
          if (workoutStore.workoutSettings.soundEnabled) {
            if (timeRemaining.value === 10) {
              playCountdownSound()
            } else if (timeRemaining.value <= 3 && timeRemaining.value > 0) {
              playTickSound()
            } else if (timeRemaining.value === 0) {
              playCompleteSound()
            }
          }
          
          // Complete timer
          if (timeRemaining.value <= 0) {
            completeTimer()
          }
        }
      }, 1000)
    }

    function pauseResume() {
      isPaused.value = !isPaused.value
    }

    function skipRest() {
      clearInterval(interval)
      emit('skip')
    }

    function addTime(seconds) {
      timeRemaining.value += seconds
    }

    function setTime(seconds) {
      timeRemaining.value = seconds
    }

    function completeTimer() {
      clearInterval(interval)
      
      // Send notification
      if (workoutStore.workoutSettings.enableNotifications && 'Notification' in window) {
        new Notification('Rest Complete!', {
          body: `Time to start Set ${props.nextSet}`,
          icon: '/icon.png',
          tag: 'rest-timer'
        })
      }
      
      emit('complete')
    }

    // Sound functions
    function playTickSound() {
      playSound('/sounds/tick.mp3', 0.3)
    }

    function playCountdownSound() {
      playSound('/sounds/countdown.mp3', 0.5)
    }

    function playCompleteSound() {
      playSound('/sounds/complete.mp3', 0.7)
    }

    function playSound(url, volume = 0.5) {
      try {
        const audio = new Audio(url)
        audio.volume = volume
        audio.play().catch(e => console.log('Could not play sound:', e))
      } catch (e) {
        console.log('Sound playback error:', e)
      }
    }

    // Keep screen awake
    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen')
        } catch (err) {
          console.log('Wake lock failed:', err)
        }
      }
    }

    async function releaseWakeLock() {
      if (wakeLock) {
        await wakeLock.release()
        wakeLock = null
      }
    }

    // Lifecycle
    onMounted(() => {
      startTimer()
      requestWakeLock()
      
      // Prevent screen timeout on mobile
      document.addEventListener('visibilitychange', handleVisibilityChange)
    })

    onUnmounted(() => {
      if (interval) clearInterval(interval)
      releaseWakeLock()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })

    // Handle page visibility
    function handleVisibilityChange() {
      if (document.hidden) {
        isPaused.value = true
      }
    }

    return {
      timeRemaining,
      isPaused,
      circumference,
      progressOffset,
      quickTimes,
      formatTime,
      pauseResume,
      skipRest,
      addTime,
      setTime
    }
  }
}
</script>

<style scoped>
.rest-timer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.rest-timer-modal {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.rest-timer-modal h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.timer-display {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto var(--spacing-lg);
}

.timer-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-ring-bg {
  stroke: var(--bg-secondary);
}

.timer-ring-progress {
  stroke: var(--primary);
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.time-remaining {
  font-size: var(--font-size-3xl);
  font-weight: bold;
  color: var(--text-primary);
}

.timer-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.timer-info {
  margin-bottom: var(--spacing-lg);
}

.timer-info p {
  margin: var(--spacing-xs) 0;
  color: var(--text-secondary);
}

.timer-info strong {
  color: var(--text-primary);
}

.timer-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-bottom: var(--spacing-lg);
}

.quick-adjustments {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  flex-wrap: wrap;
}

.time-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.time-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--primary);
}
</style>
