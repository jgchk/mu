import type { AppSubscriptionData } from 'trpc'

import type { RouterOutput } from '$lib/trpc'

export type FileSearchResponse = AppSubscriptionData<RouterOutput['search']['soulseekSubscription']>

export type SoulseekResults = Map<string, SoulseekUserResults>
export type SoulseekUserResults = Pick<
  FileSearchResponse,
  'username' | 'slotsFree' | 'queueLength' | 'avgSpeed'
> & { dirs: SoulseekDirectories }
export type SoulseekDirectories = Map<string, SoulseekDirectory>
export type SoulseekDirectory = { dirname: string; files: SoulseekFiles }
export type SoulseekFiles = Map<string, SoulseekFile>
export type SoulseekFile = Omit<FileSearchResponse['results'][number], 'attrs'> & {
  basename: string
}

export type SortedSoulseekResults = SortedSoulseekUserResults[]
export type SortedSoulseekUserResults = Omit<SoulseekUserResults, 'dirs'> & SortedSoulseekDirectory
export type SortedSoulseekDirectory = Omit<SoulseekDirectory, 'files'> & {
  files: SortedSoulseekFiles
  size: bigint
}
export type SortedSoulseekFiles = SoulseekFile[]

export type SortCol =
  | 'username'
  | 'slotsFree'
  | 'queueLength'
  | 'avgSpeed'
  | 'dirname'
  | 'basename'
  | 'size'
export type Sort = { col: SortCol; asc: boolean }
