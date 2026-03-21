;; billing.clar

;; Import traits
(use-trait data-tracking-trait .data-traits.data-tracking-trait)
(use-trait marketplace-trait .data-traits.marketplace-trait)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-insufficient-funds (err u201))
(define-constant err-invalid-plan (err u202))
(define-constant err-payment-failed (err u203))
(define-constant err-no-subscription (err u204))
(define-constant err-grace-period-expired (err u205))
(define-constant err-invalid-discount (err u206))
(define-constant err-contract-paused (err u207))
(define-constant err-invalid-amount (err u208))
(define-constant err-already-cancelled (err u209))

;; State
(define-data-var is-paused bool false)
(define-data-var total-revenue uint u0)
(define-data-var total-subscribers uint u0)

;; Data Structures
(define-map user-subscriptions
    { user: principal }
    {
        current-plan-id: uint,
        last-payment: uint,
        payment-due: uint,
        payment-status: bool,
        subscription-start: uint,
        total-payments: uint,
        grace-period-end: uint,
        discount-rate: uint
    }
)

(define-map payment-history
    { payment-id: uint }
    {
        user: principal,
        amount: uint,
        timestamp: uint,
        plan-id: uint,
        status: bool,
        discount-applied: uint
    }
)

(define-map promotional-rates
    { promo-id: uint }
    {
        discount-percentage: uint,
        valid-until: uint,
        min-subscription-months: uint
    }
)

;; Track per-user payment count
(define-map user-payment-count
    { user: principal }
    { count: uint }
)

(define-data-var payment-counter uint u0)
(define-data-var grace-period-blocks uint u144)

;; Helper Functions
(define-private (process-subscription-payment (price uint) (sender principal))
    (let
        ((subscription (default-to
            {
                current-plan-id: u0,
                last-payment: u0,
                payment-due: u0,
                payment-status: true,
                subscription-start: u0,
                total-payments: u0,
                grace-period-end: u0,
                discount-rate: u0
            }
            (map-get? user-subscriptions { user: sender }))))

        (let
            ((discounted-price (if (> (get discount-rate subscription) u0)
                (/ (* price (- u100 (get discount-rate subscription))) u100)
                price)))
            (stx-transfer? discounted-price sender contract-owner))))

(define-private (record-subscription
    (user principal)
    (plan-id uint)
    (price uint)
    (payment-id uint)
    (discount-rate uint))
    (begin
        (map-set user-subscriptions
            { user: user }
            {
                current-plan-id: plan-id,
                last-payment: stacks-block-height,
                payment-due: u0,
                payment-status: true,
                subscription-start: stacks-block-height,
                total-payments: price,
                grace-period-end: (+ stacks-block-height (var-get grace-period-blocks)),
                discount-rate: discount-rate
            }
        )
        (map-set payment-history
            { payment-id: payment-id }
            {
                user: user,
                amount: price,
                timestamp: stacks-block-height,
                plan-id: plan-id,
                status: true,
                discount-applied: discount-rate
            }
        )
        ;; Update per-user payment count
        (let ((current-count (default-to { count: u0 }
                (map-get? user-payment-count { user: user }))))
            (map-set user-payment-count
                { user: user }
                { count: (+ (get count current-count) u1) }
            ))))

;; Admin Functions
(define-public (set-paused (paused bool))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (var-set is-paused paused))))

(define-public (update-grace-period (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (> blocks u0) (err err-invalid-amount))
        (ok (var-set grace-period-blocks blocks))))

(define-public (set-promotional-rate (promo-id uint) (discount uint) (valid-blocks uint) (min-months uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (<= discount u100) (err err-invalid-discount))
        (ok (map-set promotional-rates
            { promo-id: promo-id }
            {
                discount-percentage: discount,
                valid-until: (+ stacks-block-height valid-blocks),
                min-subscription-months: min-months
            }
        ))))

