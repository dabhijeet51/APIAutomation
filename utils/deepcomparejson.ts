import fs from 'fs';
import path from 'path';

const readJsonFile = (filePath: string): object => {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

const deepCompare = (obj1: any, obj2: any, path: string = ''): string[] => {
  let differences: string[] = [];

  if (typeof obj1 === 'object' && typeof obj2 === 'object' && obj1 !== null && obj2 !== null) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      differences.push(`Different number of keys at ${path}`);
    }

    for (let key of keys1) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!keys2.includes(key)) {
        differences.push(`Key '${key}' missing in AWS JSON at ${path}`);
      } else {
        differences = differences.concat(deepCompare(obj1[key], obj2[key], currentPath));
      }
    }

    for (let key of keys2) {
      if (!keys1.includes(key)) {
        differences.push(`Key '${key}' missing in ONPREM JSON at ${path}`);
      }
    }

  } else {
    if (obj1 !== obj2) {
      differences.push(`Value mismatch at ONPREM JSON: ${path}:${JSON.stringify(obj1)} Not Equal to AWS JSON: ${path}:${JSON.stringify(obj2)}`);
    }
  }

  return differences;
};

/**
 * Main function to compare two JSON files.
 * @param file1 Path to the first JSON file.
 * @param file2 Path to the second JSON file.
 */
export const compareJsonFiles = (file1: string, file2: string, outputFile: string): string[] => {
  try {
    const json1 = readJsonFile(file1);
    const json2 = readJsonFile(file2);

    const differences = deepCompare(json1, json2);

    if (differences.length === 0) {
      console.log("Both JSON files are identical.");
    } else {
      console.log("Differences found between JSON files:");
      fs.writeFileSync(outputFile, 'Differences found between JSON files:\n');
      differences.forEach(diff => {
        console.log(diff);
        fs.appendFileSync(outputFile, diff + '\n');
      });
    }

    return differences;

  } catch (error) {
    console.error('Error reading or comparing JSON files:', error);
    fs.writeFileSync(outputFile, `Error: ${error.message}\n`);
    throw error;
  }
};

if (require.main === module) {
  const JsonFilePath1 = path.join(__dirname, 'file1.json');
  const JsonFilePath2 = path.join(__dirname, 'file2.json');
  const outputDiffPath = path.join(__dirname, 'jsondiffoutput.txt');
  compareJsonFiles(JsonFilePath1, JsonFilePath2, outputDiffPath);
}
