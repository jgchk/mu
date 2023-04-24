export type AST = Filter
export type Filter = FilterId | FilterNot | FilterAnd | FilterOr
export type FilterId = {
  kind: 'id'
  value: number
}
export type FilterNot = {
  kind: 'not'
  child: Filter
}
export type FilterAnd = {
  kind: 'and'
  children: Filter[]
}
export type FilterOr = {
  kind: 'or'
  children: Filter[]
}
