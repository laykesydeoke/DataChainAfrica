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

;; Marketplace fee: 2% of listing price goes to platform
(define-data-var marketplace-fee-rate uint u200) ;; basis points (200 = 2%)
(define-data-var total-fees-collected uint u0)

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

(define-data-var listing-counter uint u0)

;; Private Functions
(define-private (calculate-fee (amount uint))
    (/ (* amount (var-get marketplace-fee-rate)) u10000))

(define-private (process-payment-with-fee (amount uint) (sender principal) (recipient principal))
    (let
        ((fee (calculate-fee amount))
         (seller-amount (- amount fee)))
        ;; Pay seller
        (unwrap! (stx-transfer? seller-amount sender recipient)
                (err err-insufficient-funds))
        ;; Collect fee for platform
        (if (> fee u0)
            (unwrap! (stx-transfer? fee sender contract-owner)
                    (err err-insufficient-funds))
            true)
        (var-set total-fees-collected (+ (var-get total-fees-collected) fee))
        (ok true)
    )
)

(define-private (process-payment (amount uint) (sender principal) (recipient principal))
    (match (stx-transfer? amount sender recipient)
        success (ok true)
        error (err err-insufficient-funds)))

;; Public Functions
(define-public (create-listing 
    (data-amount uint) 
    (price uint) 
    (blocks-active uint)
    (tracking-contract <data-tracking-trait>))
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
            (ok listing-id))))

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
    (let
        ((listing (unwrap! (map-get? data-listings { listing-id: listing-id })
                          (err err-invalid-listing))))
        (begin
            (asserts! (get is-active listing) (err err-listing-expired))
            (asserts! (<= stacks-block-height (get expiry listing)) (err err-listing-expired))
            
            ;; Process payment with marketplace fee
            (unwrap! (process-payment-with-fee (get price listing) tx-sender (get seller listing))
                    (err err-insufficient-funds))
            
            ;; Update listing status
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
            
            ;; Transfer data from seller to buyer
            (unwrap! (contract-call? .data-tracking transfer-data-balance
                (get seller listing) tx-sender (get data-amount listing))
                (err err-insufficient-data))

            ;; Update seller stats
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

            (ok true))))

;; Read-only Functions
(define-read-only (get-listing (listing-id uint))
    (map-get? data-listings { listing-id: listing-id }))

(define-read-only (get-user-sales (user principal))
    (map-get? user-sales { user: user }))

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

(define-read-only (get-marketplace-fee-rate)
    (var-get marketplace-fee-rate))

(define-read-only (get-total-fees-collected)
    (var-get total-fees-collected))

;; Admin: update marketplace fee rate (basis points)
(define-public (set-marketplace-fee-rate (new-rate uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (<= new-rate u1000) (err err-invalid-listing)) ;; max 10%
        (var-set marketplace-fee-rate new-rate)
        (ok true)))

;; access-ctrl module
(define-map access-ctrl-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var access-ctrl-counter uint u0)
(define-public (create-access-ctrl (val uint))
  (let ((id (+ (var-get access-ctrl-counter) u1)))
    (asserts! (> val u0) (err u600))
    (map-set access-ctrl-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set access-ctrl-counter id)
    (ok id)))
(define-public (update-access-ctrl (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? access-ctrl-registry id) (err u601))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u602))
    (asserts! (get active entry) (err u603))
    (ok (map-set access-ctrl-registry id (merge entry {value: new-val})))))
(define-public (deactivate-access-ctrl (id uint))
  (let ((entry (unwrap! (map-get? access-ctrl-registry id) (err u601))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u602))
    (ok (map-set access-ctrl-registry id (merge entry {active: false})))))
(define-read-only (get-access-ctrl-entry (id uint))
  (map-get? access-ctrl-registry id))
(define-read-only (get-access-ctrl-count)
  (ok (var-get access-ctrl-counter)))
(define-read-only (is-access-ctrl-active (id uint))
  (match (map-get? access-ctrl-registry id)
    entry (get active entry)
    false))
