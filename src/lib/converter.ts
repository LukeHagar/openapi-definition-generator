import type { OpenAPIV3_1 } from "openapi-types";

export const example = {
	numbersMock: {
		smallInt: -20,
		bigInt: 2147483647,
		// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
		unsafeInt: 9999999999999999,
		notInt: 12.2
	},
	stringsMock: {
		stringTest: 'Hello World',
		isoDate: '1999-12-31',
		isoDateTime: '1999-12-31T23:59:59Z'
	},
	objectsMock: {
		child: { child: true },
		childList: [{ child: true }],
		childMatrix: [[{ child: true }]],
		mixedObjectsArray: [
			[1, 2, { test: true }],
			{ child: true },
			{ son: true },
			{ son: true },
			{ offspring: true }
		],
		nullable: null
	},
	listMock: [1, 2, 3, 4, 5],
	matrixMock: [
		[1, 2],
		[3, 4]
	],
	mixedArrayMock: [1, 'two', 3, 'four']
};

export type Config = {
	/**
	 * @description Whether to allow integers in the OpenAPI Schema output
	 */
	allowIntegers: boolean;

	/**
	 * @description Whether to include examples in the OpenAPI Schema output
	 */
	includeExamples: boolean;

	/**
	 * @description Whether to allow oneOf for array items schema
	 */
	allowOneOf: boolean;
};

export function convertNumber(number: number, config: Config): OpenAPIV3_1.SchemaObject {
	let output: OpenAPIV3_1.SchemaObject;
	if (Number.isInteger(number) && config.allowIntegers) {
		output = { type: 'integer' }
		if (number < 2147483647 && number > -2147483647) {
			output.format = 'int32';
		} else if (Number.isSafeInteger(number)) {
			output.format = 'int64';
		} else {
			output.format = 'unsafe';
		}
	} else {
		output = { type: 'number' };
	}
	if (config.includeExamples) {
		output.examples = [number];
	}

	return output;
}

export function convertArray(array: unknown[], config: Config): OpenAPIV3_1.ArraySchemaObject {
	const output: OpenAPIV3_1.ArraySchemaObject = { type: 'array', items: {} };
	const outputItems: OpenAPIV3_1.SchemaObject[] = [];
	const items: unknown[] = [];
	const schema = new Map<string, unknown>();
	for (const entry of array) {
		if (config.allowOneOf) {
			const objectMap = convertObject(entry, config);
			const isDuplicate = outputItems.some(item => {
				const hasSameTypeAndFormat = item.type === objectMap.type && item.format === objectMap.format;
				const hasSameProperties = item.properties && objectMap.properties &&
					JSON.stringify(Object.keys(item.properties).sort()) === JSON.stringify(Object.keys(objectMap.properties).sort());
				return hasSameTypeAndFormat || hasSameProperties;
			});

			if (!isDuplicate) {
				outputItems.push(objectMap as OpenAPIV3_1.SchemaObject);
			}
		} else {
			items.push(entry);
			if (typeof entry === 'object' && !Array.isArray(entry) && entry !== null) {
				for (const prop in entry) {
					// @ts-expect-error we are looping through self supplied object keys determined at runtime
					schema.set(prop, entry[prop]);
				}
			}
		}
	}

	if (config.allowOneOf) {
		if (outputItems.length > 1) {
			output.items = { oneOf: [...outputItems] };
		} else {
			output.items = outputItems[0];
		}
	} else {
		console.log(schema, items);
		if (schema.size > 0) {
			output.items = convertObject(Object.fromEntries(schema.entries()), config);
		} else {
			output.items = convertObject(items[0], config);
		}
	}

	return output;
}

export function convertString(string: string, config: Config): OpenAPIV3_1.SchemaObject {
	const output: OpenAPIV3_1.SchemaObject = { type: 'string' };
	const regxDate = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
	const regxDateTime =
		/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]).([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?(Z|(\+|-)([0-1][0-9]|2[0-3]):[0-5][0-9])$/;

	if (regxDateTime.test(string)) {
		output.format = 'date-time';
	} else if (regxDate.test(string)) {
		output.format = 'date';
	}
	if (config.includeExamples) output.examples = [string];

	return output;
}

export function convertObject(input: unknown, config: Config): OpenAPIV3_1.SchemaObject {
	if (input === null) {
		return { type: ['null'] };
	} else if (typeof input === 'number') {
		return convertNumber(input, config);
	} else if (Array.isArray(input)) {
		return convertArray(input, config);
	} else if (typeof input === 'object') {
		const output: OpenAPIV3_1.SchemaObject = { type: 'object', properties: {} };
		const outputObj: Map<string, OpenAPIV3_1.SchemaObject> = new Map();
		for (const prop in input) {
			// @ts-expect-error we are looping through self supplied object keys determined at runtime
			outputObj.set(prop, convertObject(input[prop], config));
		}
		output.properties = Object.fromEntries(outputObj.entries());
		return output;
	} else if (typeof input === 'string') {
		return convertString(input, config);
	} else if (typeof input === 'boolean') {
		const output: OpenAPIV3_1.SchemaObject = { type: 'boolean' };
		if (config.includeExamples) output.examples = [input];
		return output;
	} else if (input === undefined) {
		throw new Error(`undefined cannot be converted to OAS`);
	} else {
		throw new Error(`Invalid Swagger type for type ${typeof input}:${input}`);
	}
}

export function convertJSONToOAS(input: string, config: Config): OpenAPIV3_1.SchemaObject {
	const obj = JSON.parse(input);
	return convertObject(obj, config);
}

export function convertObjectToOAS(input: object, config: Config): OpenAPIV3_1.SchemaObject {
	return convertObject(input, config);
}

const ignoredWords = [
	'the',
	'a',
	'an',
	'of',
	'to',
	'in',
	'for',
	'with',
	'on',
	'at',
	'from',
	'by',
	'and'
];

// convert Get Server Preferences to getServerPreferences
export function convertSummaryToOperationId(summary: string) {
	const firstChar = summary.slice(0, 1).toLowerCase();
	const rest = summary
		.split(' ')
		.map((entry) => entry.slice(0, 1).toUpperCase() + entry.slice(1))
		.filter((entry) => !ignoredWords.includes(entry.toLowerCase()))
		.join('')
		.slice(1);

	return firstChar + rest;
}
