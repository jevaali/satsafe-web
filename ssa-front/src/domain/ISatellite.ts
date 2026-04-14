export enum ESatelliteStatus {
  Active = 0,
  Inactive = 1,
  Decommissioned = 2,
  Lost = 3,
  Unknown = 4,
  Deleted = 5,
}

export interface IOrbit {
  semiMajorAxis: number
  eccentricity: number
  inclination: number
  raan: number
  argumentOfPerigee: number
  meanAnomaly: number
}

export interface IRiskAssessment {
  riskScore: number
  riskLevel: string
  modelVersion: string
  calculatedAt: string
}

/** Shape returned by List endpoint */
export interface ISatelliteListItem {
  id: string
  name: string
  noradId: number
  launchDate: string
  status: ESatelliteStatus
  riskLevel: string
  orbit: IOrbit
}

/** Shape returned by Details endpoint */
export interface ISatelliteDetail {
  id: string
  name: string
  noradId: number
  launchDate: string
  status: ESatelliteStatus
  orbit: IOrbit
  riskAssessment?: IRiskAssessment
}

export interface ICreateSatellitePayload {
  name: string
  launchDate: string // YYYY-MM-DD
  operatorId: string
  noradId: number
  semiMajorAxis: number
  eccentricity: number
  inclination: number
  raan: number
  argumentOfPerigee: number
  meanAnomaly: number
}

export interface IUpdateSatellitePayload {
  satelliteId: string
  name: string
  launchDate: string // YYYY-MM-DD
  operatorId: string
  noradId: number
  semiMajorAxis: number
  eccentricity: number
  inclination: number
  raan: number
  argumentOfPerigee: number
  meanAnomaly: number
}
