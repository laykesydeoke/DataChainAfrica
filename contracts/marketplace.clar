;; marketplace.clar

;; Import traits
(use-trait data-tracking-trait .data-traits.data-tracking-trait)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u300))
(define-constant err-invalid-listing (err u301))
(define-constant err-insufficient-data (err u302))
(define-constant err-listing-expired (err u303))
(define-constant err-not-seller (err u304))
(define-constant err-insufficient-funds (err u305))
(define-constant err-contract-paused (err u306))
(define-constant err-invalid-fee (err u307))
(define-constant err-self-purchase (err u308))

;; State
(define-data-var is-paused bool false)
(define-data-var platform-fee-pct uint u2)
(define-data-var total-volume-stx uint u0)
(define-data-var total-trades uint u0)

;; Data Structures
(define-map data-listings
    { listing-id: uint }
    {
        seller: principal,
        data-amount: uint,
        price: uint,
        expiry: uint,
        is-active: bool
    }
)

(define-map user-sales
    { user: principal }
    {
        total-sales: uint,
        total-data-sold: uint,
        active-listings: uint
    }
)

;; New: Buyer history tracking
(define-map user-purchases
    { user: principal }
    {
        total-purchases: uint,
        total-data-bought: uint,
        total-spent: uint
    }
)

(define-data-var listing-counter uint u0)

;; Private Functions
(define-private (process-payment (amount uint) (sender principal) (recipient principal))
    (match (stx-transfer? amount sender recipient)
        success (ok true)
        error (err err-insufficient-funds)))

(define-private (calculate-fee (amount uint))
    (/ (* amount (var-get platform-fee-pct)) u100))

;; Admin Functions
(define-public (set-paused (paused bool))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (ok (var-set is-paused paused))))

(define-public (set-platform-fee (fee-pct uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (<= fee-pct u10) (err err-invalid-fee))
        (ok (var-set platform-fee-pct fee-pct))))

;; Public Functions
(define-public (create-listing
    (data-amount uint)
    (price uint)
    (blocks-active uint)
    (tracking-contract <data-tracking-trait>))
    (begin
        (asserts! (not (var-get is-paused)) (err err-contract-paused))
        (let
            ((listing-id (+ (var-get listing-counter) u1))
             (user-data (unwrap! (contract-call? tracking-contract get-usage tx-sender)
                                (err err-insufficient-data))))
            (asserts! (>= (get data-balance user-data) data-amount)
                     (err err-insufficient-data))
            (begin
                (var-set listing-counter listing-id)
                (map-set data-listings
                    { listing-id: listing-id }
                    {
                        seller: tx-sender,
                        data-amount: data-amount,
                        price: price,
                        expiry: (+ stacks-block-height blocks-active),
                        is-active: true
                    }
                )
                (let ((current-sales (default-to
                        { total-sales: u0, total-data-sold: u0, active-listings: u0 }
                        (map-get? user-sales { user: tx-sender }))))
                    (map-set user-sales
                        { user: tx-sender }
                        {
                            total-sales: (get total-sales current-sales),
                            total-data-sold: (get total-data-sold current-sales),
                            active-listings: (+ (get active-listings current-sales) u1)
                        }
                    ))
                (ok listing-id)))))

(define-public (cancel-listing (listing-id uint))
    (let ((listing (unwrap! (map-get? data-listings { listing-id: listing-id })
                           (err err-invalid-listing))))
        (asserts! (is-eq (get seller listing) tx-sender) (err err-not-seller))
        (asserts! (get is-active listing) (err err-listing-expired))
        (begin
            (map-set data-listings
                { listing-id: listing-id }
                {
                    seller: (get seller listing),
                    data-amount: (get data-amount listing),
                    price: (get price listing),
                    expiry: (get expiry listing),
                    is-active: false
                }
            )
            (let ((current-sales (unwrap! (map-get? user-sales { user: tx-sender })
                                        (err err-not-seller))))
                (map-set user-sales
                    { user: tx-sender }
                    {
                        total-sales: (get total-sales current-sales),
                        total-data-sold: (get total-data-sold current-sales),
                        active-listings: (if (> (get active-listings current-sales) u0)
                            (- (get active-listings current-sales) u1)
                            u0)
                    }
                ))
            (ok true))))

