/**
 * Fluent Wallet AI - 钱包核心逻辑
 * 基于 ethers.js v6
 */

class FluentWallet {
    constructor() {
        // Infura RPC 端点 (Sepolia 测试网)
        this.RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';
        // 如果没有 Infura Key，使用公共 RPC
        this.RPC_URL = 'https://rpc.sepolia.org';
        this.CHAIN_ID = 11155111; // Sepolia
        this.NETWORK_NAME = 'Sepolia';
        
        // 初始化 ethers provider
        this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
    }

    /**
     * 创建新钱包
     * @returns {Object} { success, mnemonic, address, privateKey, path }
     */
    createNewWallet() {
        try {
            // 生成随机助记词（12 个单词）
            const mnemonic = ethers.Mnemonic.entropyToMnemonic(ethers.getRandomValues(new Uint8Array(16)));
            
            // 从助记词创建钱包
            const mnemonicWallet = ethers.HDNodeWallet.fromMnemonic(
                ethers.Mnemonic.fromPhrase(mnemonic),
                "m/44'/60'/0'/0/0"
            );

            return {
                success: true,
                mnemonic: mnemonic,
                address: mnemonicWallet.address,
                privateKey: mnemonicWallet.privateKey,
                path: "m/44'/60'/0'/0/0"
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 从助记词导入钱包
     * @param {String} mnemonic - 12 或 24 个单词
     * @returns {Object} { success, address, privateKey, error? }
     */
    importWalletByMnemonic(mnemonic) {
        try {
            // 验证助记词
            const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic.trim());
            
            // 从助记词派生钱包
            const wallet = ethers.HDNodeWallet.fromMnemonic(
                mnemonicObj,
                "m/44'/60'/0'/0/0"
            );

            return {
                success: true,
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: mnemonic
            };
        } catch (error) {
            return {
                success: false,
                error: '无效的助记词。请确保输入 12 或 24 个单词。'
            };
        }
    }

    /**
     * 从私钥导入钱包
     * @param {String} privateKey - 以 0x 开头的私钥
     * @returns {Object} { success, address, privateKey, error? }
     */
    importWalletByPrivateKey(privateKey) {
        try {
            // 验证并标准化私钥
            const key = privateKey.trim();
            if (!key.startsWith('0x')) {
                throw new Error('私钥必须以 0x 开头');
            }
            if (key.length !== 66) {
                throw new Error('私钥长度不正确（应为 64 个十六进制字符）');
            }

            // 从私钥创建钱包
            const wallet = new ethers.Wallet(key);

            return {
                success: true,
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取 ETH 余额
     * @param {String} address - 钱包地址
     * @returns {Promise<Object>} { success, balance, balanceWei, error? }
     */
    async getBalance(address) {
        try {
            // 验证地址
            const validAddress = ethers.getAddress(address);
            
            // 获取余额
            const balanceWei = await this.provider.getBalance(validAddress);
            const balance = ethers.formatEther(balanceWei);

            return {
                success: true,
                balance: parseFloat(balance).toFixed(6),
                balanceWei: balanceWei.toString(),
                address: validAddress
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取 ERC20 Token 余额
     * @param {String} address - 钱包地址
     * @param {String} tokenAddress - Token 合约地址
     * @param {Number} decimals - Token 小数位数
     * @returns {Promise<Object>} { success, balance, balanceRaw, error? }
     */
    async getTokenBalance(address, tokenAddress, decimals = 18) {
        try {
            const validAddress = ethers.getAddress(address);
            const validTokenAddress = ethers.getAddress(tokenAddress);

            // ERC20 ABI (balanceOf 函数)
            const ERC20_ABI = [
                'function balanceOf(address owner) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function symbol() view returns (string)',
                'function name() view returns (string)'
            ];

            const contract = new ethers.Contract(validTokenAddress, ERC20_ABI, this.provider);
            
            // 获取余额
            const balanceRaw = await contract.balanceOf(validAddress);
            const balance = ethers.formatUnits(balanceRaw, decimals);

            // 获取代币信息
            let symbol = 'UNKNOWN', name = 'Unknown Token';
            try {
                symbol = await contract.symbol();
                name = await contract.name();
            } catch (e) {
                // 某些代币可能没有这些方法
            }

            return {
                success: true,
                balance: balance,
                balanceRaw: balanceRaw.toString(),
                symbol: symbol,
                name: name,
                decimals: decimals
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发起 ETH 转账
     * @param {Object} params - { privateKey, to, amount, gasPrice?, gasLimit? }
     * @returns {Promise<Object>} { success, hash, from, to, value, gasLimit, error? }
     */
    async createTransferTx(params) {
        try {
            const { privateKey, to, amount, gasPrice, gasLimit } = params;

            // 验证输入
            if (!privateKey || !to || !amount) {
                throw new Error('缺少必需参数：privateKey, to, amount');
            }

            // 创建钱包
            const wallet = new ethers.Wallet(privateKey, this.provider);
            const toAddress = ethers.getAddress(to);
            const valueWei = ethers.parseEther(amount);

            // 估算 Gas
            const estimatedGas = await this.provider.estimateGas({
                from: wallet.address,
                to: toAddress,
                value: valueWei
            });

            // 获取 Gas 价格
            const feeData = await this.provider.getFeeData();

            // 构建交易
            const tx = {
                to: toAddress,
                value: valueWei,
                gasLimit: gasLimit || (estimatedGas * BigInt(120)) / BigInt(100), // 增加 20% 作为余量
                gasPrice: gasPrice || feeData.gasPrice
            };

            // 签署并发送交易
            const txResponse = await wallet.sendTransaction(tx);

            return {
                success: true,
                hash: txResponse.hash,
                from: wallet.address,
                to: toAddress,
                value: amount,
                gasLimit: txResponse.gasLimit.toString(),
                nonce: txResponse.nonce
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发起 ERC20 Token 转账
     * @param {Object} params - { privateKey, tokenAddress, to, amount, decimals }
     * @returns {Promise<Object>} { success, hash, from, to, amount, error? }
     */
    async createTokenTransferTx(params) {
        try {
            const { privateKey, tokenAddress, to, amount, decimals = 18 } = params;

            if (!privateKey || !tokenAddress || !to || !amount) {
                throw new Error('缺少必需参数');
            }

            // 创建钱包
            const wallet = new ethers.Wallet(privateKey, this.provider);
            const toAddress = ethers.getAddress(to);
            const tokenAddr = ethers.getAddress(tokenAddress);

            // ERC20 ABI
            const ERC20_ABI = [
                'function transfer(address to, uint256 amount) public returns (bool)',
                'function approve(address spender, uint256 amount) public returns (bool)'
            ];

            const contract = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
            const amountWei = ethers.parseUnits(amount, decimals);

            // 发送转账交易
            const txResponse = await contract.transfer(toAddress, amountWei);

            return {
                success: true,
                hash: txResponse.hash,
                from: wallet.address,
                to: toAddress,
                amount: amount,
                token: tokenAddr
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 查询交易状态
     * @param {String} hash - 交易哈希
     * @returns {Promise<Object>} { success, status, confirmation, blockNumber, gasUsed, error? }
     */
    async getTransactionStatus(hash) {
        try {
            // 获取交易
            const tx = await this.provider.getTransaction(hash);
            if (!tx) {
                return {
                    success: false,
                    error: '交易不存在'
                };
            }

            // 获取收据
            const receipt = await this.provider.getTransactionReceipt(hash);
            
            if (!receipt) {
                return {
                    success: true,
                    status: 'pending',
                    confirmation: 0,
                    from: tx.from,
                    to: tx.to,
                    value: ethers.formatEther(tx.value)
                };
            }

            // 获取当前块
            const currentBlock = await this.provider.getBlockNumber();
            const confirmations = currentBlock - receipt.blockNumber;

            return {
                success: true,
                status: receipt.status === 1 ? 'success' : 'failed',
                confirmation: confirmations,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                transactionFee: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
                from: receipt.from,
                to: receipt.to,
                value: ethers.formatEther(tx.value)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 签署消息
     * @param {Object} params - { privateKey, message }
     * @returns {Promise<Object>} { success, signature, address, error? }
     */
    async signMessage(params) {
        try {
            const { privateKey, message } = params;
            
            if (!privateKey || !message) {
                throw new Error('缺少必需参数');
            }

            const wallet = new ethers.Wallet(privateKey);
            const signature = await wallet.signMessage(message);

            return {
                success: true,
                signature: signature,
                address: wallet.address,
                message: message
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 验证签名
     * @param {Object} params - { message, signature }
     * @returns {Object} { success, address, valid, error? }
     */
    verifySignature(params) {
        try {
            const { message, signature } = params;
            
            if (!message || !signature) {
                throw new Error('缺少必需参数');
            }

            const address = ethers.verifyMessage(message, signature);

            return {
                success: true,
                address: address,
                valid: true,
                message: message
            };
        } catch (error) {
            return {
                success: false,
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * 获取 Gas 价格
     * @returns {Promise<Object>} { success, gasPrice, maxFeePerGas, maxPriorityFeePerGas, error? }
     */
    async getGasPrice() {
        try {
            const feeData = await this.provider.getFeeData();

            return {
                success: true,
                gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' Gwei',
                maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei') + ' Gwei',
                maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei') + ' Gwei'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 验证地址
     * @param {String} address - 地址
     * @returns {Object} { valid, checksum, error? }
     */
    validateAddress(address) {
        try {
            const validAddress = ethers.getAddress(address);
            return {
                valid: true,
                checksum: validAddress
            };
        } catch (error) {
            return {
                valid: false,
                error: '无效的以太坊地址'
            };
        }
    }

    /**
     * 验证私钥
     * @param {String} privateKey - 私钥
     * @returns {Object} { valid, address, error? }
     */
    validatePrivateKey(privateKey) {
        try {
            const key = privateKey.trim();
            if (!key.startsWith('0x') || key.length !== 66) {
                throw new Error('格式不正确');
            }
            
            const wallet = new ethers.Wallet(key);
            return {
                valid: true,
                address: wallet.address
            };
        } catch (error) {
            return {
                valid: false,
                error: '无效的私钥'
            };
        }
    }

    /**
     * 获取 ENS 名称
     * @param {String} address - 钱包地址
     * @returns {Promise<Object>} { success, ensName, error? }
     */
    async getENSName(address) {
        try {
            const validAddress = ethers.getAddress(address);
            const ensName = await this.provider.lookupAddress(validAddress);

            return {
                success: true,
                ensName: ensName || null,
                address: validAddress
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 解析 ENS 名称
     * @param {String} ensName - ENS 名称
     * @returns {Promise<Object>} { success, address, error? }
     */
    async resolveENS(ensName) {
        try {
            const address = await this.provider.resolveName(ensName);

            if (!address) {
                throw new Error('ENS 名称不存在或无效');
            }

            return {
                success: true,
                address: address,
                ensName: ensName
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取账户信息
     * @param {String} address - 地址
     * @returns {Promise<Object>} { success, nonce, balance, error? }
     */
    async getAccountInfo(address) {
        try {
            const validAddress = ethers.getAddress(address);
            const balance = await this.provider.getBalance(validAddress);
            const code = await this.provider.getCode(validAddress);
            const nonce = await this.provider.getTransactionCount(validAddress);

            return {
                success: true,
                address: validAddress,
                balance: ethers.formatEther(balance),
                nonce: nonce,
                isContract: code !== '0x'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 全局实例
const fluentWallet = new FluentWallet();
