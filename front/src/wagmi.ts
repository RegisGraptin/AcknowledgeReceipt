import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  seiDevnet
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    seiDevnet,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [seiDevnet] : []),
  ],
  ssr: true,
});