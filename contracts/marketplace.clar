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