;; Cancel subscription (mark payment as due, disabling access at grace period end)
(define-public (cancel-subscription)
    (let ((subscription (unwrap! (map-get? user-subscriptions { user: tx-sender })
                                 (err err-no-subscription))))
        (asserts! (get payment-status subscription) (err err-already-cancelled))
        (ok (map-set user-subscriptions
            { user: tx-sender }
            {
                current-plan-id: (get current-plan-id subscription),
                last-payment: (get last-payment subscription),
                payment-due: stacks-block-height,
                payment-status: false,
                subscription-start: (get subscription-start subscription),
                total-payments: (get total-payments subscription),
                grace-period-end: (+ stacks-block-height (var-get grace-period-blocks)),
                discount-rate: (get discount-rate subscription)
            }
        ))))

;; Public Functions
(define-public (subscribe-and-pay
    (plan-id uint)
    (tracking-contract <data-tracking-trait>)
    (promo-id uint))
    (begin
        (asserts! (not (var-get is-paused)) (err err-contract-paused))
        (let
            ((plan-details (unwrap! (contract-call? tracking-contract get-plan-details plan-id)
                                   (err err-invalid-plan)))
             (promo (map-get? promotional-rates { promo-id: promo-id })))
            (let
                ((payment-id (+ (var-get payment-counter) u1))
                 (discount-rate (if (and
                                    (is-some promo)
                                    (< stacks-block-height (get valid-until (unwrap-panic promo))))
                                (get discount-percentage (unwrap-panic promo))
                                u0)))
                (begin
                    (unwrap! (process-subscription-payment (get price plan-details) tx-sender)
                            (err err-payment-failed))
                    (record-subscription
                        tx-sender
                        plan-id
                        (get price plan-details)
                        payment-id
                        discount-rate)
                    (var-set payment-counter payment-id)
                    (var-set total-revenue (+ (var-get total-revenue) (get price plan-details)))
                    (var-set total-subscribers (+ (var-get total-subscribers) u1))
                    (unwrap! (contract-call? tracking-contract subscribe-to-plan plan-id true)
                            (err err-invalid-plan))
                    (ok true))))))

(define-public (process-renewal-payment (tracking-contract <data-tracking-trait>))
    (begin
        (asserts! (not (var-get is-paused)) (err err-contract-paused))
        (let
            ((user tx-sender)
             (subscription (unwrap! (map-get? user-subscriptions { user: tx-sender })
                                   (err err-no-subscription))))
            (let
                ((plan-details (unwrap! (contract-call? tracking-contract get-plan-details
                                       (get current-plan-id subscription))
                                       (err err-invalid-plan))))
                (let
                    ((payment-id (+ (var-get payment-counter) u1)))
                    (begin
                        (asserts! (not (get payment-status subscription))
                                 (err err-payment-failed))
                        (asserts! (<= stacks-block-height (get grace-period-end subscription))
                                 (err err-grace-period-expired))
                        (unwrap! (process-subscription-payment (get price plan-details) user)
                                (err err-payment-failed))
                        (record-subscription
                            user
                            (get current-plan-id subscription)
                            (get price plan-details)
                            payment-id
                            (get discount-rate subscription))
                        (var-set payment-counter payment-id)
                        (var-set total-revenue (+ (var-get total-revenue) (get price plan-details)))
                        (ok true)))))))

;; Read-only Functions
(define-read-only (get-paused)
    (var-get is-paused))

(define-read-only (get-subscription (user principal))
    (map-get? user-subscriptions { user: user }))

(define-read-only (get-payment (payment-id uint))
    (map-get? payment-history { payment-id: payment-id }))

(define-read-only (get-promotional-rate (promo-id uint))
    (map-get? promotional-rates { promo-id: promo-id }))

(define-read-only (get-grace-period)
    (var-get grace-period-blocks))

