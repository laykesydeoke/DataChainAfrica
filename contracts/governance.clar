;; governance.clar
;; Governance contract for DataChain Africa
;; Allows authorized users to create data plan proposals and vote on them.
;; Owner can close proposals after the voting period ends.

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u400))
(define-constant err-already-voted (err u401))
(define-constant err-proposal-not-found (err u402))
(define-constant err-voting-closed (err u403))
(define-constant err-not-active (err u404))
(define-constant err-invalid-proposal (err u405))
(define-constant err-already-closed (err u406))
(define-constant err-voting-not-ended (err u407))
(define-constant err-invalid-input (err u408))

;; Proposal status values
(define-constant status-active "active")
(define-constant status-passed "passed")
(define-constant status-rejected "rejected")
(define-constant status-closed "closed")

;; Voting period in blocks: ~7 days at 10 min/block = 1008 blocks
(define-data-var default-voting-period uint u1008)

;; Proposal counter
(define-data-var proposal-counter uint u0)

;; Proposals map
(define-map proposals
    { id: uint }
    {
        title: (string-ascii 64),
        description: (string-ascii 256),
        proposer: principal,
        votes-for: uint,
        votes-against: uint,
        status: (string-ascii 10),
        created-at: uint,
        ends-at: uint
    }
)

;; Voter record - tracks who voted on which proposal and how
(define-map voter-record
    { proposal-id: uint, voter: principal }
    { vote: bool }
)

;; Authorized proposers map - only these principals can create proposals
(define-map authorized-proposers
    { proposer: principal }
    { is-authorized: bool }
)

;; ============================================================
;; Admin Functions
;; ============================================================

;; Allow owner to authorize a principal to create proposals
(define-public (authorize-proposer (proposer principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (is-standard proposer) (err err-invalid-input))
        (ok (map-set authorized-proposers
            { proposer: proposer }
            { is-authorized: true }
        ))
    )
)

;; Allow owner to revoke a proposer's authorization
(define-public (revoke-proposer (proposer principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (is-standard proposer) (err err-invalid-input))
        (ok (map-set authorized-proposers
            { proposer: proposer }
            { is-authorized: false }
        ))
    )
)

;; Allow owner to update the default voting period
(define-public (set-voting-period (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        (asserts! (> blocks u0) (err err-invalid-input))
        (var-set default-voting-period blocks)
        (ok true)
    )
)

;; ============================================================
;; Voting
;; ============================================================

;; Vote on a proposal (one vote per address per proposal, during active period)
(define-public (vote-on-proposal (proposal-id uint) (vote bool))
    (let
        ;; Validate proposal-id input
        ((valid-id (asserts! (> proposal-id u0) (err err-invalid-input)))
         (proposal (unwrap! (map-get? proposals { id: proposal-id })
                           (err err-proposal-not-found))))
        ;; Check proposal is still active
        (asserts! (is-eq (get status proposal) status-active) (err err-voting-closed))
        ;; Check voting period has not ended
        (asserts! (< stacks-block-height (get ends-at proposal)) (err err-voting-closed))
        ;; Check voter has not already voted on this proposal
        (asserts! (is-none (map-get? voter-record { proposal-id: proposal-id, voter: tx-sender }))
                 (err err-already-voted))

        ;; Record the vote
        (map-set voter-record
            { proposal-id: proposal-id, voter: tx-sender }
            { vote: vote }
        )

        ;; Update vote counts on the proposal
        (if vote
            (ok (map-set proposals
                { id: proposal-id }
                (merge proposal { votes-for: (+ (get votes-for proposal) u1) })
            ))
            (ok (map-set proposals
                { id: proposal-id }
                (merge proposal { votes-against: (+ (get votes-against proposal) u1) })
            ))
        )
    )
)

;; ============================================================
;; Close Proposal
;; ============================================================

;; Owner closes a proposal after the voting period ends, determining outcome
(define-public (close-proposal (proposal-id uint))
    (let
        ;; Validate proposal-id input
        ((valid-id (asserts! (> proposal-id u0) (err err-invalid-input)))
         (proposal (unwrap! (map-get? proposals { id: proposal-id })
                           (err err-proposal-not-found))))
        ;; Only owner can close proposals
        (asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
        ;; Proposal must be active
        (asserts! (is-eq (get status proposal) status-active) (err err-already-closed))
        ;; Voting period must have ended
        (asserts! (>= stacks-block-height (get ends-at proposal)) (err err-voting-not-ended))

        ;; Determine outcome: passed if votes-for > votes-against
        (let ((outcome (if (> (get votes-for proposal) (get votes-against proposal))
                    status-passed
                    status-rejected)))
            (ok (map-set proposals
                { id: proposal-id }
                (merge proposal { status: outcome })
            ))
        )
    )
)

;; ============================================================
;; Proposal Creation
;; ============================================================

;; Create a new proposal (authorized proposers only)
(define-public (create-proposal (title (string-ascii 64)) (description (string-ascii 256)))
    (let
        ((proposal-id (+ (var-get proposal-counter) u1))
         (auth (default-to { is-authorized: false }
                (map-get? authorized-proposers { proposer: tx-sender }))))
        (asserts! (get is-authorized auth) (err err-not-active))
        (asserts! (> (len title) u0) (err err-invalid-proposal))
        (asserts! (> (len description) u0) (err err-invalid-proposal))
        (var-set proposal-counter proposal-id)
        (ok (map-set proposals
            { id: proposal-id }
            {
                title: title,
                description: description,
                proposer: tx-sender,
                votes-for: u0,
                votes-against: u0,
                status: status-active,
                created-at: stacks-block-height,
                ends-at: (+ stacks-block-height (var-get default-voting-period))
            }
        ))
    )
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Get full proposal details by id
(define-read-only (get-proposal (proposal-id uint))
    (map-get? proposals { id: proposal-id })
)

;; Get current vote counts for a proposal
(define-read-only (get-vote-count (proposal-id uint))
    (match (map-get? proposals { id: proposal-id })
        proposal (ok {
            votes-for: (get votes-for proposal),
            votes-against: (get votes-against proposal),
            total: (+ (get votes-for proposal) (get votes-against proposal))
        })
        (err err-proposal-not-found)
    )
)

;; Check if a voter has already voted on a specific proposal
(define-read-only (has-voted (proposal-id uint) (voter principal))
    (is-some (map-get? voter-record { proposal-id: proposal-id, voter: voter }))
)

;; Get how a voter voted on a proposal (true=for, false=against)
(define-read-only (get-vote (proposal-id uint) (voter principal))
    (map-get? voter-record { proposal-id: proposal-id, voter: voter })
)

;; Get total number of proposals created
(define-read-only (get-proposal-count)
    (var-get proposal-counter)
)

;; Get the current default voting period in blocks
(define-read-only (get-voting-period)
    (var-get default-voting-period)
)

;; Check if a principal is an authorized proposer
(define-read-only (is-authorized-proposer (proposer principal))
    (default-to false
        (get is-authorized (map-get? authorized-proposers { proposer: proposer })))
)

;; Check if a proposal's voting period is still active
(define-read-only (is-voting-active (proposal-id uint))
    (match (map-get? proposals { id: proposal-id })
        proposal (and
            (is-eq (get status proposal) status-active)
            (< stacks-block-height (get ends-at proposal)))
        false
    )
)
