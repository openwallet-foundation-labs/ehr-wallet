const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FHIRAccessControl", function () {
  let fhirAccessControl;
  let owner;
  let viewer;
  let thirdParty;
  const testCid = "QmTest1234567890ABCDEF";
  const oneDay = 86400; // 1 day in seconds
  const zeroHash = ethers.ZeroHash;

  beforeEach(async function () {
    // Deploy the contract before each test
    const FHIRAccessControlFactory = await ethers.getContractFactory("FHIRAccessControl");
    fhirAccessControl = await FHIRAccessControlFactory.deploy();
    await fhirAccessControl.waitForDeployment();

    // Get signers
    [owner, viewer, thirdParty] = await ethers.getSigners();
  });

  describe("createFHIRAccess", function () {
    it("should create access grant without password", async function () {
      const tx = await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        zeroHash,
        "Bundle",
        "Patient/123",
        "4.0.1",
        ["Patient", "Observation"]
      );
      const receipt = await tx.wait();

      // Find FHIRAccessCreated event
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );
      expect(event).to.not.be.undefined;

      const accessId = event.args[0];
      expect(accessId).to.not.equal(zeroHash);

      // Verify grant details
      const details = await fhirAccessControl.getFHIRAccessDetails(accessId);
      expect(details[0]).to.equal(owner.address); // owner
      expect(details[1]).to.equal(testCid); // ipfsCid
      expect(details[4]).to.equal("Bundle"); // fhirResourceType
      expect(details[5]).to.equal("Patient/123"); // fhirResourceId
      expect(details[6]).to.equal("4.0.1"); // fhirVersion
      expect(details[7]).to.have.lengthOf(2); // resourceTypes array length
      expect(details[8]).to.equal(false); // isExpired
    });

    it("should create access grant with password", async function () {
      const password = "securePassword123";
      const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));

      const tx = await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        passwordHash,
        "Patient",
        "Patient/456",
        "4.0.1",
        ["Patient"]
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );
      expect(event).to.not.be.undefined;

      const accessId = event.args[0];
      const details = await fhirAccessControl.getFHIRAccessDetails(accessId);
      expect(details[3]).to.equal(true); // hasPassword
    });

    it("should track grants by owner", async function () {
      await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        zeroHash,
        "Bundle",
        "Patient/123",
        "4.0.1",
        ["Patient"]
      );

      const ownerGrants = await fhirAccessControl.getGrantsByOwner(owner.address);
      expect(ownerGrants).to.have.lengthOf(1);
    });

    it("should track grants by resource ID", async function () {
      await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        zeroHash,
        "Bundle",
        "Patient/789",
        "4.0.1",
        ["Patient", "Observation"]
      );

      const resourceGrants = await fhirAccessControl.getGrantsByResourceId("Patient/789");
      expect(resourceGrants).to.have.lengthOf(1);
    });

    it("should revert with zero duration", async function () {
      await expect(
        fhirAccessControl.createFHIRAccess(
          testCid,
          0,
          zeroHash,
          "Bundle",
          "Patient/123",
          "4.0.1",
          ["Patient"]
        )
      ).to.be.revertedWith("Duration must be positive");
    });

    it("should revert with empty IPFS CID", async function () {
      await expect(
        fhirAccessControl.createFHIRAccess(
          "",
          oneDay,
          zeroHash,
          "Bundle",
          "Patient/123",
          "4.0.1",
          ["Patient"]
        )
      ).to.be.revertedWith("IPFS CID cannot be empty");
    });

    it("should revert with empty FHIR resource type", async function () {
      await expect(
        fhirAccessControl.createFHIRAccess(
          testCid,
          oneDay,
          zeroHash,
          "",
          "Patient/123",
          "4.0.1",
          ["Patient"]
        )
      ).to.be.revertedWith("FHIR resource type cannot be empty");
    });

    it("should emit FHIRAccessCreated event with correct parameters", async function () {
      const tx = await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        zeroHash,
        "DocumentReference",
        "DocumentReference/abc123",
        "4.0.1",
        ["DocumentReference"]
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );

      expect(event.args[1]).to.equal(owner.address);
      expect(event.args[2]).to.equal(testCid);
      expect(event.args[5]).to.equal("DocumentReference/abc123");
    });
  });

  describe("verifyFHIRAccess", function () {
    let accessId;

    beforeEach(async function () {
      const password = "testPassword";
      const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));

      const tx = await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        passwordHash,
        "Bundle",
        "Patient/test",
        "4.0.1",
        ["Patient", "Condition"]
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );
      accessId = event.args[0];
    });

    it("should verify access with correct password", async function () {
      const [ipfsCid, fhirType, fhirId, resourceTypes] =
        await fhirAccessControl.verifyFHIRAccess(accessId, "testPassword");

      expect(ipfsCid).to.equal(testCid);
      expect(fhirType).to.equal("Bundle");
      expect(fhirId).to.equal("Patient/test");
      expect(resourceTypes).to.have.lengthOf(2);
    });

    it("should verify access without password when none set", async function () {
      const noPasswordTx = await fhirAccessControl.createFHIRAccess(
        "QmNoPassword",
        oneDay,
        zeroHash,
        "Patient",
        "Patient/no-pass",
        "4.0.1",
        ["Patient"]
      );
      const noPassReceipt = await noPasswordTx.wait();
      const noPassEvent = noPassReceipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );
      const noPassId = noPassEvent.args[0];

      const [ipfsCid, fhirType, fhirId] =
        await fhirAccessControl.verifyFHIRAccess(noPassId, "");

      expect(ipfsCid).to.equal("QmNoPassword");
      expect(fhirType).to.equal("Patient");
    });

    it("should revert with incorrect password", async function () {
      await expect(
        fhirAccessControl.verifyFHIRAccess(accessId, "wrongPassword")
      ).to.be.revertedWith("Invalid password");
    });

    it("should revert when grant does not exist", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        fhirAccessControl.verifyFHIRAccess(fakeId, "")
      ).to.be.revertedWith("Access grant does not exist");
    });
  });

  describe("revokeFHIRAccess", function () {
    let accessId;

    beforeEach(async function () {
      const tx = await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        zeroHash,
        "Bundle",
        "Patient/revoke-test",
        "4.0.1",
        ["Patient"]
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );
      accessId = event.args[0];
    });

    it("should allow owner to revoke access", async function () {
      const tx = await fhirAccessControl.revokeFHIRAccess(accessId);
      await tx.wait();

      // Check that grant is now expired
      const details = await fhirAccessControl.getFHIRAccessDetails(accessId);
      expect(details[8]).to.equal(true); // isExpired

      // Verify that access is now denied
      await expect(
        fhirAccessControl.verifyFHIRAccess(accessId, "")
      ).to.be.revertedWith("Access grant has expired");
    });

    it("should emit FHIRAccessRevoked event", async function () {
      const tx = await fhirAccessControl.revokeFHIRAccess(accessId);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessRevoked"
      );
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(accessId);
      expect(event.args[1]).to.equal(owner.address);
    });

    it("should revert when non-owner tries to revoke", async function () {
      await expect(
        fhirAccessControl.connect(viewer).revokeFHIRAccess(accessId)
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("should revert when grant does not exist", async function () {
      // Note: The onlyOwner modifier checks ownership before existence check
      // For a non-existent grant, owner defaults to address(0)
      // Since msg.sender is not address(0), it fails with "Only owner" instead
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        fhirAccessControl.revokeFHIRAccess(fakeId)
      ).to.be.revertedWith("Only owner can perform this action");
    });
  });

  describe("getFHIRAccessDetails", function () {
    it("should return correct grant details", async function () {
      const password = "detailPassword";
      const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));

      const tx = await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        passwordHash,
        "Observation",
        "Observation/obs-001",
        "4.0.1",
        ["Observation", "Patient"]
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );
      const accessId = event.args[0];

      const details = await fhirAccessControl.getFHIRAccessDetails(accessId);

      expect(details[0]).to.equal(owner.address);
      expect(details[1]).to.equal(testCid);
      expect(details[2]).to.be.greaterThan(0); // expiryTime
      expect(details[3]).to.equal(true); // hasPassword
      expect(details[4]).to.equal("Observation");
      expect(details[5]).to.equal("Observation/obs-001");
      expect(details[6]).to.equal("4.0.1");
      expect(details[7]).to.include("Observation");
      expect(details[7]).to.include("Patient");
      expect(details[8]).to.equal(false); // isExpired
    });

    it("should revert for non-existent grant", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        fhirAccessControl.getFHIRAccessDetails(fakeId)
      ).to.be.revertedWith("Grant does not exist");
    });
  });

  describe("isAccessValid", function () {
    it("should return true for valid grant", async function () {
      const tx = await fhirAccessControl.createFHIRAccess(
        testCid,
        oneDay,
        zeroHash,
        "Patient",
        "Patient/valid",
        "4.0.1",
        ["Patient"]
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );
      const accessId = event.args[0];

      const isValid = await fhirAccessControl.isAccessValid(accessId);
      expect(isValid).to.equal(true);
    });

    it("should return false for expired grant", async function () {
      const tx = await fhirAccessControl.createFHIRAccess(
        testCid,
        1, // 1 second
        zeroHash,
        "Patient",
        "Patient/expired",
        "4.0.1",
        ["Patient"]
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );
      const accessId = event.args[0];

      // Advance time
      await ethers.provider.send("evm_increaseTime", [5]);
      await ethers.provider.send("evm_mine");

      const isValid = await fhirAccessControl.isAccessValid(accessId);
      expect(isValid).to.equal(false);
    });

    it("should return false for non-existent grant", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const isValid = await fhirAccessControl.isAccessValid(fakeId);
      expect(isValid).to.equal(false);
    });
  });

  describe("getOwnerGrantCount", function () {
    it("should return correct grant count", async function () {
      // Create multiple grants
      await fhirAccessControl.createFHIRAccess(
        "Qm1",
        oneDay,
        zeroHash,
        "Patient",
        "Patient/1",
        "4.0.1",
        ["Patient"]
      );
      await fhirAccessControl.createFHIRAccess(
        "Qm2",
        oneDay,
        zeroHash,
        "Patient",
        "Patient/2",
        "4.0.1",
        ["Patient"]
      );
      await fhirAccessControl.createFHIRAccess(
        "Qm3",
        oneDay,
        zeroHash,
        "Patient",
        "Patient/3",
        "4.0.1",
        ["Patient"]
      );

      const count = await fhirAccessControl.getOwnerGrantCount(owner.address);
      expect(count).to.equal(3);
    });

    it("should return 0 for address with no grants", async function () {
      const count = await fhirAccessControl.getOwnerGrantCount(viewer.address);
      expect(count).to.equal(0);
    });
  });

  describe("getGrantsByOwner", function () {
    it("should return all grants for an owner", async function () {
      const tx1 = await fhirAccessControl.createFHIRAccess(
        "QmFirst",
        oneDay,
        zeroHash,
        "Patient",
        "Patient/first",
        "4.0.1",
        ["Patient"]
      );
      const rx1 = await tx1.wait();
      const event1 = rx1.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );

      const tx2 = await fhirAccessControl.createFHIRAccess(
        "QmSecond",
        oneDay,
        zeroHash,
        "Bundle",
        "Patient/second",
        "4.0.1",
        ["Patient", "Observation"]
      );
      const rx2 = await tx2.wait();
      const event2 = rx2.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );

      const grants = await fhirAccessControl.getGrantsByOwner(owner.address);
      expect(grants).to.have.lengthOf(2);
      expect(grants[0]).to.equal(event1.args[0]);
      expect(grants[1]).to.equal(event2.args[0]);
    });
  });

  describe("getGrantsByResourceId", function () {
    it("should return all grants for a resource ID", async function () {
      const tx1 = await fhirAccessControl.createFHIRAccess(
        "QmRes1",
        oneDay,
        zeroHash,
        "Bundle",
        "SharedResource/123",
        "4.0.1",
        ["Patient"]
      );
      const rx1 = await tx1.wait();
      const event1 = rx1.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );

      const tx2 = await fhirAccessControl.createFHIRAccess(
        "QmRes2",
        oneDay,
        zeroHash,
        "Bundle",
        "SharedResource/123",
        "4.0.1",
        ["Observation"]
      );
      const rx2 = await tx2.wait();
      const event2 = rx2.logs.find(
        log => log.fragment && log.fragment.name === "FHIRAccessCreated"
      );

      const grants = await fhirAccessControl.getGrantsByResourceId("SharedResource/123");
      expect(grants).to.have.lengthOf(2);
    });

    it("should return empty array for non-existent resource ID", async function () {
      const grants = await fhirAccessControl.getGrantsByResourceId("NonExistent/999");
      expect(grants).to.have.lengthOf(0);
    });
  });
});