(define-public (purchase-listing
    (listing-id uint)
    (tracking-contract <data-tracking-trait>))
    (begin
        (asserts! (not (var-get is-paused)) (err err-contract-paused))
        (let
            ((listing (unwrap! (map-get? data-listings { listing-id: listing-id })
                              (err err-invalid-listing))))
            (begin
                (asserts! (get is-active listing) (err err-listing-expired))
                (asserts! (<= stacks-block-height (get expiry listing)) (err err-listing-expired))
                (asserts! (not (is-eq tx-sender (get seller listing))) (err err-self-purchase))

                (let ((fee (calculate-fee (get price listing)))
                      (seller-amount (- (get price listing) (calculate-fee (get price listing)))))
                    (unwrap! (process-payment seller-amount tx-sender (get seller listing))
                            (err err-insufficient-funds))
                    (if (> fee u0)
                        (unwrap! (process-payment fee tx-sender contract-owner)
                                (err err-insufficient-funds))
                        true)
                    (map-set data-listings
                        { listing-id: listing-id }
                        {
                            seller: (get seller listing),
                            data-amount: (get data-amount listing),
                            price: (get price listing),
                            expiry: (get expiry listing),
                            is-active: false
                        }
                    )
                    (let ((seller-stats (unwrap! (map-get? user-sales { user: (get seller listing) })
                                               (err err-not-seller))))
                        (map-set user-sales
                            { user: (get seller listing) }
                            {
                                total-sales: (+ (get total-sales seller-stats) u1),
                                total-data-sold: (+ (get total-data-sold seller-stats)
                                                  (get data-amount listing)),
                                active-listings: (if (> (get active-listings seller-stats) u0)
                                    (- (get active-listings seller-stats) u1)
                                    u0)
                            }
                        ))

                    ;; Track buyer history
                    (let ((buyer-stats (default-to
                            { total-purchases: u0, total-data-bought: u0, total-spent: u0 }
                            (map-get? user-purchases { user: tx-sender }))))
                        (map-set user-purchases
                            { user: tx-sender }
                            {
                                total-purchases: (+ (get total-purchases buyer-stats) u1),
                                total-data-bought: (+ (get total-data-bought buyer-stats)
                                                    (get data-amount listing)),
                                total-spent: (+ (get total-spent buyer-stats) (get price listing))
                            }
                        ))

                    (var-set total-volume-stx (+ (var-get total-volume-stx) (get price listing)))
                    (var-set total-trades (+ (var-get total-trades) u1))
                    (ok true))))))

;; Allow seller to update price of an active listing
(define-public (update-listing-price (listing-id uint) (new-price uint))
    (let ((listing (unwrap! (map-get? data-listings { listing-id: listing-id })
                           (err err-invalid-listing))))
        (asserts! (is-eq (get seller listing) tx-sender) (err err-not-seller))
        (asserts! (get is-active listing) (err err-listing-expired))
        (asserts! (> new-price u0) (err err-insufficient-funds))
        (ok (map-set data-listings
            { listing-id: listing-id }
            {
                seller: (get seller listing),
                data-amount: (get data-amount listing),
                price: new-price,
                expiry: (get expiry listing),
                is-active: true
            }
        ))))

;; Seller can extend the expiry of an active listing
(define-public (extend-listing-duration (listing-id uint) (extra-blocks uint))
    (let ((listing (unwrap! (map-get? data-listings { listing-id: listing-id })
                           (err err-invalid-listing))))
        (asserts! (is-eq (get seller listing) tx-sender) (err err-not-seller))
        (asserts! (get is-active listing) (err err-listing-expired))
        (asserts! (> extra-blocks u0) (err err-insufficient-funds))
        (ok (map-set data-listings
            { listing-id: listing-id }
            {
                seller: (get seller listing),
                data-amount: (get data-amount listing),
                price: (get price listing),
                expiry: (+ (get expiry listing) extra-blocks),
                is-active: true
            }
        ))))

;; Read-only Functions
(define-read-only (get-paused)
    (var-get is-paused))

(define-read-only (get-platform-fee)
    (var-get platform-fee-pct))

(define-read-only (get-platform-stats)
    {
        total-volume: (var-get total-volume-stx),
        total-trades: (var-get total-trades),
        total-listings: (var-get listing-counter)
    })

(define-read-only (get-listing (listing-id uint))
    (map-get? data-listings { listing-id: listing-id }))

(define-read-only (get-user-sales (user principal))
    (map-get? user-sales { user: user }))

(define-read-only (get-user-purchases (user principal))
    (map-get? user-purchases { user: user }))

(define-read-only (get-buyer-stats (user principal))
    (default-to
        { total-purchases: u0, total-data-bought: u0, total-spent: u0 }
        (map-get? user-purchases { user: user })))

