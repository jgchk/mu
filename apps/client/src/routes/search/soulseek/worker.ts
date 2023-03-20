import type {
  FileSearchResponse,
  Sort,
  SortedSoulseekResults,
  SortedSoulseekUserResults,
  SoulseekDirectory,
  SoulseekResults
} from './types';
import type { ToWorkerMessage } from './worker-communication';

let results: FileSearchResponse[] = [];
let sort: Sort | undefined = undefined;
let responseTimeout: number | undefined;

const sorty = (data: FileSearchResponse[]) => {
  const results: SoulseekResults = new Map();
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

  const res: SortedSoulseekResults = [...results.values()].flatMap((user) => {
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

  return res;
};

onmessage = (e: MessageEvent<ToWorkerMessage>) => {
  const msg = e.data;
  switch (msg.kind) {
    case 'result': {
      results.push(msg.result);

      if (responseTimeout) {
        clearTimeout(responseTimeout);
      }
      responseTimeout = setTimeout(() => {
        postMessage({ kind: 'results', results: sorty([...results]) });
      }, 100) as unknown as number;

      break;
    }
    case 'sort': {
      sort = msg.sort;
      if (responseTimeout) {
        clearTimeout(responseTimeout);
      }
      postMessage({ kind: 'results', results: sorty([...results]) });
      break;
    }
    case 'reset': {
      results = [];
      if (responseTimeout) {
        clearTimeout(responseTimeout);
      }
      postMessage({ kind: 'results', results });
      break;
    }
  }
};
