const fs = require('fs');
const path = 'c:/dev/oshift/frontend/eslint_report.json';
const content = fs.readFileSync(path, 'utf16le');
const report = JSON.parse(content);
const issues = [];
for (const file of report) {
    for (const msg of file.messages) {
        if (['react/jsx-key', 'react-hooks/set-state-in-effect'].includes(msg.ruleId)) {
            issues.push(`${file.filePath}:${msg.line}:${msg.ruleId}`);
        }
    }
}
fs.writeFileSync('c:/dev/oshift/frontend/issues.txt', issues.join('\n'));
console.log('Done, wrote issues.txt');
