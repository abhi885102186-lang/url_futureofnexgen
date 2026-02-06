
// This file is only bundled in development and provides a simple in-memory storage
// to avoid localStorage quota issues during local development.

class DevStorage {
  private store: Map<string, string>;

  constructor() {
    this.store = new Map<string, string>();
    console.log(
      "Using in-memory devStorage for chat history. This will not persist across page reloads."
    );
  }

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const devStorage = new DevStorage();
