export type LoadTask = {
  label: string;
  weight: number;
  run: () => Promise<void>;
};

export async function runDocumentLoad(
  tasks: LoadTask[],
  onProgress: (pct: number, label: string) => void,
  minDurationMs = 2600,
) {
  const start = performance.now();
  let done = 0;

  for (const task of tasks) {
    onProgress(Math.min(done, 100), task.label);
    await task.run();
    done += task.weight;
    onProgress(Math.min(done, 100), task.label);
  }

  const elapsed = performance.now() - start;
  const remaining = Math.max(0, minDurationMs - elapsed);

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
