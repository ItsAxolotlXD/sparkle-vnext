const DATABASE_NAME = "sparkle-wallpaper-storage";
const STORE_NAME = "wallpapers";
const CUSTOM_WALLPAPER_KEY = "custom-wallpaper";

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open wallpaper storage"));
  });

export const saveCustomWallpaper = async (file: Blob): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(file, CUSTOM_WALLPAPER_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to save wallpaper"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Wallpaper save was cancelled"));
  });
  database.close();
};

export const loadCustomWallpaper = async (): Promise<Blob | null> => {
  const database = await openDatabase();
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(CUSTOM_WALLPAPER_KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error("Unable to load wallpaper"));
  });
  database.close();
  return result;
};
