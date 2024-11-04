export class EmailCache {
  private cache: Map<string, { value: any; timestamp: number }>;
  private expiryTime: number;

  constructor(expiryTime = 5 * 60 * 1000) { // Default 5 minutes
    this.cache = new Map();
    this.expiryTime = expiryTime;
  }

  set(key: string, value: any) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.expiryTime) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > this.expiryTime) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}
