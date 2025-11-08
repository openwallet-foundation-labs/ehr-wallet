// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * FHIR-Enhanced Access Control Smart Contract
 *
 * Extends the base AccessControl contract to support FHIR resource references
 * and metadata, enabling interoperable health data sharing.
 */
contract FHIRAccessControl {
    struct FHIRAccessGrant {
        address owner;
        string ipfsCid; // CID of the encrypted FHIR Bundle on IPFS
        uint256 expiryTime; // Unix timestamp
        bytes32 passwordHash; // Optional password hash (keccak256)
        string fhirResourceType; // e.g., "Patient", "Bundle", "DocumentReference"
        string fhirResourceId; // FHIR resource ID
        string fhirVersion; // e.g., "4.0.1" (R4)
        string[] resourceTypes; // Types of resources in Bundle (e.g., ["Patient", "Observation"])
        bool exists;
    }

    mapping(bytes32 => FHIRAccessGrant) public accessGrants; // accessId => FHIRAccessGrant
    mapping(address => bytes32[]) public ownerGrants; // owner => accessIds
    mapping(string => bytes32[]) public resourceGrants; // fhirResourceId => accessIds

    event FHIRAccessCreated(
        bytes32 indexed accessId,
        address indexed owner,
        string ipfsCid,
        uint256 expiryTime,
        string fhirResourceType,
        string fhirResourceId
    );

    event FHIRAccessVerified(
        bytes32 indexed accessId,
        address indexed viewer,
        string fhirResourceType
    );

    event FHIRAccessDenied(
        bytes32 indexed accessId,
        address indexed viewer,
        string reason
    );

    event FHIRAccessRevoked(
        bytes32 indexed accessId,
        address indexed owner
    );

    modifier onlyValidGrant(bytes32 accessId) {
        require(accessGrants[accessId].exists, "Access grant does not exist");
        require(block.timestamp < accessGrants[accessId].expiryTime, "Access grant has expired");
        _;
    }

    modifier onlyOwner(bytes32 accessId) {
        require(accessGrants[accessId].owner == msg.sender, "Only owner can perform this action");
        _;
    }

    /**
     * Create a FHIR-based access grant
     *
     * @param _ipfsCid IPFS CID of the encrypted FHIR Bundle
     * @param _durationSeconds Duration in seconds
     * @param _passwordHash Optional password hash (use bytes32(0) for no password)
     * @param _fhirResourceType FHIR resource type (e.g., "Patient", "Bundle")
     * @param _fhirResourceId FHIR resource ID
     * @param _fhirVersion FHIR version (e.g., "4.0.1")
     * @param _resourceTypes Array of resource types included in Bundle
     * @return accessId Unique access identifier
     */
    function createFHIRAccess(
        string memory _ipfsCid,
        uint256 _durationSeconds,
        bytes32 _passwordHash,
        string memory _fhirResourceType,
        string memory _fhirResourceId,
        string memory _fhirVersion,
        string[] memory _resourceTypes
    ) external returns (bytes32 accessId) {
        require(_durationSeconds > 0, "Duration must be positive");
        require(bytes(_ipfsCid).length > 0, "IPFS CID cannot be empty");
        require(bytes(_fhirResourceType).length > 0, "FHIR resource type cannot be empty");

        accessId = keccak256(
            abi.encodePacked(
                msg.sender,
                _ipfsCid,
                block.timestamp,
                _durationSeconds,
                _fhirResourceId
            )
        );

        uint256 expiry = block.timestamp + _durationSeconds;

        accessGrants[accessId] = FHIRAccessGrant({
            owner: msg.sender,
            ipfsCid: _ipfsCid,
            expiryTime: expiry,
            passwordHash: _passwordHash,
            fhirResourceType: _fhirResourceType,
            fhirResourceId: _fhirResourceId,
            fhirVersion: _fhirVersion,
            resourceTypes: _resourceTypes,
            exists: true
        });

        // Track by owner
        ownerGrants[msg.sender].push(accessId);

        // Track by resource ID if provided
        if (bytes(_fhirResourceId).length > 0) {
            resourceGrants[_fhirResourceId].push(accessId);
        }

        emit FHIRAccessCreated(
            accessId,
            msg.sender,
            _ipfsCid,
            expiry,
            _fhirResourceType,
            _fhirResourceId
        );

        return accessId;
    }

    /**
     * Verify and retrieve FHIR access details
     *
     * @param _accessId Access identifier
     * @param _passwordInput Password attempt (empty string if no password)
     * @return ipfsCid IPFS CID
     * @return fhirResourceType FHIR resource type
     * @return fhirResourceId FHIR resource ID
     * @return resourceTypes Array of resource types
     */
    function verifyFHIRAccess(
        bytes32 _accessId,
        string memory _passwordInput
    ) external view onlyValidGrant(_accessId) returns (
        string memory ipfsCid,
        string memory fhirResourceType,
        string memory fhirResourceId,
        string[] memory resourceTypes
    ) {
        FHIRAccessGrant storage grant = accessGrants[_accessId];

        // Check password if set
        if (grant.passwordHash != bytes32(0)) {
            require(
                keccak256(abi.encodePacked(_passwordInput)) == grant.passwordHash,
                "Invalid password"
            );
        }

        return (
            grant.ipfsCid,
            grant.fhirResourceType,
            grant.fhirResourceId,
            grant.resourceTypes
        );
    }

    /**
     * Get full FHIR access grant details
     *
     * @param _accessId Access identifier
     */
    function getFHIRAccessDetails(bytes32 _accessId)
        external
        view
        returns (
            address owner,
            string memory ipfsCid,
            uint256 expiryTime,
            bool hasPassword,
            string memory fhirResourceType,
            string memory fhirResourceId,
            string memory fhirVersion,
            string[] memory resourceTypes,
            bool isExpired
        )
    {
        FHIRAccessGrant storage grant = accessGrants[_accessId];
        require(grant.exists, "Grant does not exist");

        return (
            grant.owner,
            grant.ipfsCid,
            grant.expiryTime,
            grant.passwordHash != bytes32(0),
            grant.fhirResourceType,
            grant.fhirResourceId,
            grant.fhirVersion,
            grant.resourceTypes,
            block.timestamp >= grant.expiryTime
        );
    }

    /**
     * Revoke an access grant before expiry
     * Only the owner can revoke their grants
     *
     * @param _accessId Access identifier to revoke
     */
    function revokeFHIRAccess(bytes32 _accessId)
        external
        onlyOwner(_accessId)
    {
        require(accessGrants[_accessId].exists, "Grant does not exist");

        // Set expiry to current time (effectively revoking access)
        accessGrants[_accessId].expiryTime = block.timestamp;

        emit FHIRAccessRevoked(_accessId, msg.sender);
    }

    /**
     * Get all access grants by owner
     *
     * @param _owner Owner address
     * @return Array of access IDs
     */
    function getGrantsByOwner(address _owner)
        external
        view
        returns (bytes32[] memory)
    {
        return ownerGrants[_owner];
    }

    /**
     * Get all access grants for a specific FHIR resource
     *
     * @param _fhirResourceId FHIR resource ID
     * @return Array of access IDs
     */
    function getGrantsByResourceId(string memory _fhirResourceId)
        external
        view
        returns (bytes32[] memory)
    {
        return resourceGrants[_fhirResourceId];
    }

    /**
     * Check if an access grant is still valid (not expired)
     *
     * @param _accessId Access identifier
     * @return bool True if valid, false otherwise
     */
    function isAccessValid(bytes32 _accessId)
        external
        view
        returns (bool)
    {
        if (!accessGrants[_accessId].exists) {
            return false;
        }
        return block.timestamp < accessGrants[_accessId].expiryTime;
    }

    /**
     * Get count of grants by owner
     *
     * @param _owner Owner address
     * @return count Number of grants
     */
    function getOwnerGrantCount(address _owner)
        external
        view
        returns (uint256 count)
    {
        return ownerGrants[_owner].length;
    }
}
