import type { IOrbit } from './ISatellite'
import { ESatelliteStatus } from './ISatellite'
import { EConjunctionEventStatus } from './IAlert'
import type { IAlertListItem } from './IAlert'

export { ESatelliteStatus, EConjunctionEventStatus }

export enum EOperatorAcknowledgement {
  None = 0,
  Noticed = 1,
  Confirmed = 2,
  Resolved = 3,
}

/** Shape returned by List endpoint (matches IDashboardConjunction) */
export interface IConjunctionListItem {
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

/** Shape returned by Details endpoint */
export interface IConjunctionDetail {
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
  primaryAcknowledgement: EOperatorAcknowledgement
  secondaryAcknowledgement: EOperatorAcknowledgement
  operatorSide: string // "primary" | "secondary"
  primaryIsSatellite: boolean
  secondaryIsSatellite: boolean
  primaryNoradId: number
  secondaryNoradId: number
  primaryObjectStatus: ESatelliteStatus
  secondaryObjectStatus: ESatelliteStatus
  primaryOrbit: IOrbit
  secondaryOrbit: IOrbit
  alerts: IAlertListItem[]
}
