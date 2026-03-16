var API_URL = 'https://api.testnet.hiro.so';
var CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
var userAddress = null;

function loadTelemetryDashboard() {
    Promise.all([
        callReadOnly('data-tracking', 'get-telemetry-snapshot', []),
        callReadOnly('billing', 'get-billing-telemetry', [])
    ]).then(function (results) {
        var snap = parseClarityValue(results[0] && results[0].result);
        var bil = parseClarityValue(results[1] && results[1].result);
        var telDataEl = document.getElementById('telTotalData');
        var telUsersEl = document.getElementById('telUniqueUsers');
        var telEventsEl = document.getElementById('telEventCount');
        var telRevenueEl = document.getElementById('telRevenue');
        if (telDataEl) telDataEl.textContent = parseClarityUint(snap['total-data-recorded']) || '--';
        if (telUsersEl) telUsersEl.textContent = parseClarityUint(snap['total-unique-users']) || '--';
        if (telEventsEl) telEventsEl.textContent = parseClarityUint(snap['event-count']) || '--';
        if (telRevenueEl) telRevenueEl.textContent = parseClarityUint(bil['total-revenue-stx']) || '--';
    }).catch(function () {});
}

function loadGovernanceDashboard(address) {
    if (!address) return;
    Promise.all([
        callReadOnly('data-tracking', 'get-user-plan-type', [principalCV(address)]),
        callReadOnly('data-tracking', 'get-plan-expiry', [principalCV(address)]),
        callReadOnly('data-tracking', 'get-user-auto-renew', [principalCV(address)])
    ]).then(function (results) {
        var planType = document.getElementById('govPlanType');
        var planExpiry = document.getElementById('govPlanExpiry');
        var autoRenew = document.getElementById('govAutoRenew');
        if (planType) planType.textContent = parseClarityUint(results[0] && results[0].result) || '--';
        if (planExpiry) planExpiry.textContent = parseClarityUint(results[1] && results[1].result) || '--';
        if (autoRenew) autoRenew.textContent = parseClarityBool(results[2] && results[2].result) ? 'On' : 'Off';
    }).catch(function () {});
}

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
    loadAnalyticsDashboard();
    loadUserAnalytics(address);

    var userAnalyticsSection = document.getElementById('userAnalytics');
    if (userAnalyticsSection) userAnalyticsSection.style.display = 'block';

    var cancelBtn = document.getElementById('cancelSubBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
}

function cancelSubscription() {
    if (!userAddress) {
        alert('Please connect your wallet first');
        return;
    }

    var txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'billing',
        functionName: 'cancel-subscription',
        functionArgs: [],
        appDetails: {
            name: 'DataChain Africa',
            icon: window.location.origin + '/favicon.svg'
        },
        onFinish: function (data) {
            showToast('Cancellation submitted! TX: ' + data.txId.slice(0, 10) + '...');
        },
        onCancel: function () {
            console.log('Cancellation declined');
        }
    };

    if (window.openContractCall) {
        window.openContractCall(txOptions);
    } else if (window.StacksConnect && window.StacksConnect.openContractCall) {
        window.StacksConnect.openContractCall(txOptions);
    }
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

function loadAnalyticsDashboard() {
    Promise.all([
        callReadOnly('billing', 'get-platform-summary', []),
        callReadOnly('data-tracking', 'get-network-summary', [])
    ]).then(function (results) {
        var billing = results[0] && results[0].okay ? parseClarityValue(results[0].result) : {};
        var network = results[1] && results[1].okay ? parseClarityValue(results[1].result) : {};

        var revEl = document.getElementById('analyticRevenue');
        var subEl = document.getElementById('analyticSubscribers');
        var dataEl = document.getElementById('analyticDataRecorded');
        var usersEl = document.getElementById('analyticUsers');

        if (revEl && billing['total-revenue'] !== undefined) {
            revEl.textContent = (billing['total-revenue'] / 1000000).toFixed(2) + ' STX';
        }
        if (subEl && billing['total-subscribers'] !== undefined) {
            subEl.textContent = billing['total-subscribers'];
        }
        if (dataEl && network['total-data-recorded'] !== undefined) {
            dataEl.textContent = network['total-data-recorded'] + ' MB';
        }
        if (usersEl && network['total-unique-users'] !== undefined) {
            usersEl.textContent = network['total-unique-users'];
        }
    }).catch(function () {
        // Silently fail
    });
}

