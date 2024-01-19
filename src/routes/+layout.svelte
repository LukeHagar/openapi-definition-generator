<script lang="ts">
	import { config, yamlOut } from '$lib/store';
	import { AppBar, AppShell, RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import '../app.postcss';
</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl">OpenAPI Definition Generator</strong>
			</svelte:fragment>

			<div class="flex flex-row flex-wrap justify-center gap-8">
				<label class="label text-sm">
					Convert null values to
					<select bind:value={$config.nullType} class="select" id="nullType">
						<option value="string" selected>String</option>
						<option value="number">Number</option>
						<option value="integer">Integer</option>
						<option value="boolean">Boolean</option>
					</select>
				</label>
				<div class="flex flex-col justify-center text-sm">
					<RadioGroup>
						<RadioItem padding="px-2" bind:group={$yamlOut} name="justify" value={true}>
							YAML
						</RadioItem>
						<RadioItem padding="px-2" bind:group={$yamlOut} name="justify" value={false}>
							JSON
						</RadioItem>
					</RadioGroup>
				</div>
				<div class="flex flex-col justify-center gap-2">
					<label class="flex items-center space-x-2 text-sm">
						<input
							bind:checked={$config.includeExamples}
							class="checkbox"
							type="checkbox"
							id="requestExamples"
						/>
						<p>Add values as examples</p>
					</label>
					<label class="flex items-center space-x-2 text-sm">
						<input
							bind:checked={$config.allowIntegers}
							class="checkbox"
							type="checkbox"
							id="allowInts"
						/>
						<p>Allow integer types</p>
					</label>
					<label class="flex items-center space-x-2 text-sm">
						<input
							bind:checked={$config.allowOneOf}
							class="checkbox"
							type="checkbox"
							id="allowOneOf"
						/>
						<p>Allow array oneOf</p>
					</label>
				</div>
			</div>

			<svelte:fragment slot="trail">
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
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
