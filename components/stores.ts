import TestPlugin from 'main';
import { get, writable } from "svelte/store";
import { BaseScanner } from "../base_scanner";

export const plugin = writable<TestPlugin>();
export const getPlugin = () => get(plugin);
export const data = writable<BaseScanner>();
export const active_id = writable<string>();
