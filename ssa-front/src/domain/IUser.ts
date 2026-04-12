export enum EOperatorType {
  Government = 0,
  Commercial = 1,
  Amateur = 2,
  NotOneOfTheAbove = 3,
}

export interface IUser {
  email: string
  firstName: string
  lastName: string
  operatorName?: string
  operatorCountry?: string
  operatorType?: EOperatorType
}
