import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ActiveTrip, DayLog, LogEntry, PostTrip } from '@/shared/types'

const INITIAL_ENTRY: LogEntry = {
  time: '00:00',
  status: 'OFF_DUTY',
  location: '',
  remarks: '',
  bracket: false,
}

const emptyDay = (day_number: number, date: string): DayLog => ({
  day_number,
  date,
  driver_name: '',
  driver_number: '',
  co_driver: 'N/A',
  home_terminal: '',
  tractor: '',
  trailer: '',
  shipper: '',
  commodity: '',
  load_number: '',
  total_miles: 0,
  entries: [{ ...INITIAL_ENTRY }],
  post_trip: { defects: 'none' },
  completed: false,
})

interface TripStore {
  trip: ActiveTrip | null
  endedTrip: ActiveTrip | null

  // Lifecycle
  startTrip: (trip: ActiveTrip) => void
  endTrip: () => void
  abandonTrip: () => void

  // Day management
  addDay: () => void
  completeCurrentDay: () => void

  // Entry management
  addEntry: (entry: LogEntry) => void
  removeEntry: (index: number) => void
  updateDayHeader: (fields: Partial<DayLog>) => void
  updatePostTrip: (postTrip: PostTrip) => void

  // Selectors
  currentDay: () => DayLog | null
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trip: null,
      endedTrip: null,

      startTrip: (trip) => set({ trip, endedTrip: null }),

      // Moves active trip to endedTrip — EndTripScreen reads from endedTrip
      endTrip: () => {
        const { trip } = get()
        set({ trip: null, endedTrip: trip })
      },

      // Clears everything — used by "Abandon" and "Start New" on EndTripScreen
      abandonTrip: () => set({ trip: null, endedTrip: null }),

      addDay: () => {
        const { trip } = get()
        if (!trip) return
        const nextNum = trip.days.length + 1
        const date = new Date()
        date.setDate(date.getDate() + nextNum - 1)
        set({
          trip: {
            ...trip,
            current_day: nextNum,
            days: [...trip.days, emptyDay(nextNum, date.toISOString().split('T')[0])],
          },
        })
      },

      completeCurrentDay: () => {
        const { trip } = get()
        if (!trip) return
        set({
          trip: {
            ...trip,
            days: trip.days.map((d) =>
              d.day_number === trip.current_day ? { ...d, completed: true } : d,
            ),
          },
        })
      },

      addEntry: (entry) => {
        const { trip } = get()
        if (!trip) return
        set({
          trip: {
            ...trip,
            days: trip.days.map((d) =>
              d.day_number === trip.current_day
                ? { ...d, entries: [...d.entries, entry] }
                : d,
            ),
          },
        })
      },

      removeEntry: (index) => {
        // Index 0 is the auto-generated 00:00 OFF_DUTY anchor — never remove it
        if (index === 0) return
        const { trip } = get()
        if (!trip) return
        set({
          trip: {
            ...trip,
            days: trip.days.map((d) =>
              d.day_number === trip.current_day
                ? { ...d, entries: d.entries.filter((_, i) => i !== index) }
                : d,
            ),
          },
        })
      },

      updateDayHeader: (fields) => {
        const { trip } = get()
        if (!trip) return
        set({
          trip: {
            ...trip,
            days: trip.days.map((d) =>
              d.day_number === trip.current_day ? { ...d, ...fields } : d,
            ),
          },
        })
      },

      updatePostTrip: (postTrip) => {
        const { trip } = get()
        if (!trip) return
        set({
          trip: {
            ...trip,
            days: trip.days.map((d) =>
              d.day_number === trip.current_day ? { ...d, post_trip: postTrip } : d,
            ),
          },
        })
      },

      currentDay: () => {
        const { trip } = get()
        if (!trip) return null
        return trip.days.find((d) => d.day_number === trip.current_day) ?? null
      },
    }),
    {
      name: 'hos_active_trip',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
