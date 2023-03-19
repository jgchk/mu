<script lang="ts">
  import type { FileSearchResponse } from './types';

  export let data: FileSearchResponse[];

  type SoulseekResults = Map<string, SoulseekUserResults>;
  type SoulseekUserResults = Pick<
    FileSearchResponse,
    'username' | 'slotsFree' | 'queueLength' | 'avgSpeed'
  > & { dirs: SoulseekDirectories };
  type SoulseekDirectories = Map<string, SoulseekDirectory>;
  type SoulseekDirectory = { dirname: string; files: SoulseekFiles };
  type SoulseekFiles = Map<string, SoulseekFile>;
  type SoulseekFile = Omit<FileSearchResponse['results'][number], 'filename' | 'attrs'> & {
    basename: string;
  };

  type SortedSoulseekResults = SortedSoulseekUserResults[];
  type SortedSoulseekUserResults = Omit<SoulseekUserResults, 'dirs'> & SortedSoulseekDirectory;
  type SortedSoulseekDirectory = Omit<SoulseekDirectory, 'files'> & {
    files: SortedSoulseekFiles;
    size: bigint;
  };
  type SortedSoulseekFiles = SoulseekFile[];

  type SortCol =
    | 'username'
    | 'slotsFree'
    | 'queueLength'
    | 'avgSpeed'
    | 'dirname'
    | 'basename'
    | 'size';
  type Sort = { col: SortCol; asc: boolean };
  let sort: Sort | undefined;

  let results: SoulseekResults;
  $: {
    results = new Map();
    for (const result of data) {
      const { username, slotsFree, queueLength, avgSpeed, results: files } = result;
      const dirs = results.get(username)?.dirs ?? new Map<string, SoulseekDirectory>();
      for (const file of files) {
        const { filename } = file;
        const dirparts = filename.replaceAll('\\', '/').split('/');
        const dirname = dirparts.slice(0, -1).reverse().join('/');
        const basename = dirparts[dirparts.length - 1];
        const dir = dirs.get(dirname) ?? { dirname, files: new Map() };
        dir.files.set(basename, { ...file, basename });
        dirs.set(dirname, dir);
      }
      results.set(username, { username, slotsFree, queueLength, avgSpeed, dirs });
    }
  }

  let sortedResults: SortedSoulseekResults;
  $: {
    const res = [...results.values()].flatMap((user) => {
      const dirs = [...user.dirs.values()].map((dir) => {
        const files = [...dir.files.values()];
        const sort_ = sort ?? { col: 'basename', asc: true };
        if (sort_.col === 'basename') {
          files.sort((a, b) => {
            const sortResult = a.basename.localeCompare(b.basename);
            return sort_.asc ? sortResult : -sortResult;
          });
        } else if (sort_.col === 'size') {
          files.sort((a, b) => {
            const sortResult = Number(a.size - b.size);
            return sort_.asc ? sortResult : -sortResult;
          });
        }
        return { ...dir, files, size: files.reduce((acc, file) => acc + file.size, BigInt(0)) };
      });

      const dirNameSortDirection = sort?.col === 'dirname' ? sort.asc : true;
      dirs.sort((a, b) => {
        const sortResult = a.dirname.localeCompare(b.dirname);
        return dirNameSortDirection ? sortResult : -sortResult;
      });

      return dirs.map((dir) => ({ ...user, ...dir }));
    });

    const compareUsername = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) =>
      a.username.localeCompare(b.username);
    const compareSlotsFree = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) => {
      const aSlotsFree = a.slotsFree ? 1 : 0;
      const bSlotsFree = b.slotsFree ? 1 : 0;
      return aSlotsFree - bSlotsFree;
    };
    const compareQueueLength = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) =>
      a.queueLength - b.queueLength;
    const compareAvgSpeed = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) =>
      a.avgSpeed - b.avgSpeed;

    const defaultSorts: Sort[] = [
      { col: 'slotsFree', asc: false },
      { col: 'queueLength', asc: true },
      { col: 'avgSpeed', asc: false },
      { col: 'username', asc: true }
    ];
    if (sort) {
      const sort_ = sort;
      const sortIndex = defaultSorts.findIndex((s) => s.col === sort_.col);
      if (sortIndex !== -1) {
        defaultSorts.splice(sortIndex, 1); // remove sort from defaultSorts
        defaultSorts.unshift(sort_); // add sort to beginning of defaultSorts
      }
    }

    const orderedCompare = (a: SortedSoulseekUserResults, b: SortedSoulseekUserResults) => {
      for (const sort_ of defaultSorts) {
        if (sort_.col === 'username') {
          const sortResult = compareUsername(a, b) * (sort_.asc ? 1 : -1);
          if (sortResult !== 0) return sortResult;
        } else if (sort_.col === 'slotsFree') {
          const sortResult = compareSlotsFree(a, b) * (sort_.asc ? 1 : -1);
          if (sortResult !== 0) return sortResult;
        } else if (sort_.col === 'queueLength') {
          const sortResult = compareQueueLength(a, b) * (sort_.asc ? 1 : -1);
          if (sortResult !== 0) return sortResult;
        } else if (sort_.col === 'avgSpeed') {
          const sortResult = compareAvgSpeed(a, b) * (sort_.asc ? 1 : -1);
          if (sortResult !== 0) return sortResult;
        }
      }
      return 0;
    };

    res.sort(orderedCompare);

    sortedResults = res;
  }

  const formatSpeed = (bytes: number) => {
    const gb = bytes / 1000 / 1000 / 1000;
    if (gb >= 1) return `${gb.toFixed(2)} Gb/s`;
    const mb = bytes / 1000 / 1000;
    if (mb >= 1) return `${mb.toFixed(2)} Mb/s`;
    const kb = bytes / 1000;
    if (kb >= 1) return `${kb.toFixed(2)} Kb/s`;
    return `${bytes} B/s`;
  };

  const formatSize = (bytes: bigint) => {
    const gb = Number(bytes) / 1000 / 1000 / 1000;
    if (gb >= 1) return `${gb.toFixed(2)} Gb`;
    const mb = Number(bytes) / 1000 / 1000;
    if (mb >= 1) return `${mb.toFixed(2)} Mb`;
    const kb = Number(bytes) / 1000;
    if (kb >= 1) return `${kb.toFixed(2)} Kb`;
    return `${bytes} B`;
  };
