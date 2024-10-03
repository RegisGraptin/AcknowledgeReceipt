import ECDHEncryption from "./ECDHEncryption";


async function encryptPayload(publicKey: Uint8Array, data: any){

    // Use ECDH method, to generate local asymmetric keys.
    const ECDHKeys = ECDHEncryption.generate();

    const ECDHSharedKey = ECDHEncryption.generateSharedKey(
      publicKey,
      ECDHKeys.privateKey,
    );

    // Encrypt the JSON with the public ECDH shared key.
    const encryptedPayload = await ECDHEncryption.encrypt(
      data,
      ECDHSharedKey,
    );

    return {
      payload: Array.from(encryptedPayload),
      public_key: Array.from(ECDHKeys.publicKey),
    };
  }


  export default encryptPayload;