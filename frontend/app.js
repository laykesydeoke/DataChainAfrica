// DataChain Africa - Frontend App
// Stacks API integration using Hiro API

// ============================================================
// Network Configuration
// ============================================================
var CONFIG = {
    network: 'testnet', // 'testnet' or 'mainnet'
    testnetApi: 'https://api.testnet.hiro.so',
    mainnetApi: 'https://api.hiro.so',
    get apiBase() {
        return this.network === 'mainnet' ? this.mainnetApi : this.testnetApi;
    },
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
};

// Legacy alias for backward compat
var API_URL = CONFIG.apiBase;
var CONTRACT_ADDRESS = CONFIG.contractAddress;

var userAddress = null;

// ============================================================
// Stacks API Helpers
// ============================================================

/**
 * Get the STX and token balances for an address.
 * Calls GET /extended/v1/address/{addr}/balances
 */
function getAccountBalance(address) {
    var url = CONFIG.apiBase + '/extended/v1/address/' + address + '/balances';
    return fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(function (r) {
            if (!r.ok) throw new Error('Balance fetch failed: HTTP ' + r.status);
            return r.json();
        });
}

/**
 * Get the ABI / interface of a deployed contract.
 * Calls GET /v2/contracts/interface/{addr}/{name}
 */
function getContractInfo(contractId) {
    var parts = contractId.split('.');
    var addr = parts[0];
    var name = parts[1];
    var url = CONFIG.apiBase + '/v2/contracts/interface/' + addr + '/' + name;
    return fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(function (r) {
            if (!r.ok) throw new Error('Contract info fetch failed: HTTP ' + r.status);
            return r.json();
        });
}

/**
 * Call a read-only function on a deployed contract.
 * Calls POST /v2/contracts/call-read/{addr}/{name}/{fn}
 */
function callReadOnly(contract, fnName, args) {
    var url = CONFIG.apiBase + '/v2/contracts/call-read/' +
        CONFIG.contractAddress + '/' + contract + '/' + fnName;
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sender: CONFIG.contractAddress,
            arguments: args || []
        })
    }).then(function (r) {
        if (!r.ok) {
            throw new Error('HTTP ' + r.status + ' from ' + fnName);
        }
        return r.json();
    }).catch(function (err) {
        console.error('callReadOnly error [' + contract + '.' + fnName + ']:', err);
        throw err;
    });
}

/**
 * Get transaction status by txid.
 * Calls GET /extended/v1/tx/{txid}
 */
function getTransactionStatus(txid) {
    var url = CONFIG.apiBase + '/extended/v1/tx/' + txid;
    return fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(function (r) {
            if (!r.ok) throw new Error('TX status fetch failed: HTTP ' + r.status);
            return r.json();
        });
}

// ============================================================
// DOM Ready
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('walletBtn').addEventListener('click', handleWalletClick);

    var planButtons = document.querySelectorAll('.btn-plan');
    planButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var planId = this.getAttribute('data-plan');
            if (planId) {
                subscribeToPlan(parseInt(planId));
            }
        });
    });

    // Show network indicator on page load
    updateNetworkIndicator();

    checkExistingSession();
});

// ============================================================
// Network Status Indicator
// ============================================================
function updateNetworkIndicator() {
    var indicator = document.getElementById('networkStatus');
    if (!indicator) return;
    indicator.textContent = CONFIG.network === 'mainnet' ? 'Mainnet' : 'Testnet';
    indicator.className = 'network-indicator ' + CONFIG.network;
}

// ============================================================
// Session Management
// ============================================================
function checkExistingSession() {
    try {
        var session = localStorage.getItem('blockstack-session');
        if (session) {
            var parsed = JSON.parse(session);
            if (parsed && parsed.userData) {
                var addr = parsed.userData.profile &&
                    parsed.userData.profile.stxAddress &&
                    parsed.userData.profile.stxAddress.testnet;
                if (addr) {
                    userAddress = addr;
                    onConnected(addr);
                }
            }
        }
    } catch (e) {
        // No existing session
    }
}

function handleWalletClick() {
    var btn = document.getElementById('walletBtn');
    if (userAddress) {
        localStorage.removeItem('blockstack-session');
        userAddress = null;
        btn.textContent = 'Connect Wallet';
        btn.classList.remove('connected');
        setDashboardPlaceholder();
        clearStxBalance();
        return;
    }
    connectWallet();
}

