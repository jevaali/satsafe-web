export interface IMainListSatellite {
  id: string
  name: string
  operator: string
  hasOrbit: boolean
  semiMajorAxis: number
  eccentricity: number
  inclination: number
  raan: number
  argumentOfPerigee: number
  meanAnomaly: number
}

export interface IMainListDebris {
  id: string
  noradId: number
  sizeEstimate: number
  hasOrbit: boolean
  semiMajorAxis: number
  eccentricity: number
  inclination: number
  raan: number
  argumentOfPerigee: number
  meanAnomaly: number
}

export interface IMainList {
  satellites: IMainListSatellite[]
  debris: IMainListDebris[]
}
