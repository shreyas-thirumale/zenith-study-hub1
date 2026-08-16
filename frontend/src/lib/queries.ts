import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import toast from 'react-hot-toast'

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const queryKeys = {
  events:        ['events'] as const,
  projects:      ['projects'] as const,
  courses:       ['courses'] as const,
  focusSessions: ['focus', 'sessions'] as const,
  focusStats:    ['focus', 'stats'] as const,
  tasks:         (projectId: string) => ['tasks', projectId] as const,
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  type: string
  course_id?: string
  completed?: boolean
}

export interface Project {
  id: string
  name: string
  description?: string
  course_id?: string | undefined
  course_name?: string
  due_date?: string | undefined
  status: string
  progress: number
}

export interface Course {
  id: string
  name: string
  code: string
  color: string
  days: string[]
  start_time: string | null
  end_time: string | null
  location: string | null
}

export interface FocusSession {
  id: string
  duration: number
  course_id?: string
  course_name?: string
  started_at: string
  ended_at?: string
  status?: string
}

export interface FocusStats {
  weekSeconds: number
  weekMinutes: number
  weekHours: number
  totalSeconds: number
  totalMinutes: number
  sessionsThisWeek: number
  totalSessions: number
  averageSessionMinutes: number
}

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  position: number
  assigned_to?: string
}

// ─── Query Hooks ──────────────────────────────────────────────────────────────

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, courses(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map((p: any) => ({
        ...p,
        course_name: p.courses?.name ?? null,
      }))
    },
  })
}

export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useFocusSessions() {
  return useQuery({
    queryKey: queryKeys.focusSessions,
    queryFn: async (): Promise<FocusSession[]> => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*, courses(name)')
        .order('started_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data.map((s: any) => ({
        ...s,
        course_name: s.courses?.name ?? null,
      }))
    },
  })
}

export function useFocusStats() {
  return useQuery({
    queryKey: queryKeys.focusStats,
    queryFn: async (): Promise<FocusStats> => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('duration, started_at')
        .not('ended_at', 'is', null)

      if (error) throw error

      const allSessions = data ?? []
      const weekSessions = allSessions.filter(
        s => new Date(s.started_at) >= weekStart
      )

      const weekSeconds = weekSessions.reduce((t, s) => t + (s.duration ?? 0), 0)
      const totalSeconds = allSessions.reduce((t, s) => t + (s.duration ?? 0), 0)

      return {
        weekSeconds,
        weekMinutes: Math.round(weekSeconds / 60),
        weekHours: Math.round((weekSeconds / 3600) * 10) / 10,
        totalSeconds,
        totalMinutes: Math.round(totalSeconds / 60),
        sessionsThisWeek: weekSessions.length,
        totalSessions: allSessions.length,
        averageSessionMinutes:
          allSessions.length > 0
            ? Math.round(totalSeconds / allSessions.length / 60)
            : 0,
      }
    },
  })
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks(projectId),
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

// Events
export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<CalendarEvent, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: event, error } = await supabase
        .from('calendar_events')
        .insert({ ...data, user_id: user.id })
        .select()
        .single()
      if (error) {
        throw error
      }
      return event
    },
    onSuccess: (newEvent) => {
      qc.setQueryData<CalendarEvent[]>(queryKeys.events, old =>
        old ? [...old, newEvent] : [newEvent]
      )
      toast.success('Event added!')
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to add event')
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.events })
      const previous = qc.getQueryData<CalendarEvent[]>(queryKeys.events)
      qc.setQueryData<CalendarEvent[]>(queryKeys.events, old =>
        old ? old.filter(e => e.id !== id) : []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.events, context.previous)
      toast.error('Failed to delete event')
    },
    onSuccess: () => toast.success('Event deleted!'),
  })
}

// Projects
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: project, error } = await supabase
        .from('projects')
        .insert({ ...data, user_id: user!.id, progress: 0 })
        .select('*, courses(name)')
        .single()
      if (error) throw error
      return { ...project, course_name: (project as any).courses?.name ?? null }
    },
    onSuccess: (newProject) => {
      qc.setQueryData<Project[]>(queryKeys.projects, old =>
        old ? [newProject, ...old] : [newProject]
      )
      toast.success('Project created!')
    },
    onError: () => toast.error('Failed to create project'),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, courses(name)')
        .single()
      if (error) throw error
      return { ...project, course_name: (project as any).courses?.name ?? null }
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.projects })
      const previous = qc.getQueryData<Project[]>(queryKeys.projects)
      qc.setQueryData<Project[]>(queryKeys.projects, old =>
        old ? old.map(p => p.id === id ? { ...p, ...data } : p) : []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.projects, context.previous)
      toast.error('Failed to update project')
    },
    onSuccess: (updated) => {
      qc.setQueryData<Project[]>(queryKeys.projects, old =>
        old ? old.map(p => p.id === updated.id ? updated : p) : []
      )
      toast.success('Project updated!')
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.projects })
      const previous = qc.getQueryData<Project[]>(queryKeys.projects)
      qc.setQueryData<Project[]>(queryKeys.projects, old =>
        old ? old.filter(p => p.id !== id) : []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.projects, context.previous)
      toast.error('Failed to delete project')
    },
    onSuccess: () => toast.success('Project deleted!'),
  })
}

// Courses
export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Course>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: course, error } = await supabase
        .from('courses')
        .insert({ ...data, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return course
    },
    onSuccess: (newCourse) => {
      qc.setQueryData<Course[]>(queryKeys.courses, old =>
        old ? [...old, newCourse] : [newCourse]
      )
      toast.success('Course added!')
    },
    onError: () => toast.error('Failed to add course'),
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Course> }) => {
      const { data: course, error } = await supabase
        .from('courses')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return course
    },
    onSuccess: (updated) => {
      qc.setQueryData<Course[]>(queryKeys.courses, old =>
        old ? old.map(c => c.id === updated.id ? updated : c) : []
      )
      toast.success('Course updated!')
    },
    onError: () => toast.error('Failed to update course'),
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.courses })
      const previous = qc.getQueryData<Course[]>(queryKeys.courses)
      qc.setQueryData<Course[]>(queryKeys.courses, old =>
        old ? old.filter(c => c.id !== id) : []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.courses, context.previous)
      toast.error('Failed to delete course')
    },
    onSuccess: () => toast.success('Course removed!'),
  })
}

// Focus sessions
export function useStartFocusSession() {
  return useMutation({
    mutationFn: async (data: { duration: number; course_id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: session, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user!.id,
          duration: data.duration,
          course_id: data.course_id ?? null,
          started_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single()
      if (error) throw error
      return session
    },
    onError: () => toast.error('Failed to start focus session'),
  })
}

export function useEndFocusSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('focus_sessions')
        .update({ ended_at: new Date().toISOString(), status: 'completed' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.focusSessions })
      qc.invalidateQueries({ queryKey: queryKeys.focusStats })
      toast.success('Focus session ended!')
    },
    onError: () => toast.error('Failed to end focus session'),
  })
}

// Tasks
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Task, 'id' | 'position'> & { position?: number }) => {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return task
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks(task.project_id) })
    },
    onError: () => toast.error('Failed to create task'),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const { data: task, error } = await supabase
        .from('tasks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return task
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks(task.project_id) })
    },
    onError: () => toast.error('Failed to update task'),
  })
}