function connectWallet() {
    if (typeof window.StacksProvider === 'undefined') {
        window.open('https://wallet.hiro.so/', '_blank');
        return;
    }

    var appConfig = {
        appDetails: {
            name: 'DataChain Africa',
            icon: window.location.origin + '/favicon.svg'
        },
        onFinish: function (data) {
            if (data && data.userSession) {
                var userData = data.userSession.loadUserData();
                userAddress = userData.profile.stxAddress.testnet;
                onConnected(userAddress);
            }
        },
        onCancel: function () {
            console.log('Wallet connection cancelled');
        }
    };

    if (window.showConnect) {
        window.showConnect(appConfig);
    } else {
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/@stacks/connect@7/dist/index.umd.js';
        script.onload = function () {
            if (window.StacksConnect && window.StacksConnect.showConnect) {
                window.StacksConnect.showConnect(appConfig);
            }
        };
        document.head.appendChild(script);
    }
}

function onConnected(address) {
    var btn = document.getElementById('walletBtn');
    btn.textContent = address.slice(0, 6) + '...' + address.slice(-4);
    btn.classList.add('connected');
    loadDashboard(address);
    loadStxBalance(address);
    loadMarketplace();
    loadTransactionHistory(address);
}

// ============================================================
// STX Balance Display
// ============================================================
function loadStxBalance(address) {
    getAccountBalance(address)
        .then(function (data) {
            var stxBalance = document.getElementById('stxBalance');
            if (stxBalance && data && data.stx && data.stx.balance) {
                var microStx = parseInt(data.stx.balance, 10);
                var stx = (microStx / 1000000).toFixed(2);
                stxBalance.textContent = stx + ' STX';
            }
        })
        .catch(function (err) {
            console.error('STX balance load error:', err);
        });
}

function clearStxBalance() {
    var stxBalance = document.getElementById('stxBalance');
    if (stxBalance) stxBalance.textContent = '--';
}

// ============================================================
// Dashboard
// ============================================================
function loadDashboard(address) {
    var hexAddr = principalToHex(address);
    if (!hexAddr) {
        setDashboardPlaceholder();
        return;
    }
    callReadOnly('data-tracking', 'get-user-data', ['0x' + hexAddr])
        .then(function (data) {
            try {
                if (data && data.okay && data.result) {
                    var parsed = parseClarityValue(data.result);
                    // Handle optional some wrapper
                    if (parsed && typeof parsed === 'object' && parsed.type === 9) {
                        parsed = parseClarityTyped(parsed);
                    }
                    if (parsed && typeof parsed === 'object') {
                        updateDashboard(parsed);
                    } else {
                        setDashboardPlaceholder();
                    }
                } else {
                    setDashboardPlaceholder();
                }
            } catch (e) {
                console.error('Dashboard parse error:', e);
                setDashboardPlaceholder();
            }
        })
        .catch(function (err) {
            console.error('Dashboard load error:', err);
            setDashboardPlaceholder();
        });
}

function updateDashboard(usage) {
    var usedEl = document.getElementById('dataUsed');
    var balEl = document.getElementById('dataBalance');
    var planEl = document.getElementById('planType');

    if (usedEl) usedEl.textContent = usage['total-data-used'] || '0';
    if (balEl) balEl.textContent = usage['data-balance'] || '0';

    var plans = { 1: 'Daily', 2: 'Weekly', 3: 'Monthly' };
    if (planEl) planEl.textContent = plans[usage['plan-type']] || 'None';
}

function setDashboardPlaceholder() {
    var dataUsed = document.getElementById('dataUsed');
    var dataBalance = document.getElementById('dataBalance');
    var planType = document.getElementById('planType');
    if (dataUsed) dataUsed.textContent = '0';
    if (dataBalance) dataBalance.textContent = '0';
    if (planType) planType.textContent = 'None';
}

// ============================================================
// Transaction History
// ============================================================
function loadTransactionHistory(address) {
    var histContainer = document.getElementById('txHistory');
    if (!histContainer) return;

    var url = CONFIG.apiBase + '/extended/v1/address/' + address + '/transactions?limit=5';
    fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(function (r) {
            if (!r.ok) throw new Error('TX history fetch failed');
            return r.json();
        })
        .then(function (data) {
            renderTransactionHistory(histContainer, data.results || []);
        })
        .catch(function (err) {
            console.error('TX history load error:', err);
            histContainer.innerHTML = '<p class="empty-state">Could not load transaction history.</p>';
        });
}