(define-read-only (is-payment-due (user principal))
    (let
        ((subscription (default-to
            {
                current-plan-id: u0,
                last-payment: u0,
                payment-due: u0,
                payment-status: true,
                subscription-start: u0,
                total-payments: u0,
                grace-period-end: u0,
                discount-rate: u0
            }
            (map-get? user-subscriptions { user: user }))))
        (not (get payment-status subscription))))

(define-read-only (get-user-payment (payment-id uint) (user principal))
    (let ((payment (map-get? payment-history { payment-id: payment-id })))
        (if (and
            (is-some payment)
            (is-eq (get user (unwrap-panic payment)) user))
            payment
            none)))

(define-read-only (get-subscription-status (user principal))
    (let ((subscription (default-to
            {
                current-plan-id: u0,
                last-payment: u0,
                payment-due: u0,
                payment-status: false,
                subscription-start: u0,
                total-payments: u0,
                grace-period-end: u0,
                discount-rate: u0
            }
            (map-get? user-subscriptions { user: user }))))
        {
            is-active: (and
                        (get payment-status subscription)
                        (<= stacks-block-height (get grace-period-end subscription))),
            days-remaining: (if (> (get grace-period-end subscription) stacks-block-height)
                (/ (- (get grace-period-end subscription) stacks-block-height) u144)
                u0),
            current-discount: (get discount-rate subscription)
        }))

(define-read-only (is-promotion-valid (promo-id uint))
    (match (map-get? promotional-rates { promo-id: promo-id })
        promo (> (get valid-until promo) stacks-block-height)
        false))

(define-read-only (get-payment-details (payment-id uint))
    (default-to
        {
            user: tx-sender,
            amount: u0,
            timestamp: u0,
            plan-id: u0,
            status: false,
            discount-applied: u0
        }
        (map-get? payment-history { payment-id: payment-id })))

(define-read-only (get-total-payments)
    (var-get payment-counter))

(define-read-only (get-total-revenue)
    (var-get total-revenue))

(define-read-only (get-total-subscribers)
    (var-get total-subscribers))

(define-read-only (get-user-payment-count (user principal))
    (default-to u0
        (get count (map-get? user-payment-count { user: user }))))

(define-read-only (get-platform-summary)
    {
        total-revenue: (var-get total-revenue),
        total-subscribers: (var-get total-subscribers),
        total-payments: (var-get payment-counter)
    })

(define-read-only (get-subscription-age (user principal))
    (match (map-get? user-subscriptions { user: user })
        sub (if (> stacks-block-height (get subscription-start sub))
                (- stacks-block-height (get subscription-start sub))
                u0)
        u0))

(define-read-only (get-subscription-plan (user principal))
    (match (map-get? user-subscriptions { user: user })
        sub (some (get current-plan-id sub))
        none))

(define-read-only (get-user-discount (user principal))
    (default-to u0
        (get discount-rate (map-get? user-subscriptions { user: user }))))

(define-read-only (get-payment-record (payment-id uint))
    (map-get? payment-history { payment-id: payment-id }))

(define-read-only (get-grace-period-remaining (user principal))
    (match (map-get? user-subscriptions { user: user })
        sub (if (> (get grace-period-end sub) stacks-block-height)
                (- (get grace-period-end sub) stacks-block-height)
                u0)
        u0))

(define-read-only (get-total-revenue-in-stx)
    (/ (var-get total-revenue) u1000000))

(define-read-only (get-billing-telemetry)
    {
        total-payments: (var-get payment-counter),
        total-revenue-ustx: (var-get total-revenue),
        total-revenue-stx: (/ (var-get total-revenue) u1000000),
        is-paused: (var-get is-paused),
        grace-period-blocks: (var-get grace-period-blocks)
    })

;; Validator reward tracking
(define-map validator-rewards principal { earned: uint, claimed: uint, last-claim: uint })
(define-data-var total-validator-rewards uint u0)
(define-data-var reward-per-block uint u10)

(define-read-only (get-validator-reward (validator principal))
  (default-to { earned: u0, claimed: u0, last-claim: u0 } (map-get? validator-rewards validator)))

