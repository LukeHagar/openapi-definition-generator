<script lang="ts">
	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import { AppBar, AppShell, storeHighlightJs } from '@skeletonlabs/skeleton';

	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	import 'highlight.js/styles/github-dark.css';
	import '../app.postcss';

	import hljs from 'highlight.js/lib/core';

	// Import each language module you require
	import json from 'highlight.js/lib/languages/json';
	import yaml from 'highlight.js/lib/languages/yaml';

	// Register each imported language module
	hljs.registerLanguage('yaml', yaml);
	hljs.registerLanguage('json', json);

	storeHighlightJs.set(hljs);
</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl">OpenAPI Definition Generator</strong>
			</svelte:fragment>

			<svelte:fragment slot="trail">
				<div class="flex flex-row flex-wrap justify-between gap-4">
					<a
						class="btn btn-sm variant-ghost-surface"
						href="https://swagger.io/docs/specification/data-models/data-types/"
						target="_blank"
						rel="noreferrer"
					>
						OpenAPI Specification reference
					</a>
					<a
						class="btn btn-sm variant-ghost-surface"
						href="https://github.com/LukeHagar/openapi-definition-generator/edit/main/src/routes/%2Bpage.svelte"
						target="_blank"
						rel="noreferrer"
					>
						Fork this project
					</a>
				</div>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