function renderTransactionHistory(container, txs) {
    container.innerHTML = '';
    if (!txs || txs.length === 0) {
        container.innerHTML = '<p class="empty-state">No recent transactions.</p>';
        return;
    }
    var list = document.createElement('ul');
    list.className = 'tx-list';
    txs.forEach(function (tx) {
        var item = document.createElement('li');
        item.className = 'tx-item';
        var status = tx.tx_status || 'unknown';
        var txType = tx.tx_type || 'unknown';
        var shortTxId = tx.tx_id ? tx.tx_id.slice(0, 10) + '...' : 'N/A';
        item.innerHTML = '<span class="tx-id">' + shortTxId + '</span>' +
            '<span class="tx-type">' + txType + '</span>' +
            '<span class="tx-status status-' + status + '">' + status + '</span>';
        list.appendChild(item);
    });
    container.appendChild(list);
}

// ============================================================
// Plan Subscription
// ============================================================
function subscribeToPlan(planId) {
    if (!userAddress) {
        alert('Please connect your wallet first');
        return;
    }

    if (typeof window.StacksProvider === 'undefined') {
        alert('Stacks wallet not found');
        return;
    }

    var txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'billing',
        functionName: 'subscribe-and-pay',
        functionArgs: [
            uintCV(planId),
            contractPrincipalCV(CONTRACT_ADDRESS, 'data-tracking'),
            uintCV(1)
        ],
        appDetails: {
            name: 'DataChain Africa',
            icon: window.location.origin + '/favicon.svg'
        },
        onFinish: function (data) {
            alert('Subscription submitted! TX: ' + data.txId);
            // Poll for transaction status
            pollTransactionStatus(data.txId);
        },
        onCancel: function () {
            console.log('Transaction cancelled');
        }
    };

    if (window.openContractCall) {
        window.openContractCall(txOptions);
    } else if (window.StacksConnect && window.StacksConnect.openContractCall) {
        window.StacksConnect.openContractCall(txOptions);
    }
}

// ============================================================
// Transaction Status Polling
// ============================================================
function pollTransactionStatus(txid) {
    var maxAttempts = 10;
    var attempt = 0;
    var interval = setInterval(function () {
        attempt++;
        getTransactionStatus(txid)
            .then(function (tx) {
                if (tx.tx_status === 'success') {
                    clearInterval(interval);
                    console.log('Transaction confirmed:', txid);
                    if (userAddress) {
                        loadDashboard(userAddress);
                        loadTransactionHistory(userAddress);
                    }
                } else if (tx.tx_status === 'abort_by_response' || tx.tx_status === 'abort_by_post_condition') {
                    clearInterval(interval);
                    console.error('Transaction failed:', tx.tx_status);
                } else if (attempt >= maxAttempts) {
                    clearInterval(interval);
                    console.warn('Transaction polling timed out after ' + maxAttempts + ' attempts');
                }
            })
            .catch(function () {
                if (attempt >= maxAttempts) clearInterval(interval);
            });
    }, 5000);
}

// ============================================================
// Marketplace
// ============================================================
function loadMarketplace() {
    callReadOnly('marketplace', 'get-listing-count', [])
        .then(function (data) {
            if (data && data.okay && data.result) {
                var count = parseClarityUint(data.result);
                if (count > 0) {
                    loadListings(count);
                }
            }
        })
        .catch(function () {
            // No listings
        });
}

function loadListings(count) {
    var container = document.getElementById('listings');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    for (var i = 1; i <= Math.min(count, 10); i++) {
        (function (id) {
            callReadOnly('marketplace', 'get-listing', ['0x' + uintToHex(id)])
                .then(function (data) {
                    if (data && data.okay && data.result) {
                        var listing = parseClarityValue(data.result);
                        if (listing && listing['is-active']) {
                            appendListing(container, id, listing);
                        }
                    }
                });
        })(i);
    }
}

