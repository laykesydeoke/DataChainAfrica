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
    checkPausedState();
});

function checkPausedState() {
    Promise.all([
        callReadOnly('billing', 'get-paused', []),
        callReadOnly('marketplace', 'get-paused', [])
    ]).then(function (results) {
        var billingPaused = parseClarityBool(results[0] && results[0].result);
        var marketPaused = parseClarityBool(results[1] && results[1].result);

        var banner = document.getElementById('pauseBanner');
        if (!banner) return;

        if (billingPaused || marketPaused) {
            var msg = [];
            if (billingPaused) msg.push('Billing');
            if (marketPaused) msg.push('Marketplace');
            banner.textContent = msg.join(' & ') + ' temporarily paused for maintenance.';
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    }).catch(function () {
        // Silently fail if API unreachable
    });
}

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
    loadPlatformStats();
}

function loadDashboard(address) {
    callReadOnly('data-tracking', 'get-user-data', [
        '0x' + principalToHex(address)
    ])
        .then(function (data) {
            if (data && data.okay && data.result) {
                updateDashboard(parseClarityValue(data.result));
            } else {
                setDashboardPlaceholder();
            }
        })
        .catch(function () {
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
    var usedEl = document.getElementById('dataUsed');
    var balEl = document.getElementById('dataBalance');
    var planEl = document.getElementById('planType');
    if (usedEl) usedEl.textContent = '0';
    if (balEl) balEl.textContent = '0';
    if (planEl) planEl.textContent = 'None';
}

function loadPlatformStats() {
    callReadOnly('marketplace', 'get-platform-stats', [])
        .then(function (data) {
            if (!data || !data.okay || !data.result) return;
            var stats = parseClarityValue(data.result);
            var volEl = document.getElementById('statVolume');
            var tradeEl = document.getElementById('statTrades');
            var listEl = document.getElementById('statListings');
            if (volEl && stats['total-volume']) {
                volEl.textContent = (stats['total-volume'] / 1000000).toFixed(0) + ' STX';
            }
            if (tradeEl && stats['total-trades']) {
                tradeEl.textContent = stats['total-trades'];
            }
            if (listEl && stats['total-listings']) {
                listEl.textContent = stats['total-listings'];
            }
        })
        .catch(function () {
            // Silently fail
        });
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
            showToast('Subscription submitted! TX: ' + data.txId.slice(0, 10) + '...');
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
    if (!container) return;
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
            showToast('Purchase submitted! TX: ' + data.txId.slice(0, 10) + '...');
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

function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(function () {
        toast.classList.remove('visible');
    }, 4000);
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
    }).then(function (r) { return r.json(); });
}

function principalToHex(address) {
    return '';
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

function parseClarityBool(hex) {
    if (hex === '0x03') return true;
    if (hex === '0x04') return false;
    return false;
}

function parseClarityValue(val) {
    if (typeof val === 'object') return val;
    return {};
}
