;; data-traits.clar
;; Shared trait definitions for DataChainAfrica contracts

(define-trait data-tracking-trait
    (
        ;; Get plan details (read-only)
        (get-plan-details (uint) (optional {
            data-amount: uint,
            duration-blocks: uint,
            price: uint,
            is-active: bool
        }))

        ;; Subscribe to plan
        (subscribe-to-plan (uint bool) (response bool uint))

        ;; Get usage details for a user
        (get-usage (principal) (response {
            total-data-used: uint,
            last-updated: uint,
            data-balance: uint,
            plan-expiry: uint,
            plan-type: uint,
            auto-renew: bool,
            rollover-data: uint
        } uint))
    )
)

(define-trait marketplace-trait
    (
        ;; Create a new data listing
        (create-listing (uint uint uint) (response uint uint))
        ;; Cancel an existing listing
        (cancel-listing (uint) (response bool uint))
        ;; Purchase a listing
        (purchase-listing (uint) (response bool uint))
    )
)

(define-trait pausable-trait
    (
        ;; Get the pause state
        (get-paused () bool)
    )
)
