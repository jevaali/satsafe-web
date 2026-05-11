import type { ISatelliteListItem } from './ISatellite'
import { EOperatorType } from './IUser'

export { EOperatorType }

export interface IOperatorSummary {
  id: string
  name: string
  countryCode: string
  operatorType: EOperatorType
}

export interface IHelper {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  initials: string
}

export interface INotificationSetting {
  conjunctionThresholdKm: number
  alertThresholdKm: number
  emailEnabled: boolean
  smsEnabled: boolean
}

export interface ISettings {
  operator: IOperatorSummary
  satellites: ISatelliteListItem[]
  helpers: IHelper[]
  notificationSetting: INotificationSetting
}

export interface IUpdateOperatorSettingsPayload {
  name: string
  country: string
  operatorType: EOperatorType
}

export interface IAddHelperPayload {
  email: string
}

export interface ISaveNotificationsPayload {
  conjunctionThresholdKm: number
  alertThresholdKm: number
  emailEnabled: boolean
  smsEnabled: boolean
}

export interface IOperatorActionLog {
  userId: string
  userEmail: string
  userName: string
  action: string
  occurredAt: string
}