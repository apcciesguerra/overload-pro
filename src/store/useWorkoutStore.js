import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, TABLES } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'

export const useWorkoutStore = defineStore('workout', () => {
  const authStore = useAuthStore()
  
  // State
  const folders = ref([])
  const routines = ref([])
  const exercises = ref([])
  const exerciseLogs = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed properties
  const foldersByUser = computed(() => 
    folders.value.filter(folder => folder.user_id === authStore.user?.id)
  )

  const routinesByFolder = computed(() => (folderId) =>
    routines.value.filter(routine => routine.folder_id === folderId)
  )

  const exercisesByRoutine = computed(() => (routineId) =>
    exercises.value.filter(exercise => exercise.routine_id === routineId)
  )

  // Initialize store
  async function init() {
    if (!authStore.user) return
    
    try {
      loading.value = true
      await Promise.all([
        fetchFolders(),
        fetchRoutines(),
        fetchExercises(),
        fetchExerciseLogs()
      ])
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Folder operations
  async function fetchFolders() {
    const { data, error: fetchError } = await supabase
      .from(TABLES.WORKOUT_FOLDERS)
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError
    folders.value = data || []
  }

  async function createFolder(name, description = '') {
    const { data, error: createError } = await supabase
      .from(TABLES.WORKOUT_FOLDERS)
      .insert({
        name,
        description,
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (createError) throw createError
    folders.value.unshift(data)
    return data
  }

  async function updateFolder(id, updates) {
    const { data, error: updateError } = await supabase
      .from(TABLES.WORKOUT_FOLDERS)
      .update(updates)
      .eq('id', id)
      .eq('user_id', authStore.user.id)
      .select()
      .single()

    if (updateError) throw updateError
    
    const index = folders.value.findIndex(f => f.id === id)
    if (index !== -1) {
      folders.value[index] = data
    }
    
    return data
  }

  async function deleteFolder(id) {
    const { error: deleteError } = await supabase
      .from(TABLES.WORKOUT_FOLDERS)
      .delete()
      .eq('id', id)
      .eq('user_id', authStore.user.id)

    if (deleteError) throw deleteError
    
    folders.value = folders.value.filter(f => f.id !== id)
  }

  // Routine operations
  async function fetchRoutines() {
    const { data, error: fetchError } = await supabase
      .from(TABLES.WORKOUT_ROUTINES)
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError
    routines.value = data || []
  }

  async function createRoutine(folderId, name, description = '') {
    const { data, error: createError } = await supabase
      .from(TABLES.WORKOUT_ROUTINES)
      .insert({
        name,
        description,
        folder_id: folderId,
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (createError) throw createError
    routines.value.unshift(data)
    return data
  }

  async function updateRoutine(id, updates) {
    const { data, error: updateError } = await supabase
      .from(TABLES.WORKOUT_ROUTINES)
      .update(updates)
      .eq('id', id)
      .eq('user_id', authStore.user.id)
      .select()
      .single()

    if (updateError) throw updateError
    
    const index = routines.value.findIndex(r => r.id === id)
    if (index !== -1) {
      routines.value[index] = data
    }
    
    return data
  }

  async function deleteRoutine(id) {
    const { error: deleteError } = await supabase
      .from(TABLES.WORKOUT_ROUTINES)
      .delete()
      .eq('id', id)
      .eq('user_id', authStore.user.id)

    if (deleteError) throw deleteError
    
    routines.value = routines.value.filter(r => r.id !== id)
  }

  // Exercise operations
  async function fetchExercises() {
    const { data, error: fetchError } = await supabase
      .from(TABLES.EXERCISES)
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError
    exercises.value = data || []
  }

  async function createExercise(routineId, exerciseData) {
    const { data, error: createError } = await supabase
      .from(TABLES.EXERCISES)
      .insert({
        ...exerciseData,
        routine_id: routineId,
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (createError) throw createError
    exercises.value.unshift(data)
    return data
  }

  async function updateExercise(id, updates) {
    const { data, error: updateError } = await supabase
      .from(TABLES.EXERCISES)
      .update(updates)
      .eq('id', id)
      .eq('user_id', authStore.user.id)
      .select()
      .single()

    if (updateError) throw updateError
    
    const index = exercises.value.findIndex(e => e.id === id)
    if (index !== -1) {
      exercises.value[index] = data
    }
    
    return data
  }

  async function deleteExercise(id) {
    const { error: deleteError } = await supabase
      .from(TABLES.EXERCISES)
      .delete()
      .eq('id', id)
      .eq('user_id', authStore.user.id)

    if (deleteError) throw deleteError
    
    exercises.value = exercises.value.filter(e => e.id !== id)
  }

  // Exercise log operations
  async function fetchExerciseLogs() {
    const { data, error: fetchError } = await supabase
      .from(TABLES.EXERCISE_LOGS)
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError
    exerciseLogs.value = data || []
  }

  async function logExercise(exerciseId, logData) {
    const { data, error: createError } = await supabase
      .from(TABLES.EXERCISE_LOGS)
      .insert({
        ...logData,
        exercise_id: exerciseId,
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (createError) throw createError
    exerciseLogs.value.unshift(data)
    return data
  }

  return {
    // State
    folders,
    routines,
    exercises,
    exerciseLogs,
    loading,
    error,
    
    // Computed
    foldersByUser,
    routinesByFolder,
    exercisesByRoutine,
    
    // Actions
    init,
    
    // Folder actions
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    
    // Routine actions
    fetchRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    
    // Exercise actions
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    
    // Log actions
    fetchExerciseLogs,
    logExercise
  }
}) 