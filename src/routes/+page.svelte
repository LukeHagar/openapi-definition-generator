<script lang="ts">
	import {
		convertObjectToOAS,
		example,
		type Config,
		convertSummaryToOperationId
	} from '$lib/converter';
	import { sortByCode, status_codes } from '$lib/status';
	import { config, yamlOut } from '$lib/store';
	import { CodeBlock, InputChip, RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import { JSONEditor, isJSONContent, isTextContent, type Content } from 'svelte-jsoneditor';
	import { writable, type Writable } from 'svelte/store';
	import { stringify } from 'yaml';

	const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

	let outSwagger: string = '';
	let path: string = '';
	let method: string = methods[0];
	let summary: string = '';
	let description: string = '';
	let status: string = '200';
	let tags: string[] = ['things'];

	const content: Writable<Content> = writable({
		json: example
	});

	function format(value: object, yamlOut: boolean) {
		if (yamlOut) {
			return stringify(value, { aliasDuplicateObjects: false });
		} else {
			return JSON.stringify(value, null, 2);
		}
	}

	function run(
		content: Content,
		config: Config,
		yamlOut: boolean,
		method: string,
		status: string,
		path: string,
		summary: string,
		description: string,
		tags: string[]
	) {
		let outJsonContent = {};

		if (isTextContent(content) && content.text) {
			outJsonContent = convertObjectToOAS(JSON.parse(content.text), config);
		} else if (isJSONContent(content) && content.json) {
			outJsonContent = convertObjectToOAS(content.json, config);
		}

		outSwagger = format(
			{
				[path]: {
					[method.toLowerCase()]: {
						tags,
						summary,
						description,
						operationId: convertSummaryToOperationId(summary),
						responses: { [status]: { content: { 'application/json': { schema: outJsonContent } } } }
					}
				}
			},
			yamlOut
		);
	}

	$: run($content, $config, $yamlOut, method, status, path, summary, description, tags);
</script>

<div class="flex flex-row p-1 gap-1">
	<div class="grow max-w-[50%]">
		<div class="card overflow-hidden">
			<p class="text-center pt-2">Input your API call details here</p>
			<div class="flex flex-row gap-4 justify-center py-6">
				<div class="flex flex-col gap-2 max-w-md text-sm">
					<label class="label flex flex-col">
						<span>Path</span>
						<input
							type="text"
							class="input px-3 py-1 min-w-0"
							placeholder={`/get/the/thing`}
							bind:value={path}
						/>
					</label>

					<label class="label flex flex-col">
						<span>Summary</span>
						<input
							type="text"
							class="input px-3 py-1"
							placeholder={`Get a thing`}
							bind:value={summary}
						/>
					</label>

					<label class="label flex flex-col">
						<span>Description</span>
						<textarea
							class="textarea px-2 py-1 h-[92px]"
							placeholder="This endpoint gets a thing"
							bind:value={description}
						/>
					</label>

					<label class="label flex flex-col">
						<span>Status Code</span>
						<select class="select" bind:value={status}>
							<option value="default">
								Default - A catch-all identifier for any other status codes not defined in the map
							</option>
							{#each status_codes.sort(sortByCode) as code}
								<option value={code.code}>
									{code.code} - {code.description
										.replaceAll(`"`, ``)
										.slice(0, code.description.indexOf('~'))
										.replaceAll(`~`, ``)
										.trim()}
								</option>
							{/each}
						</select>
					</label>
				</div>
				<div class="flex flex-col flex-wrap justify-center gap-3 text-sm">
					<InputChip
						class="h-[92px] w-[214px] overflow-auto"
						bind:value={tags}
						name="tags"
						placeholder="Enter the operations tags..."
					/>

					<div class="flex flex-col justify-center">
						<label for="output-format" class="label flex flex-col">
							<span class="text-center">Output format</span>
							<RadioGroup>
								<RadioItem padding="px-2" bind:group={$yamlOut} name="justify" value={true}>
									YAML
								</RadioItem>
								<RadioItem padding="px-2" bind:group={$yamlOut} name="justify" value={false}>
									JSON
								</RadioItem>
							</RadioGroup>
						</label>
					</div>

					<div class="flex flex-col justify-center gap-1 py-1">
						<label class="flex items-center space-x-2">
							<input
								bind:checked={$config.includeExamples}
								class="checkbox"
								type="checkbox"
								id="requestExamples"
							/>
							<span>Add values as examples</span>
						</label>
						<label class="flex items-center space-x-2">
							<input
								bind:checked={$config.allowIntegers}
								class="checkbox"
								type="checkbox"
								id="allowInts"
							/>
							<span>Allow integer types</span>
						</label>
						<label class="flex items-center space-x-2">
							<input
								bind:checked={$config.allowOneOf}
								class="checkbox"
								type="checkbox"
								id="allowOneOf"
							/>
							<span>Allow array oneOf</span>
						</label>
					</div>
				</div>
			</div>
			<div class="jse-theme-dark h-[500px]">
				<JSONEditor
					onChange={() =>
						run($content, $config, $yamlOut, method, status, path, summary, description, tags)}
					bind:content={$content}
				/>
			</div>
		</div>
	</div>
	<div class="grow max-w-[50%]">
		<div class="card">
			<p class="text-center p-2">
				And here is that JSON Response formatted as a {$yamlOut === true ? 'YAML' : 'JSON'} OpenAPI Specification
			</p>
			<div class="">
				<CodeBlock lineNumbers code={outSwagger} language={$yamlOut === true ? 'YAML' : 'JSON'} />
			</div>
		</div>
	</div>
</div>

<style>
	/* load one or multiple themes */

	@import 'svelte-jsoneditor/themes/jse-theme-dark.css';
</style>
