export interface Inspection
{
  target?: {method :string, endpoint :string}
  request?: {headers: Array<Header>, content :string}
  response?: {headers: Array<Header>, content :string}
  status?: {code :number, text :string}
}

interface Header
{
  name :string,
  value :string
}