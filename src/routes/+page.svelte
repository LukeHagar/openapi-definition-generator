<script lang="ts">
	import { example, convertObjectToOAS } from '$lib/converter';
	import { RadioGroup, RadioItem, clipboard } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { stringify } from 'yaml';
	import { JSONEditor } from 'svelte-jsoneditor';
	import { config, yamlOut } from '$lib/store';

	let parseErr: Error | null | undefined;

	let content: { text?: string | undefined; json: object } = {
		text: undefined, // can be used to pass a stringified JSON document instead
		json: example
	};

	onMount(() => {
		let tempJSON = localStorage.getItem('inputJSON');
		if (tempJSON !== null && tempJSON !== '') {
			content.json = JSON.parse(tempJSON);
		} else {
			content.json = example;
		}
	});

	function format(value: object, yamlOut: boolean) {
		if (yamlOut) {
			return stringify(value, { aliasDuplicateObjects: false });
		} else {
			return JSON.stringify(value, null, '\t');
		}
	}

	$: outSwagger = format(convertObjectToOAS(content.json, $config), $yamlOut);
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<title>OpenAPI Definition Generator</title>
	<!-- HTML Meta Tags -->

	<meta
		name="description"
		content="Convert your JSON formatted responses from API calls into OpenAPI Definitions at the click of a button"
	/>

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content="https://openapi-definition-generator.vercel.app" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="OpenAPI Definition Generator" />
	<meta
		property="og:description"
		content="Convert your JSON formatted responses from API calls into OpenAPI Definitions at the click of a button"
	/>
	<meta
		property="og:image"
		content="https://opengraph.b-cdn.net/production/documents/f5773de6-c2f8-4648-9ee4-04c4281397da.jpg?token=LwnXmXIbjqROq3UJT3v7pOSz6nZsh7RoT6UumBC-58c&height=630&width=1200&expires=33241429487"
	/>

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="openapi-definition-generator.vercel.app" />
	<meta property="twitter:url" content="https://openapi-definition-generator.vercel.app" />
	<meta name="twitter:title" content="OpenAPI Definition Generator" />
	<meta
		name="twitter:description"
		content="Convert your JSON formatted responses from API calls into OpenAPI Definitions at the click of a button"
	/>
	<meta
		name="twitter:image"
		content="https://opengraph.b-cdn.net/production/documents/f5773de6-c2f8-4648-9ee4-04c4281397da.jpg?token=LwnXmXIbjqROq3UJT3v7pOSz6nZsh7RoT6UumBC-58c&height=630&width=1200&expires=33241429487"
	/>

	<!-- Meta Tags Generated via https://www.opengraph.xyz -->
</svelte:head>

<!-- <p class="text-center relative">
	{#if parseErr}
		<aside class="p-8 alert variant-filled-warning absolute m-4 center inset-0">
			<h3>Error in JSON</h3>
			<p>{parseErr}</p>
		</aside>
	{/if}
</p> -->

<div class="flex flex-row flex-wrap justify-between px-2 gap-2 overflow-hidden">
	<div class="grow">
		<p class="text-center py-2">
			Input all of your JSON formatted Data, Typically API response bodies
		</p>
		<div class="card my-json-editor jse-theme-dark overflow-hidden h-[85vh]">
			<JSONEditor bind:content />
		</div>
	</div>
	<div class="grow">
		<p class="text-center py-2">
			And here is that JSON Response formatted as a {$yamlOut === true ? 'YAML' : 'JSON'} OpenAPI Specification
		</p>
		<div class="card relative h-[85vh]">
			<textarea
				readonly
				id="Swagger"
				class="textarea p-4 h-full"
				placeholder="Here is your Swagger"
				bind:value={outSwagger}
			/>
			<button class="btn variant-filled-primary absolute top-4 right-4" use:clipboard={outSwagger}>
				Copy
			</button>
		</div>
	</div>
</div>

<style>
	/* load one or multiple themes */
	@import 'svelte-jsoneditor/themes/jse-theme-dark.css';
</style>
