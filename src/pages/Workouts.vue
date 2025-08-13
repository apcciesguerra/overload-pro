<template>
  <div class="workouts-page">
    <div class="page-header">
      <h1>My Workouts</h1>
      <button @click="showCreateFolder = true" class="btn btn-primary">
        Create Folder
      </button>
    </div>
    
    <div v-if="workoutStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading workouts...</p>
    </div>
    
    <div v-else-if="workoutStore.foldersByUser.length === 0" class="empty-state">
      <h3>No workout folders yet</h3>
      <p>Create your first workout folder to get started</p>
      <button @click="showCreateFolder = true" class="btn btn-primary">
        Create First Folder
      </button>
    </div>
    
    <div v-else class="folders-grid">
      <div 
        v-for="folder in workoutStore.foldersByUser" 
        :key="folder.id"
        class="folder-card card"
      >
        <div class="folder-header">
          <h3>{{ folder.name }}</h3>
          <div class="folder-actions">
            <button @click="editFolder(folder)" class="btn btn-secondary btn-sm">
              Edit
            </button>
            <button @click="deleteFolder(folder.id)" class="btn btn-danger btn-sm">
              Delete
            </button>
          </div>
        </div>
        
        <p v-if="folder.description" class="folder-description">
          {{ folder.description }}
        </p>
        
        <div class="routines-section">
          <div class="routines-header">
            <h4>Routines ({{ getRoutinesForFolder(folder.id).length }})</h4>
            <button @click="showCreateRoutine = folder.id" class="btn btn-primary btn-sm">
              Add Routine
            </button>
          </div>
          
          <div v-if="getRoutinesForFolder(folder.id).length === 0" class="empty-routines">
            <p>No routines yet</p>
          </div>
          
          <div v-else class="routines-list">
            <div 
              v-for="routine in getRoutinesForFolder(folder.id)"
              :key="routine.id"
              class="routine-item"
            >
              <div class="routine-info">
                <h5>{{ routine.name }}</h5>
                <p v-if="routine.description">{{ routine.description }}</p>
              </div>
              <div class="routine-actions">
                <button @click="viewRoutine(routine)" class="btn btn-primary btn-sm">
                  View
                </button>
                <button @click="editRoutine(routine)" class="btn btn-secondary btn-sm">
                  Edit
                </button>
                <button @click="deleteRoutine(routine.id)" class="btn btn-danger btn-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useWorkoutStore } from '../store/useWorkoutStore'

export default {
  name: 'Workouts',
  setup() {
    const workoutStore = useWorkoutStore()
    
    // Modal states
    const showCreateFolder = ref(false)
    const showCreateRoutine = ref(null)
    
    // Initialize data
    onMounted(() => {
      workoutStore.init()
    })
    
    // Helper functions
    const getRoutinesForFolder = (folderId) => {
      return workoutStore.routinesByFolder(folderId)
    }
    
    const editFolder = (folder) => {
      console.log('Edit folder:', folder)
    }
    
    const deleteFolder = async (folderId) => {
      if (confirm('Are you sure you want to delete this folder?')) {
        try {
          await workoutStore.deleteFolder(folderId)
        } catch (error) {
          console.error('Delete folder error:', error)
        }
      }
    }
    
    const editRoutine = (routine) => {
      console.log('Edit routine:', routine)
    }
    
    const deleteRoutine = async (routineId) => {
      if (confirm('Are you sure you want to delete this routine?')) {
        try {
          await workoutStore.deleteRoutine(routineId)
        } catch (error) {
          console.error('Delete routine error:', error)
        }
      }
    }
    
    const viewRoutine = (routine) => {
      console.log('View routine:', routine)
    }
    
    return {
      workoutStore,
      showCreateFolder,
      showCreateRoutine,
      getRoutinesForFolder,
      editFolder,
      deleteFolder,
      editRoutine,
      deleteRoutine,
      viewRoutine
    }
  }
}
</script>

<style scoped>
.workouts-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}

.loading-state .spinner {
  margin: 0 auto var(--spacing-md);
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.folder-card {
  height: fit-content;
}

.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.folder-header h3 {
  margin-bottom: 0;
  flex: 1;
}

.folder-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.folder-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.routines-section {
  border-top: 1px solid var(--border-light);
  padding-top: var(--spacing-md);
}

.routines-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.routines-header h4 {
  margin-bottom: 0;
}

.empty-routines {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-muted);
}

.routines-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.routine-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.routine-info h5 {
  margin-bottom: var(--spacing-xs);
}

.routine-info p {
  margin-bottom: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.routine-actions {
  display: flex;
  gap: var(--spacing-xs);
}
</style> 