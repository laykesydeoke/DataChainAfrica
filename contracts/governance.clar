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
