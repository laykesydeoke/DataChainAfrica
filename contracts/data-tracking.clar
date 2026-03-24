;; data-tracking.clar
;; Enhanced contract for tracking mobile data usage with plan management and events

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-caller (err u101))
(define-constant err-invalid-data (err u102))
(define-constant err-expired-plan (err u103))
(define-constant err-plan-exists (err u104))
(define-constant err-invalid-plan (err u105))
(define-constant err-data-not-found (err u106))
(define-constant err-rate-limited (err u107))
(define-constant err-price-too-high (err u108))

;; Data Plan Types
(define-constant plan-daily u1)
(define-constant plan-weekly u2)
(define-constant plan-monthly u3)

;; Data Structures
(define-map user-data-usage
    { user: principal }
    {
        total-data-used: uint,      ;; in megabytes
        last-updated: uint,         ;; blockchain height
        data-balance: uint,         ;; remaining data in megabytes
        plan-expiry: uint,          ;; expiry block height
        plan-type: uint,            ;; type of plan (daily/weekly/monthly)
        auto-renew: bool,           ;; auto renewal setting
        rollover-data: uint         ;; unused data from previous period
    }
)

(define-map data-plans
    { plan-id: uint }
    {
        data-amount: uint,          ;; in megabytes
        duration-blocks: uint,      ;; plan duration in blocks
        price: uint,                ;; plan price in microSTX
        is-active: bool             ;; whether plan is currently offered
    }
)

(define-map authorized-carriers
    { carrier: principal }
    { is-authorized: bool }
)

;; Rate limiting: track last block each user had usage recorded
(define-map last-usage-block
    { user: principal }
    { block-height: uint }
)

;; Rollover cap: max 2x plan data can be rolled over
(define-data-var rollover-cap-multiplier uint u2)

;; Max price for any plan (in microSTX) - default 1 billion microSTX = 1000 STX
(define-data-var max-plan-price uint u1000000000)

;; Events
(define-data-var event-counter uint u0)

(define-map usage-events
    { event-id: uint }
    {
        user: principal,
        usage-amount: uint,
        timestamp: uint,
        carrier: principal,
        remaining-balance: uint
    }
)

;; Public Functions

;; Initialize or update a data plan type
(define-public (set-data-plan (plan-id uint) (data-amount uint) (duration-blocks uint) (price uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (> data-amount u0) (err err-invalid-data))
        (asserts! (> duration-blocks u0) (err err-invalid-data))
        (asserts! (> price u0) (err err-invalid-data))
        (asserts! (<= price (var-get max-plan-price)) (err err-price-too-high))
        (ok (map-set data-plans
            { plan-id: plan-id }
            {
                data-amount: data-amount,
                duration-blocks: duration-blocks,
                price: price,
                is-active: true
            }
        ))
    )
)

;; Subscribe to a data plan
(define-public (subscribe-to-plan (plan-id uint) (auto-renew bool))
    (let
        (
            (user tx-sender)
            (plan (unwrap! (map-get? data-plans { plan-id: plan-id }) (err err-invalid-plan)))
            (current-usage (map-get? user-data-usage { user: user }))
            (raw-rollover (match current-usage
                usage-data (get rollover-data usage-data)
                u0))
            (max-rollover (* (get data-amount plan) (var-get rollover-cap-multiplier)))
            (rollover-amount (if (> raw-rollover max-rollover)
                max-rollover
                raw-rollover))
        )
        (asserts! (get is-active plan) (err err-invalid-plan))

        (print { action: "subscribe", user: user, plan-id: plan-id,
                 data-amount: (get data-amount plan), block: stacks-block-height })

        (ok (map-set user-data-usage
            { user: user }
            {
                total-data-used: u0,
                last-updated: stacks-block-height,
                data-balance: (+ (get data-amount plan) rollover-amount),
                plan-expiry: (+ stacks-block-height (get duration-blocks plan)),
                plan-type: plan-id,
                auto-renew: auto-renew,
                rollover-data: u0
            }
        ))
    )
)

