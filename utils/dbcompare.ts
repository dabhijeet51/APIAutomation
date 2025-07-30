import { expect } from "playwright/test";

export function compareMappedFields(
  onpremData: Record<string, any>,
  awsData: Record<string, any>,
  fieldMapping: Record<string, [string, string]>
) {
  for (const [label, [onpremKey, awsKey]] of Object.entries(fieldMapping)) {
    const onpremValue = onpremData?.[onpremKey];
    const awsValue = awsData?.[awsKey];
    console.log(`Comparing ${label}: onprem DATA: (${onpremValue}) <=> aws DATA: (${awsValue})`);
    expect(onpremValue).toBeDefined();
    expect(awsValue).toBeDefined();
    expect.soft(onpremValue).toEqual(awsValue);
  }
}