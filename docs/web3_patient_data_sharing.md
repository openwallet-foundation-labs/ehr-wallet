# Implementing Web3-Enhanced Patient Data Sharing

This document outlines the steps to implement a patient data sharing feature using Next.js, MetaMask, IPFS, and Ethereum smart contracts, based on the UX flow described.

## 1. Introduction

The goal is to allow patients to securely share selected health data (e.g., medical history, lab results, images) with providers for a temporary duration. Patients will use MetaMask for authentication and data access will be managed via a smart contract, with data stored on IPFS.

## 2. Prerequisites

*   **Node.js and npm/yarn**: For Next.js development.
*   **MetaMask Browser Extension**: For wallet interaction.
*   **IPFS Node**: Access to an IPFS node (e.g., Infura, Pinata, or a local node).
*   **Ethereum Development Environment**: Hardhat or Truffle for smart contract development.
*   **Ethereum Testnet Account**: With test ETH for deploying and testing contracts (e.g., Sepolia, Goerli).
*   **Code Editor**: VS Code or similar.

## 3. High-Level Architecture

1.  **Patient (User)**: Interacts with the Next.js frontend via a browser with MetaMask.
2.  **Next.js Frontend**: Handles UI, user interactions, MetaMask connection, IPFS uploads, and smart contract calls via `ethers.js`.
3.  **MetaMask**: Manages patient's Ethereum wallet, signs transactions, and authenticates the user.
4.  **Next.js Backend (API Routes)**: Can assist with data preparation or proxying IPFS/blockchain interactions if needed, though most Web3 interactions can be client-side.
5.  **IPFS (InterPlanetary File System)**: Stores encrypted patient data.
6.  **Ethereum Smart Contract**: Deployed on the Ethereum blockchain. Manages access permissions, duration, and links to IPFS data CIDs.
7.  **Provider (Recipient)**: Accesses shared data via a unique link, potentially entering a password, which is verified by the smart contract.

## 4. Detailed Implementation Steps

### 4.1. Project Setup

1.  **Install Dependencies**:
    ```bash
    npm install ethers ipfs-http-client react-qr-code
    # or
    yarn add ethers ipfs-http-client react-qr-code
    ```
2.  **Environment Variables**: Create or update `.env.local`:
    ```env
    NEXT_PUBLIC_IPFS_NODE_URL=https://ipfs.infura.io:5001/api/v0 # Or your IPFS node
    NEXT_PUBLIC_IPFS_GATEWAY_URL=https://ipfs.infura.io/ipfs # Or your IPFS gateway
    NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS= # Address after deployment
    NEXTAUTH_SECRET= # Your NextAuth secret
    # Add Ethereum network RPC URL and private key for deployment if using Hardhat for scripts
    NEXT_PUBLIC_CHAIN_ID= # e.g., 11155111 for Sepolia
    ```

### 4.2. Smart Contract Development (`AccessControl.sol`)

Create a new Hardhat/Truffle project or add to existing setup.

