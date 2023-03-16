<script lang="ts">
  import type { RouterOutput } from '$lib/trpc'
  import { regexLastIndexOf } from '$lib/utils/string'
  import type { Messages } from 'soulseek-ts'

  export let data: RouterOutput['search']['soulseek']

  type SoulseekResults = Map<string, SoulseekUserResults>
  type SoulseekUserResults = Pick<
    Messages.From.Peer.FileSearchResponse,
    'username' | 'slotsFree' | 'queueLength' | 'avgSpeed'
  > & { dirs: SoulseekDirectories }
  type SoulseekDirectories = Map<string, SoulseekDirectory>
  type SoulseekDirectory = { dirname: string; files: SoulseekFiles }
  type SoulseekFiles = Map<string, SoulseekFile>
  type SoulseekFile = Omit<
    Messages.From.Peer.FileSearchResponse['results'][number],
    'filename' | 'attrs'
  > & {
    basename: string
  }

  type SortedSoulseekResults = SortedSoulseekUserResults[]
  type SortedSoulseekUserResults = Omit<SoulseekUserResults, 'dirs'> & {
    dirs: SortedSoulseekDirectories
  }
  type SortedSoulseekDirectories = SortedSoulseekDirectory[]
  type SortedSoulseekDirectory = Omit<SoulseekDirectory, 'files'> & { files: SortedSoulseekFiles }
  type SortedSoulseekFiles = SoulseekFile[]

  type SortCol =
    | 'username'
    | 'slotsFree'
    | 'queueLength'
    | 'avgSpeed'
    | 'dirname'
    | 'basename'
    | 'size'
  type Sort = { col: SortCol; asc: boolean }
  let sort: Sort | undefined

  const handleSort = (col: SortCol) => {
    if (sort && sort.col === col) {
      if (!sort.asc) {
        sort = undefined
      } else {
        sort.asc = !sort.asc
      }
    } else {
      sort = { col, asc: true }
    }
  }

  let results: SoulseekResults
  $: {
    results = new Map()
    for (const result of data.results) {
      const { username, slotsFree, queueLength, avgSpeed, results: files } = result
      const dirs = new Map<string, SoulseekDirectory>()
      for (const file of files) {
        const { filename, size } = file
        const dirname = filename.slice(0, regexLastIndexOf(filename, /[/\\]/) + 1)
        const basename = filename.slice(dirname.length)
        const dir = dirs.get(dirname) ?? { dirname, files: new Map() }
        dir.files.set(basename, { ...file, basename })
        dirs.set(dirname, dir)
      }
      results.set(username, { username, slotsFree, queueLength, avgSpeed, dirs })
    }
  }

  let sortedResults: SortedSoulseekResults
  $: {
    const res = [...results.values()].map((user) => {
      const dirs = [...user.dirs.values()].map((dir) => {
        const files = [...dir.files.values()]
        const sort_ = sort ?? { col: 'basename', asc: true }
        if (sort_.col === 'basename') {
          files.sort((a, b) => {
            const sortResult = a.basename.localeCompare(b.basename)
            return sort_.asc ? sortResult : -sortResult
          })
        } else if (sort_.col === 'size') {
          files.sort((a, b) => {
            const sortResult = Number(a.size - b.size)
            return sort_.asc ? sortResult : -sortResult
          })
        }
        return { ...dir, files }
      })

      const dirNameSortDirection = sort?.col === 'dirname' ? sort.asc : true
      dirs.sort((a, b) => {
        const sortResult = a.dirname.localeCompare(b.dirname)
        return dirNameSortDirection ? sortResult : -sortResult
      })

      return { ...user, dirs }
    })

    const compareUsername = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) =>
      a.username.localeCompare(b.username)
    const compareSlotsFree = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) => {
      const aSlotsFree = a.slotsFree ? 1 : 0
      const bSlotsFree = b.slotsFree ? 1 : 0
      return aSlotsFree - bSlotsFree
    }
    const compareQueueLength = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) =>
      a.queueLength - b.queueLength
    const compareAvgSpeed = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) =>
      a.avgSpeed - b.avgSpeed

    const defaultSorts: Sort[] = [
      { col: 'slotsFree', asc: false },
      { col: 'queueLength', asc: true },
      { col: 'avgSpeed', asc: false },
      { col: 'username', asc: true },
    ]
    if (sort) {
      const sort_ = sort
      const sortIndex = defaultSorts.findIndex((s) => s.col === sort_.col)
      if (sortIndex !== -1) {
        defaultSorts.splice(sortIndex, 1) // remove sort from defaultSorts
        defaultSorts.unshift(sort_) // add sort to beginning of defaultSorts
      }
    }

    const orderedCompare = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) => {
      for (const sort_ of defaultSorts) {
        if (sort_.col === 'username') {
          const sortResult = compareUsername(a, b) * (sort_.asc ? 1 : -1)
          if (sortResult !== 0) return sortResult
        } else if (sort_.col === 'slotsFree') {
          const sortResult = compareSlotsFree(a, b) * (sort_.asc ? 1 : -1)
          if (sortResult !== 0) return sortResult
        } else if (sort_.col === 'queueLength') {
          const sortResult = compareQueueLength(a, b) * (sort_.asc ? 1 : -1)
          if (sortResult !== 0) return sortResult
        } else if (sort_.col === 'avgSpeed') {
          const sortResult = compareAvgSpeed(a, b) * (sort_.asc ? 1 : -1)
          if (sortResult !== 0) return sortResult
        }
      }
      return 0
    }

    res.sort(orderedCompare)

    sortedResults = res
  }

  const formatSpeed = (bytes: number) => {
    const mb = bytes / 1000 / 1000
    if (mb >= 1) return `${mb.toFixed(2)} mb/s`
    const kb = bytes / 1000
    if (kb >= 1) return `${kb.toFixed(2)} kb/s`
    return `${bytes} b/s`
  }

  const formatSize = (bytes: bigint) => {
    const gb = Number(bytes) / 1000 / 1000 / 1000
    if (gb >= 1) return `${gb.toFixed(2)} gb`
    const mb = Number(bytes) / 1000 / 1000
    if (mb >= 1) return `${mb.toFixed(2)} mb`
    const kb = Number(bytes) / 1000
    if (kb >= 1) return `${kb.toFixed(2)} kb`
    return `${bytes} b`
  }
