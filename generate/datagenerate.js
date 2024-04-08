import { createReadStream, writeFileSync } from 'fs';
import csv from 'csv-parser';

// Array to store CSV data
const data = [];

// File path
const filePath = './generate/data.csv';
const outputPath = './frontend/data.json';
const outputAlternative = './frontend/data.js';

// Read CSV file and parse its data
createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
        // Push each row to the data array
        data.push(row);
    })
    .on('end', () => {
        writeFileSync(outputPath, JSON.stringify(data, null, 4));
        writeFileSync(outputAlternative, `export default ${JSON.stringify(data, null, 4)}`);
    });
