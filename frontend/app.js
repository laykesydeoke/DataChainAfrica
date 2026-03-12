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
    console.log('Purchase listing:', listingId);
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

function parseClarityValue(val) {
    if (typeof val === 'object') return val;
    return {};
}