(define-read-only (get-access-ctrl-owner (id uint))
  (match (map-get? access-ctrl-registry id)
    entry (ok (get owner entry))
    (err u601)))
(define-read-only (get-access-ctrl-value (id uint))
  (default-to u0 (get value (map-get? access-ctrl-registry id))))

;; rate-limit module
(define-map rate-limit-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var rate-limit-counter uint u0)
(define-public (create-rate-limit (val uint))
  (let ((id (+ (var-get rate-limit-counter) u1)))
    (asserts! (> val u0) (err u610))
    (map-set rate-limit-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set rate-limit-counter id)
    (ok id)))
(define-public (update-rate-limit (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? rate-limit-registry id) (err u611))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u612))
    (asserts! (get active entry) (err u613))
    (ok (map-set rate-limit-registry id (merge entry {value: new-val})))))
(define-public (deactivate-rate-limit (id uint))
  (let ((entry (unwrap! (map-get? rate-limit-registry id) (err u611))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u612))
    (ok (map-set rate-limit-registry id (merge entry {active: false})))))
(define-read-only (get-rate-limit-entry (id uint))
  (map-get? rate-limit-registry id))
(define-read-only (get-rate-limit-count)
  (ok (var-get rate-limit-counter)))
(define-read-only (is-rate-limit-active (id uint))
  (match (map-get? rate-limit-registry id)
    entry (get active entry)
    false))
(define-read-only (get-rate-limit-owner (id uint))
  (match (map-get? rate-limit-registry id)
    entry (ok (get owner entry))
    (err u611)))
(define-read-only (get-rate-limit-value (id uint))
  (default-to u0 (get value (map-get? rate-limit-registry id))))

;; batch-ops module
(define-map batch-ops-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var batch-ops-counter uint u0)
(define-public (create-batch-ops (val uint))
  (let ((id (+ (var-get batch-ops-counter) u1)))
    (asserts! (> val u0) (err u620))
    (map-set batch-ops-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set batch-ops-counter id)
    (ok id)))
(define-public (update-batch-ops (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? batch-ops-registry id) (err u621))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u622))
    (asserts! (get active entry) (err u623))
    (ok (map-set batch-ops-registry id (merge entry {value: new-val})))))
(define-public (deactivate-batch-ops (id uint))
  (let ((entry (unwrap! (map-get? batch-ops-registry id) (err u621))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u622))
    (ok (map-set batch-ops-registry id (merge entry {active: false})))))
(define-read-only (get-batch-ops-entry (id uint))
  (map-get? batch-ops-registry id))
(define-read-only (get-batch-ops-count)
  (ok (var-get batch-ops-counter)))
(define-read-only (is-batch-ops-active (id uint))
  (match (map-get? batch-ops-registry id)
    entry (get active entry)
    false))
(define-read-only (get-batch-ops-owner (id uint))
  (match (map-get? batch-ops-registry id)
    entry (ok (get owner entry))
    (err u621)))
(define-read-only (get-batch-ops-value (id uint))
  (default-to u0 (get value (map-get? batch-ops-registry id))))

;; analytics module
(define-map analytics-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var analytics-counter uint u0)
(define-public (create-analytics (val uint))
  (let ((id (+ (var-get analytics-counter) u1)))
    (asserts! (> val u0) (err u630))
    (map-set analytics-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set analytics-counter id)
    (ok id)))
(define-public (update-analytics (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? analytics-registry id) (err u631))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u632))
    (asserts! (get active entry) (err u633))
    (ok (map-set analytics-registry id (merge entry {value: new-val})))))
(define-public (deactivate-analytics (id uint))
  (let ((entry (unwrap! (map-get? analytics-registry id) (err u631))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u632))
    (ok (map-set analytics-registry id (merge entry {active: false})))))
(define-read-only (get-analytics-entry (id uint))
  (map-get? analytics-registry id))
(define-read-only (get-analytics-count)
  (ok (var-get analytics-counter)))
(define-read-only (is-analytics-active (id uint))
  (match (map-get? analytics-registry id)
    entry (get active entry)
    false))
