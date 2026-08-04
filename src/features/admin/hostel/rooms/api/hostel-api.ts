import axios, { AxiosError } from 'axios'
import { Room, Bed, CreateRoomInput, CreateBedInput } from '../../types/hostel.types'

/**
 * Base API configuration
 */
const API_BASE = '/api/hostel'

/**
 * Create axios instance with interceptors for better error handling
 */
const apiClient = axios.create()

// Response interceptor to handle errors consistently
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const message = error.response?.data?.message || error.response?.data?.error || error.message
    return Promise.reject(new Error(message))
  }
)

/**
 * Room API Service
 */
export const roomApi = {
  /**
   * Create a new room
   */
  create: async (data: CreateRoomInput): Promise<Room> => {
    const response = await apiClient.post<Room>(`${API_BASE}/rooms`, data)
    return response.data
  },

  /**
   * Get all rooms with optional bed inclusion
   */
  getAll: async (includeBeds: boolean = true): Promise<Room[]> => {
    const response = await apiClient.get<Room[]>(`${API_BASE}/rooms`, {
      params: { includeBeds }
    })
    return response.data
  },

  /**
   * Get a single room by ID
   */
  getById: async (roomId: string, includeBeds: boolean = true): Promise<Room> => {
    const response = await apiClient.get<Room>(`${API_BASE}/rooms/${roomId}`, {
      params: { includeBeds }
    })
    return response.data
  },

  /**
   * Update a room
   */
  update: async (roomId: string, data: Partial<CreateRoomInput>): Promise<Room> => {
    const response = await apiClient.put<Room>(`${API_BASE}/rooms/${roomId}`, data)
    return response.data
  },

  /**
   * Delete a room
   */
  delete: async (roomId: string): Promise<void> => {
    await apiClient.delete(`${API_BASE}/rooms/${roomId}`)
  },
}

/**
 * Bed API Service
 */
export const bedApi = {
  /**
   * Create a new bed
   */
  create: async (data: CreateBedInput): Promise<Bed> => {
    const response = await apiClient.post<Bed>(`${API_BASE}/beds`, data)
    return response.data
  },

  /**
   * Get a single bed by ID
   */
  getById: async (bedId: string): Promise<Bed> => {
    const response = await apiClient.get<Bed>(`${API_BASE}/beds/${bedId}`)
    return response.data
  },

  /**
   * Update a bed
   */
  update: async (bedId: string, data: Partial<CreateBedInput>): Promise<Bed> => {
    const response = await apiClient.put<Bed>(`${API_BASE}/beds/${bedId}`, data)
    return response.data
  },

  /**
   * Delete a bed
   */
  delete: async (bedId: string): Promise<void> => {
    await apiClient.delete(`${API_BASE}/beds/${bedId}`)
  },

  /**
   * Get available beds by room
   */
  getAvailableByRoom: async (roomId: string): Promise<Bed[]> => {
    const response = await apiClient.get<Bed[]>(`${API_BASE}/beds/available`, {
      params: { roomId }
    })
    return response.data
  },
}

/**
 * Combined hostel API service
 */
export const hostelApi = {
  rooms: roomApi,
  beds: bedApi,
}
