export class BackgroundTaskTracker {
  private readonly tasks = new Set<Promise<unknown>>();

  track<T>(task: Promise<T>): void {
    this.tasks.add(task);

    void task.finally(() => {
      this.tasks.delete(task);
    });
  }

  async waitForAll(): Promise<void> {
    while (this.tasks.size > 0) {
      const currentTasks = Array.from(this.tasks);

      await Promise.allSettled(currentTasks);
    }
  }

  get activeCount(): number {
    return this.tasks.size;
  }
}

export const backgroundTaskTracker = new BackgroundTaskTracker();
