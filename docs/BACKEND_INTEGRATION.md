# Backend Integration Status — NOT CONNECTED

This repository (`bmcdamien30/Damian-`) has no access to any real GarnettWork
backend. There is no Teaser endpoint, no Supabase instance, no cron
infrastructure, no MCP OAuth service, and no Factory data reachable from this
codebase or from the session that built it. This file exists so that fact is
explicit and doesn't get lost.

Per the engineering rule this site was built under: if a real endpoint or
packet contract can't be proven from accessible source or configuration, that
integration stops and gets reported here instead of mocked. That's what
happened for every backend path below.

## Teaser / Truth decision service

```
ENDPOINT=UNKNOWN — not present in this repository
METHOD=UNKNOWN
REQUEST_SCHEMA=UNKNOWN
RESPONSE_SCHEMA=UNKNOWN (see "Known response fields" below, inferred from
  product spec, not from an actual contract)
AUTH_REQUIRED=UNKNOWN — likely yes, given the MCP service is OAuth-protected
CLIENT_SAFE=NO — do not call a real Truth/Teaser endpoint directly from
  browser JS with embedded credentials. Any real integration must go through
  a server-side proxy that holds the credentials.
```

Known response fields the UI was built to render (from product spec, not a
proven schema):

- canonical product identity
- verdict: `PASS` / `FAIL` / `REFUSE`
- reason
- asking price
- shipping / landed price (when known)
- verified comparable count
- verified fair range
- Max Safe Buy (when supported)
- known risks
- unknowns
- evidence / receipt status

`js/main.js` implements `renderResult(fixture)` against exactly this shape,
so wiring a real endpoint later is a matter of replacing `matchFixture()`
with a server-side fetch that returns the same shape — not a UI rewrite.

## MCP / Truth OAuth service

```
ENDPOINT=UNKNOWN — not present in this repository
METHOD=UNKNOWN
REQUEST_SCHEMA=UNKNOWN
RESPONSE_SCHEMA=UNKNOWN
AUTH_REQUIRED=YES (OAuth, per product spec)
CLIENT_SAFE=NO — service-role credentials for this must never be placed in
  this public GitHub Pages repository or in any file served to the browser.
```

## What this means for the current site

- The hero "Check This Listing" demo runs entirely on hard-coded fixtures in
  `js/main.js` (`FIXTURES` object). Every rendered result carries a visible
  "DEVELOPMENT FIXTURE" banner.
- SELL / TRADE / WATCH / VALUE intents are rendered as disabled pills labeled
  "Not connected" — no fixture or backend exists for them here, so they were
  not faked as interactive.
- No API keys, tokens, or service-role secrets exist anywhere in this
  repository.

## To wire a real backend later

1. Confirm the actual Teaser/Truth endpoint URL, method, and request/response
   schema from the real GarnettWork backend repo (not this one).
2. Stand up a server-side proxy (this is a static GitHub Pages site — it has
   no server of its own) that holds any required credentials and forwards
   client requests to the real service.
3. Replace `matchFixture()` in `js/main.js` with a `fetch()` call to that
   proxy, keeping `renderResult()` and the field shape unchanged.
4. Remove the fixture banner once real data is flowing.

Until those steps happen, everything under `#demo` on this site is
illustrative only.