;; Record data usage with event logging
(define-public (record-usage (user principal) (usage uint))
    (let
        (
            (carrier tx-sender)
            (is-authorized (default-to { is-authorized: false } (map-get? authorized-carriers { carrier: carrier })))
            (current-data (unwrap! (map-get? user-data-usage { user: user }) (err err-invalid-data)))
            (event-id (+ (var-get event-counter) u1))
            (last-block (default-to { block-height: u0 } (map-get? last-usage-block { user: user })))
        )
        (asserts! (get is-authorized is-authorized) (err err-invalid-caller))
        (asserts! (<= usage (get data-balance current-data)) (err err-invalid-data))
        (asserts! (< stacks-block-height (get plan-expiry current-data)) (err err-expired-plan))
        ;; Rate limit: require at least 1 block between usage recordings per user
        (asserts! (> stacks-block-height (get block-height last-block)) (err err-rate-limited))

        ;; Update last-usage-block for rate limiting
        (map-set last-usage-block
            { user: user }
            { block-height: stacks-block-height }
        )

        ;; Update usage data
        (map-set user-data-usage
            { user: user }
            {
                total-data-used: (+ (get total-data-used current-data) usage),
                last-updated: stacks-block-height,
                data-balance: (- (get data-balance current-data) usage),
                plan-expiry: (get plan-expiry current-data),
                plan-type: (get plan-type current-data),
                auto-renew: (get auto-renew current-data),
                rollover-data: (get rollover-data current-data)
            }
        )

        ;; Emit event log
        (print { action: "record-usage", user: user, carrier: carrier,
                 usage: usage, remaining: (- (get data-balance current-data) usage),
                 block: stacks-block-height })

        ;; Log usage event
        (var-set event-counter event-id)
        (ok (map-set usage-events
            { event-id: event-id }
            {
                user: user,
                usage-amount: usage,
                timestamp: stacks-block-height,
                carrier: carrier,
                remaining-balance: (- (get data-balance current-data) usage)
            }
        ))
    )
)

;; Handle plan expiry and auto-renewal
(define-public (process-plan-expiry (user principal))
    (let
        (
            (current-data (unwrap! (map-get? user-data-usage { user: user }) (err err-invalid-data)))
            (current-plan (unwrap! (map-get? data-plans { plan-id: (get plan-type current-data) }) (err err-invalid-plan)))
        )
        (asserts! (>= stacks-block-height (get plan-expiry current-data)) (err err-invalid-data))
        
        (if (get auto-renew current-data)
            (ok (map-set user-data-usage
                { user: user }
                {
                    total-data-used: u0,
                    last-updated: stacks-block-height,
                    data-balance: (+ (get data-amount current-plan) (get data-balance current-data)),
                    plan-expiry: (+ stacks-block-height (get duration-blocks current-plan)),
                    plan-type: (get plan-type current-data),
                    auto-renew: true,
                    rollover-data: (get data-balance current-data)
                }
            ))
            (ok (map-set user-data-usage
                { user: user }
                {
                    total-data-used: (get total-data-used current-data),
                    last-updated: stacks-block-height,
                    data-balance: u0,
                    plan-expiry: stacks-block-height,
                    plan-type: (get plan-type current-data),
                    auto-renew: false,
                    rollover-data: u0
                }
            ))
        )
    )
)

;; Marketplace authorization for data transfers
(define-map authorized-marketplaces
    { marketplace: principal }
    { is-authorized: bool }
)

(define-public (authorize-marketplace (marketplace principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (map-set authorized-marketplaces
            { marketplace: marketplace }
            { is-authorized: true }
        ))
    )
)

;; Transfer data balance between users (marketplace only)
(define-public (transfer-data-balance (from principal) (to principal) (amount uint))
    (let
        ((is-auth (default-to { is-authorized: false }
            (map-get? authorized-marketplaces { marketplace: tx-sender })))
         (from-data (unwrap! (map-get? user-data-usage { user: from }) (err err-invalid-data)))
         (to-data (default-to
            {
                total-data-used: u0,
                last-updated: stacks-block-height,
                data-balance: u0,
                plan-expiry: stacks-block-height,
                plan-type: u0,
                auto-renew: false,
                rollover-data: u0
            }
            (map-get? user-data-usage { user: to }))))
        (asserts! (get is-authorized is-auth) (err err-invalid-caller))
        (asserts! (> amount u0) (err err-invalid-data))
        (asserts! (<= amount (get data-balance from-data)) (err err-invalid-data))
        ;; Deduct from seller
        (map-set user-data-usage
            { user: from }
            (merge from-data {
                data-balance: (- (get data-balance from-data) amount),
                last-updated: stacks-block-height
            })
        )
        ;; Add to buyer
        (map-set user-data-usage
            { user: to }
            (merge to-data {
                data-balance: (+ (get data-balance to-data) amount),
                last-updated: stacks-block-height
            })
        )
        (print { action: "transfer-data-balance", from: from, to: to,
                 amount: amount, block: stacks-block-height })
        (ok true)
    )
)

