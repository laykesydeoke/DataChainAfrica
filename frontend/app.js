var API_URL = 'https://stacks-node-api.testnet.stacks.co';
var CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('walletBtn').addEventListener('click', connectWallet);

    var planButtons = document.querySelectorAll('.btn-plan');
    planButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var planId = this.getAttribute('data-plan');
            subscribeToPlan(planId);
        });
    });
});

function connectWallet() {
    var btn = document.getElementById('walletBtn');
    if (typeof window.StacksProvider !== 'undefined') {
        window.StacksProvider.authenticationRequest()
            .then(function () {
                btn.textContent = 'Connected';
                btn.disabled = true;
                loadDashboard();
                loadMarketplace();
            })
            .catch(function (err) {
                console.error('Wallet error:', err);
            });
    } else {
        window.open('https://wallet.hiro.so/', '_blank');
    }
}

function loadDashboard() {
    callReadOnly('data-tracking', 'get-user-data', [])
        .then(function (data) {
            if (data && data.result) {
                updateDashboard(data.result);
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
    console.log('Subscribe to plan:', planId);
}

function loadMarketplace() {
    callReadOnly('marketplace', 'get-listing-count', [])
        .then(function (data) {
            console.log('Listings:', data);
        })
        .catch(function (err) {
            console.log('No listings available');
        });
}

function callReadOnly(contract, fnName, args) {
    var url = API_URL + '/v2/contracts/call-read/' +
        CONTRACT_ADDRESS + '/' + contract + '/' + fnName;
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: args || [] })
    }).then(function (r) { return r.json(); });
}
