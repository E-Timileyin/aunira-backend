/**
 * esbuild production bundler. Bundles the app entrypoints, copies the
 * migration files into dist so app/migrate.ts can find them in prod, and
 * writes dist/package.json so the output stays ESM for Node.
 */
import { rm, cp, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";

const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf-8"));

const externals = [
	...Object.keys(pkg.dependencies || {}),
	...Object.keys(pkg.devDependencies || {}),
];

const entries = {
	server: "app/server.ts",
	migrate: "app/migrate.ts",
};

await rm("dist", { recursive: true, force: true });

await Promise.all(
	Object.entries(entries).map(([name, entry]) =>
		esbuild.build({
			entryPoints: [entry],
			outfile: `dist/${name}.js`,
			bundle: true,
			platform: "node",
			target: "node24",
			format: "esm",
			sourcemap: true,
			external: externals,
			alias: {
				"@": path.resolve("src"),
			},
		}),
	),
);

// Migration SQL is only copied, never bundled.
if (existsSync("src/db/migrations")) {
	await cp("src/db/migrations", "dist/migrations", { recursive: true });
}

await writeFile("dist/package.json", JSON.stringify({ type: "module" }, null, 2));

console.log("✓ Build complete: dist/server.js, dist/migrate.js, dist/migrations/");