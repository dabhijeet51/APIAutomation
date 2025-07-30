import fs from 'fs';
import path from 'path';

const readJsonFile = (filePath: string): object => {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

const getValueByPath = (obj: any, path: string): any => {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

// Comparison function
export const compareMappedJsonFields = (
  file1Path: string,
  file2Path: string,
  outputPath: string
): string[] => {
  const json1 = readJsonFile(file1Path);
  const json2 = readJsonFile(file2Path);

  const fieldMappings: { json1Path: string; json2Path: string; alias: string }[] = [
    { json1Path: 'testItems[0].itemData.trackingInfo.id', json2Path: 'testItems[0].itemData.trackingInfo.id', alias: 'trackingRef' },
    { json1Path: 'testItems[0].itemData.trackingInfo.activityType', json2Path: 'testItems[0].itemData.trackingInfo.activityType', alias: 'activityType' },
    { json1Path: 'testItems[0].itemData.files[0].fileId', json2Path: 'testItems[0].itemData.files[0].fileId', alias: 'fileId' },
    { json1Path: 'testItems[0].itemData.files[0].inputType', json2Path: 'testItems[0].itemData.files[0].inputType', alias: 'inputType' },

    { json1Path: 'testMetaData.metaKeyA', json2Path: 'testMetaData.metaKeyB', alias: 'metaKey' },
    { json1Path: 'testMetaData.configKey', json2Path: 'testMetaData.configKey', alias: 'configKey' },
    { json1Path: 'testMetaData.fileRef', json2Path: 'testMetaData.fileCode', alias: 'fileCode' },
    { json1Path: 'testMetaData.inputType', json2Path: 'testMetaData.inputType', alias: 'inputTypeAlt' },
    { json1Path: 'testMetaData.statusInfo.code', json2Path: 'testMetaData.statusInfo.code', alias: 'resultCode' },
    { json1Path: 'testMetaData.statusInfo.message', json2Path: 'testMetaData.statusInfo.message', alias: 'resultMessage' }
  ];

  const differences: string[] = [];

  fieldMappings.forEach(({ json1Path, json2Path, alias }) => {
    const val1 = getValueByPath(json1, json1Path);
    const val2 = getValueByPath(json2, json2Path);

    if (val1 !== val2) {
      differences.push(
        `\nField: ${alias}\njsonfile1: ${val1}\njsonfile2: ${val2}\n`
      );
    }
  });

  const result =
    differences.length === 0
      ? 'All mapped fields are identical.\n'
      : 'Differences found:\n' + differences.join('');

  console.log(result);
  fs.writeFileSync(outputPath, result);

  return differences;
};

// CLI Entry
if (require.main === module) {
  const file1 = path.join(__dirname, 'file1.json');
  const file2 = path.join(__dirname, 'file2.json');
  const output = path.join(__dirname, 'jsondiffoutput.txt');
  compareMappedJsonFields(file1, file2, output);
}
