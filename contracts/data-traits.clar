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
        (create-listing (uint uint uint) (response uint uint))
        (cancel-listing (uint) (response bool uint))
        (purchase-listing (uint) (response bool uint))
    )
)