function loadUserAnalytics(address) {
    callReadOnly('billing', 'get-user-payment-count', [
        '0x' + principalToHex(address)
    ]).then(function (data) {
        if (!data || !data.okay) return;
        var count = parseClarityUint(data.result);
        var el = document.getElementById('userPaymentCount');
        if (el) el.textContent = count;
    }).catch(function () {});

    callReadOnly('marketplace', 'get-buyer-stats', [
        '0x' + principalToHex(address)
    ]).then(function (data) {
        if (!data || !data.okay) return;
        var stats = parseClarityValue(data.result);
        var el = document.getElementById('userBoughtData');
        if (el && stats['total-data-bought'] !== undefined) {
            el.textContent = stats['total-data-bought'] + ' MB';
        }
    }).catch(function () {});
}

function loadMarketplaceAnalytics() {
    callReadOnly('marketplace', 'get-marketplace-summary', [])
        .then(function (data) {
            if (!data || !data.okay) return;
            var summary = parseClarityValue(data.result);
            var volEl = document.getElementById('mktVolume');
            var tradesEl = document.getElementById('mktTrades');
            var listingsEl = document.getElementById('mktListings');
            if (volEl && summary['total-volume'] !== undefined) {
                volEl.textContent = (summary['total-volume'] / 1000000).toFixed(2) + ' STX';
            }
            if (tradesEl && summary['total-trades'] !== undefined) {
                tradesEl.textContent = summary['total-trades'];
            }
            if (listingsEl && summary['total-listings'] !== undefined) {
                listingsEl.textContent = summary['total-listings'];
            }
        }).catch(function () {});
}

function loadBillingStats(address) {
    if (!address) return;
    Promise.all([
        callReadOnly('billing', 'get-grace-period-remaining', ['0x' + principalToHex(address)]),
        callReadOnly('billing', 'get-subscription-plan', ['0x' + principalToHex(address)])
    ]).then(function (results) {
        var graceEl = document.getElementById('graceRemaining');
        var planEl = document.getElementById('currentPlan');
        if (graceEl && results[0] && results[0].okay) {
            var blocks = parseClarityUint(results[0].result);
            graceEl.textContent = blocks > 0 ? blocks + ' blocks' : 'None';
        }
        if (planEl && results[1] && results[1].okay) {
            var plans = { 1: 'Daily', 2: 'Weekly', 3: 'Monthly' };
            var planId = parseClarityUint(results[1].result);
            planEl.textContent = plans[planId] || 'None';
        }
    }).catch(function () {});
}

function loadCarrierStats(carrierAddress) {
    if (!carrierAddress) return;
    callReadOnly('data-tracking', 'get-carrier-stats', [
        '0x' + principalToHex(carrierAddress)
    ]).then(function (data) {
        if (!data || !data.okay) return;
        var stats = parseClarityValue(data.result);
        var usageEl = document.getElementById('carrierUsage');
        var eventsEl = document.getElementById('carrierEvents');
        if (usageEl && stats['total-usage-reported'] !== undefined) {
            usageEl.textContent = stats['total-usage-reported'] + ' MB';
        }
        if (eventsEl && stats['total-events'] !== undefined) {
            eventsEl.textContent = stats['total-events'];
        }
    }).catch(function () {});
}

function extendListing(listingId, extraBlocks) {
    if (!userAddress) return;

    var txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'marketplace',
        functionName: 'extend-listing-duration',
        functionArgs: [uintCV(listingId), uintCV(extraBlocks)],
        appDetails: { name: 'DataChain Africa', icon: window.location.origin + '/favicon.svg' },
        onFinish: function (data) {
            showToast('Listing extended! TX: ' + data.txId.slice(0, 10) + '...');
        },
        onCancel: function () {}
    };

    if (window.openContractCall) window.openContractCall(txOptions);
    else if (window.StacksConnect && window.StacksConnect.openContractCall) {
        window.StacksConnect.openContractCall(txOptions);
    }
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

// Data staking
async function loadStakingParams() {
  const result = await callReadOnly('marketplace', 'get-staking-params', []);
  if (result) {
    document.getElementById('staking-params').textContent = JSON.stringify(result);
  }
}
