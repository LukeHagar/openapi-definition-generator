<script lang="ts">
	import { example, convertObjectToOAS, type Config } from '$lib/converter';
	import { clipboard } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { stringify } from 'yaml';
	import { JSONEditor } from 'svelte-jsoneditor';
	import { config, yamlOut } from '$lib/store';

	let content: { text?: string; json?: object } = {
		text: undefined, // can be used to pass a stringified JSON document instead
		json: example
	};
	let outSwagger: string = '';

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

	function run(
		content: { text?: string; json?: object | undefined },
		config: Config,
		yamlOut: boolean
	) {
		if (content.json !== undefined && content.text !== undefined) return;
		let data;
		if (content.text !== undefined) {
			data = JSON.parse(content.text);
		} else if (content.json !== undefined) {
			data = content.json;
		}

		outSwagger = format(convertObjectToOAS(data, config), yamlOut);
	}

	$: run(content, $config, $yamlOut);
</script>

<div class="flex flex-row justify-between px-2 gap-2 overflow-hidden">
	<div class="grow max-w-[50%]">
		<p class="text-center py-2">
			Input all of your JSON formatted Data, Typically API response bodies
		</p>
		<div class="card my-json-editor jse-theme-dark overflow-hidden h-[85vh]">
			<JSONEditor onChange={() => run(content, $config, $yamlOut)} bind:content />
		</div>
	</div>
	<div class="grow max-w-[50%]">
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
