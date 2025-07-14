const { execSync } = require('child_process');

const CONTRACT_ID = 'CBJVRBD5TCCM3BF22NDZPBSMU7VON5LQZBQOW3HMTN3PFDWD2TLW34XW';

// Test 1: Try to create a report without initialization
console.log('🧪 Testing smart contract...');

try {
  console.log('📝 Testing create_report function...');
  
  const createCommand = `stellar contract invoke \\
    --id ${CONTRACT_ID} \\
    --source alice \\
    --network testnet \\
    -- create_report \\
    --creator GDHKGVHM3YUNIE7TFGN46BAGETEZB34OQBMXWJLVPUW4ML6I5LGWVFAM \\
    --title "Test Emergency Report" \\
    --description "This is a test report for smart contract testing" \\
    --location "Test City, Test Country" \\
    --category "medical" \\
    --amount_needed 5000 \\
    --image_urls '[]'`;

  console.log('Running command:', createCommand);
  
  const result = execSync(createCommand, {
    cwd: '/Users/osx/Projects/Stellar/mvp02/Donaria/contracts-soroban/need-reports/contracts/need-reports',
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  console.log('✅ Create report result:', result.trim());

} catch (error) {
  console.error('❌ Create report failed:', error.message);
  
  // Test 2: Try initialization first
  console.log('🔄 Trying initialization first...');
  
  try {
    const initCommand = `stellar contract invoke \\
      --id ${CONTRACT_ID} \\
      --source alice \\
      --network testnet \\
      -- initialize \\
      --admins '["GDHKGVHM3YUNIE7TFGN46BAGETEZB34OQBMXWJLVPUW4ML6I5LGWVFAM"]'`;

    console.log('Running init command:', initCommand);
    
    const initResult = execSync(initCommand, {
      cwd: '/Users/osx/Projects/Stellar/mvp02/Donaria/contracts-soroban/need-reports/contracts/need-reports',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    console.log('✅ Initialization result:', initResult.trim());

  } catch (initError) {
    console.error('❌ Initialization failed:', initError.message);
  }
}

// Test 3: Try to get stats (should work even without initialization)
console.log('📊 Testing get_stats function...');

try {
  const statsCommand = `stellar contract invoke \\
    --id ${CONTRACT_ID} \\
    --source alice \\
    --network testnet \\
    -- get_stats`;

  const statsResult = execSync(statsCommand, {
    cwd: '/Users/osx/Projects/Stellar/mvp02/Donaria/contracts-soroban/need-reports/contracts/need-reports',
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  console.log('✅ Stats result:', statsResult.trim());

} catch (statsError) {
  console.error('❌ Get stats failed:', statsError.message);
}