**File: `contracts/AccessControl.sol`**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AccessControl {
    struct AccessGrant {
        address owner;
        string ipfsCid; // CID of the encrypted data on IPFS
        uint256 expiryTime; // Unix timestamp
        bytes32 passwordHash; // Optional password hash (keccak256)
        bool exists;
    }

    mapping(bytes32 => AccessGrant) public accessGrants; // accessId => AccessGrant

    event AccessCreated(bytes32 indexed accessId, address indexed owner, string ipfsCid, uint256 expiryTime);
    event AccessVerified(bytes32 indexed accessId, address indexed viewer);
    event AccessDenied(bytes32 indexed accessId, address indexed viewer, string reason);

    modifier onlyValidGrant(bytes32 accessId) {
        require(accessGrants[accessId].exists, "Access grant does not exist");
        require(block.timestamp < accessGrants[accessId].expiryTime, "Access grant has expired");
        _;
    }

    function createAccess(
        string memory _ipfsCid,
        uint256 _durationSeconds,
        bytes32 _passwordHash // Use bytes32(0) if no password
    ) external returns (bytes32 accessId) {
        require(_durationSeconds > 0, "Duration must be positive");

        accessId = keccak256(abi.encodePacked(msg.sender, _ipfsCid, block.timestamp, _durationSeconds));
        uint256 expiry = block.timestamp + _durationSeconds;

        accessGrants[accessId] = AccessGrant({
            owner: msg.sender,
            ipfsCid: _ipfsCid,
            expiryTime: expiry,
            passwordHash: _passwordHash,
            exists: true
        });

        emit AccessCreated(accessId, msg.sender, _ipfsCid, expiry);
        return accessId;
    }

    function verifyAccess(
        bytes32 _accessId,
        string memory _passwordInput // Empty string if no password attempt
    ) external view onlyValidGrant(_accessId) returns (string memory ipfsCid) {
        AccessGrant storage grantToVerify = accessGrants[_accessId];

        if (grantToVerify.passwordHash != bytes32(0)) { // Password is set
            if (keccak256(abi.encodePacked(_passwordInput)) != grantToVerify.passwordHash) {
                // emit AccessDenied(_accessId, msg.sender, "Invalid password"); // Cannot emit in view function, handle off-chain
                revert("Invalid password");
            }
        }
        // If passwordHash is bytes32(0), no password check is needed beyond this point.
        
        // emit AccessVerified(_accessId, msg.sender); // Cannot emit in view function, handle off-chain
        return grantToVerify.ipfsCid;
    }

    function getAccessGrantDetails(bytes32 _accessId) 
        external view 
        returns (address owner, string memory ipfsCid, uint256 expiryTime, bool hasPassword) 
    {
        AccessGrant storage grantDetails = accessGrants[_accessId];
        require(grantDetails.exists, "Grant does not exist");
        return (grantDetails.owner, grantDetails.ipfsCid, grantDetails.expiryTime, grantDetails.passwordHash != bytes32(0));
    }
}
```

*   **Deployment**: Use Hardhat/Truffle to compile and deploy this contract to a testnet. Update `NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS` with the deployed address.

### 4.3. MetaMask & NextAuth Integration

**Update `lib/auth.ts`**:

Refer to the previous example for adding a CredentialsProvider for Ethereum. The key is to:
1.  Have the client sign a message (e.g., a CSRF token or a static challenge string).
2.  Send the message and signature to the NextAuth `authorize` callback.
3.  Use `ethers.utils.verifyMessage(message, signature)` to recover the signer's address.
4.  Find or create a user in your `UserType` table linked to this Ethereum address. Assign a 'PATIENT' role.

**UI for "Connect Wallet"**: Add a button that triggers MetaMask connection:
```tsx
// components/ConnectWalletButton.tsx
import { useSDK } from '@metamask/sdk-react';
import { signIn } from 'next-auth/react';

const ConnectWalletButton = () => {
  const { sdk, connected, connecting, account } = useSDK();

  const connectAndSignIn = async () => {
    try {
      const accounts = await sdk?.connect();
      if (accounts && accounts[0]) {
        const address = accounts[0];
        // 1. Get a challenge (e.g., CSRF token or a message from backend)
        // For simplicity, using a static message here, but dynamic is better.
        const message = "Sign this message to log in to Radiant Flow Imaging Hub. Nonce: " + Date.now();
        
        // 2. Request signature
        const signature = await sdk?.signMessage(message);
        if (!signature) throw new Error('Signature failed');

        // 3. Sign in with NextAuth
        await signIn('ethereum', { // 'ethereum' is the id of your custom provider
          message,
          signature,
          address, // Send address for linking/creation
          redirect: false,
        });
        // Handle successful sign-in (e.g., router.push('/dashboard'))
      }
    } catch (err) {
      console.warn(`failed to connect..`, err);
    }
  };

  if (connected && account) {
    return <p>Connected: {account}</p>;
  }

  return (
    <button onClick={connectAndSignIn} disabled={connecting}>
      {connecting ? 'Connecting...' : 'Connect Wallet & Sign In'}
    </button>
  );
};

export default ConnectWalletButton;
```
Ensure your `_app.tsx` is wrapped with `MetaMaskProvider` from `@metamask/sdk-react`.

### 4.4. Patient Dashboard UI

Create a page (e.g., `pages/patient/dashboard.tsx`):
*   Display patient's name (fetched via session) and Ethereum address.
*   Prominent "Share Data" button.

### 4.5. Data Sharing Form UI

On clicking "Share Data", show a modal or new view:
*   **Data Types**: Checkboxes for "Medical History", "Labs", "Images". Fetch available data types/dates from your `db.ts` for the logged-in patient.
*   **Access Duration**: Slider or dropdown (e.g., 1 hour, 24 hours, 7 days).
*   **Password (Optional)**: Input field. Consider a password strength indicator.
*   **"Generate QR Code / Link" Button**: Enabled when selections are valid.

### 4.6. Backend Logic for Sharing (Client-Side with Ethers.js)

This logic will primarily run on the client-side when the user submits the sharing form.

```typescript
// In your sharing form component
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
// ... import your AccessControl.sol ABI

