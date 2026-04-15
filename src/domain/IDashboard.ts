import type { ISatelliteListItem } from './ISatellite'
import type { IAlertListItem } from './IAlert'
import { EConjunctionEventStatus } from './IAlert'

export { EConjunctionEventStatus }

export interface IDashboardConjunction {
  id: string
  isHighRisk: boolean
  timeOfClosestApproach: string
  primaryObjectId: string
  secondaryObjectId: string
  primaryObjectName: string
  secondaryObjectName: string
  missDistance: number
  collisionProbability: number
  status: EConjunctionEventStatus
}

export interface IDashboard {
  operatorName: string
  totalSatellites: number
  activeSatellites: number
  pendingConjunctions: number
  highRiskConjunctions: number
  unacknowledgedAlerts: number
  satellites: ISatelliteListItem[]
  conjunctions: IDashboardConjunction[]
  alerts: IAlertListItem[]
}
