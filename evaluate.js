const fs = require('fs');
const { analyzeEmail } = require('./engine');

const dataset = JSON.parse(fs.readFileSync('./data/sample-emails.json', 'utf8'));
const threshold = 40;

let correct = 0;
let falsePositives = 0;
let falseNegatives = 0;

console.log(`Evaluating ${dataset.length} emails. Phishing threshold: ${threshold}\n`);

for (const item of dataset) {
  const result = analyzeEmail(item.email);
  const predicted = result.score >= threshold ? 'phishing' : 'legitimate';
  const passed = predicted === item.label;

  if (passed) correct += 1;
  else if (predicted === 'phishing') falsePositives += 1;
  else falseNegatives += 1;

  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${status} ${item.id}`);
  console.log(`  expected: ${item.label}`);
  console.log(`  predicted: ${predicted}`);
  console.log(`  score: ${result.score} (${result.verdict})`);
  console.log(`  signals: ${result.signals.map(signal => signal.label).join('; ') || 'none'}`);
  console.log('');
}

console.log('Summary');
console.log(`  accuracy: ${correct}/${dataset.length} (${Math.round((correct / dataset.length) * 100)}%)`);
console.log(`  false positives: ${falsePositives}`);
console.log(`  false negatives: ${falseNegatives}`);

if (correct !== dataset.length) {
  process.exitCode = 1;
}
