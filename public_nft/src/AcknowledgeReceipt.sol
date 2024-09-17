// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";

contract AcknowledgeReceipt is ERC721URIStorage {
    uint256 private _nextTokenId;

    // Recipient of the given NFT
    mapping (uint256 => address) recipient;

    // Indicate if the recipient has reveal the NFT content
    mapping (uint256 => address) reveal;

    event RevealEvent (uint256 indexed tokenId, address indexed recipient);

    constructor() ERC721("AcknowledgeReceipt", "ART") {}

    function createReceipt(
        address player, 
        string memory tokenURI
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(player, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    function revealData(uint256 tokenId) public {
        require(msg.sender == _ownerOf(tokenId), "NOT_OWNER");

        reveal[tokenId] = msg.sender;

        emit RevealEvent(tokenId, msg.sender);
    }
}
