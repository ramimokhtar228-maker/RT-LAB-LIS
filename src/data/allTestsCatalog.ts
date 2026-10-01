import { TestDefinition } from '../types/lab';
import { EXTENSIVE_TEST_CATALOG } from './extensiveTestsCatalog';
import { ADDITIONAL_TESTS } from './moreTests';
import { EVEN_MORE_TESTS } from './evenMoreTests';
import { INDIVIDUAL_SPECIAL_TESTS } from './individualSpecialTests';

// Merge all test definitions removing any accidental duplicate IDs
const rawAllTests = [
  ...EXTENSIVE_TEST_CATALOG,
  ...ADDITIONAL_TESTS,
  ...EVEN_MORE_TESTS,
  ...INDIVIDUAL_SPECIAL_TESTS,
];

const testMap = new Map<string, TestDefinition>();
rawAllTests.forEach((t) => {
  if (!testMap.has(t.id)) {
    testMap.set(t.id, t);
  }
});

export const ALL_TESTS_CATALOG: TestDefinition[] = Array.from(testMap.values());