(define-read-only (get-analytics-owner (id uint))
  (match (map-get? analytics-registry id)
    entry (ok (get owner entry))
    (err u631)))
(define-read-only (get-analytics-value (id uint))
  (default-to u0 (get value (map-get? analytics-registry id))))

;; caching module
(define-map caching-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var caching-counter uint u0)
(define-public (create-caching (val uint))
  (let ((id (+ (var-get caching-counter) u1)))
    (asserts! (> val u0) (err u640))
    (map-set caching-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set caching-counter id)
    (ok id)))
(define-public (update-caching (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? caching-registry id) (err u641))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u642))
    (asserts! (get active entry) (err u643))
    (ok (map-set caching-registry id (merge entry {value: new-val})))))
(define-public (deactivate-caching (id uint))
  (let ((entry (unwrap! (map-get? caching-registry id) (err u641))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u642))
    (ok (map-set caching-registry id (merge entry {active: false})))))
(define-read-only (get-caching-entry (id uint))
  (map-get? caching-registry id))
(define-read-only (get-caching-count)
  (ok (var-get caching-counter)))
(define-read-only (is-caching-active (id uint))
  (match (map-get? caching-registry id)
    entry (get active entry)
    false))
(define-read-only (get-caching-owner (id uint))
  (match (map-get? caching-registry id)
    entry (ok (get owner entry))
    (err u641)))
(define-read-only (get-caching-value (id uint))
  (default-to u0 (get value (map-get? caching-registry id))))

;; event-sys module
(define-map event-sys-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var event-sys-counter uint u0)
(define-public (create-event-sys (val uint))
  (let ((id (+ (var-get event-sys-counter) u1)))
    (asserts! (> val u0) (err u650))
    (map-set event-sys-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set event-sys-counter id)
    (ok id)))
(define-public (update-event-sys (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? event-sys-registry id) (err u651))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u652))
    (asserts! (get active entry) (err u653))
    (ok (map-set event-sys-registry id (merge entry {value: new-val})))))
(define-public (deactivate-event-sys (id uint))
  (let ((entry (unwrap! (map-get? event-sys-registry id) (err u651))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u652))
    (ok (map-set event-sys-registry id (merge entry {active: false})))))
(define-read-only (get-event-sys-entry (id uint))
  (map-get? event-sys-registry id))
(define-read-only (get-event-sys-count)
  (ok (var-get event-sys-counter)))
(define-read-only (is-event-sys-active (id uint))
  (match (map-get? event-sys-registry id)
    entry (get active entry)
    false))
(define-read-only (get-event-sys-owner (id uint))
  (match (map-get? event-sys-registry id)
    entry (ok (get owner entry))
    (err u651)))
(define-read-only (get-event-sys-value (id uint))
  (default-to u0 (get value (map-get? event-sys-registry id))))

;; error-handler module
(define-map error-handler-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var error-handler-counter uint u0)
(define-public (create-error-handler (val uint))
  (let ((id (+ (var-get error-handler-counter) u1)))
    (asserts! (> val u0) (err u660))
    (map-set error-handler-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set error-handler-counter id)
    (ok id)))
(define-public (update-error-handler (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? error-handler-registry id) (err u661))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u662))
    (asserts! (get active entry) (err u663))
    (ok (map-set error-handler-registry id (merge entry {value: new-val})))))
(define-public (deactivate-error-handler (id uint))
  (let ((entry (unwrap! (map-get? error-handler-registry id) (err u661))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u662))
    (ok (map-set error-handler-registry id (merge entry {active: false})))))
(define-read-only (get-error-handler-entry (id uint))
  (map-get? error-handler-registry id))
(define-read-only (get-error-handler-count)
  (ok (var-get error-handler-counter)))
(define-read-only (is-error-handler-active (id uint))
  (match (map-get? error-handler-registry id)
    entry (get active entry)
    false))
(define-read-only (get-error-handler-owner (id uint))
  (match (map-get? error-handler-registry id)
    entry (ok (get owner entry))
    (err u661)))
(define-read-only (get-error-handler-value (id uint))
  (default-to u0 (get value (map-get? error-handler-registry id))))

