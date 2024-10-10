import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
});

export default async function handler(req, res) {
    if (req.method === 'POST') {

        try {
            
            let data = await pinata.gateways.get(req.body);
            data.data.text()
                .then((text) => {
                    const json_data = JSON.parse(text);
                    res.status(200).json({ success: true, data: json_data });
                })
                .catch((error) => {
                    console.error('Error parsing Blob to JSON:', error);
                    res.status(500).json({ success: false, error: 'Error parsing data' });
                });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Error pinning data to IPFS' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}