</script>

<div class="soulseek-results">
  <div class="contents">
    <button on:click={() => handleSort('username')}>
      Username {sort && sort.col === 'username' ? (sort.asc ? '^' : 'v') : ''}
    </button>
    <button on:click={() => handleSort('avgSpeed')}>
      Avg. Speed {sort && sort.col === 'avgSpeed' ? (sort.asc ? '^' : 'v') : ''}
    </button>
    <button on:click={() => handleSort('slotsFree')}>
      Slots Free {sort && sort.col === 'slotsFree' ? (sort.asc ? '^' : 'v') : ''}
    </button>
    <button on:click={() => handleSort('queueLength')}>
      Queued {sort && sort.col === 'queueLength' ? (sort.asc ? '^' : 'v') : ''}
    </button>
    <button on:click={() => handleSort('dirname')}>
      Folder {sort && sort.col === 'dirname' ? (sort.asc ? '^' : 'v') : ''}
    </button>
    <button on:click={() => handleSort('basename')}>
      File {sort && sort.col === 'basename' ? (sort.asc ? '^' : 'v') : ''}
    </button>
    <button on:click={() => handleSort('size')}>
      Size {sort && sort.col === 'size' ? (sort.asc ? '^' : 'v') : ''}
    </button>
  </div>

  {#each sortedResults as data (data.username)}
    <div class="contents">
      <div class="col-start-1">{data.username}</div>
      <div>{formatSpeed(data.avgSpeed)}</div>
      <div>{data.slotsFree}</div>
      <div>{data.queueLength}</div>
    </div>
    {#each data.dirs as dir (dir.dirname)}
      <div class="contents">
        <div class="col-start-1" />
        <div class="col-start-5">{dir.dirname}</div>
      </div>
      {#each dir.files as file (file.basename)}
        <div class="contents">
          <div class="col-start-1" />
          <div class="col-start-6">{file.basename}</div>
          <div class="col-start-7">{formatSize(file.size)}</div>
        </div>
      {/each}
    {/each}
  {/each}
</div>

<style lang="postcss">
  .soulseek-results {
    display: grid;
    grid-template-columns: repeat(7, fit-content);
    row-gap: theme(spacing.1);
    column-gap: theme(spacing[0.5]);
  }
</style>
