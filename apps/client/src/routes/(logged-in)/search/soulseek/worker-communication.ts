import type { FileSearchResponse, Sort, SortedSoulseekResults } from './types'

export type ToWorkerMessage = ResultMessage | ResetMessage | SortMessage
export type ResultMessage = {
  kind: 'result'
  result: FileSearchResponse
}
export type ResetMessage = {
  kind: 'reset'
}
export type SortMessage = {
  kind: 'sort'
  sort: Sort | undefined
}

export type FromWorkerMessage = ResultsMessage
export type ResultsMessage = {
  kind: 'results'
  results: SortedSoulseekResults
}