;; Authorize a carrier to record usage
(define-public (authorize-carrier (carrier principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (map-set authorized-carriers
            { carrier: carrier }
            { is-authorized: true }
        ))
    )
)

;; Revoke carrier authorization
(define-public (revoke-carrier (carrier principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (map-set authorized-carriers
            { carrier: carrier }
            { is-authorized: false }
        ))
    )
)

;; Deactivate a plan so no new subscriptions can use it
(define-public (deactivate-plan (plan-id uint))
    (let
        ((plan (unwrap! (map-get? data-plans { plan-id: plan-id }) (err err-invalid-plan))))
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (map-set data-plans
            { plan-id: plan-id }
            (merge plan { is-active: false })
        ))
    )
)

;; Update an existing data plan
(define-public (update-plan (plan-id uint) (data-amount uint) (duration-blocks uint) (price uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (is-some (map-get? data-plans { plan-id: plan-id })) (err err-invalid-plan))
        (asserts! (> price u0) (err err-invalid-data))
        (asserts! (<= price (var-get max-plan-price)) (err err-price-too-high))
        (asserts! (> data-amount u0) (err err-invalid-data))
        (ok (map-set data-plans
            { plan-id: plan-id }
            {
                data-amount: data-amount,
                duration-blocks: duration-blocks,
                price: price,
                is-active: true
            }
        ))
    )
)

;; Admin: configure the maximum allowed price for a plan
(define-public (set-max-plan-price (new-max uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (> new-max u0) (err err-invalid-data))
        (var-set max-plan-price new-max)
        (ok true))
)

;; Get usage data (trait-compatible wrapper)
(define-public (get-usage (user principal))
    (match (map-get? user-data-usage { user: user })
        data (ok data)
        (err err-invalid-data)
    )
)

;; Get usage history by event id for a user
(define-public (get-usage-history (user principal) (event-id uint))
    (match (map-get? usage-events { event-id: event-id })
        event (if (is-eq (get user event) user)
            (ok {
                usage-amount: (get usage-amount event),
                timestamp: (get timestamp event),
                carrier: (get carrier event),
                remaining-balance: (get remaining-balance event)
            })
            (err err-invalid-data))
        (err err-invalid-data)
    )
)

;; Check if user's plan is still valid
(define-public (check-plan-validity (user principal))
    (match (map-get? user-data-usage { user: user })
        data (ok (< stacks-block-height (get plan-expiry data)))
        (err err-invalid-data)
    )
)

;; Read-only functions

;; Get user's current data usage and plan details
(define-read-only (get-user-data (user principal))
    (map-get? user-data-usage { user: user })
)

;; Get plan details (trait-compatible: returns response)
(define-read-only (get-plan-details (plan-id uint))
    (match (map-get? data-plans { plan-id: plan-id })
        plan (ok plan)
        (err u999))
)

;; Get usage event details
(define-read-only (get-usage-event (event-id uint))
    (map-get? usage-events { event-id: event-id })
)

;; Get latest event ID
(define-read-only (get-latest-event-id)
    (var-get event-counter)
)

;; Check if carrier is authorized
(define-read-only (is-carrier-authorized (carrier principal))
    (default-to false
        (get is-authorized (map-get? authorized-carriers { carrier: carrier })))
)

;; Get max plan price setting
(define-read-only (get-max-plan-price)
    (var-get max-plan-price))

;; Get last usage block for a user (rate limiting)
(define-read-only (get-last-usage-block (user principal))
    (default-to u0
        (get block-height (map-get? last-usage-block { user: user })))
)
