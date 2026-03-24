;; referral-rewards.clar
;; Referral reward system for DataChainAfrica
;; Users earn STX rewards when their referrals subscribe to plans

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u700))
(define-constant err-invalid-input (err u701))
(define-constant err-self-referral (err u702))
(define-constant err-already-referred (err u703))
(define-constant err-no-referral (err u704))
(define-constant err-reward-claimed (err u705))
(define-constant err-insufficient-pool (err u706))
(define-constant err-program-paused (err u707))

;; Reward amounts in microSTX
(define-data-var referrer-reward uint u500000)   ;; 0.5 STX to referrer
(define-data-var referee-reward uint u250000)    ;; 0.25 STX to new subscriber
(define-data-var reward-pool uint u0)            ;; Total STX in reward pool
(define-data-var program-paused bool false)

;; Track referral relationships
(define-map referrals
    { referee: principal }
    {
        referrer: principal,
        referred-at: uint,
        referrer-claimed: bool,
        referee-claimed: bool
    }
)

;; Track per-user referral stats
(define-map referral-stats
    { user: principal }
    {
        total-referrals: uint,
        successful-referrals: uint,
        total-earned: uint
    }
)

;; Track total platform referral metrics
(define-data-var total-referrals uint u0)
(define-data-var total-rewards-paid uint u0)

;; ============================================================
;; Admin Functions
;; ============================================================

;; Fund the reward pool (owner sends STX to contract)
(define-public (fund-reward-pool (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> amount u0) err-invalid-input)
        (unwrap! (stx-transfer? amount tx-sender (as-contract tx-sender))
                err-insufficient-pool)
        (var-set reward-pool (+ (var-get reward-pool) amount))
        (print { event: "pool-funded", amount: amount, total-pool: (var-get reward-pool) })
        (ok true)
    )
)

;; Set referrer reward amount
(define-public (set-referrer-reward (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> amount u0) err-invalid-input)
        (var-set referrer-reward amount)
        (ok true)
    )
)

;; Set referee reward amount
(define-public (set-referee-reward (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> amount u0) err-invalid-input)
        (var-set referee-reward amount)
        (ok true)
    )
)

;; Pause/unpause the referral program
(define-public (set-program-pause (paused bool))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set program-paused paused)
        (print { event: "program-pause-changed", paused: paused })
        (ok true)
    )
)

;; ============================================================
;; Public Functions
;; ============================================================

;; Register a referral (called by new user before subscribing)
(define-public (register-referral (referrer principal))
    (begin
        (asserts! (not (var-get program-paused)) err-program-paused)
        (asserts! (is-standard referrer) err-invalid-input)
        (asserts! (not (is-eq tx-sender referrer)) err-self-referral)
        ;; Prevent being referred twice
        (asserts! (is-none (map-get? referrals { referee: tx-sender }))
                 err-already-referred)

        (map-set referrals
            { referee: tx-sender }
            {
                referrer: referrer,
                referred-at: stacks-block-height,
                referrer-claimed: false,
                referee-claimed: false
            }
        )

        ;; Update referrer stats
        (let ((stats (default-to
                { total-referrals: u0, successful-referrals: u0, total-earned: u0 }
                (map-get? referral-stats { user: referrer }))))
            (map-set referral-stats
                { user: referrer }
                (merge stats { total-referrals: (+ (get total-referrals stats) u1) })
            )
        )

        (var-set total-referrals (+ (var-get total-referrals) u1))
        (print { event: "referral-registered", referrer: referrer, referee: tx-sender })
        (ok true)
    )
)

;; Claim referrer reward (called by the person who referred)
(define-public (claim-referrer-reward (referee principal))
    (let (
        (referral (unwrap! (map-get? referrals { referee: referee }) err-no-referral))
        (reward (var-get referrer-reward))
        (pool (var-get reward-pool))
    )
        (asserts! (not (var-get program-paused)) err-program-paused)
        (asserts! (is-eq tx-sender (get referrer referral)) err-no-referral)
        (asserts! (not (get referrer-claimed referral)) err-reward-claimed)
        (asserts! (>= pool reward) err-insufficient-pool)

        ;; Transfer reward from contract to referrer
        (unwrap! (as-contract (stx-transfer? reward tx-sender (get referrer referral)))
                err-insufficient-pool)

        ;; Update referral record
        (map-set referrals
            { referee: referee }
            (merge referral { referrer-claimed: true })
        )

        ;; Update referrer stats
        (let ((stats (default-to
                { total-referrals: u0, successful-referrals: u0, total-earned: u0 }
                (map-get? referral-stats { user: tx-sender }))))
            (map-set referral-stats
                { user: tx-sender }
                (merge stats {
                    successful-referrals: (+ (get successful-referrals stats) u1),
                    total-earned: (+ (get total-earned stats) reward)
                })
            )
        )

        (var-set reward-pool (- pool reward))
        (var-set total-rewards-paid (+ (var-get total-rewards-paid) reward))
        (print { event: "referrer-reward-claimed", referrer: tx-sender, referee: referee, amount: reward })
        (ok reward)
    )
)

;; Claim referee reward (new user claims their welcome bonus)
(define-public (claim-referee-reward)
    (let (
        (referral (unwrap! (map-get? referrals { referee: tx-sender }) err-no-referral))
        (reward (var-get referee-reward))
        (pool (var-get reward-pool))
    )
        (asserts! (not (var-get program-paused)) err-program-paused)
        (asserts! (not (get referee-claimed referral)) err-reward-claimed)
        (asserts! (>= pool reward) err-insufficient-pool)

        ;; Transfer reward from contract to referee
        (unwrap! (as-contract (stx-transfer? reward tx-sender tx-sender))
                err-insufficient-pool)

        ;; Update referral record
        (map-set referrals
            { referee: tx-sender }
            (merge referral { referee-claimed: true })
        )

        (var-set reward-pool (- pool reward))
        (var-set total-rewards-paid (+ (var-get total-rewards-paid) reward))
        (print { event: "referee-reward-claimed", referee: tx-sender, amount: reward })
        (ok reward)
    )
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Get referral info for a referee
(define-read-only (get-referral (referee principal))
    (map-get? referrals { referee: referee })
)

;; Get a user's referral stats
(define-read-only (get-referral-stats (user principal))
    (default-to
        { total-referrals: u0, successful-referrals: u0, total-earned: u0 }
        (map-get? referral-stats { user: user }))
)

;; Get current reward amounts
(define-read-only (get-reward-amounts)
    {
        referrer-reward: (var-get referrer-reward),
        referee-reward: (var-get referee-reward)
    }
)

;; Get reward pool balance
(define-read-only (get-reward-pool)
    (var-get reward-pool)
)

;; Get platform referral metrics
(define-read-only (get-platform-stats)
    {
        total-referrals: (var-get total-referrals),
        total-rewards-paid: (var-get total-rewards-paid),
        reward-pool: (var-get reward-pool)
    }
)

;; Check if a user has been referred
(define-read-only (is-referred (user principal))
    (is-some (map-get? referrals { referee: user }))
)

;; Check if referral program is paused
(define-read-only (is-program-paused)
    (var-get program-paused)
)

;; Get who referred a specific user
(define-read-only (get-referrer (referee principal))
    (match (map-get? referrals { referee: referee })
        ref (some (get referrer ref))
        none)
)
