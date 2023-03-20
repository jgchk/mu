import type { MetadataTask } from './queue';
import { q } from './queue';

export const queueDownload = (dl: MetadataTask['input']) => {
  void q.push({ task: 'metadata', input: dl });
};

process.on('SIGTERM', () => {
  console.log('SIGTERM');
  q.kill();
});
