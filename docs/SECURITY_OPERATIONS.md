# AMR Security, Testing, Operations, And Releases

Last updated: 2026-06-09

## Security Model

Threats include:

-   hostile source pages
-   changed or compromised source sites
-   malicious HTML and script data
-   stolen account tokens
-   forged leaderboard events
-   user-created generic source templates
-   excessive permissions
-   supply-chain compromise
-   leaked diagnostics

## Extension Security

-   Manifest V3
-   no remote executable code
-   no `eval`, `new Function`, or script tag injection
-   strict Content Security Policy
-   host permissions requested per source
-   minimal content scripts
-   sender and payload validation on every runtime message
-   HTML parsed as data, never inserted unsanitized
-   external links use safe tab APIs
-   tokens never stored in page localStorage
-   secrets are not sent to content scripts
-   source pages cannot choose extension message operations
-   network response sizes and timeouts are bounded

User-created generic templates are declarative and validated. They cannot execute code.

## Account Security

-   passkeys preferred
-   Argon2id for passwords
-   short-lived access token
-   rotating refresh token
-   refresh token stored in extension local storage and encrypted where browser facilities
    allow
-   server-side session revocation
-   email verification
-   rate limits per IP, account, and device
-   breached password checks where legally and operationally appropriate
-   audit log for login, profile, privacy, and sync changes

Do not place API secrets in the extension. Public extension clients cannot safely hold
client secrets.

## Privacy

Default:

-   no account
-   no telemetry
-   no public profile
-   no leaderboard participation
-   no title-level activity upload

Separate consent switches:

-   crash reports
-   anonymous source health
-   encrypted sync
-   aggregate public statistics
-   verified leaderboard activity

Users can export and delete local and remote data.

Diagnostics must remove:

-   cookies
-   authorization headers
-   tokens
-   query parameters likely to contain secrets
-   full HTML
-   manga titles when privacy mode is enabled

## Anti-Cheat

Perfect anti-cheat is impossible in a client-controlled extension. The goal is to stop
trivial fabrication and make competitive data meaningfully verified.

### Verified Session

1. Extension requests a signed session challenge.
2. Server returns session ID, nonce, expiry, and allowed event policy.
3. Extension records page and progress events with monotonic sequence numbers.
4. Events are hashed into a chain.
5. Batches include challenge, chain head, timing, source ID, and chapter fingerprint.
6. Server checks sequence, timing, replay, impossible rates, and duplicate fingerprints.
7. Completion receives a verification confidence score.

### Server Checks

-   nonce replay
-   impossible chapter completion time
-   impossible page rate
-   overlapping sessions
-   excessive daily totals
-   repeated identical event batches
-   device clock drift
-   unsupported or unknown extension version
-   revoked session

### Ranking Rules

-   imported history never counts competitively
-   offline activity may count locally but is unverified
-   suspicious activity is excluded without publicly accusing the user
-   users can appeal moderation decisions
-   seasonal boards cap points per day
-   no rewards with monetary value

Do not use invasive fingerprinting.

## Autonomous Development Testing

The project must be testable without the user loading an extension manually.

### Test Layers

On every pull request:

1. format check
2. lint
3. TypeScript
4. unit tests
5. adapter fixture tests
6. extension build for Chrome
7. extension build for Firefox
8. manifest policy checks
9. Chromium browser smoke tests
10. Firefox browser smoke tests
11. API tests
12. website tests
13. dependency and secret scans

Nightly:

-   full browser suite
-   long chapter memory test
-   1,000 and 10,000 library performance tests
-   live source health checks
-   API migration test
-   backup restore test
-   accessibility scan

Release:

-   clean install
-   upgrade from previous stable
-   legacy data import
-   offline API behavior
-   revoked permissions
-   service worker restart
-   browser restart and progress resume
-   signed package verification

### Chromium Harness

-   Playwright persistent Chromium context
-   load unpacked extension
-   discover extension ID
-   open popup and full pages
-   use local fixture source server
-   capture trace, video, screenshots, console, service-worker logs, and network HAR

### Firefox Harness

-   build Firefox package
-   launch temporary profile with `web-ext`
-   install temporary extension
-   control Firefox through geckodriver and WebDriver
-   expose a test-only diagnostics page in non-production builds
-   capture browser console, extension logs, screenshots, profile logs, and test reports

Do not pretend Playwright provides equivalent Firefox extension loading.

### Fixture Source Server

Run a local deterministic HTTP server containing:

