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
(define-constant err-promo-not-found (err u207))
(define-constant err-payment-not-found (err u208))
(define-constant err-refund-window-expired (err u209))
(define-constant err-refund-already-requested (err u210))
(define-constant err-no-refund-request (err u211))

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

(define-data-var payment-counter uint u0)
(define-data-var grace-period-blocks uint u144)  ;; Default 24 hours worth of blocks
(define-data-var refund-window uint u24)          ;; Blocks within which refund can be requested

;; Track refund requests
(define-map refund-requests
    { user: principal }
    {
        requested-at: uint,
        amount: uint,
        status: (string-ascii 10)   ;; "pending" or "approved"
    }
)

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
        )))

;; Public Functions
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

(define-public (subscribe-and-pay 
    (plan-id uint) 
    (tracking-contract <data-tracking-trait>)
    (promo-id uint))
    (let 
        ((plan-details (unwrap! (contract-call? tracking-contract get-plan-details plan-id) 
                               (err err-invalid-plan)))
         (promo (map-get? promotional-rates { promo-id: promo-id })))
        (let
            ((payment-id (+ (var-get payment-counter) u1))
             (discount-rate (match promo
                            promo-val
                            (if (< stacks-block-height (get valid-until promo-val))
                                (get discount-percentage promo-val)
                                u0)
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
                (unwrap! (contract-call? tracking-contract subscribe-to-plan plan-id true)
                        (err err-invalid-plan))
                (ok true)))))

(define-public (process-renewal-payment (tracking-contract <data-tracking-trait>))
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
                    ;; Allow renewal when grace period is still active
                    ;; No need to check payment-status - the grace period window
                    ;; is the authoritative check for renewal eligibility
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
                    (ok true))))))

;; Cancel subscription - stops auto-renew and marks inactive
(define-public (cancel-subscription)
    (let
        ((subscription (unwrap! (map-get? user-subscriptions { user: tx-sender })
                               (err err-no-subscription))))
        (map-set user-subscriptions
            { user: tx-sender }
            (merge subscription {
                payment-status: false,
                grace-period-end: stacks-block-height
            })
        )
        (ok true)))

;; Owner can update grace period duration
(define-public (set-grace-period (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (> blocks u0) (err err-invalid-plan))
        (var-set grace-period-blocks blocks)
        (ok true)))

;; Read-only Functions
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
    (match (map-get? payment-history { payment-id: payment-id })
        payment
        (if (is-eq (get user payment) user)
            (some payment)
            none)
        none))

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