</script>

<div class="space-y-4 p-4">
  {#each sortedResults.slice(0, 10) as data (`${data.username}-${data.dirname}`)}
    <div class="max-w-4xl rounded bg-gray-900 p-4 text-gray-200">
      <div class="files-grid">
        <div class="contents">
          <div class="mb-2 text-lg">{data.dirname}</div>
          <div class="mb-2 text-right text-lg">{formatSize(data.size)}</div>
          <button class="mb-2 text-right text-lg hover:text-white">Download</button>
        </div>
        {#each data.files as file (file.basename)}
          <div class="contents text-gray-400">
            <div>{file.basename}</div>
            <div class="text-right">{formatSize(file.size)}</div>
            <button class="text-right hover:text-white">Download</button>
          </div>
        {/each}
      </div>
      <div class="mt-2 flex gap-4 text-sm">
        <div>{data.username}</div>
        <div>{formatSpeed(data.avgSpeed)}</div>
        <div>
          {#if data.slotsFree}
            Free Slots
          {:else}
            No Slots
          {/if}
        </div>
        <div>
          {#if data.queueLength === 0}
            Free Queue
          {:else}
            {data.queueLength} Queued
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>

<style lang="postcss">
  .files-grid {
    display: grid;
    grid-template-columns: auto 1fr auto;
    column-gap: theme(spacing.4);
  }
</style>
