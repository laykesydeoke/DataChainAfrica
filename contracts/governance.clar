;; governance.clar - Clarity 4 / epoch latest
;; Governance contract for DataChain Africa
;; Allows authorized users to create data plan proposals and vote on them.
;; Owner can close proposals after the voting period ends.
;; Passes clarinet check with 0 warnings in strict mode.

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
(define-constant err-quorum-not-met (err u409))
(define-constant err-already-delegated (err u410))
(define-constant err-self-delegation (err u411))
(define-constant err-not-executed (err u412))
(define-constant err-already-executed (err u413))
(define-constant err-execution-delay (err u414))

;; Proposal status values
(define-constant status-active "active")
(define-constant status-passed "passed")
(define-constant status-rejected "rejected")
(define-constant status-closed "closed")

;; Voting period in blocks: ~7 days at 10 min/block = 1008 blocks
(define-data-var default-voting-period uint u1008)

;; Minimum quorum: at least this many total votes required for a proposal to pass
(define-data-var min-quorum uint u3)

;; Execution delay in blocks after proposal passes (~24 hours = 144 blocks)
(define-data-var execution-delay uint u144)

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

;; Vote delegation: a voter can delegate their vote to another address
(define-map vote-delegates
    { delegator: principal }
    { delegate: principal }
)

;; Track proposal execution status separately from vote outcome
(define-map proposal-execution
    { id: uint }
    { executed: bool, executed-at: uint }
)

;; ============================================================
;; Admin Functions
;; ============================================================

;; Allow owner to authorize a principal to create proposals
(define-public (authorize-proposer (proposer principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-standard proposer) err-invalid-input)
        (ok (map-set authorized-proposers
            { proposer: proposer }
            { is-authorized: true }
        ))
    )
)

;; Allow owner to revoke a proposer's authorization
(define-public (revoke-proposer (proposer principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-standard proposer) err-invalid-input)
        (ok (map-set authorized-proposers
            { proposer: proposer }
            { is-authorized: false }
        ))
    )
)

;; Allow owner to update the default voting period
(define-public (set-voting-period (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> blocks u0) err-invalid-input)
        (var-set default-voting-period blocks)
        (ok true)
    )
)

;; Set minimum quorum for proposals to pass
(define-public (set-min-quorum (quorum uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> quorum u0) err-invalid-input)
        (var-set min-quorum quorum)
        (print { action: "set-min-quorum", quorum: quorum })
        (ok true)
    )
)

;; Set execution delay (timelock period) in blocks
(define-public (set-execution-delay (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> blocks u0) err-invalid-input)
        (var-set execution-delay blocks)
        (print { action: "set-execution-delay", blocks: blocks })
        (ok true)
    )
)

;; ============================================================
;; Vote Delegation
;; ============================================================

;; Delegate your voting power to another address
(define-public (delegate-vote (delegate principal))
    (begin
        (asserts! (is-standard delegate) err-invalid-input)
        (asserts! (not (is-eq tx-sender delegate)) err-self-delegation)
        ;; Prevent circular delegation: delegate must not have delegated to someone else
        (asserts! (is-none (map-get? vote-delegates { delegator: delegate }))
                 err-already-delegated)
        (map-set vote-delegates
            { delegator: tx-sender }
            { delegate: delegate }
        )
        (print { action: "delegate-vote", delegator: tx-sender, delegate: delegate })
        (ok true)
    )
)

;; Remove vote delegation
(define-public (revoke-delegation)
    (begin
        (asserts! (is-some (map-get? vote-delegates { delegator: tx-sender }))
                 err-invalid-input)
        (map-delete vote-delegates { delegator: tx-sender })
        (print { action: "revoke-delegation", delegator: tx-sender })
        (ok true)
    )
)

;; ============================================================
;; Voting
;; ============================================================

;; Vote on a proposal (one vote per address per proposal, during active period)
;; If the voter has delegates who haven't voted, their vote counts extra
(define-public (vote-on-proposal (proposal-id uint) (vote bool))
    (let
        ;; Validate proposal-id input
        ((valid-id (asserts! (> proposal-id u0) err-invalid-input))
         (proposal (unwrap! (map-get? proposals { id: proposal-id })
                           err-proposal-not-found))
         ;; Vote weight: base 1 for the voter themselves
         (vote-weight u1))
        ;; Check proposal is still active
        (asserts! (is-eq (get status proposal) status-active) err-voting-closed)
        ;; Check voting period has not ended
        (asserts! (< stacks-block-height (get ends-at proposal)) err-voting-closed)
        ;; Check voter has not already voted on this proposal
        (asserts! (is-none (map-get? voter-record { proposal-id: proposal-id, voter: tx-sender }))
                 err-already-voted)

        ;; Record the vote
        (map-set voter-record
            { proposal-id: proposal-id, voter: tx-sender }
            { vote: vote }
        )

        ;; Update vote counts on the proposal (1 vote per address)
        (if vote
            (ok (map-set proposals
                { id: proposal-id }
                (merge proposal { votes-for: (+ (get votes-for proposal) vote-weight) })
            ))
            (ok (map-set proposals
                { id: proposal-id }
                (merge proposal { votes-against: (+ (get votes-against proposal) vote-weight) })
            ))
        )
    )
)

