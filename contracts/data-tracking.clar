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
(define-constant err-contract-paused (err u106))
(define-constant err-plan-inactive (err u107))

;; Data Plan Types
(define-constant plan-daily u1)
(define-constant plan-weekly u2)
(define-constant plan-monthly u3)

;; State
(define-data-var is-paused bool false)
(define-data-var total-data-recorded uint u0)
(define-data-var total-unique-users uint u0)

;; Data Structures
(define-map user-data-usage
    { user: principal }
    {
        total-data-used: uint,
        last-updated: uint,
        data-balance: uint,
        plan-expiry: uint,
        plan-type: uint,
        auto-renew: bool,
        rollover-data: uint
    }
)

(define-map data-plans
    { plan-id: uint }
    {
        data-amount: uint,
        duration-blocks: uint,
        price: uint,
        is-active: bool
    }
)

(define-map authorized-carriers
    { carrier: principal }
    { is-authorized: bool }
)

;; Events
(define-data-var event-counter uint u0)
(define-data-var plan-counter uint u0)

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

;; Admin Functions

(define-public (set-paused (paused bool))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (var-set is-paused paused))))

;; Initialize or update a data plan type
(define-public (set-data-plan (plan-id uint) (data-amount uint) (duration-blocks uint) (price uint))
    (begin
        (asserts! (not (var-get is-paused)) (err err-contract-paused))
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (var-set plan-counter (+ (var-get plan-counter) u1))
        (ok (map-set data-plans
            { plan-id: plan-id }
            {
                data-amount: data-amount,
                duration-blocks: duration-blocks,
                price: price,
                is-active: true
            }
        ))))

;; Deactivate a plan so no new subscriptions can use it
(define-public (deactivate-plan (plan-id uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (let ((plan (unwrap! (map-get? data-plans { plan-id: plan-id }) (err err-invalid-plan))))
            (ok (map-set data-plans
                { plan-id: plan-id }
                {
                    data-amount: (get data-amount plan),
                    duration-blocks: (get duration-blocks plan),
                    price: (get price plan),
                    is-active: false
                }
            )))))

;; Subscribe to a data plan
(define-public (subscribe-to-plan (plan-id uint) (auto-renew bool))
    (begin
        (asserts! (not (var-get is-paused)) (err err-contract-paused))
        (let
            (
                (user tx-sender)
                (plan (unwrap! (map-get? data-plans { plan-id: plan-id }) (err err-invalid-plan)))
                (current-usage (map-get? user-data-usage { user: user }))
                (rollover-amount (if (is-some current-usage)
                    (get rollover-data (unwrap-panic current-usage))
                    u0))
            )
            (asserts! (get is-active plan) (err err-plan-inactive))
            (if (is-none current-usage)
                (var-set total-unique-users (+ (var-get total-unique-users) u1))
                true)
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
            )))))

;; Record data usage with event logging
(define-public (record-usage (user principal) (usage uint))
    (begin
        (asserts! (not (var-get is-paused)) (err err-contract-paused))
        (let
            (
                (carrier tx-sender)
                (is-authorized (default-to { is-authorized: false } (map-get? authorized-carriers { carrier: carrier })))
                (current-data (unwrap! (map-get? user-data-usage { user: user }) (err err-invalid-data)))
                (event-id (+ (var-get event-counter) u1))
            )
            (asserts! (get is-authorized is-authorized) (err err-invalid-caller))
            (asserts! (<= usage (get data-balance current-data)) (err err-invalid-data))
            (asserts! (< stacks-block-height (get plan-expiry current-data)) (err err-expired-plan))

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

            (var-set event-counter event-id)
            (var-set total-data-recorded (+ (var-get total-data-recorded) usage))
            (ok (map-set usage-events
                { event-id: event-id }
                {
                    user: user,
                    usage-amount: usage,
                    timestamp: stacks-block-height,
                    carrier: carrier,
                    remaining-balance: (- (get data-balance current-data) usage)
                }
            )))))

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
            )))))

;; Allow user to toggle auto-renew for their own subscription
(define-public (set-auto-renew (enabled bool))
    (let ((current (unwrap! (map-get? user-data-usage { user: tx-sender }) (err err-invalid-data))))
        (ok (map-set user-data-usage
            { user: tx-sender }
            {
                total-data-used: (get total-data-used current),
                last-updated: (get last-updated current),
                data-balance: (get data-balance current),
                plan-expiry: (get plan-expiry current),
                plan-type: (get plan-type current),
                auto-renew: enabled,
                rollover-data: (get rollover-data current)
            }
        ))))

;; Authorize a carrier to record usage
(define-public (authorize-carrier (carrier principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (map-set authorized-carriers
            { carrier: carrier }
            { is-authorized: true }
        ))))

;; Revoke carrier authorization
(define-public (revoke-carrier (carrier principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (map-set authorized-carriers
            { carrier: carrier }
            { is-authorized: false }
        ))))

;; Update an existing data plan
(define-public (update-plan (plan-id uint) (data-amount uint) (duration-blocks uint) (price uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (is-some (map-get? data-plans { plan-id: plan-id })) (err err-invalid-plan))
        (ok (map-set data-plans
            { plan-id: plan-id }
            {
                data-amount: data-amount,
                duration-blocks: duration-blocks,
                price: price,
                is-active: true
            }
        ))))

;; Get usage data (trait-compatible wrapper)
(define-public (get-usage (user principal))
    (match (map-get? user-data-usage { user: user })
        data (ok data)
        (err err-invalid-data)))

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
        (err err-invalid-data)))

;; Check if user's plan is still valid
(define-public (check-plan-validity (user principal))
    (match (map-get? user-data-usage { user: user })
        data (ok (< stacks-block-height (get plan-expiry data)))
        (err err-invalid-data)))

;; Read-only functions

(define-read-only (get-paused)
    (var-get is-paused))

(define-read-only (get-user-data (user principal))
    (map-get? user-data-usage { user: user }))

(define-read-only (get-plan-details (plan-id uint))
    (map-get? data-plans { plan-id: plan-id }))

(define-read-only (get-usage-event (event-id uint))
    (map-get? usage-events { event-id: event-id }))

(define-read-only (get-latest-event-id)
    (var-get event-counter))

(define-read-only (get-total-plans)
    (var-get plan-counter))

(define-read-only (is-carrier-authorized (carrier principal))
    (default-to false
        (get is-authorized (map-get? authorized-carriers { carrier: carrier }))))

(define-read-only (get-total-data-recorded)
    (var-get total-data-recorded))

(define-read-only (get-total-unique-users)
    (var-get total-unique-users))

(define-read-only (get-network-summary)
    {
        total-data-recorded: (var-get total-data-recorded),
        total-unique-users: (var-get total-unique-users),
        total-events: (var-get event-counter),
        total-plans: (var-get plan-counter)
    })
