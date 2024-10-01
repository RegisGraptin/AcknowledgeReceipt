// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AcknowledgeReceipt is ERC721URIStorage, AxelarExecutable {
    using StringToAddress for string;
    using AddressToString for address;

    uint256 private _nextTokenId;

    // Recipient of the given NFT
    mapping(uint256 => address) recipient;

    // Indicate if the recipient has reveal the NFT content
    mapping(uint256 => address) reveal;

    IAxelarGasService public immutable gasService;
    string public chainName; // FIXME :: name of the chain this contract is deployed to

    string secretSmartContractAddress;

    event RevealEvent(uint256 indexed tokenId, address indexed recipient);

    constructor(address gateway_, address gasReceiver_, string memory chainName_)
        ERC721("AcknowledgeReceipt", "ART")
        AxelarExecutable(gateway_)
    {
        
    }

    function createReceipt(address _recipient, string memory tokenURI, string calldata encryptedMessage)
        public
        payable
        returns (uint256)
    {
        // Mint a new NFT
        uint256 tokenId = _nextTokenId++;
        _mint(_recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        recipient[tokenId] = _recipient;

        // Store the encrypted part
        _send_axelar_msg(encryptedMessage);

        return tokenId;
    }

    function revealData(uint256 tokenId) public {
        require(msg.sender == _ownerOf(tokenId), "NOT_OWNER");

        reveal[tokenId] = msg.sender;

        // _send_axelar_msg("reveal"); // FIXME :: Need to send an action data for the given tokenId and address

        emit RevealEvent(tokenId, msg.sender);
    }
}
