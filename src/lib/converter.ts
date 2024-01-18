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
};

export type Output = {
	type?: string;
	format?: string;
	items?: unknown[] | { oneOf: unknown[] };
	properties?: object;
	example?: unknown;
	additionalProperties?: boolean;
};

export function convertNumber(number: number, config: Config) {
	const output: Output = {};
	if (Number.isInteger(number) && config.allowIntegers) {
		if (number < 2147483647 && number > -2147483647) {
			output.type = 'integer';
			output.format = 'int32';
		} else if (Number.isSafeInteger(number)) {
			output.type = 'integer';
			output.format = 'int64';
		} else {
			output.type = 'integer';
			output.format = 'unsafe';
		}
	} else {
		output.type = 'number';
	}
	if (config.includeExamples) {
		output.example = number;
	}

	return output;
}

export function convertArray(array: any[], config: Config) {
	const output: Output = {};
	const items = [];

	for (const entry of array) {
		const map = convertObject(entry, config);

		if (items.filter((item) => item.type === map.type && item.format === map.format).length < 1) {
			items.push(map);
		}
	}

	output.type = 'array';
	if (items.length > 1) {
		output.items = { oneOf: [...items] };
	} else {
		output.items = [...items];
	}

	if (config.includeExamples) output.example = array;

	return output;
}

export function convertString(string: string, config: Config) {
	const output: Output = { type: 'string' };
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

export function convertObject(input: any, config: Config) {
	if (input === null) {
		const output: Output = {};
		output.type = config.nullType;
		output.format = 'nullable';
		return output;
	} else if (typeof input === 'number') {
		return convertNumber(input, config);
	} else if (Array.isArray(input)) {
		return convertArray(input, config);
	} else if (typeof input === 'object') {
		const output: Output = {};
		const outputObj: any = {};
		for (const prop in input) {
			outputObj[prop] = convertObject(input[prop], config);
		}
		output.type = 'object';
		output.properties = outputObj;
		return output;
	} else if (typeof input === 'string') {
		return convertString(input, config);
	} else if (typeof input === 'boolean') {
		const output: Output = {};
		output.type = 'boolean';
		output.example = input;
		return output;
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