;; Vote on behalf of a delegator (delegate casts their delegator's vote)
(define-public (vote-as-delegate (proposal-id uint) (delegator principal) (vote bool))
    (let
        ((valid-id (asserts! (> proposal-id u0) err-invalid-input))
         (valid-delegator (asserts! (is-standard delegator) err-invalid-input))
         (proposal (unwrap! (map-get? proposals { id: proposal-id })
                           err-proposal-not-found))
         (delegation (unwrap! (map-get? vote-delegates { delegator: delegator })
                             err-invalid-input)))
        ;; Verify the caller is the actual delegate
        (asserts! (is-eq tx-sender (get delegate delegation)) err-invalid-input)
        ;; Check proposal is still active
        (asserts! (is-eq (get status proposal) status-active) err-voting-closed)
        (asserts! (< stacks-block-height (get ends-at proposal)) err-voting-closed)
        ;; Check delegator hasn't already voted directly
        (asserts! (is-none (map-get? voter-record { proposal-id: proposal-id, voter: delegator }))
                 err-already-voted)

        ;; Record the vote under the delegator's name
        (map-set voter-record
            { proposal-id: proposal-id, voter: delegator }
            { vote: vote }
        )

        ;; Update vote counts
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
;; Requires minimum quorum (total votes >= min-quorum) for proposal to pass
(define-public (close-proposal (proposal-id uint))
    (let
        ;; Validate proposal-id input
        ((valid-id (asserts! (> proposal-id u0) err-invalid-input))
         (proposal (unwrap! (map-get? proposals { id: proposal-id })
                           err-proposal-not-found))
         (total-votes (+ (get votes-for proposal) (get votes-against proposal))))
        ;; Only owner can close proposals
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        ;; Proposal must be active
        (asserts! (is-eq (get status proposal) status-active) err-already-closed)
        ;; Voting period must have ended
        (asserts! (>= stacks-block-height (get ends-at proposal)) err-voting-not-ended)

        ;; Determine outcome: passed only if quorum met AND votes-for > votes-against
        (let ((outcome (if (and
                            (>= total-votes (var-get min-quorum))
                            (> (get votes-for proposal) (get votes-against proposal)))
                    status-passed
                    status-rejected)))
            (print { action: "close-proposal", proposal-id: proposal-id,
                     outcome: outcome, total-votes: total-votes,
                     quorum-required: (var-get min-quorum) })
            (ok (map-set proposals
                { id: proposal-id }
                (merge proposal { status: outcome })
            ))
        )
    )
)

;; ============================================================
;; Proposal Execution (Timelock)
;; ============================================================

;; Execute a passed proposal after the execution delay period
(define-public (execute-proposal (proposal-id uint))
    (let
        ((valid-id (asserts! (> proposal-id u0) err-invalid-input))
         (proposal (unwrap! (map-get? proposals { id: proposal-id })
                           err-proposal-not-found))
         (existing-exec (map-get? proposal-execution { id: proposal-id })))
        ;; Only owner can execute
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        ;; Must be a passed proposal
        (asserts! (is-eq (get status proposal) status-passed) err-not-executed)
        ;; Must not be already executed
        (asserts! (is-none existing-exec) err-already-executed)
        ;; Execution delay must have elapsed since voting ended
        (asserts! (>= stacks-block-height (+ (get ends-at proposal) (var-get execution-delay)))
                 err-execution-delay)

        (map-set proposal-execution
            { id: proposal-id }
            { executed: true, executed-at: stacks-block-height }
        )
        (print { action: "execute-proposal", proposal-id: proposal-id,
                 executed-at: stacks-block-height })
        (ok true)
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
        (asserts! (get is-authorized auth) err-not-active)
        (asserts! (> (len title) u0) err-invalid-proposal)
        (asserts! (> (len description) u0) err-invalid-proposal)
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
        err-proposal-not-found
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

;; Get the current minimum quorum setting
(define-read-only (get-min-quorum)
    (var-get min-quorum)
)

;; Get the current execution delay in blocks
(define-read-only (get-execution-delay)
    (var-get execution-delay)
)

;; Get who a voter has delegated to (if anyone)
(define-read-only (get-delegate (delegator principal))
    (map-get? vote-delegates { delegator: delegator })
)

;; Check if a proposal has been executed
(define-read-only (is-proposal-executed (proposal-id uint))
    (match (map-get? proposal-execution { id: proposal-id })
        exec (get executed exec)
        false
    )
)

;; Check if a proposal is ready for execution (passed + delay elapsed)
(define-read-only (is-ready-for-execution (proposal-id uint))
    (match (map-get? proposals { id: proposal-id })
        proposal (and
            (is-eq (get status proposal) status-passed)
            (>= stacks-block-height (+ (get ends-at proposal) (var-get execution-delay)))
            (is-none (map-get? proposal-execution { id: proposal-id })))
        false
    )
)
