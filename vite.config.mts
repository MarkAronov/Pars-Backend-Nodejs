import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig(() => {
	return {
		test: {
			setupFiles: "./__tests__/setup.ts",
			isolate: true,
			environment: "node",
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},
	};
});
