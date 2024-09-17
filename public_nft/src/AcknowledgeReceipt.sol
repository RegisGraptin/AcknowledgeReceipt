// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import {AxelarExecutable} from "axelar-gmp-sdk-solidity/executable/AxelarExecutable.sol";
import {IAxelarGasService} from "axelar-gmp-sdk-solidity/interfaces/IAxelarGasService.sol";
import {StringToAddress, AddressToString} from "axelar-gmp-sdk-solidity/libs/AddressString.sol";

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
        gasService = IAxelarGasService(gasReceiver_);
        chainName = chainName_;
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

    function _send_axelar_msg(string calldata message) internal {
        // 1. Generate GMP payload
        bytes memory executeMsgPayload = abi.encode(message);
        bytes memory payload = _encodePayloadToCosmWasm(executeMsgPayload);

        // 2. Pay for gas
        gasService.payNativeGasForContractCall{value: msg.value}(
            address(this), "secret", secretSmartContractAddress, payload, msg.sender
        );

        // 3. Make GMP call
        gateway.callContract("secret", secretSmartContractAddress, payload);
    }

    function _encodePayloadToCosmWasm(bytes memory executeMsgPayload) internal view returns (bytes memory) {
        // Schema
        //   bytes4  version number (0x00000001)
        //   bytes   ABI-encoded payload, indicating function name and arguments:
        //     string                   CosmWasm contract method name
        //     dynamic array of string  CosmWasm contract argument name array
        //     dynamic array of string  argument abi type array
        //     bytes                    abi encoded argument values

        // contract call arguments for ExecuteMsg::receive_message_evm{ source_chain, source_address, payload }
        bytes memory argValues = abi.encode(chainName, address(this).toString(), executeMsgPayload);

        string[] memory argumentNameArray = new string[](3);
        argumentNameArray[0] = "source_chain";
        argumentNameArray[1] = "source_address";
        argumentNameArray[2] = "payload";

        string[] memory abiTypeArray = new string[](3);
        abiTypeArray[0] = "string";
        abiTypeArray[1] = "string";
        abiTypeArray[2] = "bytes";

        bytes memory gmpPayload;
        gmpPayload = abi.encode("receive_message_evm", argumentNameArray, abiTypeArray, argValues);

        return abi.encodePacked(bytes4(0x00000001), gmpPayload);
    }
}
