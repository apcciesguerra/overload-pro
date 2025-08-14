<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Overload Pro</h1>
        <p>Track your hypertrophy progress</p>
      </div>
      
      <div class="auth-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'login' }]"
          @click="activeTab = 'login'"
        >
          Login
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'signup' }]"
          @click="activeTab = 'signup'"
        >
          Sign Up
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            required
            :disabled="authStore.loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            required
            :disabled="authStore.loading"
          />
        </div>
        
        <div v-if="activeTab === 'signup'" class="form-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            required
            :disabled="authStore.loading"
          />
        </div>
        
        <div v-if="authStore.error" class="form-error">
          {{ authStore.error }}
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-full"
          :disabled="authStore.loading || !isFormValid"
        >
          <span v-if="authStore.loading" class="spinner mr-2"></span>
          {{ activeTab === 'login' ? 'Login' : 'Sign Up' }}
        </button>
      </form>
      
      <div v-if="activeTab === 'login'" class="auth-footer">
        <button @click="showResetPassword = true" class="btn btn-secondary btn-sm">
          Forgot Password?
        </button>
      </div>
    </div>
    
    <!-- Reset Password Modal -->
    <div v-if="showResetPassword" class="modal-overlay" @click="showResetPassword = false">
      <div class="modal-content" @click.stop>
        <h3>Reset Password</h3>
        <form @submit.prevent="handleResetPassword" class="auth-form">
          <div class="form-group">
            <label for="resetEmail" class="form-label">Email</label>
            <input
              id="resetEmail"
              v-model="resetEmail"
              type="email"
              class="form-input"
              required
            />
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">
              Send Reset Link
            </button>
            <button type="button" @click="showResetPassword = false" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuthStore } from '../store/useAuthStore'
import { useRouter } from 'vue-router'

export default {
  name: 'Auth',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const activeTab = ref('login')
    const showResetPassword = ref(false)
    const resetEmail = ref('')
    
    const form = ref({
      email: '',
      password: '',
      confirmPassword: ''
    })
    
    const isFormValid = computed(() => {
      if (activeTab.value === 'login') {
        return form.value.email && form.value.password
      } else {
        return form.value.email && 
               form.value.password && 
               form.value.confirmPassword &&
               form.value.password === form.value.confirmPassword
      }
    })
    
    const handleSubmit = async () => {
      try {
        if (activeTab.value === 'login') {
          await authStore.signIn(form.value.email, form.value.password)
        } else {
          await authStore.signUp(form.value.email, form.value.password)
        }
        
        // Redirect to workouts page after successful auth
        router.push('/workouts')
      } catch (error) {
        console.error('Auth error:', error)
      }
    }
    
    const handleResetPassword = async () => {
      try {
        await authStore.resetPassword(resetEmail.value)
        showResetPassword.value = false
        resetEmail.value = ''
        alert('Password reset link sent to your email!')
      } catch (error) {
        console.error('Reset password error:', error)
      }
    }
    
    return {
      authStore,
      activeTab,
      form,
      isFormValid,
      showResetPassword,
      resetEmail,
      handleSubmit,
      handleResetPassword
    }
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  padding: var(--spacing-md);
}

.auth-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.auth-header h1 {
  color: var(--primary);
  margin-bottom: var(--spacing-sm);
}

.auth-header p {
  color: var(--text-secondary);
  margin-bottom: 0;
}

.auth-tabs {
  display: flex;
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: var(--spacing-md);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 500;
}

.tab-btn.active {
  background-color: var(--primary);
  color: var(--text-light);
}

.tab-btn:not(.active):hover {
  background-color: var(--bg-secondary);
}

.auth-form {
  margin-bottom: var(--spacing-lg);
}

.auth-footer {
  text-align: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.gap-2 {
  gap: var(--spacing-sm);
}

.mr-2 {
  margin-right: var(--spacing-sm);
}
</style> 