<script lang="ts">
	import { RadioGroup, RadioItem, clipboard } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	//@ts-ignore
	import { stringify } from 'yaml';
	let inJSON: any;
	let inputJSON = '';
	let outSwagger = '';

	let requestExamples: boolean = true;
	let noInt: boolean;
	let yamlOut: boolean = true;
	let tabCount: number;
	let indentator: string;
	let nullType: string;
	let parseErr: Error | null;
	let timeOut: any;

	const trigger = (evt: Event) => {
		clearTimeout(timeOut);
		timeOut = setTimeout(() => convert(), 100);
	};

	const convert = () => {
		localStorage.setItem('inputJSON', inputJSON);
		try {
			inJSON = JSON.parse(inputJSON);
			parseErr = null;
		} catch (e: any) {
			parseErr = e;
			return;
		}
		//For recursive functions to keep track of the tab spacing
		tabCount = 0;
		indentator = '\n';
		// ---- Begin definitions ----
		outSwagger = '{';
		changeIndentation(1);
		//For each object inside the JSON
		for (let obj in inJSON) {
			// ---- Begin schema scope ----
			outSwagger += indentator + '"' + obj + '": {';
			conversorSelection(inJSON[obj]);
			outSwagger += indentator + '},';
			// ---- End schema scope ----
		}
		//Remove last comma
		outSwagger = outSwagger.substring(0, outSwagger.length - 1);
		// ---- End definitions ----
		changeIndentation(tabCount - 1);
		outSwagger += indentator + '}';

		outSwagger = format(outSwagger);
	};

	function changeIndentation(count: number) {
		/* 
      Assign 'indentator' a string beginning with newline and followed by 'count' tabs
      Updates variable 'tabCount' with the number of tabs used
      Global variables updated: 
      -indentator 
      -tabCount
      */

		let i;
		if (count >= tabCount) {
			i = tabCount;
		} else {
			i = 0;
			indentator = '\n';
		}
		for (; i < count; i++) {
			indentator += '\t';
		}
		//Update tabCount
		tabCount = count;
	}

	function conversorSelection(obj: any) {
		/* 
      Selects which conversion method to call based on given obj
      Global variables updated: 
      -outSwagger
      */

		changeIndentation(tabCount + 1);
		if (typeof obj === 'number') {
			//attribute is a number
			convertNumber(obj);
		} else if (Object.prototype.toString.call(obj) === '[object Array]') {
			//attribute is an array
			convertArray(obj);
		} else if (typeof obj === 'object') {
			//attribute is an object
			convertObject(obj);
		} else if (typeof obj === 'string') {
			//attribute is a string
			convertString(obj);
		} else if (typeof obj === 'boolean') {
			// attribute is a boolean
			outSwagger += indentator + '"type": "boolean"';
		} else {
			// not a valid Swagger type
			alert('Property type "' + typeof obj + '" not valid for Swagger definitions');
		}
		changeIndentation(tabCount - 1);
	}

	function convertNumber(num: number) {
		/* 
      Append to 'outSwagger' string with Swagger schema attributes relative to given number
      Global variables updated: 
      -outSwagger
      */

		if (num % 1 === 0 && !noInt) {
			outSwagger += indentator + '"type": "integer",';
			if (num < 2147483647 && num > -2147483647) {
				outSwagger += indentator + '"format": "int32"';
			} else if (Number.isSafeInteger(num)) {
				outSwagger += indentator + '"format": "int64"';
			} else {
				outSwagger += indentator + '"format": "unsafe"';
			}
		} else {
			outSwagger += indentator + '"type": "number"';
		}
		if (requestExamples) {
			//Log example if checkbox is checked
			outSwagger += ',' + indentator + '"example": "' + num + '"';
		}
	}

	//date is ISO8601 format - https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14
	function convertString(str: string) {
		/* 
      Append to 'outSwagger' string with Swagger schema attributes relative to given string
      Global variables updated: 
      -outSwagger
      */

		let regxDate = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
			regxDateTime =
				/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]).([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?(Z|(\+|\-)([0-1][0-9]|2[0-3]):[0-5][0-9])$/;

		outSwagger += indentator + '"type": "string"';
		if (regxDateTime.test(str)) {
			outSwagger += ',';
			outSwagger += indentator + '"format": "date-time"';
		} else if (regxDate.test(str)) {
			outSwagger += ',';
			outSwagger += indentator + '"format": "date"';
		}
		if (requestExamples) {
			//Log example if checkbox is checked
			outSwagger += ',' + indentator + '"example": "' + str + '"';
		}
	}

	function convertArray(obj: any[]) {
		/* 
      Append to 'outSwagger' string with Swagger schema attributes relative to given array
      Global variables updated: 
      -outSwagger
      */
		let schema: any = {};
		let examples = new Set();
		for (const entry of obj) {
			for (const key of Object.keys(entry)) {
				if (!Object.keys(schema).includes(key)) {
					examples.add(entry);
					schema[key] = entry[key];
				}
			}
		}

		outSwagger += indentator + '"type": "array",';
		// ---- Begin items scope ----
		outSwagger += indentator + '"items": {';
		conversorSelection(schema);
		outSwagger += indentator + '}';
		// ---- End items scope ----
		// ---- Begin example scope ----
		if (requestExamples) {
			outSwagger += ',' + indentator + '"example": ' + JSON.stringify([...examples], null, '\t');
		}
	}

	function convertObject(obj: any) {
		/* 
      Append to 'outSwagger' string with Swagger schema attributes relative to given object
      Global variables updated: 
      -outSwagger
      */

		//Convert null attributes to given type
		if (obj === null) {
			outSwagger += indentator + '"type": "' + nullType + '",';
			outSwagger += indentator + '"format": "nullable"';
			return;
		}
		// ---- Begin properties scope ----
		outSwagger += indentator + '"type": "object",';
		outSwagger += indentator + '"properties": {';
		changeIndentation(tabCount + 1);
		//For each attribute inside that object
		for (var prop in obj) {
			// ---- Begin property type scope ----
			outSwagger += indentator + '"' + prop + '": {';
			conversorSelection(obj[prop]);
			outSwagger += indentator + '},';
			// ---- End property type scope ----
		}

		changeIndentation(tabCount - 1);
		if (Object.keys(obj).length > 0) {
			//At least 1 property inserted
			outSwagger = outSwagger.substring(0, outSwagger.length - 1); //Remove last comma
			outSwagger += indentator + '}';
		} else {
			// No property inserted
			outSwagger += ' }';
		}
	}

	function format(value: string) {
		/*
      Convert JSON to YAML if yaml checkbox is checked
      Global variables updated:
      NONE
      */

		value = JSON.stringify(JSON.parse(value), null, '\t');

		if (yamlOut) {
			return stringify(JSON.parse(value));
		} else {
			return value;
		}
	}

	onMount(() => {
		let tempJSON = localStorage.getItem('inputJSON');
		if (tempJSON !== null && tempJSON !== '') {
			inputJSON = tempJSON;
		} else {
			inputJSON = `{
	"numbersMock": {
		"smallInt": -20,
		"bigInt": 2147483647,
		"unsafeInt": 9999999999999999,
		"notInt": 12.2
	},
	"stringsMock": {
		"stringTest": "Hello World",
		"isoDate": "1999-12-31",
		"isoDateTime": "1999-12-31T23:59:59Z"
	},
	"objectsMock": {
		"child": {"child": true},
		"childList": [{"child": true}],
		"childMatrix": [[{"child": true}]],
		"nullable": null
	}
}`;
		}
		convert();
	});
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<title>Swagger Generator</title>
</svelte:head>

<p class="text-center p-8 relative">
	Add your JSON mock to generate Swagger definitions.
	{#if parseErr && inputJSON != ''}
		<aside class="alert variant-filled-warning absolute m-4 center inset-0">
			<h3>Error in JSON</h3>
			<p>{parseErr}</p>
		</aside>
	{/if}
</p>
<div class="flex flex-row justify-end p-2 gap-2" />
<div class="flex flex-row justify-between p-2 gap-2">
	<div class="grow">
		<textarea
			id="JSON"
			rows="35"
			cols="85"
			class="textarea"
			placeholder="Type your JSON"
			contenteditable
			on:input={trigger}
			on:paste
			bind:value={inputJSON}
		/>
	</div>
	<div class="grow relative">
		<textarea
			readonly
			id="Swagger"
			rows="35"
			cols="85"
			class="textarea"
			placeholder="Here is your Swagger"
			bind:value={outSwagger}
		/>
		<button class="btn variant-filled-primary absolute top-4 right-4" use:clipboard={outSwagger}>
			Copy
		</button>
	</div>
</div>
<div class="flex flex-row justify-center px-4 gap-8">
	<label class="label">
		Convert null values to
		<select bind:value={nullType} on:change={() => convert()} class="select" id="nullType">
			<option value="string" selected>String</option>
			<option value="number">Number</option>
			<option value="integer">Integer</option>
			<option value="boolean">Boolean</option>
		</select>
	</label>
	<div class="flex flex-col justify-center">
		<RadioGroup>
			<RadioItem bind:group={yamlOut} on:change={() => convert()} name="justify" value={true}>
				YAML
			</RadioItem>
			<RadioItem bind:group={yamlOut} on:change={() => convert()} name="justify" value={false}>
				JSON
			</RadioItem>
		</RadioGroup>
	</div>
	<div class="flex flex-col justify-center">
		<label class="flex items-center space-x-2">
			<input
				bind:checked={requestExamples}
				on:change={() => convert()}
				class="checkbox"
				type="checkbox"
				id="requestExamples"
			/>
			<p>Add values as examples</p>
		</label>
		<label class="flex items-center space-x-2">
			<input
				bind:checked={noInt}
				on:change={() => convert()}
				class="checkbox"
				type="checkbox"
				id="noInt"
			/>
			<p>Convert integer values to number</p>
		</label>
	</div>
</div>
<p class="text-center pt-4">
	Feel like collaborating? Clone the repository at <a
		target="_blank"
		href="https://github.com/LukeHagar/openapi-definition-generator">GitHub</a
	>
</p>
