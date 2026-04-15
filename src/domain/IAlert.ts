export enum EAlertSeverity {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum EConjunctionEventStatus {
  AlreadyOccurred = 0,
  Imminent = 1,
  Potential = 2,
  Resolved = 3,
  Pending = 4,
}

export interface IConjunctionEventSummary {
  id: string
  timeOfClosestApproach: string
  missDistance: number
  collisionProbability: number
  isHighRisk: boolean
  status: EConjunctionEventStatus
}

/** Shape returned by List endpoint */
export interface IAlertListItem {
  id: string
  isAcknowledged: boolean
  createdAt: string
  severity: EAlertSeverity
  message: string
  conjunctionEventId: string
  hasConjunctionEvent: boolean
}

/** Shape returned by Details endpoint */
export interface IAlertDetail {
  id: string
  isAcknowledged: boolean
  createdAt: string
  updatedAt: string
  severity: EAlertSeverity
  message: string
  conjunctionEventId: string
  conjunctionEvent?: IConjunctionEventSummary
}