(define-read-only (get-listing-count)
    (var-get listing-counter))

(define-read-only (is-listing-active (listing-id uint))
    (match (map-get? data-listings { listing-id: listing-id })
        listing (and (get is-active listing)
                    (<= stacks-block-height (get expiry listing)))
        false))

(define-read-only (get-user-active-listings (user principal))
    (let ((sales-data (default-to
            { total-sales: u0, total-data-sold: u0, active-listings: u0 }
            (map-get? user-sales { user: user }))))
        (get active-listings sales-data)))

(define-read-only (get-seller-stats (seller principal))
    (default-to
        { total-sales: u0, total-data-sold: u0, active-listings: u0 }
        (map-get? user-sales { user: seller })))

(define-read-only (get-seller-revenue (seller principal))
    (get total-sales
        (default-to
            { total-sales: u0, total-data-sold: u0, active-listings: u0 }
            (map-get? user-sales { user: seller }))))

(define-read-only (get-total-data-sold (seller principal))
    (get total-data-sold
        (default-to
            { total-sales: u0, total-data-sold: u0, active-listings: u0 }
            (map-get? user-sales { user: seller }))))

(define-read-only (get-marketplace-summary)
    (let ((stats (get-platform-stats)))
        {
            total-volume: (get total-volume stats),
            total-trades: (get total-trades stats),
            total-listings: (get total-listings stats),
            active-listings: (var-get listing-counter)
        }))

;; Data staking mechanism
(define-map data-stakes principal { amount: uint, staked-at: uint, reward-rate: uint })
(define-data-var total-staked uint u0)
(define-data-var staking-enabled bool true)
(define-data-var base-reward-rate uint u50)

(define-read-only (get-stake (staker principal))
  (map-get? data-stakes staker))

(define-read-only (get-staking-params)
  {
    total-staked: (var-get total-staked),
    staking-enabled: (var-get staking-enabled),
    base-reward-rate: (var-get base-reward-rate)
  })

(define-public (stake-data (amount uint))
  (begin
    (asserts! (var-get staking-enabled) (err u501))
    (asserts! (> amount u0) (err u502))
    (map-set data-stakes tx-sender { amount: amount, staked-at: stacks-block-height, reward-rate: (var-get base-reward-rate) })
    (var-set total-staked (+ (var-get total-staked) amount))
    (ok true)))

(define-public (set-staking-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u500))
    (var-set staking-enabled enabled)
    (ok true)))

;; Data bounty system
(define-map data-bounties uint { creator: principal, reward: uint, fulfilled: bool, created-at: uint })
(define-data-var bounty-count uint u0)
(define-data-var total-bounty-pool uint u0)

(define-read-only (get-bounty (id uint))
  (map-get? data-bounties id))

(define-read-only (get-bounty-stats)
  { bounty-count: (var-get bounty-count), total-pool: (var-get total-bounty-pool) })

(define-public (create-bounty (reward uint))
  (begin
    (asserts! (> reward u0) (err u701))
    (let ((id (+ (var-get bounty-count) u1)))
      (map-set data-bounties id { creator: tx-sender, reward: reward, fulfilled: false, created-at: stacks-block-height })
      (var-set bounty-count id)
      (var-set total-bounty-pool (+ (var-get total-bounty-pool) reward))
      (ok id))))

(define-public (fulfill-bounty (id uint))
  (let ((bounty (unwrap! (map-get? data-bounties id) (err u702))))
    (asserts! (not (get fulfilled bounty)) (err u703))
    (map-set data-bounties id (merge bounty { fulfilled: true }))
    (ok true)))

;; Provider reputation scores
(define-map reputation-scores principal { score: uint, reviews: uint, last-updated: uint })
(define-data-var min-reviews-for-score uint u3)
(define-data-var reputation-enabled bool true)

(define-read-only (get-reputation (provider principal))
  (default-to { score: u500, reviews: u0, last-updated: u0 } (map-get? reputation-scores provider)))

(define-read-only (get-reputation-params)
  { min-reviews: (var-get min-reviews-for-score), enabled: (var-get reputation-enabled) })

(define-public (submit-review (provider principal) (rating uint))
  (begin
    (asserts! (var-get reputation-enabled) (err u1101))
    (asserts! (<= rating u1000) (err u1102))
    (let ((current (get-reputation provider)))
      (let ((new-reviews (+ (get reviews current) u1))
            (new-score (/ (+ (* (get score current) (get reviews current)) rating) (+ (get reviews current) u1))))
        (map-set reputation-scores provider { score: new-score, reviews: new-reviews, last-updated: stacks-block-height })
        (ok new-score)))))

