import axios from 'axios';
import QRCode from 'qrcode';
import logger from '../utils/logger';

interface CryptoWallet {
  currency: 'BTC' | 'ETH' | 'USDT';
  address: string;
  network?: string;
}

interface CryptoPaymentDetails {
  btc: { address: string; qrCode: string };
  eth: { address: string; qrCode: string };
  usdt: { address: string; qrCode: string; network: string };
  amount: number;
  amountUSD: number;
  rates: {
    btc: number;
    eth: number;
    usdt: number;
  };
}

interface BlockchainTransaction {
  hash: string;
  confirmations: number;
  amount: number;
  timestamp: number;
}

class DirectCryptoService {
  private wallets: {
    BTC: string;
    ETH: string;
    USDT: string;
  };

  constructor() {
    this.wallets = {
      BTC: process.env.CRYPTO_BTC_ADDRESS || '',
      ETH: process.env.CRYPTO_ETH_ADDRESS || '',
      USDT: process.env.CRYPTO_USDT_ADDRESS || '', // ERC-20 USDT on Ethereum
    };
  }

  /**
   * Generate QR code for crypto address
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCode;
    } catch (error: any) {
      logger.error('Failed to generate QR code:', error.message);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Get current crypto prices in USD
   */
  async getCryptoPrices(): Promise<{ btc: number; eth: number; usdt: number }> {
    try {
      // Using CoinGecko free API
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'bitcoin,ethereum,tether',
            vs_currencies: 'usd',
          },
        }
      );

      return {
        btc: response.data.bitcoin.usd,
        eth: response.data.ethereum.usd,
        usdt: response.data.tether.usd,
      };
    } catch (error: any) {
      logger.error('Failed to get crypto prices:', error.message);
      // Fallback to approximate values
      return {
        btc: 50000,
        eth: 3000,
        usdt: 1,
      };
    }
  }

  /**
   * Create payment details with QR codes
   */
  async createPaymentDetails(amountUSD: number): Promise<CryptoPaymentDetails> {
    try {
      const rates = await this.getCryptoPrices();

      // Calculate crypto amounts
      const btcAmount = amountUSD / rates.btc;
      const ethAmount = amountUSD / rates.eth;
      const usdtAmount = amountUSD / rates.usdt;

      // Generate QR codes for each cryptocurrency
      const btcQR = await this.generateQRCode(`bitcoin:${this.wallets.BTC}?amount=${btcAmount.toFixed(8)}`);
      const ethQR = await this.generateQRCode(`ethereum:${this.wallets.ETH}?value=${ethAmount.toFixed(18)}`);
      const usdtQR = await this.generateQRCode(`ethereum:${this.wallets.USDT}?value=${usdtAmount.toFixed(6)}`);

      return {
        btc: {
          address: this.wallets.BTC,
          qrCode: btcQR,
        },
        eth: {
          address: this.wallets.ETH,
          qrCode: ethQR,
        },
        usdt: {
          address: this.wallets.USDT,
          qrCode: usdtQR,
          network: 'ERC-20 (Ethereum)',
        },
        amount: amountUSD,
        amountUSD,
        rates: {
          btc: parseFloat(btcAmount.toFixed(8)),
          eth: parseFloat(ethAmount.toFixed(6)),
          usdt: parseFloat(usdtAmount.toFixed(2)),
        },
      };
    } catch (error: any) {
      logger.error('Failed to create crypto payment details:', error.message);
      throw new Error('Failed to create crypto payment details');
    }
  }

  /**
   * Check Bitcoin transaction
   * Uses Blockchain.info free API
   */
  async checkBitcoinTransaction(address: string, expectedAmount: number): Promise<BlockchainTransaction | null> {
    try {
      const response = await axios.get(
        `https://blockchain.info/rawaddr/${address}`,
        {
          params: { limit: 10 },
        }
      );

      const transactions = response.data.txs || [];
      
      for (const tx of transactions) {
        // Check if transaction has outputs to our address
        const output = tx.out?.find((o: any) => o.addr === address);
        if (output) {
          const amountBTC = output.value / 100000000; // Satoshis to BTC
          
          // Check if amount matches (with 1% tolerance)
          if (Math.abs(amountBTC - expectedAmount) / expectedAmount < 0.01) {
            return {
              hash: tx.hash,
              confirmations: tx.block_height ? response.data.n_tx - tx.block_height : 0,
              amount: amountBTC,
              timestamp: tx.time,
            };
          }
        }
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to check Bitcoin transaction:', error.message);
      return null;
    }
  }

  /**
   * Check Ethereum transaction
   * Uses Etherscan free API
   */
  async checkEthereumTransaction(
    address: string,
    expectedAmount: number,
    isUSDT: boolean = false
  ): Promise<BlockchainTransaction | null> {
    try {
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
      const action = isUSDT ? 'tokentx' : 'txlist';
      
      const response = await axios.get(
        'https://api.etherscan.io/api',
        {
          params: {
            module: 'account',
            action,
            address,
            startblock: 0,
            endblock: 99999999,
            page: 1,
            offset: 10,
            sort: 'desc',
            apikey: apiKey,
          },
        }
      );

      if (response.data.status !== '1') {
        return null;
      }

      const transactions = response.data.result || [];
      
      for (const tx of transactions) {
        let amountETH: number;
        
        if (isUSDT) {
          // USDT has 6 decimals
          amountETH = parseInt(tx.value) / 1000000;
        } else {
          // ETH has 18 decimals
          amountETH = parseInt(tx.value) / 1000000000000000000;
        }

        // Check if amount matches (with 1% tolerance)
        if (Math.abs(amountETH - expectedAmount) / expectedAmount < 0.01) {
          // Get current block to calculate confirmations
          const currentBlock = await this.getCurrentEthereumBlock();
          const confirmations = currentBlock - parseInt(tx.blockNumber);

          return {
            hash: tx.hash,
            confirmations,
            amount: amountETH,
            timestamp: parseInt(tx.timeStamp),
          };
        }
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to check Ethereum transaction:', error.message);
      return null;
    }
  }

  /**
   * Get current Ethereum block number
   */
  private async getCurrentEthereumBlock(): Promise<number> {
    try {
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
      const response = await axios.get(
        'https://api.etherscan.io/api',
        {
          params: {
            module: 'proxy',
            action: 'eth_blockNumber',
            apikey: apiKey,
          },
        }
      );

      return parseInt(response.data.result, 16);
    } catch (error: any) {
      logger.error('Failed to get current Ethereum block:', error.message);
      return 0;
    }
  }

  /**
   * Verify crypto payment
   */
  async verifyPayment(
    currency: 'BTC' | 'ETH' | 'USDT',
    expectedAmount: number,
    minConfirmations: number = 1
  ): Promise<{ verified: boolean; transaction?: BlockchainTransaction }> {
    try {
      let transaction: BlockchainTransaction | null = null;

      if (currency === 'BTC') {
        transaction = await this.checkBitcoinTransaction(this.wallets.BTC, expectedAmount);
      } else if (currency === 'ETH') {
        transaction = await this.checkEthereumTransaction(this.wallets.ETH, expectedAmount, false);
      } else if (currency === 'USDT') {
        transaction = await this.checkEthereumTransaction(this.wallets.USDT, expectedAmount, true);
      }

      if (!transaction) {
        return { verified: false };
      }

      // Check if transaction has enough confirmations
      const verified = transaction.confirmations >= minConfirmations;

      return { verified, transaction };
    } catch (error: any) {
      logger.error('Failed to verify crypto payment:', error.message);
      return { verified: false };
    }
  }

  /**
   * Get wallet addresses
   */
  getWalletAddresses(): CryptoWallet[] {
    return [
      { currency: 'BTC', address: this.wallets.BTC },
      { currency: 'ETH', address: this.wallets.ETH },
      { currency: 'USDT', address: this.wallets.USDT, network: 'ERC-20' },
    ];
  }

  /**
   * Validate wallet configuration
   */
  validateWallets(): boolean {
    const missingWallets = [];
    
    if (!this.wallets.BTC) missingWallets.push('BTC');
    if (!this.wallets.ETH) missingWallets.push('ETH');
    if (!this.wallets.USDT) missingWallets.push('USDT');

    if (missingWallets.length > 0) {
      logger.warn(`Missing crypto wallet addresses: ${missingWallets.join(', ')}`);
      return false;
    }

    return true;
  }
}

export default new DirectCryptoService();
