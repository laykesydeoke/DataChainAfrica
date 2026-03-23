var API_URL = 'https://api.testnet.hiro.so';
var CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
var userAddress = null;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('walletBtn').addEventListener('click', handleWalletClick);

    var planButtons = document.querySelectorAll('.btn-plan');
    planButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var planId = this.getAttribute('data-plan');
            subscribeToPlan(parseInt(planId));
        });
    });

    checkExistingSession();
});

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
    loadMarketplace();
}

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
    document.getElementById('dataUsed').textContent = '0';
    document.getElementById('dataBalance').textContent = '0';
    document.getElementById('planType').textContent = 'None';
}

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
            uintCV(0)
        ],
        appDetails: {
            name: 'DataChain Africa',
            icon: window.location.origin + '/favicon.svg'
        },
        onFinish: function (data) {
            alert('Subscription submitted! TX: ' + data.txId);
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

function callReadOnly(contract, fnName, args) {
    var url = API_URL + '/v2/contracts/call-read/' +
        CONTRACT_ADDRESS + '/' + contract + '/' + fnName;
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sender: CONTRACT_ADDRESS,
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

function principalToHex(address) {
    // Encode a Stacks principal as Clarity serialized bytes
    // Version byte: 0x16 for mainnet P2PKH, 0x1a for testnet P2PKH
    var isTestnet = address.startsWith('ST');
    var versionByte = isTestnet ? 0x1a : 0x16;
    // Base58 alphabet
    var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    // Decode base58 address to bytes
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
        // Add leading zero bytes
        for (var k = 0; k < str.length && str[k] === '1'; k++) {
            bytes.push(0);
        }
        return bytes.reverse();
    }
    try {
        var decoded = base58Decode(address);
        // decoded is [version(1)] + [hash160(20)] + [checksum(4)]
        var hashBytes = decoded.slice(1, 21);
        // Clarity standard principal: 0x05 (type) + version(1) + hash160(20)
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
    // Handle already-parsed objects
    if (typeof val === 'object' && val !== null) {
        // Clarity response object with type tag
        if (val.type !== undefined) {
            return parseClarityTyped(val);
        }
        return val;
    }
    // Handle hex-encoded Clarity values
    if (typeof val === 'string' && val.startsWith('0x')) {
        return parseClarityHex(val.slice(2));
    }
    return {};
}

function parseClarityTyped(val) {
    // type 1 = uint, type 3 = bool, type 12 = tuple, type 9 = optional some
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
    // 0x01 = uint (16 bytes big-endian)
    if (typeTag === 0x01) return parseInt(data, 16);
    // 0x03 = true, 0x04 = false
    if (typeTag === 0x03) return true;
    if (typeTag === 0x04) return false;
    // 0x0c = tuple
    if (typeTag === 0x0c) return {};
    return {};
}