const handleGenerateShare = async (formData) => {
  // 1. Get patient data based on selected types
  // const dataToShare = await getPatientSpecificData(formData.dataTypes);
  const dataToShare = { info: "Sample patient data for labs and images", details: formData };

  // 2. Encrypt data (CRITICAL STEP)
  // This is a simplified example. Use robust encryption (e.g., AES-GCM).
  // The encryption key management is crucial. If password is set, derive key from it.
  // If no password, generate a random key and include it in the share link fragment (e.g., #key=...).
  const encryptionKey = formData.password || 'default-weak-key'; // Replace with proper key derivation/generation
  const encryptedData = JSON.stringify(dataToShare); // Replace with actual encryption: encrypt(JSON.stringify(dataToShare), encryptionKey);

  // 3. Upload to IPFS
  const ipfs = create({ url: process.env.NEXT_PUBLIC_IPFS_NODE_URL });
  const { cid } = await ipfs.add(encryptedData);
  const ipfsCid = cid.toString();

  // 4. Interact with Smart Contract
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(process.env.NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS, AccessControlABI, signer);

  const durationSeconds = parseInt(formData.duration); // e.g., 3600 for 1 hour
  let passwordHash = ethers.constants.HashZero;
  if (formData.password) {
    passwordHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(formData.password));
  }

  try {
    const tx = await contract.createAccess(ipfsCid, durationSeconds, passwordHash);
    const receipt = await tx.wait();
    
    // Find the AccessCreated event to get the accessId
    const event = receipt.events?.find(e => e.event === 'AccessCreated');
    const accessId = event?.args?.accessId;

    if (!accessId) throw new Error('Failed to get accessId from transaction.');

    // 5. Display QR Code / Link
    const shareUrl = `${window.location.origin}/view-shared?id=${accessId}`;
    // If encryptionKey was random and not password-derived, append it: shareUrl += `#key=${encryptionKey}`
    setQrCodeUrl(shareUrl);
    setExpiryTime(Date.now() + durationSeconds * 1000);
    // Show success message, QR code component

  } catch (error) {
    console.error('Error creating access grant:', error);
    // Show error to user
  }
};
```

### 4.7. QR Code Generation and Display

```tsx
// components/ShareDisplay.tsx
import QRCode from 'react-qr-code';

const ShareDisplay = ({ shareUrl, expiryTime }) => {
  if (!shareUrl) return null;

  return (
    <div>
      <h3>Share Ready!</h3>
      <QRCode value={shareUrl} size={200} />
      <p><a href={shareUrl} target="_blank" rel="noopener noreferrer">{shareUrl}</a></p>
      <button onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy Link</button>
      <p>Expires: {new Date(expiryTime).toLocaleString()}</p>
      <p>Note: QR code will expire in { /* calculate remaining time */ }.</p>
    </div>
  );
};
```

### 4.8. Provider/Doctor Viewing Flow

Create `pages/view-shared.tsx`:

```tsx
// pages/view-shared.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
// ... import AccessControlABI and IPFS client

