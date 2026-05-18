# Fluent Wallet AI 🚀

> 一款基于自然语言意图的 Web3 钱包，让区块链交互变得像说话一样简单。

## ✨ 核心特性

### 🔑 钱包管理
- **创建钱包** - 一键生成新钱包，包含助记词和私钥
- **导入钱包** - 支持助记词或私钥导入
- **安全存储** - 私钥本地加密存储
- **导出私钥** - 支持钱包恢复

### 💰 资产管理
- **余额查询** - 实时查询 ETH 和 Token 余额
- **资产概览** - 完整的资产组合展示
- **价格估算** - 集成主流代币价格

### 💸 交易功能
- **自然语言转账** - 用自然语言直接发起转账
- **交易签署** - 安全的离线交易签署
- **交易追踪** - 实时查询交易状态和确认数

### 🛡️ 安全特性
- **私钥保护** - 采用本地存储，不上传服务器
- **交易验证** - 所有交易需要用户二次确认
- **授权检查** - 自动扫描恶意授权
- **地址验证** - EIP-55 校验和验证

### 🤖 意图识别
- **自然语言处理** - 理解各种口语化指令
- **智能参数补全** - 自动填充交易信息
- **上下文记忆** - 记住对话历史

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| ethers.js | v6 | Web3 库，钱包操作 |
| Tailwind CSS | 最新 | UI 框架 |
| Vanilla JS | ES6+ | 核心逻辑 |
| Infura API | Sepolia | 测试网络 RPC |

## 📦 文件结构

```
.
├── index.html          # 主应用界面
├── wallet.js           # 钱包核心逻辑（ethers.js）
├── ui.js              # UI 交互逻辑
└── README.md          # 本文件
```

## 🚀 快速开始

### 1. 本地运行

```bash
# 直接在浏览器打开
open index.html

# 或启动本地服务器
python -m http.server 8000
# 访问 http://localhost:8000
```

### 2. 创建钱包

```
用户: "创建钱包"
AI: 生成新钱包，显示：
  - 12 或 24 个助记词
  - 钱包地址
  - 私钥（仅第一次显示）
```

### 3. 导入钱包

```
用户: "导入钱包"
AI: 弹出导入对话框，支持：
  - 助记词导入
  - 私钥导入
```

### 4. 查询余额

```
用户: "查询余额" / "资产查询" / "余额多少"
AI: 返回实时 ETH 和 Token 余额
```

### 5. 发起转账

```
用户: "转账 0.01 ETH 到 0x7a..."
AI: 准备交易，显示预览，需要用户确认
```

## 🧪 测试网络

应用默认使用 **Sepolia 测试网**

### 获取测试 ETH Faucet：
- [Sepolia Faucet](https://sepoliafaucet.com)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Infura Faucet](https://infura.io/faucet/sepolia)

## 📱 API 参考

### 钱包操作

#### 创建新钱包
```javascript
const result = fluentWallet.createNewWallet();
// 返回: { success, mnemonic, address, privateKey, path }
```

#### 导入钱包（助记词）
```javascript
const result = fluentWallet.importWalletByMnemonic(mnemonic);
// 返回: { success, address, privateKey, error? }
```

#### 导入钱包（私钥）
```javascript
const result = fluentWallet.importWalletByPrivateKey(privateKey);
// 返回: { success, address, privateKey, error? }
```

#### 查询余额
```javascript
const result = await fluentWallet.getBalance(address);
// 返回: { success, balance, balanceWei, error? }
```

#### 发起转账
```javascript
const result = await fluentWallet.createTransferTx({
    privateKey: '0x...',
    to: '0x...',
    amount: '0.01'  // ETH
});
// 返回: { success, hash, from, to, value, gasLimit, error? }
```

#### 查询交易状态
```javascript
const result = await fluentWallet.getTransactionStatus(hash);
// 返回: { success, status, confirmation, blockNumber, gasUsed, error? }
```

#### 签署消息
```javascript
const result = await fluentWallet.signMessage({
    privateKey: '0x...',
    message: '登录确认'
});
// 返回: { success, signature, address, error? }
```

#### 验证签名
```javascript
const result = await fluentWallet.verifySignature({
    message: '登录确认',
    signature: '0x...'
});
// 返回: { success, address, valid, error? }
```

## 🎯 使用示例

### 示例 1：创建和保存钱包

```javascript
// 创建新钱包
const wallet = fluentWallet.createNewWallet();
console.log('新钱包地址:', wallet.address);
console.log('助记词:', wallet.mnemonic);

// 本地存储
localStorage.setItem('walletAddress', wallet.address);
localStorage.setItem('walletPrivateKey', wallet.privateKey);
```

### 示例 2：查询和转账

```javascript
// 1. 查询余额
const balance = await fluentWallet.getBalance('0x...');
console.log('余额:', balance.balance, 'ETH');

// 2. 发起转账
const tx = await fluentWallet.createTransferTx({
    privateKey: '0x...',
    to: '0x7a3...', // 接收地址
    amount: '0.01'
});
console.log('交易哈希:', tx.hash);

// 3. 查询交易状态
const status = await fluentWallet.getTransactionStatus(tx.hash);
console.log('交易状态:', status.status);
console.log('确认数:', status.confirmation);
```

### 示例 3：ERC20 代币操作

```javascript
// 查询 USDC 余额
const usdcBalance = await fluentWallet.getTokenBalance(
    address,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC 合约
);
console.log('USDC 余额:', usdcBalance.balance);

// 转账 USDC
const tokenTx = await fluentWallet.createTokenTransferTx({
    privateKey: '0x...',
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    to: '0x...',
    amount: '100',
    decimals: 6
});
```

## ⚠️ 安全建议

### 关键提示
- ✋ **不要分享私钥** - 永远不要向任何人透露您的私钥或助记词
- 🔒 **本地存储** - 私钥存储在浏览器 localStorage，仅限个人测试
- 🔐 **二次确认** - 所有关键操作需要用户确认
- 📱 **备份助记词** - 务必在安全的地方备份助记词
- 🚨 **测试网络** - 仅在 Sepolia 测试网上使用，不要在主网使用测试代码

### 生产环境建议
- 使用硬件钱包（如 Ledger, Trezor）
- 集成 MetaMask 或其他浏览器钱包
- 实施完整的 KYC/AML 流程
- 定期安全��计

## 🔧 常见问题

### Q: 支持 MetaMask 吗？
**A:** 是的！应用会自动检测 MetaMask，如果已安装会优先使用。

### Q: 支持主网吗？
**A:** 当前默认使用 Sepolia 测试网。要切换到主网，修改 `wallet.js` 中的 RPC 端点。

### Q: 私钥安全吗？
**A:** 私钥存储在浏览器 localStorage，不上传任何服务器。但本地存储仍不如硬件钱包安全，仅适合测试。

### Q: 支持 ENS 吗？
**A:** 是的！支持 ENS 名称解析和反向解析。

### Q: 支持哪些代币？
**A:** 支持所有 ERC20 标准代币。

### Q: 可以离线使用吗？
**A:** 可以创建和导入钱包离线进行，但查询余额和发送交易需要网络连接。

## 🚀 未来功能

- [ ] 多链支持（Polygon, Arbitrum, Optimism）
- [ ] 高级交易路由（DEX 聚合）
- [ ] DeFi 集成（借贷、流动性）
- [ ] NFT 支持
- [ ] 完整的 Voice AI 集成
- [ ] 移动应用版本
- [ ] 浏览器扩展

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 PR 和 Issue！

## 📞 支持

有问题？请提交 Issue 或联系我们。

---

**Made with ❤️ for Web3**