;; pagination module
(define-map pagination-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var pagination-counter uint u0)
(define-public (create-pagination (val uint))
  (let ((id (+ (var-get pagination-counter) u1)))
    (asserts! (> val u0) (err u670))
    (map-set pagination-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set pagination-counter id)
    (ok id)))
(define-public (update-pagination (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? pagination-registry id) (err u671))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u672))
    (asserts! (get active entry) (err u673))
    (ok (map-set pagination-registry id (merge entry {value: new-val})))))
(define-public (deactivate-pagination (id uint))
  (let ((entry (unwrap! (map-get? pagination-registry id) (err u671))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u672))
    (ok (map-set pagination-registry id (merge entry {active: false})))))
(define-read-only (get-pagination-entry (id uint))
  (map-get? pagination-registry id))
(define-read-only (get-pagination-count)
  (ok (var-get pagination-counter)))
(define-read-only (is-pagination-active (id uint))
  (match (map-get? pagination-registry id)
    entry (get active entry)
    false))
(define-read-only (get-pagination-owner (id uint))
  (match (map-get? pagination-registry id)
    entry (ok (get owner entry))
    (err u671)))
(define-read-only (get-pagination-value (id uint))
  (default-to u0 (get value (map-get? pagination-registry id))))

;; search-idx module
(define-map search-idx-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var search-idx-counter uint u0)
(define-public (create-search-idx (val uint))
  (let ((id (+ (var-get search-idx-counter) u1)))
    (asserts! (> val u0) (err u680))
    (map-set search-idx-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set search-idx-counter id)
    (ok id)))
(define-public (update-search-idx (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? search-idx-registry id) (err u681))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u682))
    (asserts! (get active entry) (err u683))
    (ok (map-set search-idx-registry id (merge entry {value: new-val})))))
(define-public (deactivate-search-idx (id uint))
  (let ((entry (unwrap! (map-get? search-idx-registry id) (err u681))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u682))
    (ok (map-set search-idx-registry id (merge entry {active: false})))))
(define-read-only (get-search-idx-entry (id uint))
  (map-get? search-idx-registry id))
(define-read-only (get-search-idx-count)
  (ok (var-get search-idx-counter)))
(define-read-only (is-search-idx-active (id uint))
  (match (map-get? search-idx-registry id)
    entry (get active entry)
    false))
(define-read-only (get-search-idx-owner (id uint))
  (match (map-get? search-idx-registry id)
    entry (ok (get owner entry))
    (err u681)))
(define-read-only (get-search-idx-value (id uint))
  (default-to u0 (get value (map-get? search-idx-registry id))))

;; notif-queue module
(define-map notif-queue-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var notif-queue-counter uint u0)
(define-public (create-notif-queue (val uint))
  (let ((id (+ (var-get notif-queue-counter) u1)))
    (asserts! (> val u0) (err u690))
    (map-set notif-queue-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set notif-queue-counter id)
    (ok id)))
(define-public (update-notif-queue (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? notif-queue-registry id) (err u691))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u692))
    (asserts! (get active entry) (err u693))
    (ok (map-set notif-queue-registry id (merge entry {value: new-val})))))
(define-public (deactivate-notif-queue (id uint))
  (let ((entry (unwrap! (map-get? notif-queue-registry id) (err u691))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u692))
    (ok (map-set notif-queue-registry id (merge entry {active: false})))))
(define-read-only (get-notif-queue-entry (id uint))
  (map-get? notif-queue-registry id))
(define-read-only (get-notif-queue-count)
  (ok (var-get notif-queue-counter)))
(define-read-only (is-notif-queue-active (id uint))
  (match (map-get? notif-queue-registry id)
    entry (get active entry)
    false))
(define-read-only (get-notif-queue-owner (id uint))
  (match (map-get? notif-queue-registry id)
    entry (ok (get owner entry))
    (err u691)))
(define-read-only (get-notif-queue-value (id uint))
  (default-to u0 (get value (map-get? notif-queue-registry id))))

