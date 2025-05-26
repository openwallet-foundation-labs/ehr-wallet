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
                revert("Invalid password");
            }
        }
        
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