function appendListing(container, id, listing) {
    var card = document.createElement('div');
    card.className = 'listing-card';

    var info = document.createElement('div');
    var amount = document.createElement('strong');
    amount.textContent = listing['data-amount'] + ' MB';
    var price = document.createElement('span');
    price.style.marginLeft = '1rem';
    price.style.color = 'var(--muted)';
    price.textContent = (listing.price / 1000000).toFixed(2) + ' STX';
    info.appendChild(amount);
    info.appendChild(price);

    var buyBtn = document.createElement('button');
    buyBtn.className = 'btn-plan';
    buyBtn.textContent = 'Buy';
    buyBtn.addEventListener('click', function () {
        purchaseListing(id);
    });

    card.appendChild(info);
    card.appendChild(buyBtn);
    container.appendChild(card);
}

function purchaseListing(listingId) {
    if (!userAddress) {
        alert('Please connect your wallet first');
        return;
    }

    if (typeof window.StacksProvider === 'undefined') {
        alert('Stacks wallet not found');
        return;
    }

    var txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'marketplace',
        functionName: 'purchase-listing',
        functionArgs: [
            uintCV(listingId),
            contractPrincipalCV(CONTRACT_ADDRESS, 'data-tracking')
        ],
        appDetails: {
            name: 'DataChain Africa',
            icon: window.location.origin + '/favicon.svg'
        },
        onFinish: function (data) {
            alert('Purchase submitted! TX: ' + data.txId);
            pollTransactionStatus(data.txId);
            loadMarketplace();
        },
        onCancel: function () {
            console.log('Purchase cancelled');
        }
    };

    if (window.openContractCall) {
        window.openContractCall(txOptions);
    } else if (window.StacksConnect && window.StacksConnect.openContractCall) {
        window.StacksConnect.openContractCall(txOptions);
    }
}

// ============================================================
// Clarity Value Encoding Helpers
// ============================================================
function principalToHex(address) {
    var isTestnet = address.startsWith('ST');
    var versionByte = isTestnet ? 0x1a : 0x16;
    var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    function base58Decode(str) {
        var bytes = [0];
        for (var i = 0; i < str.length; i++) {
            var char = str[i];
            var value = ALPHABET.indexOf(char);
            if (value < 0) continue;
            var carry = value;
            for (var j = 0; j < bytes.length; j++) {
                carry += bytes[j] * 58;
                bytes[j] = carry & 0xff;
                carry >>= 8;
            }
            while (carry > 0) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
        }
        for (var k = 0; k < str.length && str[k] === '1'; k++) {
            bytes.push(0);
        }
        return bytes.reverse();
    }
    try {
        var decoded = base58Decode(address);
        var hashBytes = decoded.slice(1, 21);
        var result = '05' + versionByte.toString(16).padStart(2, '0');
        for (var b = 0; b < hashBytes.length; b++) {
            result += hashBytes[b].toString(16).padStart(2, '0');
        }
        return result;
    } catch (e) {
        return '';
    }
}

function uintToHex(value) {
    var hex = value.toString(16);
    while (hex.length < 32) hex = '0' + hex;
    return '01' + hex;
}

function uintCV(value) {
    return '0x01' + value.toString(16).padStart(32, '0');
}

function contractPrincipalCV(address, name) {
    return address + '.' + name;
}

function parseClarityUint(hex) {
    if (typeof hex === 'string' && hex.startsWith('0x01')) {
        return parseInt(hex.slice(4), 16);
    }
    return 0;
}

function parseClarityValue(val) {
    if (typeof val === 'object' && val !== null) {
        if (val.type !== undefined) {
            return parseClarityTyped(val);
        }
        return val;
    }
    if (typeof val === 'string' && val.startsWith('0x')) {
        return parseClarityHex(val.slice(2));
    }
    return {};
}

function parseClarityTyped(val) {
    if (val.type === 1) return val.value ? parseInt(val.value, 10) : 0;
    if (val.type === 3) return val.value === true || val.value === 'true';
    if (val.type === 12 && val.data) {
        var result = {};
        var keys = Object.keys(val.data);
        for (var i = 0; i < keys.length; i++) {
            result[keys[i]] = parseClarityTyped(val.data[keys[i]]);
        }
        return result;
    }
    if (val.type === 9 && val.value) return parseClarityTyped(val.value);
    return val.value !== undefined ? val.value : val;
}

function parseClarityHex(hex) {
    if (!hex || hex.length < 2) return {};
    var typeTag = parseInt(hex.slice(0, 2), 16);
    var data = hex.slice(2);
    if (typeTag === 0x01) return parseInt(data, 16);
    if (typeTag === 0x03) return true;
    if (typeTag === 0x04) return false;
    if (typeTag === 0x0c) return {};
    return {};
}