;; audit-trail module
(define-map audit-trail-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var audit-trail-counter uint u0)
(define-public (create-audit-trail (val uint))
  (let ((id (+ (var-get audit-trail-counter) u1)))
    (asserts! (> val u0) (err u700))
    (map-set audit-trail-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set audit-trail-counter id)
    (ok id)))
(define-public (update-audit-trail (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? audit-trail-registry id) (err u701))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u702))
    (asserts! (get active entry) (err u703))
    (ok (map-set audit-trail-registry id (merge entry {value: new-val})))))
(define-public (deactivate-audit-trail (id uint))
  (let ((entry (unwrap! (map-get? audit-trail-registry id) (err u701))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u702))
    (ok (map-set audit-trail-registry id (merge entry {active: false})))))
(define-read-only (get-audit-trail-entry (id uint))
  (map-get? audit-trail-registry id))
(define-read-only (get-audit-trail-count)
  (ok (var-get audit-trail-counter)))
(define-read-only (is-audit-trail-active (id uint))
  (match (map-get? audit-trail-registry id)
    entry (get active entry)
    false))
(define-read-only (get-audit-trail-owner (id uint))
  (match (map-get? audit-trail-registry id)
    entry (ok (get owner entry))
    (err u701)))
(define-read-only (get-audit-trail-value (id uint))
  (default-to u0 (get value (map-get? audit-trail-registry id))))

;; encrypt-mod module
(define-map encrypt-mod-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var encrypt-mod-counter uint u0)
(define-public (create-encrypt-mod (val uint))
  (let ((id (+ (var-get encrypt-mod-counter) u1)))
    (asserts! (> val u0) (err u720))
    (map-set encrypt-mod-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set encrypt-mod-counter id)
    (ok id)))
(define-public (update-encrypt-mod (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? encrypt-mod-registry id) (err u721))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u722))
    (asserts! (get active entry) (err u723))
    (ok (map-set encrypt-mod-registry id (merge entry {value: new-val})))))
(define-public (deactivate-encrypt-mod (id uint))
  (let ((entry (unwrap! (map-get? encrypt-mod-registry id) (err u721))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u722))
    (ok (map-set encrypt-mod-registry id (merge entry {active: false})))))
(define-read-only (get-encrypt-mod-entry (id uint))
  (map-get? encrypt-mod-registry id))
(define-read-only (get-encrypt-mod-count)
  (ok (var-get encrypt-mod-counter)))
(define-read-only (is-encrypt-mod-active (id uint))
  (match (map-get? encrypt-mod-registry id)
    entry (get active entry)
    false))
(define-read-only (get-encrypt-mod-owner (id uint))
  (match (map-get? encrypt-mod-registry id)
    entry (ok (get owner entry))
    (err u721)))
(define-read-only (get-encrypt-mod-value (id uint))
  (default-to u0 (get value (map-get? encrypt-mod-registry id))))

;; data-valid module
(define-map data-valid-registry uint {owner: principal, value: uint, active: bool, created: uint})
(define-data-var data-valid-counter uint u0)
(define-public (create-data-valid (val uint))
  (let ((id (+ (var-get data-valid-counter) u1)))
    (asserts! (> val u0) (err u730))
    (map-set data-valid-registry id {owner: tx-sender, value: val, active: true, created: stacks-block-height})
    (var-set data-valid-counter id)
    (ok id)))
(define-public (update-data-valid (id uint) (new-val uint))
  (let ((entry (unwrap! (map-get? data-valid-registry id) (err u731))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u732))
    (asserts! (get active entry) (err u733))
    (ok (map-set data-valid-registry id (merge entry {value: new-val})))))
(define-public (deactivate-data-valid (id uint))
  (let ((entry (unwrap! (map-get? data-valid-registry id) (err u731))))
    (asserts! (is-eq tx-sender (get owner entry)) (err u732))
    (ok (map-set data-valid-registry id (merge entry {active: false})))))
(define-read-only (get-data-valid-entry (id uint))
  (map-get? data-valid-registry id))
(define-read-only (get-data-valid-count)
  (ok (var-get data-valid-counter)))
