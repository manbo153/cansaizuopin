/**
 * Fluent Wallet AI - UI 交互逻辑
 */

class WalletUI {
    constructor() {
        this.currentAccount = null;
        this.currentBalance = null;
        this.mockAssets = [
            { symbol: 'ETH', name: 'Ethereum', balance: '0.00', usd: '0.00', icon: '💎' },
            { symbol: 'USDC', name: 'USD Coin', balance: '0.00', usd: '0.00', icon: '💵' },
            { symbol: 'DAI', name: 'Dai Stablecoin', balance: '0.00', usd: '0.00', icon: '🏦' }
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabNavigation();
    }

    setupEventListeners() {
        // 连接钱包按钮
        document.getElementById('wallet-status').addEventListener('click', (e) => {
            this.handleWalletConnect();
        });

        // 发送消息
        document.getElementById('send-btn').addEventListener('click', () => {
            this.handleSendMessage();
        });

        // 输入框回车发送
        document.getElementById('user-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // 建议按钮
        document.querySelectorAll('[data-action="suggest"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const suggestion = e.currentTarget.dataset.val;
                document.getElementById('user-input').value = suggestion;
                this.handleSendMessage();
            });
        });

        // 关闭 Action Panel
        document.querySelector('[data-action="close-panel"]').addEventListener('click', () => {
            document.getElementById('action-panel').classList.add('hidden');
        });

        // 钱包管理按钮
        document.getElementById('btn-create-wallet').addEventListener('click', () => {
            this.showCreateWalletModal();
        });

        document.getElementById('btn-import-wallet').addEventListener('click', () => {
            this.showImportWalletModal();
        });

        document.getElementById('btn-export-key').addEventListener('click', () => {
            this.showExportKeyModal();
        });

        // 标签页切换
        document.querySelectorAll('button[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    setupTabNavigation() {
        document.querySelectorAll('button[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('button[data-tab]').forEach(b => {
                    b.classList.remove('active-nav');
                    b.classList.add('text-slate-400');
                });
                e.currentTarget.classList.add('active-nav');
                e.currentTarget.classList.remove('text-slate-400');

