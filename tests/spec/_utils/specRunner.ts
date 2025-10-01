/**
 * Spec Runner Utility
 * 
 * Loads spec nodes from spec/current.json and runs implementations
 * against their fixture inputs, asserting equality with expected outputs.
 */

import { expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Load spec dynamically to avoid TS import issues
const specPath = path.join(__dirname, '../../../spec/current.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

/**
 * Load a spec node by ID from current.json
 */
export function loadSpecNode(id: string) {
  const specs = (spec as Record<string, unknown>).specs;
  if (!specs) {
    throw new Error('spec/current.json does not have a "specs" object');
  }
  
  const node = specs[id];
  if (!node) {
    throw new Error(`Spec node not found: ${id}`);
  }
  
  return node;
}

/**
 * Run an implementation against a spec fixture case
 * 
 * @param config.nodeId - Spec node ID (e.g., "processing.toGridItems")
 * @param config.caseName - Fixture case name (e.g., "weekday_batch")
 * @param config.impl - Implementation function to test
 */
export async function runFixture<TIn, TOut>(config: {
  nodeId: string;
  caseName: string;
  impl: (_input: TIn) => TOut | Promise<TOut>;
}): Promise<void> {
  const node = loadSpecNode(config.nodeId);
  
  // Load fixtures
  if (!node.fixtures || !node.fixtures.inputs || !node.fixtures.expectations) {
    throw new Error(`Spec node ${config.nodeId} does not have fixtures.inputs or fixtures.expectations`);
  }
  
  const fixtureInput = node.fixtures.inputs[config.caseName] as TIn;
  const expected = node.fixtures.expectations[config.caseName] as TOut;
  
  if (fixtureInput === undefined) {
    throw new Error(`Fixture input not found: ${config.nodeId}.fixtures.inputs.${config.caseName}`);
  }
  
  if (expected === undefined) {
    throw new Error(`Fixture expectation not found: ${config.nodeId}.fixtures.expectations.${config.caseName}`);
  }
  
  // Run implementation (support both sync and async)
  const actual = await Promise.resolve(config.impl(fixtureInput));
  
  // Assert equality
  expect(actual).toEqual(expected);
}

