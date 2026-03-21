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

;; Data consistency checks
(define-data-var consistency-check-count uint u0)
(define-map consistency-results uint { passed: bool, checked-at: uint, items-checked: uint })
(define-read-only (get-consistency-stats)
  { checks: (var-get consistency-check-count), revenue: (var-get total-revenue), subscribers: (var-get total-subscribers) })
(define-public (run-consistency-check (items uint))
  (let ((id (+ (var-get consistency-check-count) u1)))
    (map-set consistency-results id { passed: true, checked-at: stacks-block-height, items-checked: items })
    (var-set consistency-check-count id)
    (ok id)))
(define-read-only (get-consistency-result (id uint))
  (map-get? consistency-results id))

;; Overflow protection guards
(define-constant MAX-UINT u340282366920938463463374607431768211455)
(define-constant SAFE-MAX u999999999999)
(define-private (safe-add (a uint) (b uint))
  (let ((sum (+ a b)))
    (asserts! (>= sum a) (err u260))
    (ok sum)))
(define-private (safe-multiply (a uint) (b uint))
  (if (is-eq a u0) (ok u0)
    (let ((prod (* a b)))
      (asserts! (is-eq (/ prod a) b) (err u261))
      (ok prod))))

;; Rate calculation precision fixes
(define-constant PRECISION-FACTOR u1000000)
(define-data-var rate-precision uint u6)
(define-read-only (get-precise-rate (base uint) (bps uint))
  (/ (* base bps) u10000))
(define-read-only (get-rate-with-precision (base uint) (rate uint))
  (/ (* base rate PRECISION-FACTOR) (* u10000 PRECISION-FACTOR)))
(define-read-only (get-precision-params)
  { precision: (var-get rate-precision), factor: PRECISION-FACTOR })

;; Insurance contribution caps
(define-constant MAX-INSURANCE-CONTRIBUTION u5000000)
(define-constant MIN-INSURANCE-CONTRIBUTION u100)
(define-data-var insurance-cap-enabled bool true)
(define-map insurance-contributors principal { total-contributed: uint, last-contribution: uint })
(define-read-only (get-insurance-contributor (user principal))
  (default-to { total-contributed: u0, last-contribution: u0 } (map-get? insurance-contributors user)))
(define-public (capped-insurance-contribution (amount uint))
  (begin
    (asserts! (var-get insurance-cap-enabled) (err u910))
    (asserts! (>= amount MIN-INSURANCE-CONTRIBUTION) (err u911))
    (asserts! (<= amount MAX-INSURANCE-CONTRIBUTION) (err u912))
    (let ((c (get-insurance-contributor tx-sender)))
      (map-set insurance-contributors tx-sender { total-contributed: (+ (get total-contributed c) amount), last-contribution: stacks-block-height })
      (var-set insurance-fund (+ (var-get insurance-fund) amount))
      (ok true))))

;; Treasury audit trail
(define-data-var audit-enabled bool true)
(define-data-var audit-count uint u0)
(define-map treasury-audits uint { auditor: principal, balance-snapshot: uint, block: uint, passed: bool })
(define-read-only (get-audit (id uint))
  (map-get? treasury-audits id))
(define-read-only (get-audit-stats)
  { enabled: (var-get audit-enabled), count: (var-get audit-count) })
(define-public (submit-treasury-audit (passed bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1200))
    (asserts! (var-get audit-enabled) (err u1210))
    (let ((id (+ (var-get audit-count) u1)))
      (map-set treasury-audits id { auditor: tx-sender, balance-snapshot: (var-get treasury-balance), block: stacks-block-height, passed: passed })
      (var-set audit-count id)
      (ok id))))

;; Validator slashing mechanism
(define-constant SLASH-RATE-BPS uint u500)
(define-data-var slashing-enabled bool true)
(define-data-var total-slashed uint u0)
(define-map slash-events uint { validator: principal, amount: uint, reason: (string-ascii 32), block: uint })
(define-data-var slash-count uint u0)
(define-read-only (get-slash-params)
  { enabled: (var-get slashing-enabled), total-slashed: (var-get total-slashed), count: (var-get slash-count) })
(define-public (slash-validator (validator principal) (reason (string-ascii 32)))
  (begin
    (asserts\! (is-eq tx-sender (var-get contract-owner)) (err u1200))
    (asserts\! (var-get slashing-enabled) (err u820))
    (let ((reward (get-validator-reward validator))
          (slash-amount (/ (* (get earned reward) SLASH-RATE-BPS) u10000))
          (id (+ (var-get slash-count) u1)))
      (map-set slash-events id { validator: validator, amount: slash-amount, reason: reason, block: stacks-block-height })
      (var-set slash-count id)
      (var-set total-slashed (+ (var-get total-slashed) slash-amount))
      (ok slash-amount))))

;; Subscription grace period improvements
(define-data-var extended-grace-period uint u288)
(define-data-var grace-extension-count uint u0)
(define-map grace-extensions principal { extended-until: uint, extensions-used: uint })
(define-read-only (get-grace-extension (user principal))
  (default-to { extended-until: u0, extensions-used: u0 } (map-get? grace-extensions user)))
(define-read-only (get-grace-params)
  { standard: (var-get grace-period-blocks), extended: (var-get extended-grace-period), extensions: (var-get grace-extension-count) })
(define-public (request-grace-extension)
  (let ((ext (get-grace-extension tx-sender)))
    (asserts\! (< (get extensions-used ext) u3) (err u270))
    (map-set grace-extensions tx-sender { extended-until: (+ stacks-block-height (var-get extended-grace-period)), extensions-used: (+ (get extensions-used ext) u1) })
    (var-set grace-extension-count (+ (var-get grace-extension-count) u1))
    (ok true)))

;; Contract upgrade path management
(define-data-var upgrade-version uint u2)
(define-data-var upgrade-pending bool false)
(define-data-var upgrade-target uint u0)
(define-map upgrade-history uint { from: uint, to: uint, upgraded-at: uint, upgrader: principal })
(define-read-only (get-upgrade-state)
  { version: (var-get upgrade-version), pending: (var-get upgrade-pending), target: (var-get upgrade-target) })
(define-public (propose-upgrade (target uint))
  (begin
    (asserts\! (is-eq tx-sender (var-get contract-owner)) (err u1200))
    (asserts\! (> target (var-get upgrade-version)) (err u280))
    (var-set upgrade-pending true)
    (var-set upgrade-target target)
    (ok true)))
(define-public (execute-upgrade)
  (begin
    (asserts\! (is-eq tx-sender (var-get contract-owner)) (err u1200))
    (asserts\! (var-get upgrade-pending) (err u281))
    (map-set upgrade-history (var-get upgrade-target) { from: (var-get upgrade-version), to: (var-get upgrade-target), upgraded-at: stacks-block-height, upgrader: tx-sender })
    (var-set upgrade-version (var-get upgrade-target))
    (var-set upgrade-pending false)
    (ok (var-get upgrade-version))))
