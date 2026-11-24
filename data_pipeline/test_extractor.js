const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ResilientDataPipeline = require('./extractor');

async function runTestSuite() {
    console.log('[Test] Running Data Pipeline Verification Tests...');

    const pipeline = new ResilientDataPipeline();
    const records = await pipeline.extractSources();

    // Verification 1: Record count matches expectations
    assert.strictEqual(records.length, 10, 'Expected 10 extracted records');
    console.log('✓ Test 1: Record count verified (10/10)');

    // Verification 2: Data schema validation
    for (const r of records) {
        assert(r.id, 'Missing record ID');
        assert(r.company_name, 'Missing clean company name');
        assert(r.domain, 'Missing domain');
        assert(typeof r.employees === 'number', 'Employees must be numeric');
        assert(typeof r.automation_opportunity_score === 'number', 'Opportunity score must be numeric');
        assert(r.automation_opportunity_score >= 0 && r.automation_opportunity_score <= 100, 'Score must be 0-100');
    }
    console.log('✓ Test 2: Field types and schema contracts passed');

    // Verification 3: File export integrity
    const outputDir = path.join(__dirname, 'test_output');
    const { jsonPath, csvPath, count } = pipeline.exportData(outputDir);

    assert(fs.existsSync(jsonPath), 'JSON export file must exist');
    assert(fs.existsSync(csvPath), 'CSV export file must exist');

    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    assert.strictEqual(jsonContent.length, count, 'JSON record count matches');

    const csvContent = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
    assert.strictEqual(csvContent.length, count + 1, 'CSV line count matches header + records');

    console.log('✓ Test 3: Output files verified & validated');

    // Cleanup test folder
    fs.rmSync(outputDir, { recursive: true, force: true });
    console.log('\n[PASS] All Data Pipeline Tests Passed Successfully.');
}

runTestSuite().catch(err => {
    console.error('[FAIL] Test suite encountered an error:', err);
    process.exit(1);
});
