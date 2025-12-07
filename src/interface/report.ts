export interface Report {
  id: string
  remarks?: string
  bhwId: string
  bhwName: string
  taskList: string[]
  weekStart: string // ISO date string for Monday of the week
  createdAt: string
  updatedAt: string
}