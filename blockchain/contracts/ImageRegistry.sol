// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ImageRegistry {
    // Event to notify the world when a new image is added
    event ImageRegistered(string imageName, string imageHash, address owner);

    // Mapping: ImageName -> ImageHash
    mapping(string => string) private imageHashes;
    // Mapping: ImageName -> Owner Address (Who uploaded it)
    mapping(string => address) private imageOwners;

    // Function 1: Register an Image (Write to Blockchain)
    function registerImage(string memory _name, string memory _hash) public {
        // Check if image already exists
        require(bytes(imageHashes[_name]).length == 0, "Image already registered!");

        imageHashes[_name] = _hash;
        imageOwners[_name] = msg.sender; // msg.sender is the wallet calling this function

        emit ImageRegistered(_name, _hash, msg.sender);
    }

    // Function 2: Verify an Image (Read from Blockchain)
    function verifyImage(string memory _name) public view returns (string memory, address) {
        return (imageHashes[_name], imageOwners[_name]);
    }
}