-   manga page
-   paginated chapter list
-   direct image chapter
-   page-per-image chapter
-   delayed response
-   HTTP errors
-   malformed HTML
-   login wall
-   Cloudflare-like interstitial
-   changed selector fixture
-   hotlink header requirement

All critical extension behavior must be testable against fixtures.

## Logging

Structured log fields:

-   timestamp
-   level
-   area
-   operation
-   source ID
-   request ID
-   duration
-   error code
-   extension version
-   browser

Storage:

-   in-memory ring buffer
-   bounded local persisted error buffer
-   CI artifacts during tests
-   optional remote crash upload with consent

Production logs never include raw HTML, tokens, cookies, or image URLs with sensitive
query strings.

## Diagnostic Bundle

User-exported ZIP:

-   extension version and manifest
-   browser and OS
-   enabled source IDs
-   permissions summary
-   recent redacted logs
-   source health results
-   database schema version
-   optional record counts

No library titles by default.

## CI Artifacts

Every browser failure uploads:

-   test report
-   trace
-   screenshots
-   video where supported
-   console logs
-   background logs
-   fixture server logs
-   redacted storage snapshot
-   generated manifests
-   extension package

Retention:

-   pull request: 14 days
-   main branch: 30 days
-   release: permanent release artifacts

## Source Health Automation

Each source has:

-   fixture tests
-   one or more live canary URLs
-   search canary where legal and stable
-   expected operation timing
-   parser version

Nightly checks classify:

-   healthy
-   slow
-   blocked
-   permission changed
-   parser changed
-   offline

Live checks do not download complete chapters. They minimize load on third-party sites.

Failures create or update one GitHub issue per source with:

-   first and last failure
-   operation
-   error class
-   sanitized sample
-   recent commit

## VPS Decision

Use a VPS for:

-   API
-   PostgreSQL
-   website
-   scheduled source health worker
-   optional self-hosted browser test runner

Do not use a VPS as:

-   a required reader proxy
-   a remote code source for the extension
-   an SSH bridge from the browser
-   the only place builds can run

Initial VPS layout:

-   Caddy
-   web container
-   API container
-   PostgreSQL
-   backup job
-   optional Valkey
-   monitoring agent

Development remains reproducible locally and in GitHub Actions.

## Deployment

GitHub Actions:

1. test
2. build immutable containers
3. push to container registry
4. run database migration check
5. deploy over restricted SSH or a pull-based agent
6. health check
7. rollback on failure

SSH:

-   key restricted to deployment user
-   no password login
-   no root login
-   firewall allows only HTTPS and restricted SSH
-   fail2ban or equivalent
-   unattended security updates

## Backups

-   PostgreSQL daily encrypted backup
-   weekly restore drill
-   retention: 7 daily, 4 weekly, 6 monthly
-   backups stored outside the VPS
-   restore procedure is automated and tested

## Monitoring

-   uptime
-   API latency and errors
-   database connections and storage
-   authentication failures
-   queue depth
-   source health
-   release adoption

Alert only on actionable thresholds.

## Extension Updates

Stable distribution:

-   Chrome Web Store for Chromium browsers
-   Firefox Add-ons for Firefox signing and updates
-   GitHub Releases for source, checksums, changelog, and optional manual packages

Store installations receive updates through browser-managed mechanisms.

Do not implement a custom executable code updater.

The extension may fetch signed, non-executable data:

-   source health flags
-   minimum supported version
-   announcements
-   achievement definitions

Fetched data is schema validated, signature checked, cached, and cannot change host
permissions or execute code.

## Release Channels

-   nightly: CI artifacts only
-   beta: unlisted or dedicated beta listing
-   stable: browser stores

Versioning:

-   semantic version
-   one shared product version
-   browser packages generated from the same commit

## Release Workflow

1. merge to main
2. CI passes
3. changeset generates version and changelog
4. tag created
5. Chrome and Firefox packages built reproducibly
6. packages signed or submitted through store APIs
7. GitHub Release created with checksums
8. staged rollout starts
9. monitoring checks errors
10. rollout continues or release is halted

Store credentials exist only in protected CI environments.

## Supply Chain

-   lockfile required
-   automated dependency updates
-   dependency review on pull requests
-   secret scanning
-   CodeQL or equivalent static analysis
-   npm provenance where available
-   pinned GitHub Action major or commit versions
-   production dependency license review

## Moderation

Before public profiles:

-   report profile
-   block user
-   private by default
-   username policy
-   avatar moderation
-   account deletion
-   audit trail

No public comments or messaging until moderation capacity exists.
