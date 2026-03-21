import { uploadToIpfs, getFromIpfs, encryptData, decryptData } from '../lib/web3/ipfs';

async function testIpfs() {
  try {
    console.log('Testing IPFS with Helia implementation...');
    
    // Test data
    const testData = {
      message: 'Hello from Helia!',
      timestamp: new Date().toISOString(),
      testNumber: 42
    };
    
    console.log('Test data:', testData);
    
    // Test regular upload and retrieval
    console.log('\n--- Testing regular upload and retrieval ---');
    console.log('Uploading to IPFS...');
    const cid = await uploadToIpfs(testData);
    console.log('Uploaded successfully! CID:', cid);
    
    console.log('Retrieving from IPFS...');
    const retrievedData = await getFromIpfs(cid);
    console.log('Retrieved data:', retrievedData);
    
    // Verify data integrity
    console.log('\nVerifying data integrity...');
    const isEqual = JSON.stringify(testData) === JSON.stringify(retrievedData);
    console.log('Data integrity check:', isEqual ? 'PASSED ✅' : 'FAILED ❌');
    
    // Test encrypted upload and retrieval
    console.log('\n--- Testing encrypted upload and retrieval ---');
    const password = 'test-password-123';
    console.log('Encrypting data with password:', password);
    const encryptedData = await encryptData(testData, password);
    
    console.log('Uploading encrypted data to IPFS...');
    const encryptedCid = await uploadToIpfs(encryptedData);
    console.log('Uploaded encrypted data! CID:', encryptedCid);
    
    console.log('Retrieving encrypted data from IPFS...');
    const retrievedEncryptedData = await getFromIpfs(encryptedCid);
    console.log('Retrieved encrypted data');
    
    console.log('Decrypting data...');
    const decryptedData = await decryptData(retrievedEncryptedData, password);
    console.log('Decrypted data:', decryptedData);
    
    // Verify encrypted data integrity
    console.log('\nVerifying encrypted data integrity...');
    const isEncryptedEqual = JSON.stringify(testData) === JSON.stringify(decryptedData);
    console.log('Encrypted data integrity check:', isEncryptedEqual ? 'PASSED ✅' : 'FAILED ❌');
    
    console.log('\nIPFS test completed successfully!');
  } catch (error) {
    console.error('Error testing IPFS:', error);
  }
}

// Run the test
testIpfs();
