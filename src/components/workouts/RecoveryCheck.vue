<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>Recovery Check</h2>
      <p class="intro">
        You've been struggling with your lifts. Let's check your recovery factors to adjust your training.
      </p>

      <form @submit.prevent="submitCheck">
        <div 
          v-for="(factor, key) in recoveryFactors" 
          :key="key"
          class="factor-section"
        >
          <h3>{{ factor.label }}</h3>
          <p class="question">{{ factor.question }}</p>
          
          <div class="options-grid">
            <label 
              v-for="option in factor.options" 
              :key="option.value"
              class="option-card"
              :class="{ 
                selected: responses[key] === option.value,
                negative: option.impact < 0,
                positive: option.impact > 0
              }"
            >
              <input 
                type="radio" 
                :name="key"
                :value="option.value"
                v-model="responses[key]"
                required
              >
              <span class="option-label">{{ option.label }}</span>
            </label>
          </div>
        </div>

        <div v-if="analysis" class="analysis-section">
          <h3>Analysis</h3>
          
          <div class="overall-recommendation" :class="{ warning: analysis.shouldDeload }">
            <p>{{ analysis.overallRecommendation }}</p>
          </div>

          <div v-if="analysis.recommendations.length > 0" class="recommendations">
            <h4>Recommendations:</h4>
            <ul>
              <li v-for="(rec, index) in analysis.recommendations" :key="index">
                {{ rec }}
              </li>
            </ul>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('skip')" class="btn btn-secondary">
            Skip Check
          </button>
          <button type="submit" class="btn btn-primary">
            {{ analysis ? 'Continue Workout' : 'Analyze Recovery' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { RECOVERY_FACTORS, analyzeRecoveryFactors } from '../../lib/progressiveOverload'

export default {
  name: 'RecoveryCheck',
  emits: ['complete', 'skip'],
  setup(props, { emit }) {
    // State
    const recoveryFactors = RECOVERY_FACTORS
    const responses = reactive({
      sleep: null,
      stress: null,
      nutrition: null,
      soreness: null,
      energy: null
    })
    const analysis = ref(null)

    // Methods
    function submitCheck() {
      if (analysis.value) {
        // Already analyzed, emit complete
        emit('complete', responses)
      } else {
        // Analyze responses
        analysis.value = analyzeRecoveryFactors(responses)
      }
    }

    return {
      recoveryFactors,
      responses,
      analysis,
      submitCheck
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

.modal-content h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.intro {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.factor-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--border-light);
}

.factor-section:last-of-type {
  border-bottom: none;
}

.factor-section h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.question {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
}

.option-card {
  position: relative;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.option-card.selected {
  border-color: var(--primary);
  background: var(--bg-primary);
}

.option-card.selected.negative {
  border-color: var(--danger);
  background: rgba(var(--danger-rgb), 0.1);
}

.option-card.selected.positive {
  border-color: var(--success);
  background: rgba(var(--success-rgb), 0.1);
}

.option-card input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.analysis-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.analysis-section h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.overall-recommendation {
  padding: var(--spacing-md);
  background: var(--bg-info);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.overall-recommendation.warning {
  background: rgba(var(--danger-rgb), 0.1);
  border-color: var(--danger);
}

.overall-recommendation p {
  margin: 0;
  font-weight: 500;
  color: var(--text-primary);
}

.recommendations h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.recommendations ul {
  margin: 0;
  padding-left: var(--spacing-lg);
}

.recommendations li {
  margin-bottom: var(--spacing-xs);
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
}
</style>
