// lib/events.ts - Simple event system for component communication

type EventCallback = () => void

class EventEmitter {
  private events: Record<string, EventCallback[]> = {}

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter((cb) => cb !== callback)
  }

  emit(event: string) {
    if (!this.events[event]) return
    this.events[event].forEach((callback) => callback())
  }
}

export const events = new EventEmitter()

// Event constants
export const EVENTS = {
  SESSIONS_UPDATED: "sessions:updated",
  PROJECTS_UPDATED: "projects:updated",
  SUBPROJECTS_UPDATED: "subprojects:updated",
} as const