                const tab = e.currentTarget.dataset.tab;
                document.getElementById('sidebar-panel-chat').classList.toggle('hidden', tab !== 'chat');
                document.getElementById('sidebar-panel-docs').classList.toggle('hidden', tab !== 'docs');
            });
        });
    }

    async handleWalletConnect() {
        // 检查是否有 MetaMask
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.currentAccount = accounts[0];
                this.onWalletConnected();
            } catch (error) {
                this.addMessage('ai', `❌ MetaMask 连接失败: ${error.message}`);
            }
        } else {
            this.showLocalWalletOptions();
        }
    }

    showLocalWalletOptions() {
        const message = `
            📱 未检测到 MetaMask
            <br><br>您可以选择：
            <br>• <span class="text-blue-400 font-bold cursor-pointer underline" onclick="walletUI.showCreateWalletModal()">创建新钱包</span>
            <br>• <span class="text-blue-400 font-bold cursor-pointer underline" onclick="walletUI.showImportWalletModal()">导入已有钱包</span>
        `;
        this.addMessage('ai', message);
    }

    async onWalletConnected() {
        this.currentAccount = this.currentAccount || window.ethereum.selectedAddress;
        
        // 更新 UI
        document.getElementById('wallet-status').textContent = `${this.currentAccount.substring(0, 6)}...${this.currentAccount.substring(38)}`;
        document.getElementById('wallet-status').classList.add('bg-green-600');
        document.getElementById('wallet-address').textContent = this.currentAccount;

        // 获取余额
        const balanceResult = await fluentWallet.getBalance(this.currentAccount);
        if (balanceResult.success) {
            this.currentBalance = balanceResult.balance;
            document.getElementById('wallet-balance').textContent = `${balanceResult.balance} ETH`;
            this.mockAssets[0].balance = balanceResult.balance;
            this.mockAssets[0].usd = (parseFloat(balanceResult.balance) * 2500).toFixed(2);
        }

        // 更新资产列表
        this.renderAssets();

        // 显示欢迎消息
        this.addMessage('ai', `✅ 钱包已连接！<br>地址：<span class="font-mono text-xs text-blue-400">${this.currentAccount}</span><br>余额：<span class="font-bold">${this.currentBalance} ETH</span>`);
    }

    showCreateWalletModal() {
        const result = fluentWallet.createNewWallet();
        
        if (!result.success) {
            this.addMessage('ai', `❌ 创建失败: ${result.error}`);
            return;
        }

        const modal = document.getElementById('modal-backdrop');
        const content = document.getElementById('modal-content');
        
        content.innerHTML = `
            <h3 class="text-lg font-bold text-blue-400">✅ 钱包创建成功！</h3>
            
            <div class="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-3 space-y-2">
                <p class="text-xs font-bold text-yellow-500">⚠️ 重要提示</p>
                <p class="text-xs text-slate-300">请妥善保管您的助记词和私钥，丢失将无法恢复资产！</p>
            </div>

            <div class="space-y-2">
                <label class="text-xs font-bold text-slate-400">助记词（12个单词）</label>
                <div class="bg-black/30 border border-white/10 rounded-lg p-3">
                    <p class="text-xs font-mono text-blue-400 break-all select-all">${result.mnemonic}</p>
                </div>
                <button onclick="navigator.clipboard.writeText('${result.mnemonic}').then(() => alert('已复制到剪贴板'))" class="w-full px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded text-xs font-bold text-blue-400 hover:bg-blue-600/30">
                    📋 复制助记词
                </button>
            </div>

            <div class="space-y-2">
                <label class="text-xs font-bold text-slate-400">钱包地址</label>
                <div class="bg-black/30 border border-white/10 rounded-lg p-3">
                    <p class="text-xs font-mono text-green-400 break-all select-all">${result.address}</p>
                </div>
                <button onclick="navigator.clipboard.writeText('${result.address}').then(() => alert('已复制到剪贴板'))" class="w-full px-3 py-1.5 bg-green-600/20 border border-green-500/30 rounded text-xs font-bold text-green-400 hover:bg-green-600/30">
                    📋 复制地址
                </button>
            </div>

            <button onclick="walletUI.importWalletLocally('${result.privateKey}', '${result.address}')" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-all">
                ✓ 我已保存，继续
            </button>
            
            <button onclick="document.getElementById('modal-backdrop').classList.add('hidden')" class="w-full px-4 py-2 bg-slate-600/30 hover:bg-slate-600/50 rounded-lg text-xs font-bold text-slate-300 transition-all">
                关闭
            </button>
        `;
        
        modal.classList.remove('hidden');
    }

    showImportWalletModal() {
        const modal = document.getElementById('modal-backdrop');
        const content = document.getElementById('modal-content');
        
        content.innerHTML = `
            <h3 class="text-lg font-bold text-blue-400">📥 导入钱包</h3>
            
            <div class="space-y-3">
                <div>
                    <label class="text-xs font-bold text-slate-400 block mb-2">导入方式</label>
                    <div class="flex gap-2">
                        <button onclick="walletUI.switchImportMode('mnemonic')" class="flex-1 px-3 py-2 bg-blue-600/30 border border-blue-500 rounded text-xs font-bold text-blue-400">
                            助记词
                        </button>
                        <button onclick="walletUI.switchImportMode('privatekey')" class="flex-1 px-3 py-2 bg-slate-600/30 border border-white/10 rounded text-xs font-bold text-slate-400 hover:border-blue-500">
                            私钥
                        </button>
                    </div>
                </div>

                <div id="import-input-area">
                    <label class="text-xs font-bold text-slate-400 block mb-2">请输入 12 或 24 个单词</label>
                    <textarea id="import-text" class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-300 focus:border-blue-500 resize-none h-24" placeholder="单词之间用空格分隔..."></textarea>
                </div>

                <button onclick="walletUI.importWalletFromModal()" class="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold text-white transition-all">
                    导入
                </button>
                
                <button onclick="document.getElementById('modal-backdrop').classList.add('hidden')" class="w-full px-4 py-2 bg-slate-600/30 hover:bg-slate-600/50 rounded-lg text-xs font-bold text-slate-300 transition-all">
                    取消
                </button>
            </div>
        `;
        
        modal.classList.remove('hidden');
        window.currentImportMode = 'mnemonic';
    }

    switchImportMode(mode) {
        window.currentImportMode = mode;
        const buttons = document.querySelectorAll('[onclick*="switchImportMode"]');
        buttons.forEach(btn => btn.classList.remove('bg-blue-600/30', 'border-blue-500'));
        buttons.forEach(btn => btn.classList.add('bg-slate-600/30', 'border-white/10', 'text-slate-400'));
        event.target.classList.remove('bg-slate-600/30', 'border-white/10', 'text-slate-400');
        event.target.classList.add('bg-blue-600/30', 'border-blue-500', 'text-blue-400');

        const textarea = document.getElementById('import-text');
        if (mode === 'mnemonic') {
            textarea.placeholder = '12 或 24 个单词，用空格分隔...';
        } else {
            textarea.placeholder = '以 0x 开头的私钥...';
        }
    }

    importWalletFromModal() {
        const text = document.getElementById('import-text').value.trim();
        const mode = window.currentImportMode;
        
        let result;
        if (mode === 'mnemonic') {
            result = fluentWallet.importWalletByMnemonic(text);
        } else {
            result = fluentWallet.importWalletByPrivateKey(text);
        }

        if (!result.success) {
            alert(`导入失败: ${result.error}`);
            return;
        }

        this.importWalletLocally(result.privateKey, result.address);
        document.getElementById('modal-backdrop').classList.add('hidden');
    }

    importWalletLocally(privateKey, address) {
        this.currentAccount = address;
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletPrivateKey', privateKey);
        
        this.onWalletConnected();
        this.addMessage('ai', `✅ 钱包已导入！地址：${address}`);
    }

    showExportKeyModal() {
        if (!this.currentAccount) {
            this.addMessage('ai', '❌ 请先连接或导入钱包');
            return;
        }

        const privateKey = localStorage.getItem('walletPrivateKey');
        if (!privateKey) {
            this.addMessage('ai', '❌ 无法导出私钥（未本地存储）');
            return;
        }

        const modal = document.getElementById('modal-backdrop');
        const content = document.getElementById('modal-content');
        
        content.innerHTML = `
            <h3 class="text-lg font-bold text-red-500">⚠️ 导出私钥</h3>
            
            <div class="bg-red-600/20 border border-red-500/30 rounded-lg p-3">
                <p class="text-xs font-bold text-red-500">危险操作</p>
                <p class="text-xs text-slate-300 mt-1">任何获得您私钥的人都可以完全控制您的资产。不要与任何人分享！</p>
            </div>

            <div class="space-y-2">
                <label class="text-xs font-bold text-slate-400">您的私钥</label>
                <div class="bg-black/30 border border-white/10 rounded-lg p-3">
                    <p class="text-xs font-mono text-red-400 break-all select-all">${privateKey}</p>
                </div>
                <button onclick="navigator.clipboard.writeText('${privateKey}').then(() => alert('已复制到剪贴板'))" class="w-full px-3 py-1.5 bg-red-600/20 border border-red-500/30 rounded text-xs font-bold text-red-400 hover:bg-red-600/30">
                    📋 复制私钥
                </button>
            </div>

            <button onclick="document.getElementById('modal-backdrop').classList.add('hidden')" class="w-full px-4 py-2 bg-slate-600/30 hover:bg-slate-600/50 rounded-lg text-xs font-bold text-slate-300 transition-all">
                关闭
            </button>
        `;
        
        modal.classList.remove('hidden');
    }

    renderAssets() {
        const assetList = document.getElementById('asset-list');
        assetList.innerHTML = this.mockAssets.map(a => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm">${a.icon}</div>
                    <div>
                        <div class="text-xs font-bold">${a.symbol}</div>
                        <div class="text-[10px] text-slate-500">${a.name}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-bold font-mono">${a.balance}</div>
                    <div class="text-[10px] text-slate-500">$${a.usd}</div>
                </div>
            </div>
        `).join('');
    }

    async handleSendMessage() {
        const input = document.getElementById('user-input');
        const message = input.value.trim();
        
        if (!message) return;

        // 添加用户消息
        this.addMessage('user', message);
        input.value = '';

        // 显示输入中
        this.showTyping();

        // 处理意图
        await this.processIntent(message);
    }

    async processIntent(message) {
        const text = message.toLowerCase();
        
        // 模拟 AI 处理时间
        await new Promise(resolve => setTimeout(resolve, 1200));

        if (!this.currentAccount && !text.includes('创建') && !text.includes('导入')) {
            this.hideTyping();
            this.addMessage('ai', '检测到您尚未连接钱包。请先点击右上角 <span class="text-blue-400 font-bold">连接钱包</span> 或对我说 "<span class="text-blue-400 font-bold">创建钱包</span>"。');
            return;
        }

        this.hideTyping();

        if (text.includes('资产') || text.includes('余额') || text.includes('查询')) {
            this.handleAssetQuery();
        } 
        else if (text.includes('转账') || text.includes('发送')) {
            this.handleTransfer();
        }
        else if (text.includes('创建') || text.includes('新钱包')) {
            this.showCreateWalletModal();
        }
        else if (text.includes('导入') || text.includes('私钥')) {
            this.showImportWalletModal();
        }
        else if (text.includes('安全') || text.includes('检查')) {
            this.handleSecurityCheck();
        }
        else {
            this.addMessage('ai', `我理解您想 "${message}"。<br><br>我支持以下操作：<br>• "查询余额"<br>• "创建钱包"<br>• "转账 0.01 ETH"<br>• "安全检查"`);
        }
    }

    handleAssetQuery() {
        const total = this.mockAssets.reduce((sum, a) => sum + parseFloat(a.usd || 0), 0);
        const assetsText = this.mockAssets.map(a => 
            `• ${a.symbol}: ${a.balance} ($${a.usd})`
        ).join('<br>');
        
        this.addMessage('ai', `💰 您的资产概览<br><br>${assetsText}<br><br>总计：$${total.toFixed(2)}`);
    }

    handleTransfer() {
        this.addMessage('ai', '💸 我准备为您转账。请说明详情，例如："转 0.01 ETH 到 0x7a3..."');
    }

    handleSecurityCheck() {
        this.addMessage('ai', `🛡️ 安全检查已完成<br><br>✅ 地址：${this.currentAccount}<br>✅ 无异常授权<br>✅ 交易历史正常<br><br>您的钱包状态良好！`);
    }

    switchTab(tab) {
        // 已在 setupTabNavigation 中处理
    }

    addMessage(role, content) {
        const chatContainer = document.getElementById('chat-container');
        const div = document.createElement('div');
        div.className = `flex items-start gap-3 ${role === 'user' ? 'flex-row-reverse' : ''} max-w-2xl animate-fade-in`;
        
        const avatar = role === 'user' 
            ? `<div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-white/10 text-[10px] font-bold">ME</div>`
            : `<div class="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center shrink-0 shadow-lg"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>`;

        const bubbleClass = role === 'user'
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
            : 'glass-panel text-slate-200 rounded-2xl rounded-tl-none';

        div.innerHTML = `
            ${avatar}
            <div class="${bubbleClass} p-4 text-sm leading-relaxed shadow-xl border border-white/5">
                ${content}
            </div>
        `;
        
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    showTyping() {
        const chatContainer = document.getElementById('chat-container');
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'flex items-center gap-3 animate-fade-in';
        div.innerHTML = `
            <div class="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center shrink-0 opacity-50">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div class="glass-panel p-3 rounded-2xl flex gap-1 items-center">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        `;
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    hideTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }
}

// 初始化 UI
const walletUI = new WalletUI();

// 页面加载时恢复钱包
window.addEventListener('DOMContentLoaded', () => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
        walletUI.currentAccount = savedAddress;
        walletUI.onWalletConnected();
    }
});
