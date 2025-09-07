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
    exercises.value.filter(exercise => exercise.routine_id === planId)
      // TODO: Add order_index support when DB schema is updated
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
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
      .order('created_at', { ascending: true }) // TODO: Use order_index when available in DB

    if (fetchError) throw fetchError
    exercises.value = data || []
  }

  async function createExercise(planId, exerciseData) {
    // Map the exercise data to match database schema
    const dbExerciseData = {
      name: exerciseData.name,
      description: exerciseData.description || '',
      target_reps: exerciseData.target_reps || 8,
      target_sets: exerciseData.target_sets || 3,
      routine_id: planId, // Map planId to routine_id for database
      user_id: authStore.user.id
    }

    // Add any extra fields to notes for future implementation
    const extraFields = []
    if (exerciseData.muscle_group) extraFields.push(`Muscle Group: ${exerciseData.muscle_group}`)
    if (exerciseData.equipment_type) extraFields.push(`Equipment: ${exerciseData.equipment_type}`)
    if (exerciseData.target_rir) extraFields.push(`Target RIR: ${exerciseData.target_rir}`)
    if (exerciseData.rest_time) extraFields.push(`Rest Time: ${exerciseData.rest_time}s`)
    
    if (extraFields.length > 0) {
      const existingNotes = dbExerciseData.description ? `${dbExerciseData.description}\n\n` : ''
      dbExerciseData.description = `${existingNotes}${extraFields.join(', ')}`
    }

    const { data, error: createError } = await supabase
      .from(TABLES.EXERCISES)
      .insert(dbExerciseData)
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
    // TODO: Implement exercise reordering when order_index column is added to DB
    // For now, exercises will be ordered by creation date
    console.warn('Exercise reordering not yet supported - exercises ordered by creation date')
    
    // Could potentially update created_at timestamps as a workaround
    // But keeping it simple for MVP
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

    // Enhanced set data with tracking info
    const enhancedSetData = {
      exercise_id: exerciseId,
      exercise_name: exercise.name,
      weight: setData.weight || 0,
      reps: setData.reps || 0,
      sets: 1, // Each log represents one set
      notes: setData.notes || '',
      user_id: authStore.user.id,
      logged_at: new Date().toISOString(),
      // Additional tracking data
      target_reps: exercise.target_reps,
      rir: setData.rir || null,
      difficulty: setData.difficulty || null
    }

    // Save to database
    const { data, error: createError } = await supabase
      .from(TABLES.EXERCISE_LOGS)
      .insert({
        exercise_id: exerciseId,
        weight: enhancedSetData.weight,
        reps: enhancedSetData.reps,
        sets: enhancedSetData.sets,
        notes: enhancedSetData.notes,
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (createError) throw createError
    exerciseLogs.value.unshift(data)

    // Update active workout tracking if workout is in progress
    if (activeWorkout.value) {
      activeWorkout.value.total_sets_completed += 1
      activeWorkout.value.total_volume += (enhancedSetData.weight * enhancedSetData.reps)
      activeWorkout.value.exercise_logs.push(enhancedSetData)
      
      // Update completed sets array for UI display
      if (!activeWorkout.value.completed_sets) {
        activeWorkout.value.completed_sets = []
      }
      activeWorkout.value.completed_sets.push({
        exerciseId,
        setData: enhancedSetData,
        timestamp: Date.now()
      })

      console.log('✅ Set completed:', {
        exercise: exercise.name,
        weight: enhancedSetData.weight,
        reps: enhancedSetData.reps,
        total_sets: activeWorkout.value.total_sets_completed
      })
    }
    
    return { 
      log: data, 
      enhanced: enhancedSetData,
      workout_progress: activeWorkout.value ? {
        total_sets: activeWorkout.value.total_sets_completed,
        total_volume: activeWorkout.value.total_volume
      } : null
    }
  }

  // TODO: Future feature - Add workout session logging to database when sessions table is available
  // For now, we track everything in memory for better UX and performance
  function createInMemoryWorkoutSession(planId, plan) {
    return {
      id: `temp-${Date.now()}`, // Temporary ID for in-memory tracking
      plan_id: planId,
      plan_name: plan.name,
      user_id: authStore.user.id,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      duration: 0, // in seconds
      total_sets_completed: 0,
      total_volume: 0, // weight * reps * sets
      exercises_completed: 0,
      current_exercise_index: 0,
      completed_sets: [], // Array of completed set data
      workout_notes: ''
    }
  }

  // Active workout management - In-Memory Tracking
  async function startWorkout(planId) {
    const plan = workoutPlans.value.find(p => p.id === planId)
    if (!plan) throw new Error('Workout plan not found')

    const exercises = exercisesByPlan.value(planId)
    if (exercises.length === 0) {
      throw new Error('No exercises found in this workout plan')
    }

    // Create rich in-memory workout session
    const session = createInMemoryWorkoutSession(planId, plan)
    
    activeWorkout.value = {
      ...session,
      plan,
      exercises,
      // Enhanced tracking data
      start_time: Date.now(),
      exercise_logs: [], // Store completed sets here before saving to DB
      performance_notes: [],
      rest_periods: [] // Track rest times between sets
    }

    console.log('🏋️ Workout started:', {
      plan: plan.name,
      exercises: exercises.length,
      startTime: new Date().toISOString()
    })

    return activeWorkout.value
  }

  async function completeWorkout() {
    if (!activeWorkout.value) return

    const workout = activeWorkout.value
    const completedAt = new Date().toISOString()
    const duration = Math.floor((Date.now() - workout.start_time) / 1000) // seconds

    // Calculate workout statistics
    const stats = {
      duration,
      total_sets: workout.total_sets_completed,
      total_volume: workout.total_volume,
      exercises_completed: workout.exercises_completed,
      completion_rate: (workout.exercises_completed / workout.exercises.length) * 100
    }

    console.log('🎉 Workout completed:', {
      plan: workout.plan_name,
      ...stats,
      duration_formatted: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
    })

    // TODO: When workout_sessions table is available, save session summary here
    // await saveWorkoutSession(workout, stats, completedAt)

    // TODO: Batch save any remaining exercise logs
    // The individual sets should already be saved via logExerciseSet during workout

    const completed = { 
      ...workout, 
      completed_at: completedAt,
      status: 'completed',
      stats
    }
    
    activeWorkout.value = null
    return completed
  }

  async function cancelWorkout() {
    if (!activeWorkout.value) return

    const workout = activeWorkout.value
    const cancelledAt = new Date().toISOString()
    const duration = Math.floor((Date.now() - workout.start_time) / 1000)

    console.log('❌ Workout cancelled:', {
      plan: workout.plan_name,
      duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
      sets_completed: workout.total_sets_completed
    })

    // TODO: When workout_sessions table is available, save cancelled session
    // await saveWorkoutSession(workout, { status: 'cancelled' }, cancelledAt)
    
    activeWorkout.value = null
  }

  // Recovery check - In-Memory tracking
  async function checkRecoveryFactors(factors) {
    const analysis = analyzeRecoveryFactors(factors)
    
    // TODO: Store recovery check in database when recovery_checks table is available
    // For now, add to workout notes if workout is active
    if (activeWorkout.value) {
      const recoveryNote = {
        type: 'recovery_check',
        timestamp: new Date().toISOString(),
        factors,
        analysis,
        recommendation: analysis.overallRecommendation
      }
      
      activeWorkout.value.performance_notes.push(recoveryNote)
      console.log('📊 Recovery check completed:', analysis.overallRecommendation)
    }
    
    return analysis
  }

  // Helper functions for workout tracking
  function updateWorkoutDuration() {
    if (activeWorkout.value && activeWorkout.value.start_time) {
      activeWorkout.value.duration = Math.floor((Date.now() - activeWorkout.value.start_time) / 1000)
    }
  }

  function addRestPeriod(duration, exerciseId) {
    if (activeWorkout.value) {
      activeWorkout.value.rest_periods.push({
        exercise_id: exerciseId,
        duration,
        timestamp: new Date().toISOString()
      })
    }
  }

  function markExerciseComplete(exerciseId) {
    if (activeWorkout.value) {
      const exerciseIndex = activeWorkout.value.exercises.findIndex(e => e.id === exerciseId)
      if (exerciseIndex >= 0) {
        activeWorkout.value.exercises_completed = Math.max(
          activeWorkout.value.exercises_completed,
          exerciseIndex + 1
        )
      }
    }
  }

  function getWorkoutStats() {
    if (!activeWorkout.value) return null
    
    const duration = Math.floor((Date.now() - activeWorkout.value.start_time) / 1000)
    return {
      duration,
      duration_formatted: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
      total_sets: activeWorkout.value.total_sets_completed,
      total_volume: activeWorkout.value.total_volume,
      exercises_completed: activeWorkout.value.exercises_completed,
      total_exercises: activeWorkout.value.exercises.length,
      completion_percentage: Math.round((activeWorkout.value.exercises_completed / activeWorkout.value.exercises.length) * 100)
    }
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
    
    // Workout session actions
    startWorkout,
    completeWorkout,
    cancelWorkout,
    
    // Recovery
    checkRecoveryFactors,
    
    // In-Memory Workout Tracking Features
    updateWorkoutDuration,
    addRestPeriod,
    markExerciseComplete,
    getWorkoutStats
  }
})