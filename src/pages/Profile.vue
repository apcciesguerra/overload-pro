<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>Profile</h1>
    </div>
    
    <div class="profile-content">
      <div class="profile-card card">
        <div class="card-header">
          <h2>Account Information</h2>
        </div>
        
        <div class="profile-info">
          <div class="info-group">
            <label class="info-label">Email</label>
            <p class="info-value">{{ authStore.userEmail }}</p>
          </div>
          
          <div class="info-group">
            <label class="info-label">User ID</label>
            <p class="info-value">{{ authStore.user?.id || 'N/A' }}</p>
          </div>
          
          <div class="info-group">
            <label class="info-label">Account Created</label>
            <p class="info-value">{{ formatDate(authStore.user?.created_at) }}</p>
          </div>
          
          <div class="info-group">
            <label class="info-label">Last Sign In</label>
            <p class="info-value">{{ formatDate(authStore.user?.last_sign_in_at) }}</p>
          </div>
        </div>
      </div>
      
      <div class="stats-card card">
        <div class="card-header">
          <h2>Workout Statistics</h2>
        </div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ workoutStore.foldersByUser.length }}</div>
            <div class="stat-label">Workout Folders</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-number">{{ workoutStore.routines.length }}</div>
            <div class="stat-label">Total Routines</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-number">{{ workoutStore.exercises.length }}</div>
            <div class="stat-label">Total Exercises</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-number">{{ workoutStore.exerciseLogs.length }}</div>
            <div class="stat-label">Exercise Logs</div>
          </div>
        </div>
      </div>
      
      <div class="actions-card card">
        <div class="card-header">
          <h2>Account Actions</h2>
        </div>
        
        <div class="actions-list">
          <button @click="showChangePassword = true" class="btn btn-secondary">
            Change Password
          </button>
          
          <button @click="exportData" class="btn btn-secondary">
            Export My Data
          </button>
          
          <button @click="deleteAccount" class="btn btn-danger">
            Delete Account
          </button>
        </div>
      </div>
    </div>
    
    <!-- Change Password Modal -->
    <div v-if="showChangePassword" class="modal-overlay" @click="showChangePassword = false">
      <div class="modal-content" @click.stop>
        <h3>Change Password</h3>
        <form @submit.prevent="handleChangePassword" class="form">
          <div class="form-group">
            <label for="currentPassword" class="form-label">Current Password</label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              class="form-input"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword" class="form-label">New Password</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              class="form-input"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="confirmNewPassword" class="form-label">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              v-model="passwordForm.confirmNewPassword"
              type="password"
              class="form-input"
              required
            />
          </div>
          
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">
              Update Password
            </button>
            <button type="button" @click="showChangePassword = false" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../store/useAuthStore'
import { useWorkoutStore } from '../store/useWorkoutStore'

export default {
  name: 'Profile',
  setup() {
    const authStore = useAuthStore()
    const workoutStore = useWorkoutStore()
    
    const showChangePassword = ref(false)
    const passwordForm = ref({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    })
    
    onMounted(() => {
      workoutStore.init()
    })
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const handleChangePassword = async () => {
      if (passwordForm.value.newPassword !== passwordForm.value.confirmNewPassword) {
        alert('New passwords do not match')
        return
      }
      
      try {
        // TODO: Implement password change functionality
        console.log('Change password:', passwordForm.value)
        alert('Password change functionality will be implemented')
        showChangePassword.value = false
        passwordForm.value = {
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }
      } catch (error) {
        console.error('Change password error:', error)
      }
    }
    
    const exportData = () => {
      const data = {
        user: authStore.user,
        folders: workoutStore.foldersByUser,
        routines: workoutStore.routines,
        exercises: workoutStore.exercises,
        exerciseLogs: workoutStore.exerciseLogs,
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `overload-pro-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    
    const deleteAccount = () => {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
        if (confirm('This is your final warning. All your workout data will be permanently deleted. Are you absolutely sure?')) {
          // TODO: Implement account deletion
          console.log('Delete account')
          alert('Account deletion functionality will be implemented')
        }
      }
    }
    
    return {
      authStore,
      workoutStore,
      showChangePassword,
      passwordForm,
      formatDate,
      handleChangePassword,
      exportData,
      deleteAccount
    }
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.info-value {
  color: var(--text-secondary);
  margin-bottom: 0;
  padding: var(--spacing-sm);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-lg);
}

.stat-item {
  text-align: center;
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.stat-number {
  font-size: var(--font-size-3xl);
  font-weight: bold;
  color: var(--primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
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
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.gap-2 {
  gap: var(--spacing-sm);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .actions-list {
    gap: var(--spacing-sm);
  }
}
</style> 