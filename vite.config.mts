import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/node_modules/**", "**/index.ts"],
    },
    globals: true,
    restoreMocks: true,
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): false | void {
      console.log('log in test: ', log);
      if (log === 'message from third party library' && type === 'stdout') {
        return false;
      }
    },
  },
  plugins: [tsconfigPaths()],
});