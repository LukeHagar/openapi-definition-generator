import type { Writable } from 'svelte/store';
import type { Config } from './converter';
import { localStorageStore } from '@skeletonlabs/skeleton';

const localConfig: Config = {
	allowIntegers: true,
	includeExamples: true,
	nullType: 'string'
};

export const config: Writable<Config> = localStorageStore('config', localConfig);
export const yamlOut: Writable<boolean> = localStorageStore('yaml', true);
