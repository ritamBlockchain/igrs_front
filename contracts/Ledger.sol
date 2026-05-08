// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract Ledger {
    address public admin;
    bytes32[] private roots;
    mapping(bytes32 => bool) private rootExists;
    mapping(bytes32 => uint256) private rootTimestamp;

    event RootStored(bytes32 indexed root, uint256 timestamp, address indexed storedBy);
    event RootVerified(bytes32 indexed root, bool exists, address indexed verifiedBy);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    constructor(address _admin) {
        require(_admin != address(0), "Admin cannot be zero address");
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    /**
     * @dev Store a merkle root on-chain
     * @param root The merkle root to store
     * @return success message
     */
    function storeRoot(bytes32 root) public onlyAdmin returns (string memory) {
        require(root != bytes32(0), "Root cannot be zero");
        require(!rootExists[root], "Root already exists");
        
        roots.push(root);
        rootExists[root] = true;
        rootTimestamp[root] = block.timestamp;
        
        emit RootStored(root, block.timestamp, msg.sender);
        return "Root stored successfully";
    }

    /**
     * @dev Verify a merkle proof by reconstructing the root and checking if it exists
     * @param leaf The leaf hash to verify
     * @param proof Array of sibling hashes
     * @param indices Array of boolean indices (true = right sibling, false = left sibling)
     * @return boolean indicating if the reconstructed root exists on-chain
     */
    function verifyRoot(bytes32 leaf, bytes32[] memory proof, bool[] memory indices) public view returns (bool) {
        bytes32 computedRoot = leaf;
        
        require(proof.length == indices.length, "Proof and indices length mismatch");
        
        // Reconstruct the merkle root from the leaf and siblings
        for (uint256 i = 0; i < proof.length; i++) {
            if (indices[i]) {
                // Current node is the left sibling, proof[i] is the right sibling
                computedRoot = keccak256(abi.encodePacked(computedRoot, proof[i]));
            } else {
                // Current node is the right sibling, proof[i] is the left sibling
                computedRoot = keccak256(abi.encodePacked(proof[i], computedRoot));
            }
        }
        
        // Check if the reconstructed root exists in the stored roots
        return rootExists[computedRoot];
    }

    /**
     * @dev Get all stored merkle roots
     * @return array of all roots
     */
    function getAllRoots() public view returns (bytes32[] memory) {
        return roots;
    }

    /**
     * @dev Get the total count of stored roots
     * @return count of roots
     */
    function getRootCount() public view returns (uint256) {
        return roots.length;
    }

    /**
     * @dev Check if a root is stored and get its timestamp
     * @param root The merkle root to check
     * @return exists (bool) and timestamp (uint256)
     */
    function getRootStatus(bytes32 root) public view returns (bool exists, uint256 timestamp) {
        return (rootExists[root], rootTimestamp[root]);
    }

    /**
     * @dev Change the admin/owner of the contract
     * @param newAdmin The address of the new admin
     */
    function changeOwner(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "New admin cannot be zero address");
        require(newAdmin != admin, "New admin must be different");
        
        address oldAdmin = admin;
        admin = newAdmin;
        
        emit OwnerChanged(oldAdmin, newAdmin);
    }

    /**
     * @dev Get the current admin address
     * @return admin address
     */
    function getAdmin() public view returns (address) {
        return admin;
    }

    /**
     * @dev Delete a root (admin only)
     * @param root The merkle root to delete
     * @return success message
     */
    function deleteRoot(bytes32 root) public onlyAdmin returns (string memory) {
        require(rootExists[root], "Root does not exist");
        
        rootExists[root] = false;
        rootTimestamp[root] = 0;
        
        // Remove from array (not efficient for large arrays, but functional)
        for (uint256 i = 0; i < roots.length; i++) {
            if (roots[i] == root) {
                roots[i] = roots[roots.length - 1];
                roots.pop();
                break;
            }
        }
        
        return "Root deleted successfully";
    }
}