(define-read-only (get-validator-params)
  { total-rewards: (var-get total-validator-rewards), reward-per-block: (var-get reward-per-block) })

(define-public (accrue-validator-reward (validator principal) (amount uint))
  (let ((current (get-validator-reward validator)))
    (map-set validator-rewards validator (merge current { earned: (+ (get earned current) amount) }))
    (var-set total-validator-rewards (+ (var-get total-validator-rewards) amount))
    (ok true)))

(define-public (claim-validator-reward)
  (let ((reward (get-validator-reward tx-sender)))
    (asserts! (> (get earned reward) (get claimed reward)) (err u801))
    (map-set validator-rewards tx-sender (merge reward { claimed: (get earned reward), last-claim: stacks-block-height }))
    (ok (- (get earned reward) (get claimed reward)))))

;; Data insurance reserve fund
(define-data-var insurance-fund uint u0)
(define-data-var insurance-rate-bps uint u100)
(define-data-var insurance-enabled bool true)
(define-map insurance-claims principal { amount: uint, claimed-at: uint, approved: bool })

(define-read-only (get-insurance-params)
  { fund: (var-get insurance-fund), rate-bps: (var-get insurance-rate-bps), enabled: (var-get insurance-enabled) })

(define-read-only (get-insurance-claim (claimant principal))
  (map-get? insurance-claims claimant))

(define-public (contribute-to-insurance (amount uint))
  (begin
    (asserts! (var-get insurance-enabled) (err u901))
    (asserts! (> amount u0) (err u902))
    (var-set insurance-fund (+ (var-get insurance-fund) amount))
    (ok true)))

(define-public (set-insurance-rate (rate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u900))
    (asserts! (<= rate u1000) (err u903))
    (var-set insurance-rate-bps rate)
    (ok true)))

;; Protocol treasury management
(define-data-var treasury-balance uint u0)
(define-data-var treasury-fee-bps uint u50)
(define-data-var treasury-admin principal (var-get contract-owner))
(define-map treasury-allocations uint { purpose: (string-ascii 64), amount: uint, allocated-at: uint })
(define-data-var allocation-count uint u0)

(define-read-only (get-treasury-params)
  { balance: (var-get treasury-balance), fee-bps: (var-get treasury-fee-bps) })

(define-read-only (get-treasury-allocation (id uint))
  (map-get? treasury-allocations id))

(define-public (contribute-to-treasury (amount uint))
  (begin
    (asserts! (> amount u0) (err u1201))
    (var-set treasury-balance (+ (var-get treasury-balance) amount))
    (ok true)))

(define-public (set-treasury-fee (fee uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1200))
    (asserts! (<= fee u500) (err u1202))
    (var-set treasury-fee-bps fee)
    (ok true)))

(define-public (allocate-treasury (purpose (string-ascii 64)) (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1200))
    (asserts! (<= amount (var-get treasury-balance)) (err u1203))
    (let ((id (+ (var-get allocation-count) u1)))
      (map-set treasury-allocations id { purpose: purpose, amount: amount, allocated-at: stacks-block-height })
      (var-set treasury-balance (- (var-get treasury-balance) amount))
      (var-set allocation-count id)
      (ok id))))

;; Standardized error registry
(define-constant ERR-REGISTRY-LOCKED (err u250))
(define-constant ERR-INVALID-STATE (err u251))
(define-constant ERR-RATE-EXCEEDED (err u252))
(define-data-var error-log-count uint u0)
(define-map error-log uint { code: uint, context: (string-ascii 32), block: uint })
(define-public (log-error (code uint) (context (string-ascii 32)))
  (let ((id (+ (var-get error-log-count) u1)))
    (map-set error-log id { code: code, context: context, block: stacks-block-height })
    (var-set error-log-count id)
    (ok id)))
(define-read-only (get-error-log (id uint))
  (map-get? error-log id))
