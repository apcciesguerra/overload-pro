import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, TABLES } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'
import { progressiveOverload, analyzeRecoveryFactors } from '../lib/progressiveOverload'

export const useWorkoutStore = defineStore('workout', () => {
  const authStore = useAuthStore()
  
  // State
  const folders = ref([])
  const workoutPlans = ref([])
  const exercises = ref([])
  const exerciseLogs = ref([])
  const activeWorkout = ref(null)
  const workoutSettings = ref({
    defaultRestTime: 90, // seconds
    enableNotifications: true,
    soundEnabled: true,
    autoProgress: true,
    weightUnit: 'kg'
  })
  const loading = ref(false)
  const error = ref(null)

  // Computed properties
  const foldersByUser = computed(() => 
    folders.value.filter(folder => folder.user_id === authStore.user?.id)
  )

  const plansByFolder = computed(() => (folderId) =>
    workoutPlans.value.filter(plan => plan.folder_id === folderId)
  )

  const exercisesByPlan = computed(() => (planId) =>
    exercises.value.filter(exercise => exercise.plan_id === planId)
      .sort((a, b) => a.order_index - b.order_index)
  )

  const lastWorkoutForExercise = computed(() => (exerciseId) => {
    return exerciseLogs.value
      .filter(log => log.exercise_id === exerciseId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  })

  const progressHistory = computed(() => (exerciseId, limit = 10) => {
    return exerciseLogs.value
      .filter(log => log.exercise_id === exerciseId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
  })

  // Initialize store
  async function init() {
    if (!authStore.user) return
    
    try {
      loading.value = true
      await Promise.all([
        fetchFolders(),
        fetchWorkoutPlans(),
        fetchExercises(),
        fetchExerciseLogs(),
        loadSettings()
      ])
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Settings operations
  async function loadSettings() {
    const stored = localStorage.getItem('workoutSettings')
    if (stored) {
      workoutSettings.value = { ...workoutSettings.value, ...JSON.parse(stored) }
    }
  }

  async function saveSettings(settings) {
    workoutSettings.value = { ...workoutSettings.value, ...settings }
    localStorage.setItem('workoutSettings', JSON.stringify(workoutSettings.value))
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

  // Workout Plan operations
  async function fetchWorkoutPlans() {
    const { data, error: fetchError } = await supabase
      .from(TABLES.WORKOUT_ROUTINES)
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError
    workoutPlans.value = data || []
  }

  async function createWorkoutPlan(folderId, planData) {
    const { data, error: createError } = await supabase
      .from(TABLES.WORKOUT_ROUTINES)
      .insert({
        ...planData,
        folder_id: folderId,
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (createError) throw createError
    workoutPlans.value.unshift(data)
    return data
  }

  async function updateWorkoutPlan(id, updates) {
    const { data, error: updateError } = await supabase
      .from(TABLES.WORKOUT_ROUTINES)
      .update(updates)
      .eq('id', id)
      .eq('user_id', authStore.user.id)
      .select()
      .single()

    if (updateError) throw updateError
    
    const index = workoutPlans.value.findIndex(p => p.id === id)
    if (index !== -1) {
      workoutPlans.value[index] = data
    }
    
    return data
  }

  async function deleteWorkoutPlan(id) {
    const { error: deleteError } = await supabase
      .from(TABLES.WORKOUT_ROUTINES)
      .delete()
      .eq('id', id)
      .eq('user_id', authStore.user.id)

    if (deleteError) throw deleteError
    
    workoutPlans.value = workoutPlans.value.filter(p => p.id !== id)
  }

  // Exercise operations
  async function fetchExercises() {
    const { data, error: fetchError } = await supabase
      .from(TABLES.EXERCISES)
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('order_index', { ascending: true })

    if (fetchError) throw fetchError
    exercises.value = data || []
  }

  async function createExercise(planId, exerciseData) {
    // Get the max order index for this plan
    const planExercises = exercisesByPlan(planId)
    const maxOrder = planExercises.length > 0 
      ? Math.max(...planExercises.map(e => e.order_index || 0))
      : -1

    const { data, error: createError } = await supabase
      .from(TABLES.EXERCISES)
      .insert({
        ...exerciseData,
        plan_id: planId,
        order_index: maxOrder + 1,
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (createError) throw createError
    exercises.value.push(data)
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

  async function reorderExercises(planId, exerciseIds) {
    const updates = exerciseIds.map((id, index) => ({
      id,
      order_index: index
    }))

    const { error: updateError } = await supabase
      .from(TABLES.EXERCISES)
      .upsert(updates)
      .eq('plan_id', planId)
      .eq('user_id', authStore.user.id)

    if (updateError) throw updateError

    // Update local state
    updates.forEach(update => {
      const exercise = exercises.value.find(e => e.id === update.id)
      if (exercise) {
        exercise.order_index = update.order_index
      }
    })
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

  async function logExerciseSet(exerciseId, setData) {
    const exercise = exercises.value.find(e => e.id === exerciseId)
    if (!exercise) throw new Error('Exercise not found')

    // Get previous sessions for this exercise
    const previousSessions = progressHistory(exerciseId, 5)

    // Calculate progression recommendation
    const progression = progressiveOverload({
      repsDone: setData.reps,
      weight: setData.weight,
      repsMin: exercise.reps_min,
      repsMax: exercise.reps_max,
      rir: setData.rir,
      previousSessions: previousSessions.map(log => ({
        repsDone: log.reps,
        weight: log.weight
      }))
    })

    const { data, error: createError } = await supabase
      .from(TABLES.EXERCISE_LOGS)
      .insert({
        ...setData,
        exercise_id: exerciseId,
        user_id: authStore.user.id,
        progression_data: progression,
        workout_session_id: activeWorkout.value?.id
      })
      .select()
      .single()

    if (createError) throw createError
    exerciseLogs.value.unshift(data)
    
    return { log: data, progression }
  }

  async function logWorkoutSession(planId, sessionData) {
    const { data, error: createError } = await supabase
      .from('workout_sessions')
      .insert({
        plan_id: planId,
        user_id: authStore.user.id,
        ...sessionData
      })
      .select()
      .single()

    if (createError) throw createError
    return data
  }

  // Active workout management
  async function startWorkout(planId) {
    const plan = workoutPlans.value.find(p => p.id === planId)
    if (!plan) throw new Error('Workout plan not found')

    const session = await logWorkoutSession(planId, {
      started_at: new Date().toISOString(),
      status: 'in_progress'
    })

    activeWorkout.value = {
      ...session,
      plan,
      exercises: exercisesByPlan(planId),
      completedSets: [],
      currentExerciseIndex: 0
    }

    return activeWorkout.value
  }

  async function completeWorkout() {
    if (!activeWorkout.value) return

    const { error: updateError } = await supabase
      .from('workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        total_sets: activeWorkout.value.completedSets.length
      })
      .eq('id', activeWorkout.value.id)

    if (updateError) throw updateError

    const completed = { ...activeWorkout.value }
    activeWorkout.value = null
    return completed
  }

  async function cancelWorkout() {
    if (!activeWorkout.value) return

    const { error: updateError } = await supabase
      .from('workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        status: 'cancelled'
      })
      .eq('id', activeWorkout.value.id)

    if (updateError) throw updateError
    
    activeWorkout.value = null
  }

  // Recovery check
  async function checkRecoveryFactors(factors) {
    const analysis = analyzeRecoveryFactors(factors)
    
    // Store recovery check
    const { error } = await supabase
      .from('recovery_checks')
      .insert({
        user_id: authStore.user.id,
        factors,
        analysis,
        created_at: new Date().toISOString()
      })

    if (error) console.error('Failed to save recovery check:', error)
    
    return analysis
  }

  return {
    // State
    folders,
    workoutPlans,
    exercises,
    exerciseLogs,
    activeWorkout,
    workoutSettings,
    loading,
    error,
    
    // Computed
    foldersByUser,
    plansByFolder,
    exercisesByPlan,
    lastWorkoutForExercise,
    progressHistory,
    
    // Actions
    init,
    saveSettings,
    
    // Folder actions
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    
    // Workout plan actions
    fetchWorkoutPlans,
    createWorkoutPlan,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    
    // Exercise actions
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    reorderExercises,
    
    // Log actions
    fetchExerciseLogs,
    logExerciseSet,
    logWorkoutSession,
    
    // Workout session actions
    startWorkout,
    completeWorkout,
    cancelWorkout,
    
    // Recovery
    checkRecoveryFactors
  }
})