import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { purgeCss } from 'vite-plugin-tailwind-purgecss';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'sentry',
				project: 'oas-def-gen',
				url: 'https://sentry.plygrnd.org',
				authToken: process.env.SENTRY_AUTH_TOKEN
			}
		}),
		sveltekit(),
		purgeCss({
			safelist: {
				// any selectors that begin with "hljs-" will not be purged
				greedy: [/^hljs-/]
			}
		})
	]
});