const ViewSharedDataPage = () => {
  const router = useRouter();
  const { id: accessId } = router.query;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const fetchAccessDetails = async (currentAccessId) => {
    // No need for MetaMask for this initial check if contract allows public view of grant details
    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL); // Public RPC
    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS, AccessControlABI, provider);
    try {
      const details = await contract.getAccessGrantDetails(currentAccessId);
      setPasswordRequired(details.hasPassword);
      if (new Date(details.expiryTime * 1000) < new Date()) {
        setError('Link has expired.');
        return false;
      }
      return details.hasPassword;
    } catch (e) {
      setError('Invalid or expired link.');
      return false;
    }
  };

  const handleViewData = async () => {
    if (!accessId) return;
    setIsLoading(true);
    setError('');
    setData(null);

    try {
      // Provider doesn't need MetaMask to *call* view functions if they are public
      // However, for consistency or if view functions were restricted, they might connect.
      // For this flow, assume public RPC is fine for view functions.
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL);
      const contract = new ethers.Contract(process.env.NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS, AccessControlABI, provider);

      const ipfsCid = await contract.verifyAccess(accessId, passwordInput);
      
      // Fetch from IPFS
      const ipfsGatewayUrl = `${process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL}/${ipfsCid}`;
      const response = await fetch(ipfsGatewayUrl);
      if (!response.ok) throw new Error('Failed to fetch data from IPFS');
      const encryptedDataString = await response.text();
      
      // Decrypt data
      // Key management: if key was in URL fragment, retrieve it. If password-derived, use passwordInput.
      const encryptionKey = passwordInput || 'default-weak-key'; // Replace with actual key retrieval
      const decryptedData = JSON.parse(encryptedDataString); // Replace with actual decryption: decrypt(encryptedDataString, encryptionKey)
      setData(decryptedData);

      // Optional: Notify patient via backend if push notifications are set up
      // await fetch('/api/notify-access', { method: 'POST', body: JSON.stringify({ accessId }) });

    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to access data. Check password or link validity.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (accessId) {
      fetchAccessDetails(accessId as string);
    }
  }, [accessId]);

  if (!accessId) return <p>Loading or invalid link...</p>;
  if (error) return <p>Error: {error} <button onClick={() => router.push('/')}>Generate New Link?</button></p>;

  return (
    <div>
      <h1>View Shared Patient Data</h1>
      {passwordRequired && !data && (
        <div>
          <input 
            type="password" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            placeholder="Enter password"
          />
        </div>
      )}
      {!data && <button onClick={handleViewData} disabled={isLoading}>{isLoading ? 'Loading...' : 'View Data'}</button>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

export default ViewSharedDataPage;
```

### 4.9. Push Notifications (Optional)

*   Integrate a service like Firebase Cloud Messaging (FCM), OneSignal, or a custom WebSocket solution.
*   When data is successfully accessed by a provider (in `handleViewData`), the Next.js app (or an API route it calls) would trigger a push notification to the patient's registered device/browser.
*   This requires storing patient's device tokens securely and associating them with their user ID.

## 5. Security Considerations

*   **Data Encryption**: THIS IS CRITICAL. Data stored on IPFS **must** be strongly encrypted. The encryption key should be:
    *   Derived from the optional password set by the patient, OR
    *   A randomly generated key that is appended to the share link as a URL fragment (e.g., `.../view-shared?id=XYZ#key=ABCDEF`). The fragment is not sent to the server.
    *   Never store raw encryption keys in the smart contract or IPFS directly alongside unencrypted data.
*   **Smart Contract Audits**: Before deploying to mainnet, get your `AccessControl.sol` contract audited by a reputable firm.
*   **Input Validation**: Validate all inputs on frontend and (if applicable) backend.
*   **Gas Costs**: All transactions on Ethereum (like `createAccess`) cost gas. Inform users or design the system to minimize transactions.
*   **Password Security**: If passwords are used, ensure they are not trivial. Guide users to create strong passwords. Hashing is done on-chain, but input should be handled securely.
*   **IPFS Pinning**: Data on IPFS is only guaranteed to persist if it's pinned. Use a pinning service (Pinata, Infura) or run your own IPFS node that pins the CIDs.
*   **Replay Attacks**: The smart contract nonce mechanism (implicit in `block.timestamp` usage for `accessId` generation) helps, but ensure signed messages for login also have nonces.
*   **Error Handling**: Provide clear, user-friendly error messages for blockchain errors, IPFS issues, or decryption failures.

## 6. Testing

*   **Smart Contract**: Use Hardhat/Truffle for unit tests (e.g., access creation, verification with/without password, expiry).
*   **Frontend**: Test MetaMask connection, form submissions, QR generation, data display.
*   **Integration**: Full end-to-end tests on a testnet (e.g., patient shares, provider views).
*   **Security Testing**: Penetration testing, especially around encryption and access control.

## 7. Deployment

1.  **Smart Contract**: Deploy `AccessControl.sol` to your chosen Ethereum network (testnet first, then mainnet). Update the contract address in your `.env.local`.
2.  **Next.js Application**: Deploy to a platform like Vercel, Netlify, or your own server.

## 8. Future Enhancements

*   **Access Revocation**: Allow patients to revoke an active share via a smart contract function.
*   **Granular Data Selection**: More detailed checkboxes for specific data points within categories.
*   **Provider Identity Verification**: Share directly with a provider's Ethereum address.
*   **Audit Trails**: On-chain or off-chain logs of who accessed what and when (balancing privacy).
*   **Gasless Transactions**: Explore meta-transactions for patients if gas fees are a concern.

This detailed plan provides a roadmap. Each step, especially around security and smart contract development, requires careful attention and expertise.
