// src/types/global.d.ts o sa kasalukuyang preload declarations
export {};

declare global {
  interface Window {
    backendAPI: {
      kabisilya?: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<any>;
    };
  }
}