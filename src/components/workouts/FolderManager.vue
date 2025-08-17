<template>
  <div class="folder-manager">
    <!-- Create Folder Button -->
    <div class="header-actions">
      <button @click="showCreateModal = true" class="btn btn-primary">
        <span class="icon">+</span> Create Folder
      </button>
    </div>

    <!-- Folders Grid -->
    <div v-if="workoutStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading folders...</p>
    </div>

    <div v-else-if="folders.length === 0" class="empty-state">
      <h3>No workout folders yet</h3>
      <p>Create your first folder to organize your workout plans</p>
      <button @click="showCreateModal = true" class="btn btn-primary">
        Create Your First Folder
      </button>
    </div>

    <div v-else class="folders-grid">
      <div 
        v-for="folder in folders" 
        :key="folder.id"
        class="folder-card"
        @click="selectFolder(folder)"
      >
        <div class="folder-header">
          <h3>{{ folder.name }}</h3>
          <div class="folder-actions" @click.stop>
            <button @click="editFolder(folder)" class="btn-icon" title="Edit">
              ✏️
            </button>
            <button @click="confirmDelete(folder)" class="btn-icon" title="Delete">
              🗑️
            </button>
          </div>
        </div>
        
        <p v-if="folder.description" class="folder-description">
          {{ folder.description }}
        </p>

        <div class="folder-stats">
          <span class="stat">
            <strong>{{ getPlanCount(folder.id) }}</strong> plans
          </span>
          <span class="stat">
            Created {{ formatDate(folder.created_at) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Create/Edit Folder Modal -->
    <div v-if="showCreateModal || editingFolder" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingFolder ? 'Edit Folder' : 'Create New Folder' }}</h2>
        
        <form @submit.prevent="saveFolder">
          <div class="form-group">
            <label for="folder-name">Folder Name *</label>
            <input 
              id="folder-name"
              v-model="folderForm.name" 
              type="text" 
              required
              placeholder="e.g., Push/Pull/Legs"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="folder-description">Description</label>
            <textarea 
              id="folder-description"
              v-model="folderForm.description" 
              placeholder="Optional description for this folder"
              rows="3"
              class="form-input"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!folderForm.name">
              {{ editingFolder ? 'Update' : 'Create' }} Folder
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deletingFolder" class="modal-overlay" @click="deletingFolder = null">
      <div class="modal-content" @click.stop>
        <h2>Delete Folder</h2>
        <p>Are you sure you want to delete "{{ deletingFolder.name }}"?</p>
        <p class="warning">This will also delete all workout plans and exercises in this folder.</p>
        
        <div class="modal-actions">
          <button @click="deletingFolder = null" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="deleteFolder" class="btn btn-danger">
            Delete Folder
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useWorkoutStore } from '../../store/useWorkoutStore'

export default {
  name: 'FolderManager',
  emits: ['folder-selected'],
  setup(props, { emit }) {
    const workoutStore = useWorkoutStore()
    
    // State
    const showCreateModal = ref(false)
    const editingFolder = ref(null)
    const deletingFolder = ref(null)
    const folderForm = ref({
      name: '',
      description: ''
    })

    // Computed
    const folders = computed(() => workoutStore.foldersByUser)

    // Methods
    const getPlanCount = (folderId) => {
      return workoutStore.plansByFolder(folderId).length
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }

    const selectFolder = (folder) => {
      emit('folder-selected', folder)
    }

    const editFolder = (folder) => {
      editingFolder.value = folder
      folderForm.value = {
        name: folder.name,
        description: folder.description || ''
      }
    }

    const closeModal = () => {
      showCreateModal.value = false
      editingFolder.value = null
      folderForm.value = {
        name: '',
        description: ''
      }
    }

    const saveFolder = async () => {
      try {
        if (editingFolder.value) {
          await workoutStore.updateFolder(editingFolder.value.id, folderForm.value)
        } else {
          await workoutStore.createFolder(folderForm.value.name, folderForm.value.description)
        }
        closeModal()
      } catch (error) {
        console.error('Error saving folder:', error)
        alert('Failed to save folder. Please try again.')
      }
    }

    const confirmDelete = (folder) => {
      deletingFolder.value = folder
    }

    const deleteFolder = async () => {
      if (!deletingFolder.value) return
      
      try {
        await workoutStore.deleteFolder(deletingFolder.value.id)
        deletingFolder.value = null
      } catch (error) {
        console.error('Error deleting folder:', error)
        alert('Failed to delete folder. Please try again.')
      }
    }

    return {
      workoutStore,
      folders,
      showCreateModal,
      editingFolder,
      deletingFolder,
      folderForm,
      getPlanCount,
      formatDate,
      selectFolder,
      editFolder,
      closeModal,
      saveFolder,
      confirmDelete,
      deleteFolder
    }
  }
}
</script>

<style scoped>
.folder-manager {
  padding: var(--spacing-lg);
}

.header-actions {
  margin-bottom: var(--spacing-xl);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.loading-state .spinner {
  margin: 0 auto var(--spacing-md);
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.folder-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.folder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.folder-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.folder-actions {
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

.folder-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.folder-stats {
  display: flex;
  justify-content: space-between;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.stat strong {
  color: var(--text-primary);
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
  color: var(--text-primary);
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
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
}

.warning {
  color: var(--danger);
  font-weight: 500;
  margin-top: var(--spacing-md);
}

.icon {
  margin-right: var(--spacing-xs);
}
</style>