;; Input validation helpers
(define-constant ERR-ZERO-AMOUNT (err u350))
(define-constant ERR-AMOUNT-TOO-LARGE (err u351))
(define-constant MAX-LISTING-PRICE u1000000000)
(define-private (validate-listing-amount (amount uint))
  (and (> amount u0) (<= amount MAX-LISTING-PRICE)))
(define-read-only (check-listing-validity (id uint))
  (match (map-get? data-listings { listing-id: id })
    listing (ok { valid: (get is-active listing), expired: (> stacks-block-height (get expiry listing)) })
    (err u352)))

;; Enhanced role-based access control
(define-map operator-roles principal { role: uint, granted-at: uint, active: bool })
(define-data-var operator-count uint u0)
(define-read-only (get-operator-role (addr principal))
  (default-to { role: u0, granted-at: u0, active: false } (map-get? operator-roles addr)))
(define-public (grant-operator-role (addr principal) (role uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set operator-roles addr { role: role, granted-at: stacks-block-height, active: true })
    (var-set operator-count (+ (var-get operator-count) u1))
    (ok true)))
(define-public (revoke-operator (addr principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set operator-roles addr (merge (get-operator-role addr) { active: false }))
    (ok true)))

;; Event emission tracking
(define-map marketplace-events uint { event-type: (string-ascii 32), actor: principal, data-id: uint, block: uint })
(define-data-var event-counter uint u0)
(define-read-only (get-event-stats)
  { total-events: (var-get event-counter) })
(define-read-only (get-marketplace-event (id uint))
  (map-get? marketplace-events id))
(define-public (emit-marketplace-event (event-type (string-ascii 32)) (data-id uint))
  (let ((id (+ (var-get event-counter) u1)))
    (map-set marketplace-events id { event-type: event-type, actor: tx-sender, data-id: data-id, block: stacks-block-height })
    (var-set event-counter id)
    (ok id)))

;; Pagination and query limits
(define-constant MAX-PAGE-SIZE u50)
(define-constant DEFAULT-PAGE-SIZE u20)
(define-data-var query-count uint u0)
(define-map query-cache uint { requester: principal, page: uint, size: uint, cached-at: uint })
(define-read-only (get-page-config)
  { max-size: MAX-PAGE-SIZE, default-size: DEFAULT-PAGE-SIZE, queries: (var-get query-count) })
(define-public (log-query (page uint) (size uint))
  (let ((id (+ (var-get query-count) u1))
        (actual-size (if (> size MAX-PAGE-SIZE) MAX-PAGE-SIZE size)))
    (map-set query-cache id { requester: tx-sender, page: page, size: actual-size, cached-at: stacks-block-height })
    (var-set query-count id)
    (ok id)))

;; Safe migration utilities
(define-data-var migration-version uint u1)
(define-data-var migration-locked bool false)
(define-map migration-log uint { from-version: uint, to-version: uint, migrated-at: uint, migrator: principal })
(define-read-only (get-migration-state)
  { version: (var-get migration-version), locked: (var-get migration-locked) })
(define-public (begin-migration (target-version uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (not (var-get migration-locked)) (err u360))
    (asserts! (> target-version (var-get migration-version)) (err u361))
    (var-set migration-locked true)
    (ok true)))
(define-public (complete-migration (target-version uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (var-get migration-locked) (err u362))
    (map-set migration-log target-version { from-version: (var-get migration-version), to-version: target-version, migrated-at: stacks-block-height, migrator: tx-sender })
    (var-set migration-version target-version)
    (var-set migration-locked false)
    (ok true)))

;; Staking safety guards
(define-constant MIN-STAKE-AMOUNT u100)
(define-constant MAX-STAKE-AMOUNT u10000000)
(define-data-var staking-cooldown uint u144)
(define-map stake-locks principal { locked-until: uint, amount: uint })
(define-read-only (get-stake-lock (user principal))
  (map-get? stake-locks user))
(define-read-only (is-stake-locked (user principal))
  (match (map-get? stake-locks user) lock (<= stacks-block-height (get locked-until lock)) false))
(define-public (lock-stake (amount uint) (duration uint))
  (begin
    (asserts! (>= amount MIN-STAKE-AMOUNT) (err u510))
    (asserts! (<= amount MAX-STAKE-AMOUNT) (err u511))
    (map-set stake-locks tx-sender { locked-until: (+ stacks-block-height duration), amount: amount })
    (ok true)))
