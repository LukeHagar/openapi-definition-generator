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
	 * @description The type to use for null values
	 */
	nullType: 'number' | 'string' | 'integer' | 'boolean';

	/**
	 * @description Whether to allow oneOf for array items schema
	 */
	allowOneOf: boolean;
};

export type StringType = {
	type: 'string';
	format?: string;
	example?: string;
};

export type NumberType = {
	type: 'number';
	format?: string;
	example?: number;
};

export type ObjectType = {
	type: 'object';
	properties: { [key: string]: Output };
	additionalProperties?: boolean;
	example?: object;
};

export type ArrayType = {
	type: 'array';
	items?: Output | { oneOf: Output[] };
	example?: unknown[];
};

export type BooleanType = {
	type: 'boolean';
	format?: string;
	example?: boolean;
};

export type IntegerType = {
	type: 'integer';
	format?: string;
	example?: number;
};

export type NullableType = {
	type: string;
	format: 'nullable';
};

export type Output =
	| StringType
	| NumberType
	| ObjectType
	| ArrayType
	| BooleanType
	| IntegerType
	| NullableType;

export function convertNumber(number: number, config: Config) {
	let output: Output;
	if (Number.isInteger(number) && config.allowIntegers) {
		output = { type: 'integer' } as IntegerType;
		if (number < 2147483647 && number > -2147483647) {
			output.format = 'int32';
		} else if (Number.isSafeInteger(number)) {
			output.format = 'int64';
		} else {
			output.format = 'unsafe';
		}
	} else {
		output = { type: 'number' } as NumberType;
	}
	if (config.includeExamples) {
		output.example = number;
	}

	return output;
}

const isObject = (item: Output): item is ObjectType => {
	return item.type === 'object';
};

const isArray = (item: Output): item is ArrayType => {
	return item.type === 'array';
};

const isObjectOrArray = (item: Output): item is ObjectType | ArrayType => {
	return isObject(item) || isArray(item);
};

export function convertArray(array: unknown[], config: Config) {
	const output: ArrayType = { type: 'array' };
	const outputItems: Output[] = [];
	const items: unknown[] = [];
	const schema = new Map<string, unknown>();
	for (const entry of array) {
		if (config.allowOneOf) {
			const objectMap = convertObject(entry, config);
			if (
				!outputItems.some(
					(item) =>
						(item.type === objectMap.type &&
							!isObjectOrArray(item) &&
							!isObjectOrArray(objectMap) &&
							item.format === objectMap.format) ||
						(isObject(item) &&
							isObject(objectMap) &&
							Object.keys(item.properties).sort() === Object.keys(objectMap.properties).sort())
				)
			) {
				outputItems.push(objectMap);
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
		if (schema.size > 0) {
			output.items = convertObject(schema, config);
		} else {
			output.items = convertObject(items[0], config);
		}
	}

	return output;
}

export function convertString(string: string, config: Config) {
	const output: StringType = { type: 'string' };
	const regxDate = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
	const regxDateTime =
		/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]).([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?(Z|(\+|-)([0-1][0-9]|2[0-3]):[0-5][0-9])$/;

	if (regxDateTime.test(string)) {
		output.format = 'date-time';
	} else if (regxDate.test(string)) {
		output.format = 'date';
	}
	if (config.includeExamples) output.example = string;

	return output;
}

export function convertObject(input: unknown, config: Config) {
	if (input === null) {
		return { type: config.nullType, format: 'nullable' } as NullableType;
	} else if (typeof input === 'number') {
		return convertNumber(input, config);
	} else if (Array.isArray(input)) {
		return convertArray(input, config);
	} else if (typeof input === 'object') {
		const output: ObjectType = { type: 'object', properties: {} };
		const outputObj: Map<string, Output> = new Map();
		for (const prop in input) {
			// @ts-expect-error we are looping through self supplied object keys determined at runtime
			outputObj.set(prop, convertObject(input[prop], config));
		}
		output.properties = Object.fromEntries(outputObj.entries());
		return output;
	} else if (typeof input === 'string') {
		return convertString(input, config);
	} else if (typeof input === 'boolean') {
		const output: BooleanType = { type: 'boolean' };
		if (config.includeExamples) output.example = input;
		return output;
	} else if (input === undefined) {
		throw new Error(`undefined cannot be converted to OAS`);
	} else {
		throw new Error(`Invalid Swagger type for type ${typeof input}:${input}`);
	}
}

export function convertJSONToOAS(input: string, config: Config) {
	const obj = JSON.parse(input);
	return convertObject(obj, config);
}

export function convertObjectToOAS(input: object, config: Config) {
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
