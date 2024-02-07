import { writable, type Writable } from 'svelte/store';
import type { Config } from './converter';

const localConfig: Config = {
	allowIntegers: true,
	includeExamples: true,
	nullType: 'string',
	allowOneOf: false
};

export const config: Writable<Config> = writable(localConfig);
export const yamlOut: Writable<boolean> = writable(true);
