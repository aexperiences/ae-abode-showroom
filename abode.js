/* ============================================================================
   ABODE OS — SHOWROOM ENGINE
   Real Estate Brokerage OS · Powered by Accelerated Experiences LLC

   BROWSER-ONLY SHOWROOM. No backend, no network. Everything lives in this
   browser tab's sessionStorage and resets when the visitor leaves or idles.
   Faithful to real AEHub canon: Broker-Owner -> COO -> DH -> AE -> Event Bus ->
   Pacemaker -> Triad (2 opposing lenses + Pacemaker), confidence-gated release,
   LIVE/ESTIMATE/ASSUMPTION source tags, the Fences (drafts only, nothing sent,
   nothing spent, no money moved).

   Industry grounding: GCI / company dollar / split-and-cap math (RealTrends,
   NAR vocabulary), managing-broker compliance review, DA (disbursement
   authorization), RESPA §8, Fair Housing Act §804(c), the Aug-2024 NAR
   settlement. Every benchmark ships sourced or blank — never asserted.
   ============================================================================ */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ store */
  var KEY = "abode_showroom_v1";
  var IDLE_MS = 20 * 60 * 1000;         // reset the floor 20 min after they walk away
  var STORE = (function(){ try{ localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return localStorage; }catch(e){ return sessionStorage; } })();

  function now() { return Date.now(); }
  function read() {
    try { var d = JSON.parse(STORE.getItem(KEY)); return d || null; } catch (e) { return null; }
  }
  function write(d) { d._t = now(); try { STORE.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  function fresh() {
    return {
      _t: now(), started: now(),
      tier: "grandsuite",   // the package they're standing in
      adds: [],             // departments added ON TOP of that package
      offs: [],             // departments taken OFF that package
      agents:     clone(SEED.agents),
      deals:      clone(SEED.deals),
      listings:   clone(SEED.listings),
      contacts:   clone(SEED.contacts),
      compliance: clone(SEED.compliance),
      campaigns:  clone(SEED.campaigns),
      recruits:   clone(SEED.recruits),
      billing:    clone(SEED.billing),
      systems:    clone(SEED.systems),
      matters:    clone(SEED.matters),
      bus: [],
      approvals:  clone(SEED.approvals),
      seq: 1
    };
  }
  function clone(a){ return JSON.parse(JSON.stringify(a)); }
  function db() {
    var d = read();
    if (!d) { d = fresh(); write(d); return d; }
    if (now() - (d._t || 0) > IDLE_MS) { d = fresh(); write(d); }
    return d;
  }
  function save(mut) { var d = db(); mut(d); write(d); return d; }
  function resetFloor() { var d = fresh(); write(d); return d; }

  /* ====================================================================
     INDUSTRY CANON — the real vocabulary. Not invented.
     ==================================================================== */

  /* Transaction milestones fall off the contract date. A file cannot advance
     to "clear to close" until its documents clear the broker compliance
     portal — Abode's rights-gate, the analog of Buttress's ASI-vs-CO gate. */
  var MILESTONES = [
    { k:"earnest",   name:"Earnest money delivered",  offset:3,  note:"Buyer's good-faith deposit to escrow." },
    { k:"inspection",name:"Inspection contingency",   offset:10, note:"Right to inspect and object." },
    { k:"appraisal", name:"Appraisal complete",       offset:21, note:"Lender's value must support the price." },
    { k:"financing", name:"Financing / loan approval",offset:30, note:"Final underwriting; the deal's last real risk." },
    { k:"walkthru",  name:"Final walk-through",        offset:-1, note:"Day before closing (relative to close date)." },
    { k:"close",     name:"Clear to close · fund & record", offset:0, note:"Docs clear, DA issued, keys change hands." }
  ];

  /* The document set the managing broker reviews. Status flows
     Pending Review -> Approved / Changes Requested / Rejected. A Rejected or
     missing required doc BLOCKS clear-to-close. */
  var DOC_TYPES = [
    { k:"PSA",     label:"Purchase & Sale Agreement" },
    { k:"AGENCY",  label:"Agency Disclosure" },
    { k:"SELLER",  label:"Seller Property Disclosure" },
    { k:"LEAD",    label:"Lead-Based Paint Disclosure" },
    { k:"WIRE",    label:"Wire-Fraud Advisory" }
  ];
  var DOC_STATUS = ["Approved", "Pending Review", "Changes Requested", "Rejected"];

  /* Listing status ladder — MLS-fed in production (RESO Web API). */
  var LISTING_STATUS = ["Coming Soon", "Active", "Pending", "Sold", "Withdrawn"];

  /* Lead-routing rules a brokerage actually runs. */
  var ROUTING = [
    { k:"robin",   name:"Round-robin",       note:"Next agent in the queue, in order — fair, even distribution." },
    { k:"blast",   name:"First-to-claim",    note:"Blast to a pod; first to accept owns the lead." },
    { k:"perf",    name:"Performance-based", note:"Weighted to agents with the best conversion on that lead type." }
  ];

  /* Financial benchmarks. Real estate has no clean, single published target for
     most of these (splits and caps are brokerage-specific), so bands ship BLANK
     with an honest note. We never invent a target we can't source. */
  var BENCH = {
    companyDollar: { target:null, src:"No single published benchmark — company dollar depends entirely on the firm's split/cap model. Shown computed, without a target band." },
    companyPct:    { target:null, src:"Varies by split plan (60/40 to 90/10) and cap. No industry target; shown live." },
    dom:           { target:null, src:"Days-on-market is local and price-band specific. Compare against your own MLS median, not a national number." },
    cap:           { target:null, src:"Cap amounts are set per brokerage (franchise cap models run ~$16k–$23k). No industry 'right' number." }
  };

  /* Genuinely-sourced context, tagged and caveated — never a fabricated stat. */
  var CONTEXT = [
    { stat:"Aug 17 2024", claim:"the NAR settlement took effect — offers of buyer-broker compensation can't be posted in the MLS, and written buyer-agency agreements are required up front", src:"National Association of REALTORS® settlement (widely reported)" },
    { stat:"Company dollar", claim:"is the only revenue a brokerage actually keeps — GCI minus every agent split, cap credit and franchise fee. Most firms can't produce it live", src:"RealTrends / brokerage-accounting convention" },
    { stat:"A capped top producer", claim:"can bring the house near-zero on each new close — so company dollar rides on your mid-tier agents, not your stars", src:"Split-and-cap model math (computed on this floor)" },
    { stat:"RESPA §8", claim:"makes an un-papered cost-split with a lender an illegal kickback — the compliance read has to catch it before an ad runs", src:"RESPA / Regulation X" }
  ];

  /* What Abode OS replaces — the stack and the headcount, priced against that. */
  var REPLACES = [
    { tool:"kvCORE / BoldTrail / Chime", job:"CRM, IDX agent sites, lead routing, smart lists", cost:"~$500–1,500/mo per office (third-party est.; vendors quote-only)" },
    { tool:"SkySlope / Dotloop / Brokermint", job:"Transaction management, compliance review, e-sign", cost:"$200–1,000/mo published tiers" },
    { tool:"Brokermint / Loft47 (back office)", job:"Commission splits, caps, DA generation, agent billing", cost:"Per-transaction or per-agent fees" },
    { tool:"DocuSign / Adobe Sign", job:"E-signature on association forms", cost:"$25–75/user/mo published" },
    { tool:"A part-time TC + bookkeeper", job:"Chasing docs, cutting DAs, chasing desk-fee AR", cost:"Headcount" }
  ];

  /* --------------------------------------------------------------- seed data */
  var SEED = {
    /* The roster — producers + staff, each with their split plan, cap progress
       and (real-estate-real) license expiry. This is the labor spine: the money
       math, cap progress, per-agent production and the HR license gate all read
       from here. Deliberately imperfect: one agent just capped, one license is
       about to lapse, one agent is behind cap pace. */
    agents: [
      { id:"a1", name:"Regina Alvarez", role:"Managing Broker", type:"Human", status:"Active",
        team:"", tier:"Broker desk · 90/10", cap:0, capPriorYTD:0, splitHouse:0.10, txnFee:0,
        franchisePct:0, franchiseCap:0, franchisePriorYTD:0, teamSplit:0,
        license:"ID DB-22140 · exp 2028-04-30", ce:"12 / 12 hrs",
        note:"Designated & managing broker. Owns the compliance review portal. Light personal production." },
      { id:"a2", name:"Marcus Bell", role:"Team Lead — Bell Group", type:"Human", status:"Active",
        team:"", tier:"Team lead · 75/25 cap", cap:18000, capPriorYTD:18000, splitHouse:0.25, txnFee:350,
        franchisePct:6, franchiseCap:3000, franchisePriorYTD:3000, teamSplit:0,
        license:"ID SP-30881 · exp 2027-09-30", ce:"14 / 12 hrs",
        note:"Capped for the year. Runs a two-agent team; collects the team split on Nair's deals." },
      { id:"a3", name:"Priya Nair", role:"Agent — Bell Group", type:"Human", status:"Active",
        team:"Marcus Bell", tier:"70/30 cap", cap:16000, capPriorYTD:16000, splitHouse:0.30, txnFee:350,
        franchisePct:6, franchiseCap:3000, franchisePriorYTD:3000, teamSplit:0.25,
        license:"ID SP-31902 · exp 2027-12-31", ce:"12 / 12 hrs",
        note:"⚑ Just hit her $16,000 cap this month — she flips to ~100% (flat fee only) on the next close." },
      { id:"a4", name:"Danny Cho", role:"Agent", type:"Human", status:"Active",
        team:"", tier:"70/30 cap", cap:16000, capPriorYTD:6400, splitHouse:0.30, txnFee:350,
        franchisePct:6, franchiseCap:3000, franchisePriorYTD:1800, teamSplit:0,
        license:"ID SP-33110 · exp 2027-06-30", ce:"10 / 12 hrs",
        note:"Behind cap pace at mid-year — still on the 30% house split on every close." },
      { id:"a5", name:"Sofia Ramos", role:"Agent", type:"Human", status:"Active",
        team:"", tier:"70/30 cap", cap:16000, capPriorYTD:10200, splitHouse:0.30, txnFee:350,
        franchisePct:6, franchiseCap:3000, franchisePriorYTD:1800, teamSplit:0,
        license:"ID SP-29455 · exp 2026-09-15", ce:"9 / 12 hrs",
        note:"⚠ License renews in under 60 days and CE is short 3 hours — a lapsed license is a stop-work event, not a nicety." },
      { id:"a6", name:"Wes Okafor", role:"Agent (new)", type:"Human", status:"Onboarding",
        team:"", tier:"60/40 cap · new-agent", cap:20000, capPriorYTD:900, splitHouse:0.40, txnFee:350,
        franchisePct:6, franchiseCap:3000, franchisePriorYTD:300, teamSplit:0,
        license:"ID SP-34220 · exp 2028-01-31", ce:"— (new)",
        note:"Started this month. IC agreement signed, MLS + lockbox provisioned, onboarding portal 60% complete." }
    ],

    /* The deals — the transaction spine. Closed deals drive company dollar and
       cap progress; pending deals drive pending volume and the compliance gate. */
    deals: [
      { id:"d1", address:"812 Lakeshore Dr, Coeur d'Alene", mls:"24-8812", agent:"Marcus Bell",
        side:"List", sides:1, price:720000, rate:3.0, status:"Closed", contractDate:"2026-06-20",
        closeDate:"2026-07-10", dom:14, listPrice:735000, note:"Waterfront. Sold under list after one reduction." },
      { id:"d2", address:"305 Pine Meadow Ln, Hayden", mls:"25-1043", agent:"Priya Nair",
        side:"Buy", sides:1, price:465000, rate:2.5, status:"Closed", contractDate:"2026-06-28",
        closeDate:"2026-07-18", dom:9, listPrice:459000, note:"Buyer side. Priya's first close after capping." },
      { id:"d3", address:"77 Sherman Ave Unit 4, Coeur d'Alene", mls:"25-1190", agent:"Danny Cho",
        side:"List", sides:1, price:389000, rate:3.0, status:"Closed", contractDate:"2026-06-05",
        closeDate:"2026-06-28", dom:22, listPrice:399000, note:"Condo. Danny still pre-cap — full house split." },
      { id:"d4", address:"1420 Ramsey Rd, Hayden", mls:"24-9970", agent:"Sofia Ramos",
        side:"Dual", sides:2, price:540000, rate:2.5, status:"Closed", contractDate:"2026-06-12",
        closeDate:"2026-07-05", dom:31, listPrice:549000, note:"Represented both sides — this close pushes Sofia over her cap." },
      { id:"d5", address:"9 Fernan Hill Rd, Coeur d'Alene", mls:"25-1201", agent:"Regina Alvarez",
        side:"Buy", sides:1, price:615000, rate:2.5, status:"Closed", contractDate:"2026-06-30",
        closeDate:"2026-07-14", dom:6, listPrice:619000, note:"Broker's personal client. 90/10 desk." },
      { id:"d6", address:"220 Coeur Village, Post Falls", mls:"25-1260", agent:"Marcus Bell",
        side:"List", sides:1, price:410000, rate:3.0, status:"Closed", contractDate:"2026-07-05",
        closeDate:"2026-07-22", dom:12, listPrice:419000, note:"Bell capped — house keeps the flat transaction fee only." },

      { id:"d7", address:"55 Selkirk Ridge, Rathdrum", mls:"25-1288", agent:"Priya Nair",
        side:"List", sides:1, price:585000, rate:3.0, status:"Pending", contractDate:"2026-07-06",
        closeDate:"2026-08-05", dom:18, listPrice:585000, earnestDue:"2026-07-09",
        note:"Under contract. Lead-paint disclosure is in changes-requested — clears once initials are added." },
      { id:"d8", address:"1201 Government Way, Coeur d'Alene", mls:"25-1301", agent:"Danny Cho",
        side:"Buy", sides:1, price:335000, rate:2.5, status:"Clear to Close", contractDate:"2026-07-12",
        closeDate:"2026-07-30", dom:15, listPrice:339000,
        note:"All docs approved by the managing broker. Cleared to close — DA is the next step." },
      { id:"d9", address:"44 Mica Bay, Coeur d'Alene", mls:"25-1315", agent:"Wes Okafor",
        side:"List", sides:1, price:875000, rate:3.0, status:"Pending", contractDate:"2026-07-01",
        closeDate:"2026-08-12", dom:40, listPrice:899000, earnestDue:"2026-07-04",
        note:"BLOCKED. Agency disclosure was rejected in compliance — cannot reach clear-to-close until it's re-executed." }
    ],

    /* Listings inventory — MLS-fed (RESO) in production. Status, days-on-market,
       list price vs original (the reduction signal). */
    listings: [
      { id:"l1", address:"1802 Lakeview Blvd, Coeur d'Alene", mls:"25-1330", agent:"Marcus Bell", status:"Active", listPrice:1250000, originalPrice:1295000, dom:61, note:"Aging past the luxury-band median — a second reduction is the call." },
      { id:"l2", address:"44 Mica Bay, Coeur d'Alene", mls:"25-1315", agent:"Wes Okafor", status:"Pending", listPrice:875000, originalPrice:899000, dom:40, note:"Under contract but compliance-blocked." },
      { id:"l3", address:"55 Selkirk Ridge, Rathdrum", mls:"25-1288", agent:"Priya Nair", status:"Pending", listPrice:585000, originalPrice:585000, dom:18, note:"Clean file, minor doc fix pending." },
      { id:"l4", address:"610 Birch St, Post Falls", mls:"25-1352", agent:"Sofia Ramos", status:"Active", listPrice:379000, originalPrice:379000, dom:8, note:"Fresh listing, priced to the comps." },
      { id:"l5", address:"3 Hauser Lake Rd, Hauser", mls:"25-1360", agent:"Danny Cho", status:"Coming Soon", listPrice:449000, originalPrice:449000, dom:0, note:"Photos done; goes Active Friday." },
      { id:"l6", address:"220 Coeur Village, Post Falls", mls:"25-1260", agent:"Marcus Bell", status:"Sold", listPrice:410000, originalPrice:419000, dom:12, note:"Closed 2026-07-22." },
      { id:"l7", address:"812 Lakeshore Dr, Coeur d'Alene", mls:"24-8812", agent:"Marcus Bell", status:"Sold", listPrice:720000, originalPrice:735000, dom:14, note:"Closed 2026-07-10." }
    ],

    /* CRM contacts — behavior-scored. The "Likely to List" figure is a MODEL
       ESTIMATE (assumption), never asserted as fact. Buyers carry no list score. */
    contacts: [
      { id:"c1", name:"The Harmons", type:"Seller lead", agent:"Priya Nair", stage:"Hot",
        activity:"Ran 2 home valuations + viewed 3 nearby solds in 7 days", likely:82,
        signals:"10 yrs in home · high equity · searching a better school zone", source:"IDX valuation tool" },
      { id:"c2", name:"Jordan Wills", type:"Buyer", agent:"Danny Cho", stage:"Active",
        activity:"Viewed 812 Lakeshore 5× · saved search: CDA waterfront under $800k", likely:null,
        signals:"Pre-approved · high intent on one property", source:"Portal lead (simulated)" },
      { id:"c3", name:"Kim & Lee Park", type:"Past client", agent:"Regina Alvarez", stage:"Nurture",
        activity:"Closed 2021 · anniversary + market touch due", likely:41,
        signals:"5-yr owner · recent refinance inquiry", source:"Sphere" },
      { id:"c4", name:"Tara Boyd", type:"Seller lead", agent:"Sofia Ramos", stage:"Warm",
        activity:"Opened 4 market emails, clicked the CMA offer", likely:63,
        signals:"empty-nester signals · downsizing keywords", source:"Facebook lead form (simulated)" },
      { id:"c5", name:"The Okonkwos", type:"Buyer", agent:"Wes Okafor", stage:"New",
        activity:"New lead — pre-approval pending", likely:null,
        signals:"relocation · timeline 90 days", source:"Google Ads (simulated)" },
      { id:"c6", name:"Marta Silva", type:"Seller lead", agent:"Marcus Bell", stage:"Watch",
        activity:"Requested a valuation, no follow-through", likely:28,
        signals:"refinanced 6 mo ago — unlikely to move soon", source:"Sphere" }
    ],

    /* Compliance review portal — the managing broker's queue. A Rejected or
       missing required doc blocks the deal from clear-to-close. */
    compliance: [
      { id:"cp1", deal:"44 Mica Bay, Coeur d'Alene", mls:"25-1315", doc:"PSA", status:"Approved", reviewer:"Regina Alvarez", note:"Executed by all parties." },
      { id:"cp2", deal:"44 Mica Bay, Coeur d'Alene", mls:"25-1315", doc:"AGENCY", status:"Rejected", reviewer:"Regina Alvarez", note:"Buyer signature line blank AND the wrong agency-form version was used. Re-execute the current form before this file can advance." },
      { id:"cp3", deal:"44 Mica Bay, Coeur d'Alene", mls:"25-1315", doc:"SELLER", status:"Pending Review", reviewer:"Regina Alvarez", note:"In the broker's queue." },
      { id:"cp4", deal:"55 Selkirk Ridge, Rathdrum", mls:"25-1288", doc:"PSA", status:"Approved", reviewer:"Regina Alvarez", note:"Clean." },
      { id:"cp5", deal:"55 Selkirk Ridge, Rathdrum", mls:"25-1288", doc:"LEAD", status:"Changes Requested", reviewer:"Regina Alvarez", note:"Pre-1978 home — disclosure required and present, but seller initials are missing on page 2." },
      { id:"cp6", deal:"1201 Government Way, Coeur d'Alene", mls:"25-1301", doc:"PSA", status:"Approved", reviewer:"Regina Alvarez", note:"Clean." },
      { id:"cp7", deal:"1201 Government Way, Coeur d'Alene", mls:"25-1301", doc:"AGENCY", status:"Approved", reviewer:"Regina Alvarez", note:"Current form, fully executed." },
      { id:"cp8", deal:"1201 Government Way, Coeur d'Alene", mls:"25-1301", doc:"WIRE", status:"Approved", reviewer:"Regina Alvarez", note:"Wire-fraud advisory signed — all docs clear, file is clear-to-close." }
    ],

    /* Ad campaigns — the ad manager. Everything is DRAFT; launching (spending)
       is a Fence that stages to the Approval Desk. Nothing spends here. */
    campaigns: [
      { id:"cm1", name:"CDA Waterfront Buyers", channel:"Google", status:"Draft — staged", budget:1200, leads:0, note:"Search + valuation landing page. Awaiting broker approval to spend." },
      { id:"cm2", name:"Hayden Seller Valuations", channel:"Meta", status:"Draft — staged", budget:800, leads:0, note:"Lead-form to CMA offer. Not launched." },
      { id:"cm3", name:"Just Listed — 1802 Lakeview", channel:"Instagram", status:"Draft — staged", budget:400, leads:0, note:"Single-listing awareness. Not launched." }
    ],

    /* Recruiting pipeline — outside agents to hire. Production figures are
       ROSTER ESTIMATES (assumption) until verified. Contacting a named target
       is a Fence. */
    recruits: [
      { id:"r1", name:"Alicia Trent", from:"Panhandle Realty", production:"$18.4M · 26 units (est.)", stage:"In conversation", owner:"Regina Alvarez", note:"RealTrends / MLS-roster estimate — verify production before any offer." },
      { id:"r2", name:"Grant Muller", from:"Selkirk Realty", production:"$7.1M · 12 units (est.)", stage:"Sourced", owner:"Marcus Bell", note:"Solid mid-producer; culture fit unknown." },
      { id:"r3", name:"Devon Pryce", from:"Lakeside Homes", production:"$31M · 40 units (est.)", stage:"Target — no contact yet", owner:"Regina Alvarez", note:"Top producer. Reaching out is a Fence — needs the broker's go." }
    ],

    /* Agent billing — desk fees, tech fees, marketing charge-backs. Drives AR. */
    billing: [
      { id:"b1", agent:"Danny Cho",   deskFee:300, techFee:85, mktg:120, status:"Open", age:34 },
      { id:"b2", agent:"Sofia Ramos", deskFee:300, techFee:85, mktg:0,   status:"Open", age:12 },
      { id:"b3", agent:"Wes Okafor",  deskFee:150, techFee:85, mktg:60,  status:"Open", age:6 },
      { id:"b4", agent:"Priya Nair",  deskFee:300, techFee:85, mktg:200, status:"Paid", age:0 }
    ],

    systems: [
      { id:"sy1", name:"IDX agent sites", state:"CLEAR", metric:"6 sites · 99.97% uptime" },
      { id:"sy2", name:"MLS / RESO feed sync", state:"WATCH", metric:"last sync 41 min ago — provider throttling" },
      { id:"sy3", name:"Dialer & SMS (Twilio-simulated)", state:"CLEAR", metric:"queue empty · A2P registered" },
      { id:"sy4", name:"E-sign & forms engine", state:"CLEAR", metric:"no stuck envelopes" },
      { id:"sy5", name:"Client & agent portal", state:"CLEAR", metric:"99.98% · 210ms" }
    ],

    /* Law — advisory ONLY, not a lawyer. Real-estate-real, hard fence to counsel. */
    matters: [
      { id:"mt1", title:"Co-marketing flyer cost-split with a preferred lender", state:"Open", risk:"High", ref:"RESPA §8 / Reg X",
        note:"Splitting ad cost with a lender can be an illegal kickback unless it's a bona-fide MSA at fair market value. Advisory only — route to counsel before anything runs." },
      { id:"mt2", title:"Listing copy: “perfect for a young family”", state:"Open", risk:"High", ref:"Fair Housing Act §804(c)",
        note:"Familial-status steering language in the ad itself. Rewrite before publish; do not run it. Fair-housing exposure sits with the broker." },
      { id:"mt3", title:"Buyer-broker compensation & agreements post-settlement", state:"Open", risk:"Medium", ref:"NAR settlement (Aug 2024)",
        note:"Compensation offers can't be posted in the MLS; written buyer-agency agreements required up front. Confirm the firm's forms are current with counsel." },
      { id:"mt4", title:"Independent-contractor classification — new agent", state:"Open", risk:"Medium", ref:"IRS / state IC test",
        note:"Keep the IC agreement and no-employee-control posture clean for the 60/40 new-agent desk." }
    ],

    /* The Approval Desk is meant to be nearly EMPTY — full autonomy is the goal.
       Only real FENCES land here (send / spend / move money / price / a human). */
    approvals: [
      { id:"ap1", kind:"spend", title:"Launch “CDA Waterfront Buyers” — Google Ads", by:"Funnel (Lead Gen AE)",
        summary:"$1,200/mo budget against the buyer valuation landing page.",
        state:"Pending", why:"Spends real ad money on a live account — a Fence, not an auto-run." },
      { id:"ap2", kind:"external", title:"Price-reduction blast — 1802 Lakeview", by:"Cadence (CRM AE)",
        summary:"Notify 148 saved-search matches of a $45,000 reduction.",
        state:"Pending", why:"Reaches real contacts outside the office." },
      { id:"ap3", kind:"money", title:"Disbursement Authorization — 812 Lakeshore (24-8812)", by:"Split (Money AE)",
        summary:"DA to title: company dollar + Bell Group team payout at closing.",
        state:"Pending", why:"Authorizes real money movement to title/escrow." },
      { id:"ap4", kind:"appointment", title:"Listing appointment — The Harmons, Thu 5:30p", by:"Beacon (Lead Gen DH)",
        summary:"Likely-to-list seller (model estimate 82). Needs an agent in the room.",
        state:"Pending", why:"Booked for a human to take; the org sets it, a person shows up." }
    ]
  };

  /* ============================================================ THE PRICE BOOK
     Anthony's model: the three tiers are PACKAGES, but every department is
     priced on its own — so a deal can add a department to a lower tier or take
     one off a higher one, and the price moves with it. The package is a bundle
     discount against the à-la-carte total; showing that gap IS the sales tool.

     Command Center + the Approval Desk are the platform — in every build,
     not separately priced.

     ⚠ EVERY figure here is DRAFT and brokerage-appropriate. Anthony sets all
     live pricing in the editor — nothing here goes live without him. */
  var ROOMS = {
    leadgen:      { label:"Lead Gen · Front Office", mo:95,  build:700,
                   why:"IDX brokerage + per-agent sites, lead-routing rules, and the Google/Meta ad manager in one place." },
    crm:          { label:"CRM · Pipelines",         mo:85,  build:600,
                   why:"Behavior-scored smart lists, the omnichannel dialer/SMS/email, and auto property-matching to saved searches." },
    listings:     { label:"Listings · Inventory",    mo:70,  build:500,
                   why:"MLS-fed listings, status, days-on-market and price-vs-list — uniform across every agent site." },
    transactions: { label:"Transactions · Compliance", mo:90, build:700,
                   why:"The broker compliance review portal, milestone checklists off the contract date, and e-sign. The rights-gate to clear-to-close." },
    commissions:  { label:"Commissions · Accounting", mo:95, build:800,
                   why:"The commission split-and-cap calculator, the DA generator, and agent billing. The money spine." },
    books:        { label:"Books & Metrics",         mo:75,  build:500,
                   why:"Company dollar, GCI, franchise fees and desk-fee AR — computed, not reconstructed at month end." },
    analytics:    { label:"Brokerage Analytics",     mo:80,  build:600,
                   why:"Pending vs closed volume, per-agent production, and the company-dollar board, real-time." },
    recruiting:   { label:"Recruiting · Growth",     mo:60,  build:400,
                   why:"A separate CRM for outside agents to hire, plus the digital onboarding portal for new signs." },
    hr:           { label:"HR · People Ops",         mo:65,  build:450,
                   why:"Roster, onboarding, and license/CE expiry tracking. A lapsed license is a stop-work event." },
    it:           { label:"IT · System Health",      mo:55,  build:350,
                   why:"CLEAR / WATCH / INTERVENE on the IDX sites, the MLS feed, the dialer, e-sign and the portal." },
    law:          { label:"Law · Contracts & Compliance", mo:100, build:800,
                   why:"RESPA, agency-disclosure and fair-housing read — advisory only, with a hard fence to a real attorney." },
    org:          { label:"Agent Org · Bus",         mo:150, build:1300,
                   why:"The ten AI department chains, the event bus, and the confidence gates. This is the engine." }
  };

  /* The three packages. `includes` is what ships in the box at that price. */
  var TIERS = {
    lite: { key:"lite", name:"Lite", rank:1, mo:650, build:4000,
      desc:"Deal-to-close core. Lead gen, the CRM, listings, the transaction & compliance gate, and the commission money spine.",
      base:"Single office · up to 8 agents",
      includes:["leadgen","crm","listings","transactions","commissions"] },
    standard: { key:"standard", name:"Standard", rank:2, mo:1400, build:10000,
      desc:"The running brokerage. Adds the books, the analytics board, recruiting & onboarding, HR license tracking, IT — and the agent org.",
      base:"Single office · up to 30 agents",
      includes:["leadgen","crm","listings","transactions","commissions",
                "books","analytics","recruiting","hr","it","org"] },
    grandsuite: { key:"grandsuite", name:"Grandsuite", rank:3, mo:2900, build:24000,
      desc:"The whole brokerage, nothing held back. Every department, the full ten-chain agent org, and the contracts & compliance advisory desk.",
      base:"Multi-office · unlimited agents · dedicated environment · data migration",
      includes:["leadgen","crm","listings","transactions","commissions",
                "books","analytics","recruiting","hr","it","org","law"] }
  };

  /* Departments (nav). `room` links a nav item to its price-book entry.
     Items with no `room` are platform and always present.
     The showroom opens on the FULL Grandsuite; subtract to fit the budget, and
     add a single department back to any tier at its own price. Never build up
     from a stripped base — Article X, the showroom rule. */
  var DEPTS = [
    { group:"Command", items:[
      { href:"dashboard.html",    label:"Command Center",          ic:"◎" }, { href:"calendar.html", label:"Calendar", ic:"▤" }, { href:"contacts.html", label:"Contacts", ic:"☎" }, { href:"connect.html", label:"Connect · Video", ic:"◉" }, { href:"records.html", label:"Records · Filing", ic:"▤" },
      { href:"approvals.html",    label:"Approval Desk",           ic:"✓", accent:"ops" }
    ]},
    { group:"Front Office", items:[
      { href:"leadgen.html",      label:"Lead Gen · Front Office", ic:"✦", room:"leadgen",   accent:"leadgen" }
    ]},
    { group:"Sales", items:[
      { href:"crm.html",          label:"CRM · Pipelines",         ic:"◈", room:"crm",       accent:"crm" },
      { href:"listings.html",     label:"Listings · Inventory",    ic:"⌂", room:"listings",  accent:"listings" }
    ]},
    { group:"Transactions", items:[
      { href:"transactions.html", label:"Transactions · Compliance", ic:"⇄", room:"transactions", accent:"txn" }
    ]},
    { group:"Money", items:[
      { href:"commissions.html",  label:"Commissions · Accounting", ic:"▦", room:"commissions", accent:"money" },
      { href:"books.html",        label:"Books & Metrics",         ic:"▭", room:"books",     accent:"money" }
    ]},
    { group:"Growth", items:[
      { href:"analytics.html",    label:"Brokerage Analytics",     ic:"◰", room:"analytics", accent:"analytics" },
      { href:"recruiting.html",   label:"Recruiting · Growth",     ic:"⚑", room:"recruiting", accent:"recruiting" }
    ]},
    { group:"People", items:[
      { href:"hr.html",           label:"HR · People Ops",         ic:"☷", room:"hr",        accent:"ops" }
    ]},
    { group:"Governance", items:[
      { href:"law.html",          label:"Law · Contracts",         ic:"⚖", room:"law",       accent:"law" },
      { href:"it.html",           label:"IT · System Health",      ic:"♥", room:"it",        accent:"it" }
    ]},
    { group:"The Org", items:[
      { href:"org.html",          label:"Agent Org · Bus",         ic:"❖", room:"org",       accent:"ops" }
    ]}
  ];

  /* ----------------------------------------------------------- the agent org
     Faithful to AEHub canon: each department is a chain
     DH (owns the "so what") -> AE (packages, files, sets follow-up) -> Event Bus
     -> Pacemaker (gates on a confidence bar; the ONLY voice out of the triad)
     -> two opposing Lenses that never confer.
     Harper (COO) is the apex; she routes, gates and packages — she does NOT do
     the work. She defers to the Broker-Owner only behind a Fence.
     Gates: 80 general; 85 for Money and the two Compliance chains (Transactions
     and Law) — a bluffed number or a bad compliance read poisons everything. */
  var SEATS = {
    coo: { id:"coo", name:"Harper", role:"Chief Operating Officer", tier:"COO", dept:"Command", gate:null,
           line:"Apex seat and the front desk to the Broker-Owner. Makes the ordinary call; defers only behind a Fence." },
    depts: [
      { key:"leadgen", name:"Front Office · Lead Gen", accent:"leadgen", gate:80,
        dh:   { name:"Beacon",  line:"Owns where the next deal comes from — which leads are real and which channel produced them." },
        ae:   { name:"Funnel",  line:"Packages the IDX sites, the routing rules, and the Google/Meta ad campaigns." },
        pace: { name:"Signal",  line:"Only voice out of the triad. Releases a routing/ad call at ≥80%; a spend goes to the Approval Desk." },
        lensA:{ name:"Reach",   line:"Demand lens — which channel actually produces booked appointments, not just clicks?" },
        lensB:{ name:"Qualify", line:"Quality lens — is this a real, financeable buyer or seller, or a tire-kicker?" } },

      { key:"crm", name:"CRM · Pipelines", accent:"crm", gate:80,
        dh:   { name:"Sphere",  line:"Owns the database of relationships — nothing in the book goes cold." },
        ae:   { name:"Cadence", line:"Packages smart lists, dialer/SMS/email sequences, and property matches to saved searches." },
        pace: { name:"Nurture", line:"Releases the touch plan at ≥80%; a mass send to real contacts is a Fence." },
        lensA:{ name:"Intent",  line:"Behavior lens — who's showing buying signals, like viewing one home five times?" },
        lensB:{ name:"Fit",     line:"Match lens — does the new listing actually meet their saved search, or is it noise?" } },

      { key:"transactions", name:"Transactions · Compliance", accent:"txn", gate:85,
        dh:   { name:"Escrow",  line:"Owns the file from contract to close, and the compliance gate that guards it." },
        ae:   { name:"Checklist", line:"Packages the milestones off the contract date, e-sign, and the request for a DA." },
        pace: { name:"Clear",   line:"High bar (85%). Nothing reaches clear-to-close until the broker clears every required doc." },
        lensA:{ name:"Momentum",line:"Timeline lens — what's the next deadline: earnest money, inspection, financing?" },
        lensB:{ name:"Defect",  line:"Compliance lens — which required document is missing, expired, or rejected?" } },

      { key:"money", name:"Commissions · Accounting", accent:"money", gate:85,
        dh:   { name:"Sterling", line:"Owns the integrity of every dollar. A wrong split or a bad DA poisons trust with the agents." },
        ae:   { name:"Split",    line:"Packages GCI, the split-and-cap math, the DA, and agent billing." },
        pace: { name:"Reconcile",line:"High bar (85%). A bluffed commission number is worse than an honest “unsure”." },
        lensA:{ name:"Collected",line:"Cash lens — what company dollar actually cleared, tagged LIVE only." },
        lensB:{ name:"Exposure", line:"Margin lens — is desk-fee AR aging, and who is about to cap out and compress company dollar?" } },

      { key:"listings", name:"Listings · Inventory", accent:"listings", gate:80,
        dh:   { name:"Curb",    line:"Owns the inventory — every listing accurate and uniform across every agent site." },
        ae:   { name:"Feed",    line:"Packages the MLS/RESO data, status, days-on-market and price-vs-list." },
        pace: { name:"Stage",   line:"Releases a pricing/status call at ≥80%; pushing a price change to the MLS is a Fence." },
        lensA:{ name:"Absorb",  line:"Market lens — how fast is this price band actually selling right now?" },
        lensB:{ name:"Stale",   line:"Aging lens — which listing is past the market's days-on-market and needs a reduction?" } },

      { key:"recruiting", name:"Recruiting · Growth", accent:"recruiting", gate:80,
        dh:   { name:"Scout",   line:"Owns the pipeline of outside agents worth hiring." },
        ae:   { name:"Onboard", line:"Packages the recruiting CRM and the digital onboarding portal for new signs." },
        pace: { name:"Court",   line:"Releases an outreach plan at ≥80%; actually contacting a named target agent is a Fence." },
        lensA:{ name:"Producer",line:"Value lens — does this agent's real production move the firm, or just the headcount?" },
        lensB:{ name:"Culture", line:"Fit lens — will they close, comply, and stay?" } },

      { key:"analytics", name:"Brokerage Analytics", accent:"analytics", gate:80,
        dh:   { name:"Compass", line:"Owns the firm's numbers — company dollar, pending vs closed, per-agent production." },
        ae:   { name:"Board",   line:"Packages the volume dashboards and the production board." },
        pace: { name:"Trend",   line:"Releases a read at ≥80%; a forecast built on assumptions is tagged, never asserted." },
        lensA:{ name:"Pace",    line:"Momentum lens — is pending volume rising or falling into next month?" },
        lensB:{ name:"Concentration", line:"Risk lens — how much of the firm rides on one or two producers?" } },

      { key:"hr", name:"HR · People Ops", accent:"ops", gate:80,
        dh:   { name:"Roster",  line:"Owns the team's health — hiring, onboarding, license currency, and the hard conversations." },
        ae:   { name:"File",    line:"Packages offers, checklists, license/CE tracking, and the IC agreements." },
        pace: { name:"Balance", line:"Releases people calls at ≥80%; a termination always routes to a human." },
        lensA:{ name:"Bench",   line:"Talent lens — who do we need to cover the pipeline we already have?" },
        lensB:{ name:"Record",  line:"Compliance lens — is every agent's license, CE and E&O current and defensible?" } },

      { key:"it", name:"IT · System Health", accent:"it", gate:80,
        dh:   { name:"Ward",    line:"Owns uptime — the IDX sites, the MLS feed, the dialer, e-sign, and the portal." },
        ae:   { name:"Watch",   line:"Packages incident notes, the watch list, and feed-sync verification." },
        pace: { name:"Steady",  line:"Calls system health; a real outage or a data breach escalates to a human immediately." },
        lensA:{ name:"Uptime",  line:"Availability lens — are the agent sites and the portal reachable right now?" },
        lensB:{ name:"Loss",    line:"Risk lens — is client PII and the transaction archive actually backed up?" } },

      { key:"law", name:"Law · Contracts & Compliance", accent:"law", gate:85,
        dh:   { name:"Redline", line:"Owns the contract read — the PSA, agency, RESPA and fair-housing. NOT a lawyer; advisory only." },
        ae:   { name:"Docket",  line:"Packages the matter, the risk and the source; flags what needs a real attorney." },
        pace: { name:"Caution", line:"High bar (85%). Anything with real exposure routes to a licensed attorney." },
        lensA:{ name:"Enable",  line:"Enablement lens — how do we get to a clean, compliant, signed agreement?" },
        lensB:{ name:"Claim",   line:"Exposure lens — RESPA, fair-housing language, agency: what claim could arise here?" } }
    ]
  };

  /* ================================================== the money & metrics spine
     Real formulas, computed off the seeded data. Nothing hard-coded, nothing
     invented. GCI, split-by-cap, franchise fee, team split, company dollar,
     pending/closed volume and per-agent production all fall out of the deals
     and the roster. */

  /* GCI on one deal = price × side rate × number of sides represented. */
  function gci(deal) {
    return Math.round((Number(deal.price)||0) * (Number(deal.rate)||0) / 100 * (Number(deal.sides)||1));
  }

  /* Walk each agent's closed deals in date order, applying the split, the
     franchise fee (off the top, capped for the year), and the cap (agent flips
     to ~100% — a flat transaction fee to the house — once the cap is paid).
     Returns per-agent state with the company dollar the house actually kept. */
  function commissionRun(d) {
    d = d || db();
    var state = {};
    (d.agents || []).forEach(function (a) {
      state[a.name] = {
        agent:a, name:a.name,
        capPaid: Number(a.capPriorYTD) || 0,
        frPaid:  Number(a.franchisePriorYTD) || 0,
        companyDollar:0, agentNet:0, franchise:0, gci:0, volume:0, deals:0, teamIn:0, teamOut:0, capped:false
      };
    });
    var closed = (d.deals || []).filter(function (x) { return x.status === "Closed"; })
      .slice().sort(function (a, b) { return String(a.closeDate).localeCompare(String(b.closeDate)); });

    closed.forEach(function (deal) {
      var S = state[deal.agent]; if (!S) return;
      var a = S.agent;
      var gross = gci(deal);

      /* franchise fee off the top, capped for the year */
      var frGross = Math.round(gross * (Number(a.franchisePct) || 0) / 100);
      var frRemain = Math.max(0, (Number(a.franchiseCap) || 0) - S.frPaid);
      var franchise = (Number(a.franchisePct) || 0) > 0 ? Math.min(frGross, frRemain) : 0;
      S.frPaid += franchise;
      var companyBase = gross - franchise;

      /* split, subject to the cap */
      var hasCap = (Number(a.cap) || 0) > 0;
      var capRemain = hasCap ? Math.max(0, (Number(a.cap) || 0) - S.capPaid) : Infinity;
      var preCapHouse = Math.round(companyBase * (Number(a.splitHouse) || 0));
      var house;
      if (hasCap && capRemain <= 0) {
        house = Math.min(companyBase, Number(a.txnFee) || 0);          // capped: flat fee only
      } else if (preCapHouse <= capRemain) {
        house = preCapHouse;
        if (hasCap) S.capPaid += preCapHouse;
      } else {
        house = capRemain + (Number(a.txnFee) || 0);                   // straddles the cap
        S.capPaid += capRemain;
      }
      if (hasCap && S.capPaid >= (Number(a.cap) || 0)) S.capped = true;

      var agentGross = companyBase - house;
      var toLead = (a.team && a.teamSplit) ? Math.round(agentGross * a.teamSplit) : 0;

      S.companyDollar += house;
      S.franchise += franchise;
      S.agentNet += (agentGross - toLead);
      S.teamOut += toLead;
      S.gci += gross;
      S.volume += (Number(deal.price) || 0);
      S.deals++;
      if (toLead && state[a.team]) { state[a.team].agentNet += toLead; state[a.team].teamIn += toLead; }
    });
    return state;
  }

  function commissionTotals(d) {
    var s = commissionRun(d);
    var t = { companyDollar:0, gci:0, agentNet:0, franchise:0, deals:0 };
    Object.keys(s).forEach(function (k) {
      t.companyDollar += s[k].companyDollar; t.gci += s[k].gci;
      t.agentNet += s[k].agentNet; t.franchise += s[k].franchise; t.deals += s[k].deals;
    });
    t.companyPct = t.gci ? (t.companyDollar / t.gci) * 100 : 0;
    return t;
  }

  /* One deal's full breakdown — used by the split calculator and the DA. */
  function dealBreakdown(deal, agent, capPaidBefore, frPaidBefore) {
    agent = agent || {};
    var gross = gci(deal);
    var frGross = Math.round(gross * (Number(agent.franchisePct) || 0) / 100);
    var frRemain = Math.max(0, (Number(agent.franchiseCap) || 0) - (Number(frPaidBefore) || 0));
    var franchise = (Number(agent.franchisePct) || 0) > 0 ? Math.min(frGross, frRemain) : 0;
    var companyBase = gross - franchise;
    var hasCap = (Number(agent.cap) || 0) > 0;
    var capRemain = hasCap ? Math.max(0, (Number(agent.cap) || 0) - (Number(capPaidBefore) || 0)) : Infinity;
    var preCapHouse = Math.round(companyBase * (Number(agent.splitHouse) || 0));
    var house, straddled = false, capped = false;
    if (hasCap && capRemain <= 0) { house = Math.min(companyBase, Number(agent.txnFee) || 0); capped = true; }
    else if (preCapHouse <= capRemain) { house = preCapHouse; }
    else { house = capRemain + (Number(agent.txnFee) || 0); straddled = true; }
    var agentGross = companyBase - house;
    var toLead = (agent.team && agent.teamSplit) ? Math.round(agentGross * agent.teamSplit) : 0;
    return {
      gross:gross, franchise:franchise, companyBase:companyBase,
      companyDollar:house, agentGross:agentGross, toLead:toLead, agentNet:agentGross - toLead,
      capped:capped, straddled:straddled, capRemain:isFinite(capRemain) ? capRemain : null
    };
  }

  /* Volume / units / averages, straight off the deals. */
  function closedVolume(d) { d = d || db();
    return (d.deals||[]).filter(function(x){return x.status==="Closed";}).reduce(function(s,x){return s+(Number(x.price)||0);},0); }
  function pendingVolume(d) { d = d || db();
    return (d.deals||[]).filter(function(x){return x.status==="Pending"||x.status==="Clear to Close";}).reduce(function(s,x){return s+(Number(x.price)||0);},0); }
  function unitsClosed(d) { d = d || db(); return (d.deals||[]).filter(function(x){return x.status==="Closed";}).length; }
  function unitsPending(d) { d = d || db(); return (d.deals||[]).filter(function(x){return x.status==="Pending"||x.status==="Clear to Close";}).length; }
  function avgSalePrice(d) { d = d || db(); var u = unitsClosed(d); return u ? Math.round(closedVolume(d)/u) : 0; }

  function deskFeeAR(d) { d = d || db();
    return (d.billing||[]).filter(function(b){return b.status==="Open";})
      .reduce(function(s,b){ return s + (Number(b.deskFee)||0) + (Number(b.techFee)||0) + (Number(b.mktg)||0); }, 0); }

  /* Cap progress per agent — the second half of the headline metric. */
  function capProgress(d) {
    d = d || db();
    var run = commissionRun(d);
    return (d.agents||[]).filter(function(a){ return (Number(a.cap)||0) > 0; }).map(function (a) {
      var paid = run[a.name] ? run[a.name].capPaid : (Number(a.capPriorYTD)||0);
      var pct = a.cap ? Math.min(100, paid / a.cap * 100) : 0;
      return { name:a.name, role:a.role, cap:a.cap, paid:paid, pct:pct,
        capped: paid >= a.cap, remaining: Math.max(0, a.cap - paid) };
    });
  }

  /* Per-agent production board. */
  function production(d) {
    d = d || db();
    var run = commissionRun(d);
    return (d.agents||[]).map(function (a) {
      var r = run[a.name] || {};
      return { name:a.name, role:a.role, deals:r.deals||0, volume:r.volume||0,
        gci:r.gci||0, companyDollar:r.companyDollar||0, agentNet:r.agentNet||0, capped:!!r.capped };
    }).sort(function(x,y){ return y.volume - x.volume; });
  }

  /* The compliance gate: is a given deal cleared to close? */
  function docsFor(d, mls) { d = d || db(); return (d.compliance||[]).filter(function(c){ return c.mls === mls; }); }
  function dealCleared(d, mls) {
    var docs = docsFor(d, mls);
    if (!docs.length) return false;
    return docs.every(function (c) { return c.status === "Approved"; });
  }
  function complianceBlocks(d) {
    d = d || db();
    return (d.compliance||[]).filter(function(c){ return c.status === "Rejected" || c.status === "Changes Requested"; });
  }

  /* Transaction milestones computed off a contract/close date. */
  function milestonesFor(deal) {
    var base = new Date(deal.contractDate + "T00:00:00");
    var close = deal.closeDate ? new Date(deal.closeDate + "T00:00:00") : null;
    return MILESTONES.map(function (m) {
      var dt;
      if (m.k === "close" && close) dt = close;
      else if (m.k === "walkthru" && close) { dt = new Date(close.getTime()); dt.setDate(dt.getDate() + m.offset); }
      else { dt = new Date(base.getTime()); dt.setDate(dt.getDate() + m.offset); }
      return { k:m.k, name:m.name, note:m.note, date: dt.toISOString().slice(0,10) };
    });
  }

  /* One call for the Command Center headline board. Bands are internal/honest;
     external target bands ship BLANK (see BENCH) — we don't invent targets. */
  function kpis() {
    var d = db();
    var t = commissionTotals(d);
    var ar = deskFeeAR(d);
    return [
      { k:"companyDollar", label:"Company Dollar", value:t.companyDollar, fmt:"money", band:"good",
        help:"The brokerage's share kept after every split, cap credit and franchise fee — YTD closed. The signature number." },
      { k:"companyPct", label:"Company dollar %", value:t.companyPct, fmt:"pct", band: t.companyPct < 15 ? "watch" : "good",
        help:"Company dollar ÷ gross commission income. Capped top producers pull this down — that's the story, not a fault." },
      { k:"closedVol", label:"Closed volume", value:closedVolume(d), fmt:"money", band:"good",
        help:"Sale price across every closed deal." },
      { k:"pendingVol", label:"Pending volume", value:pendingVolume(d), fmt:"money", band:"watch",
        help:"Under contract, not yet closed — including one file blocked in compliance." },
      { k:"units", label:"Units closed", value:unitsClosed(d), fmt:"int", band:"good",
        help:"Closed transaction sides." },
      { k:"avgPrice", label:"Avg sale price", value:avgSalePrice(d), fmt:"money", band:"good",
        help:"Closed volume ÷ units." },
      { k:"deskAR", label:"Desk-fee AR", value:ar, fmt:"money", band: ar > 900 ? "watch" : "good",
        help:"Open desk, tech and marketing charge-backs owed by agents." }
    ];
  }

  /* ------------------------------------------------------------- the brain
     Deterministic, no LLM in the browser. Routes a question DOWN the chain and
     returns a real Output Contract: stance + confidence 0-100 + reasons tagged
     [data] / [assumption]. Below the bar OR estimate-only -> "needs a human". */
  var BRAIN = {
    leadgen: {
      match:["lead","idx","site","website","route","routing","round","robin","ad","campaign","google","meta","facebook","instagram","appointment","source","front"],
      build: function (d) {
        var camp = d.campaigns || [];
        var hot = (d.contacts||[]).filter(function(c){ return c.stage === "Hot" || c.stage === "Warm"; });
        return {
          stance: "Route the Harmons and Boyd (both seller-signal) to your listing agents on a performance rule, and stage the two ad campaigns — but the spend waits for you. Booked appointments, not clicks, are the only scoreboard.",
          conf: 82,
          reasons: [
            { t:"data", s: camp.length + " campaigns are drafted at $" + camp.reduce(function(s,c){return s+(Number(c.budget)||0);},0).toLocaleString() + "/mo total — all staged, none launched. Launching is a Fence." },
            { t:"data", s: hot.length + " contact(s) are showing hot/warm seller signals and should be routed now, not left in the queue." },
            { t:"assumption", s: "Performance-based routing assumes past conversion predicts the next lead. Thin sample per agent — treat as a starting rule, not a law." }
          ]
        };
      }
    },
    crm: {
      match:["crm","contact","pipeline","smart","list","dialer","sms","text","email","sequence","saved","search","match","behavior","nurture","sphere","likely"],
      build: function (d) {
        var buyers = (d.contacts||[]).filter(function(c){ return c.type === "Buyer"; });
        var signal = (d.contacts||[]).filter(function(c){ return /5|valuation|CMA|viewed/i.test(c.activity||""); });
        return {
          stance: "Jordan Wills has viewed 812 Lakeshore five times against a live saved search — that's a buyer to call today, not email. Auto-match new waterfront listings under $800k straight into his pipeline.",
          conf: 83,
          reasons: [
            { t:"data", s: signal.length + " contact(s) show explicit behavior signals (repeat views, valuations, CMA clicks) — the smart list surfaces them ahead of cold leads." },
            { t:"data", s: buyers.length + " active buyer(s) carry saved searches the property-matching engine watches against new MLS inventory." },
            { t:"assumption", s: "The “Likely to List” scores on seller leads are a MODEL ESTIMATE off tenure and equity signals — a prioritizer, never a fact. Tagged as such everywhere." }
          ]
        };
      }
    },
    transactions: {
      match:["transaction","close","closing","compliance","doc","document","disclosure","agency","psa","earnest","inspection","milestone","checklist","broker","review","clear","sign","esign"],
      build: function (d) {
        var blocks = complianceBlocks(d);
        var rejected = (d.compliance||[]).filter(function(c){ return c.status === "Rejected"; });
        var cleared = (d.deals||[]).filter(function(x){ return x.status === "Clear to Close"; });
        return {
          stance: "44 Mica Bay cannot advance — its agency disclosure is rejected, and a rejected required doc blocks clear-to-close. Fix that first; 1201 Government Way is already clear and just needs its DA.",
          conf: 88,
          reasons: [
            { t:"data", s: blocks.length + " document(s) are blocking a file: " + rejected.length + " rejected outright, the rest changes-requested. The gate is doing its job." },
            { t:"data", s: cleared.length + " deal(s) have every required doc approved and are genuinely clear-to-close." },
            { t:"assumption", s: "Milestone dates are computed off the contract date (earnest +3, inspection +10, appraisal +21, financing +30). Local addenda can shift them — confirm against the executed contract." }
          ]
        };
      }
    },
    money: {
      match:["money","commission","split","cap","company","dollar","gci","da","disbursement","franchise","desk","fee","ar","billing","payout","margin"],
      build: function (d) {
        var t = commissionTotals(d);
        var ar = deskFeeAR(d);
        return {
          stance: "Company dollar is $" + t.companyDollar.toLocaleString() + " on $" + t.gci.toLocaleString() + " of GCI — only " + t.companyPct.toFixed(1) + "%, because two top producers have capped. The DA on 812 Lakeshore is ready but authorizing money is your signature, not mine.",
          conf: 79,   // deliberately under the 85 bar -> escalates, showing the fence
          reasons: [
            { t:"data", s: "Company dollar $" + t.companyDollar.toLocaleString() + " / GCI $" + t.gci.toLocaleString() + " = " + t.companyPct.toFixed(1) + "% across " + t.deals + " closed deals — computed off the split-and-cap math, not typed in." },
            { t:"data", s: "Desk-fee AR is $" + ar.toLocaleString() + " open across the roster — real receivable, not revenue." },
            { t:"assumption", s: "A DA moves real money to title. That is a Fence, so this holds under the 85% Money bar by design and routes to you — I don't authorize disbursements." }
          ]
        };
      }
    },
    listings: {
      match:["listing","inventory","mls","status","dom","days","market","price","reduction","reduce","active","pending","sold","stale","absorb"],
      build: function (d) {
        var active = (d.listings||[]).filter(function(l){ return l.status === "Active"; });
        var aging = active.filter(function(l){ return (Number(l.dom)||0) > 45; });
        return {
          stance: "1802 Lakeview is 61 days on market in the luxury band — that's stale. Recommend a second reduction; the rest of the active inventory is inside a normal window. Pushing the new price to the MLS is a Fence.",
          conf: 84,
          reasons: [
            { t:"data", s: active.length + " active listing(s); " + aging.length + " past 45 days-on-market. 1802 Lakeview has already taken one reduction and is still sitting." },
            { t:"data", s: "Price-vs-original is tracked per listing, so a reduction pattern is visible before a listing goes cold, not after." },
            { t:"assumption", s: "“Stale” is judged against a generic 45-day mark. The honest benchmark is your own local MLS median by price band — no national DOM target is asserted here." }
          ]
        };
      }
    },
    recruiting: {
      match:["recruit","recruiting","hire","hiring","grow","growth","onboard","onboarding","agent","producer","pipeline","target","poach"],
      build: function (d) {
        var pipe = d.recruits || [];
        var live = pipe.filter(function(r){ return /conversation|sourced/i.test(r.stage); });
        return {
          stance: "Alicia Trent is the live recruit — she's already in conversation and her production would add real company dollar. Devon Pryce is the bigger fish but he's a cold target, and reaching out to a named agent is a Fence.",
          conf: 80,
          reasons: [
            { t:"data", s: pipe.length + " agent(s) in the recruiting pipeline; " + live.length + " are actually in motion (in conversation or sourced)." },
            { t:"assumption", s: "The production figures ($18.4M, $31M) are RealTrends/MLS-roster ESTIMATES, not verified books. Verify before any offer — an assumed number can't anchor a comp package." },
            { t:"assumption", s: "Contacting Pryce assumes he's open to a move. No signal supports that yet, so the outreach stages to you rather than firing on a guess." }
          ]
        };
      }
    },
    analytics: {
      match:["analytics","volume","closed","pending","production","company","dollar","forecast","trend","report","dashboard","per-agent","concentration"],
      build: function (d) {
        var prod = production(d);
        var top = prod[0];
        var concentration = closedVolume(d) ? (top ? top.volume / closedVolume(d) * 100 : 0) : 0;
        return {
          stance: "Pending volume ($" + pendingVolume(d).toLocaleString() + ") is ahead of a normal month, but " + (top ? top.name : "your lead agent") + " alone is " + concentration.toFixed(0) + "% of closed volume — that's concentration risk worth naming to the Broker-Owner.",
          conf: 81,
          reasons: [
            { t:"data", s: "Closed volume $" + closedVolume(d).toLocaleString() + " across " + unitsClosed(d) + " units; pending $" + pendingVolume(d).toLocaleString() + " across " + unitsPending(d) + " — all computed off the deals." },
            { t:"data", s: (top ? top.name : "the top producer") + " carries " + concentration.toFixed(0) + "% of closed volume. One agent leaving would move the whole firm." },
            { t:"assumption", s: "Next-month pending is a snapshot, not a forecast — a fall-through or a compliance block (44 Mica Bay) can pull it. Tagged estimate, not a promise." }
          ]
        };
      }
    },
    hr: {
      match:["hr","people","license","licensure","ce","expire","expiry","renew","staff","team","hire","onboard","terminate","review","payroll"],
      build: function (d) {
        var agents = d.agents || [];
        var lapsing = agents.filter(function(a){ return a.license && a.license.indexOf("2026") >= 0; });
        var onboarding = agents.filter(function(a){ return a.status === "Onboarding"; });
        return {
          stance: lapsing.length
            ? "Sofia Ramos' license renews in under 60 days and her CE is 3 hours short — book the CE now. A lapsed license is a stop-work event: she can't be paid a commission she isn't licensed to earn."
            : "Licenses and CE are current across the roster; next check is the quarterly review.",
          conf: 87,
          reasons: [
            { t:"data", s: agents.filter(function(a){return a.type==="Human";}).length + " human seat(s); " + lapsing.length + " license(s) renewing this calendar year; " + onboarding.length + " mid-onboarding." },
            { t:"data", s: "License expiry is tracked as a hard gate, not a reminder — a closing under a lapsed license is a compliance and payment problem." },
            { t:"assumption", s: "A termination is never auto-run. It always routes to a human — flagged here, not executed." }
          ]
        };
      }
    },
    it: {
      match:["it","system","health","uptime","backup","outage","security","feed","mls","reso","sync","dialer","portal","incident","slow","site"],
      build: function (d) {
        var sys = d.systems || [];
        var watch = sys.filter(function(s){ return s.state !== "CLEAR"; });
        return {
          stance: watch.length
            ? "WATCH: the MLS/RESO feed last synced 41 minutes ago — provider throttling, not an outage. Listings could drift stale on the agent sites if it stretches; nothing needs a human INTERVENE yet."
            : "System is CLEAR — IDX sites, dialer, e-sign and the portal all reachable, feed in sync.",
          conf: watch.length ? 84 : 89,
          reasons: [
            { t:"data", s: sys.length + " service(s) monitored; " + watch.length + " on WATCH, 0 on INTERVENE." },
            { t:"data", s: "The MLS feed is the one that shows: a stale sync means listings and status drift across every agent site at once." },
            { t:"assumption", s: "Assumes the showroom's checks mirror production. A true INTERVENE — an outage or a PII breach — pages a person immediately." }
          ]
        };
      }
    },
    law: {
      match:["law","legal","contract","respa","fair","housing","agency","disclosure","kickback","compliance","clause","liability","settlement","advertising","attorney","counsel"],
      build: function (d) {
        var open = (d.matters||[]).filter(function(m){ return m.state === "Open"; });
        var high = open.filter(function(m){ return m.risk === "High"; });
        return {
          stance: "Two matters need a real attorney before anything runs: the lender co-marketing split (RESPA §8 kickback risk) and the “perfect for a young family” listing line (Fair Housing §804(c)). Both are advisory reads, not clearance.",
          conf: 74,   // deliberately under the 85 bar — legal caution, not a lawyer
          reasons: [
            { t:"data", s: open.length + " open matter(s) in the docket; " + high.length + " rated High risk (RESPA and fair-housing)." },
            { t:"assumption", s: "This is an advisory read, NOT legal advice. A licensed attorney owns the sign-off — that caps confidence under the 85% bar by design." },
            { t:"assumption", s: "Fair-housing exposure sits in the ad language itself; a familial-status phrase is a claim risk even with no intent. Rewrite before publish, confirm with counsel." }
          ]
        };
      }
    }
  };

  /* Run the org: route a question to a department, deliberate through the triad,
     gate on the Pacemaker's bar, and log every hop to the Event Bus. */
  function consult(deptKey, question) {
    var d = db();
    var dept = SEATS.depts.filter(function (x) { return x.key === deptKey; })[0];
    var brain = BRAIN[deptKey];
    if (!dept || !brain) return null;
    var verdict = brain.build(d, question || "");
    var passed = verdict.conf >= dept.gate;
    var topic = dept.key;
    var stamp = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

    var events = [
      { topic:topic+".sot.read", kind:"route", from:dept.dh.name, to:"Filing · SSOT",
        body: dept.dh.name + " is called to the Source of Truth and reads it before acting. SSOT loaded ✓ — canon, fences, and this firm's record in hand.", stamp:stamp },
      { topic:topic+".ae.packaged", kind:"route", from:dept.ae.name, to:dept.pace.name,
        body: dept.ae.name + " (Administrative Executive) packages the ask, files it, and routes it down the bus to the triad: \"" + (question || "(department review)") + "\"", stamp:stamp },
      { topic:topic+".triad.finding", kind:"deliberate", from:dept.lensA.name, to:dept.pace.name,
        body: "[" + dept.lensA.name + "] " + lensTake(verdict, "A"), stamp:stamp },
      { topic:topic+".triad.finding", kind:"deliberate", from:dept.lensB.name, to:dept.pace.name,
        body: "[" + dept.lensB.name + "] " + lensTake(verdict, "B"), stamp:stamp }
    ];

    /* Lateral coordination: AEs talk ONLY to the same position in another
       department. Canon: lateral is same-position only; cross-position routes
       through the chain, never directly. */
    var COORD = {
      leadgen:      { to:"crm",          why:"hand the routed leads into the right agent pipelines with a saved-search match" },
      crm:          { to:"listings",     why:"pull the new MLS inventory to auto-match against buyers' saved searches" },
      transactions: { to:"money",        why:"request the DA once the file clears every required compliance doc" },
      money:        { to:"transactions", why:"confirm the file is clear-to-close before cutting any disbursement" },
      listings:     { to:"leadgen",      why:"feed a just-listed or reduced property into the ad manager as fresh creative" },
      recruiting:   { to:"hr",           why:"hand a signed recruit to onboarding, license verification and the IC agreement" },
      analytics:    { to:"money",        why:"reconcile the production board against the company-dollar math before it's reported" },
      hr:           { to:"transactions", why:"flag a lapsing license so no closing is scheduled under it" },
      it:           { to:"listings",     why:"warn that a stale MLS feed will drift listing status across the agent sites" },
      law:          { to:"leadgen",      why:"stop a fair-housing or RESPA-risky ad before it reaches the ad manager" }
    };
    var co = COORD[dept.key];
    if (co) {
      var peer = SEATS.depts.filter(function (x) { return x.key === co.to; })[0];
      if (peer) events.push({ topic:topic+".ae.lateral", kind:"route", from:dept.ae.name,
        to: peer.ae.name + " (" + peer.name + " AE)",
        body: dept.ae.name + " coordinates laterally with " + peer.ae.name + " to " + co.why + " — AE↔AE, same position, no chain needed.", stamp:stamp });
    }

    if (passed) {
      events.push({ topic:topic+".pacemaker.released", kind:"conclude", from:dept.pace.name, to:dept.ae.name,
        body: verdict.stance, conclusion:true, verdict:verdict, gate:dept.gate, stamp:stamp });
      events.push({ topic:topic+".ae.filed", kind:"route", from:dept.ae.name, to:dept.dh.name,
        body: dept.ae.name + " files the released conclusion to the firm record and sets a follow-up on the calendar, then hands it to " + dept.dh.name + ".", stamp:stamp });
      events.push({ topic:"coo.decision", kind:"route", from:dept.dh.name, to:SEATS.coo.name + " (COO)",
        body: dept.dh.name + " carries it up to " + SEATS.coo.name + ", the front desk to the Broker-Owner: cleared the " + dept.gate + "% bar.", stamp:stamp });
    } else {
      events.push({ topic:"escalation.below_bar", kind:"reject", from:dept.pace.name, to:SEATS.coo.name + " → the Broker-Owner",
        body: "Held below the " + dept.gate + "% bar (" + verdict.conf + "%). Needs a human — either a Fence or not enough live data. " + dept.ae.name + " files the hold; " + SEATS.coo.name + " routes it up with reasons attached.",
        conclusion:true, verdict:verdict, gate:dept.gate, escalate:true, stamp:stamp });
    }

    save(function (x) {
      events.forEach(function (e) { e.id = "e" + (x.seq++); e.dept = dept.key; x.bus.push(e); });
      if (x.bus.length > 60) x.bus = x.bus.slice(-60);
    });
    return { dept:dept, verdict:verdict, passed:passed, events:events };
  }

  function lensTake(v, which) {
    var pro = v.reasons.filter(function (r) { return r.t === "data"; })[0];
    var con = v.reasons.filter(function (r) { return r.t === "assumption"; })[0];
    if (which === "A") return "Argues FOR: " + (pro ? pro.s : "the evidence supports moving.");
    return "Pushes back: " + (con ? con.s : "the evidence isn't fully sourced yet.");
  }

  /* ---- The Interface: Harper (COO) as a machine of her own ----
     She does NOT do the department work. She is the single gate between the
     department heads and the Broker-Owner: reads the ask, routes it, lets that
     chain work under its own bar, packages ONE clean answer back up. */
  function routeDept(question) {
    var q = String(question || "").toLowerCase();
    var best = null, bestScore = 0;
    Object.keys(BRAIN).forEach(function (k) {
      var score = BRAIN[k].match.reduce(function (s, w) { return s + (q.indexOf(w) >= 0 ? 1 : 0); }, 0);
      if (score > bestScore) { bestScore = score; best = k; }
    });
    return best || "analytics";
  }

  function askHarper(question) {
    var deptKey = routeDept(question);
    var dept = SEATS.depts.filter(function (x) { return x.key === deptKey; })[0];
    var stamp = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    save(function (x) {
      x.bus.push({ id:"e"+(x.seq++), dept:"coo", topic:"coo.route", kind:"route",
        from: SEATS.coo.name + " (COO)", to: dept.dh.name + " (" + dept.name + ")",
        body: SEATS.coo.name + " takes the ask off the Broker-Owner's desk and routes it to " + dept.name + " — she gates and packages, she doesn't do the work herself.",
        stamp: stamp });
    });
    var r = consult(deptKey, question);
    var packaged = r.passed
      ? (SEATS.coo.name + ": On track. " + dept.name + " cleared its " + dept.gate + "% bar — I'm releasing this to you. " + r.verdict.stance)
      : (SEATS.coo.name + ": Holding this off your desk. " + dept.name + " came in at " + r.verdict.conf + "%, under its " + dept.gate + "% bar — it needs a human. Here's what I have, and I've set a follow-up. " + r.verdict.stance);
    return { deptKey:deptKey, dept:dept, result:r, packaged:packaged, on_track:r.passed };
  }

  /* ----------------------------------------------------------- approval desk
     Ghost Mode gate. Goal: keep it nearly EMPTY. The org clears everything it
     honestly can; only true fences reach the Broker-Owner. Approving here does
     NOT send, spend, or move money — this is a showroom. */
  function approvals() { return db().approvals || []; }
  function stage(kind, title, summary, why, by) {
    var item = { id:"ap" + now(), kind:kind || "general", title:title || "Untitled",
      summary:summary || "", why:why || "Behind a fence — needs the Broker-Owner.",
      by:by || "The org", state:"Pending" };
    save(function (d) { (d.approvals = d.approvals || []).push(item); });
    return item;
  }
  function decideApproval(id, decision) {
    save(function (d) { (d.approvals||[]).forEach(function (a) { if (a.id === id) a.state = decision; }); });
    return approvals();
  }

  /* ============================================== the configurator (à la carte) */
  function tier() { return db().tier || "grandsuite"; }
  function tierRank() { return TIERS[tier()].rank; }
  function tierByRank(r){ for (var k in TIERS) if (TIERS[k].rank === r) return k; return "grandsuite"; }
  function setTier(k) { save(function (d) { d.tier = k; d.adds = []; d.offs = []; }); }

  function activeRooms() {
    var d = db();
    var inc = (TIERS[d.tier] || TIERS.grandsuite).includes.slice();
    (d.offs || []).forEach(function (k) { var i = inc.indexOf(k); if (i >= 0) inc.splice(i, 1); });
    (d.adds || []).forEach(function (k) { if (inc.indexOf(k) < 0 && ROOMS[k]) inc.push(k); });
    return inc;
  }
  function hasRoom(k) { return !k || activeRooms().indexOf(k) >= 0; }

  function toggleRoom(k) {
    if (!ROOMS[k]) return;
    save(function (d) {
      var inc = (TIERS[d.tier] || TIERS.grandsuite).includes;
      d.adds = d.adds || []; d.offs = d.offs || [];
      var inPackage = inc.indexOf(k) >= 0;
      var iAdd = d.adds.indexOf(k), iOff = d.offs.indexOf(k);
      if (inPackage) {
        if (iOff >= 0) d.offs.splice(iOff, 1); else d.offs.push(k);
      } else {
        if (iAdd >= 0) d.adds.splice(iAdd, 1); else d.adds.push(k);
      }
    });
  }

  function priceNow() {
    var d = db();
    var t = TIERS[d.tier] || TIERS.grandsuite;
    var adds = (d.adds || []).filter(function (k) { return ROOMS[k]; });
    var offs = (d.offs || []).filter(function (k) { return ROOMS[k]; });
    var addMo   = adds.reduce(function (s,k) { return s + ROOMS[k].mo; }, 0);
    var addBuild= adds.reduce(function (s,k) { return s + ROOMS[k].build; }, 0);
    var offMo   = offs.reduce(function (s,k) { return s + ROOMS[k].mo; }, 0);
    var offBuild= offs.reduce(function (s,k) { return s + ROOMS[k].build; }, 0);
    var rooms = activeRooms();
    var alaMo    = rooms.reduce(function (s,k) { return s + (ROOMS[k] ? ROOMS[k].mo : 0); }, 0);
    var alaBuild = rooms.reduce(function (s,k) { return s + (ROOMS[k] ? ROOMS[k].build : 0); }, 0);
    var mo    = Math.max(0, t.mo + addMo - offMo);
    var build = Math.max(0, t.build + addBuild - offBuild);
    return {
      tier:t, rooms:rooms, adds:adds, offs:offs,
      mo:mo, build:build,
      addMo:addMo, offMo:offMo, addBuild:addBuild, offBuild:offBuild,
      alaMo:alaMo, alaBuild:alaBuild,
      platformMo: Math.max(0, mo - alaMo),
      savingMo: Math.max(0, alaMo - mo),
      changed: adds.length > 0 || offs.length > 0
    };
  }
  function priceLabel() {
    var p = priceNow();
    return money(p.mo) + "/mo · " + money(p.build) + " build";
  }

  function el(html) { var t = document.createElement("template"); t.innerHTML = String(html).trim(); return t.content.firstChild; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function money(n){ return "$" + (Math.round(Number(n)||0)).toLocaleString(); }
  function pct(n, dp){ return (Number(n)||0).toFixed(dp === undefined ? 0 : dp) + "%"; }

  /* Brand mark: the REAL live illustrated Abode OS icon is the logo, everywhere
     it appears. The inline SVG is ONLY the onerror fallback if the URL 404s. */
  function brandMark() {
    return '<img src="https://www.aexperiences.com/Abode_OS.png" alt="Abode OS" ' +
      'style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block" ' +
      'onerror="this.style.display=\'none\';this.parentNode.classList.add(\'fallback\')">' +
      '<svg class="fallback-mark" viewBox="0 0 32 32" width="24" height="24" style="display:none" aria-hidden="true">' +
      '<g fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">' +
      '<path d="M4 15 L16 5 L28 15"/><path d="M7 13 V27 H25 V13"/><path d="M13 27 V19 H19 V27"/></g></svg>';
  }

  function renderShell(active) {
    var side = document.createElement("aside"); side.className = "sidebar";
    side.appendChild(el(
      '<a href="dashboard.html" class="brand">' +
        '<div class="bmark">' + brandMark() + '</div>' +
        '<div><div class="bt">Abode OS</div><div class="bs">Real Estate Brokerage OS</div></div>' +
      '</a>'
    ));
    var nav = document.createElement("nav"); nav.className = "nav";
    var on = activeRooms();
    DEPTS.forEach(function (grp) {
      nav.appendChild(el('<div class="nav-group">' + esc(grp.group) + '</div>'));
      grp.items.forEach(function (it) {
        var off = it.room && on.indexOf(it.room) < 0;
        var a = el('<a href="' + (off ? "javascript:void(0)" : it.href) + '" class="navlink ' +
          (it.href === active ? "active" : "") + (off ? " locked" : "") + '"' +
          (it.accent ? ' data-accent="' + it.accent + '"' : "") + '>' +
          '<span class="ic">' + it.ic + '</span><span class="lb">' + esc(it.label) + '</span>' +
          (off ? '<span class="tier-tag">+' + money(ROOMS[it.room].mo) + '</span>' : '') + '</a>');
        if (off) {
          a.title = "Not in this build — add " + ROOMS[it.room].label +
                    " for " + money(ROOMS[it.room].mo) + "/mo + " + money(ROOMS[it.room].build) + " build";
          a.addEventListener("click", function () {
            toggleRoom(it.room);
            toast(ROOMS[it.room].label + " added — " + priceLabel(), "ok");
            setTimeout(function () { location.reload(); }, 500);
          });
        }
        nav.appendChild(a);
      });
    });
    side.appendChild(nav);
    return side;
  }

  /* The mobile bottom nav — the fix for the sidebar-shoves-content bug. On
     narrow viewports the sidebar becomes an off-canvas drawer and this frosted
     bottom bar carries the key rooms, so content is never pushed down. */
  var MOBILE_NAV = [
    { href:"dashboard.html",    label:"Home",    ic:"◎" },
    { href:"listings.html",     label:"Listings",ic:"⌂", room:"listings" },
    { href:"transactions.html", label:"Deals",   ic:"⇄", room:"transactions" },
    { href:"commissions.html",  label:"Money",   ic:"▦", room:"commissions" },
    { href:"approvals.html",    label:"Approvals",ic:"✓" }
  ];
  function renderMobileBar(active) {
    var bar = document.createElement("nav"); bar.className = "mobilebar";
    var on = activeRooms();
    MOBILE_NAV.forEach(function (it) {
      var off = it.room && on.indexOf(it.room) < 0;
      var href = off ? "javascript:void(0)" : it.href;
      var a = el('<a href="' + href + '" class="mb-link ' + (it.href === active ? "active" : "") + '">' +
        '<span class="mb-ic">' + it.ic + '</span><span class="mb-lb">' + esc(it.label) + '</span></a>');
      bar.appendChild(a);
    });
    var menu = el('<button class="mb-link mb-menu" id="mbMenu"><span class="mb-ic">☰</span><span class="mb-lb">Menu</span></button>');
    bar.appendChild(menu);
    return bar;
  }

  function renderTopbar(crumb) {
    var p = priceNow();
    var bar = document.createElement("div"); bar.className = "topbar";
    bar.innerHTML =
      '<button class="hamburger" id="hamburger" aria-label="Open menu">☰</button>' +
      '<div class="crumbs">Abode OS · <b>' + esc(crumb) + '</b></div>' +
      '<div class="spacer"></div>' +
      '<div class="tierpill" id="tierPillStatic">' +
        '<span class="dot"></span><div><b>' + esc(p.tier.name) + (p.changed ? ' <i class="cfg">configured</i>' : '') + '</b> ' +
        '<span class="price">' + money(p.mo) + '/mo · ' + money(p.build) + ' build</span></div>' +
        '<span class="chev">▾</span></div>' +
      '<div class="who"><div class="av">RC</div><div>Ruth Calder<br>' +
        '<span class="muted small">Broker-Owner · Designated Broker</span></div></div>';

    var menu = document.createElement("div"); menu.className = "tiermenu"; menu.id = "tierMenu";
    menu.appendChild(el('<div class="tm-head">Start from a package, then <b>add or take off any department</b>. ' +
      'Every one is priced on its own, so the build fits the brokerage instead of the brokerage fitting the build.</div>'));

    Object.keys(TIERS).sort(function (a,b) { return TIERS[b].rank - TIERS[a].rank; }).forEach(function (k) {
      var tt = TIERS[k];
      var opt = el('<div class="tieropt ' + (k === tier() ? "on" : "") + '">' +
        '<div class="to-top"><span class="to-name">' + esc(tt.name) + '</span>' +
        '<span class="to-price">' + money(tt.mo) + '/mo · ' + money(tt.build) + ' build</span></div>' +
        '<div class="to-desc">' + esc(tt.desc) + '</div>' +
        '<div class="to-base">' + esc(tt.base) + ' · ' + tt.includes.length + ' departments</div></div>');
      opt.addEventListener("click", function (e) { e.stopPropagation(); setTier(k); location.reload(); });
      menu.appendChild(opt);
    });

    menu.appendChild(el('<div class="tm-sub">Departments — toggle any one on or off</div>'));
    var on = activeRooms();
    var list = document.createElement("div"); list.className = "roomlist";
    Object.keys(ROOMS).forEach(function (k) {
      var r = ROOMS[k], isOn = on.indexOf(k) >= 0;
      var inPack = p.tier.includes.indexOf(k) >= 0;
      var row = el('<div class="roomrow ' + (isOn ? "on" : "") + '">' +
        '<span class="rr-box">' + (isOn ? "✓" : "+") + '</span>' +
        '<span class="rr-name">' + esc(r.label) +
          (isOn && !inPack ? ' <i class="rr-flag add">added</i>' : '') +
          (!isOn && inPack ? ' <i class="rr-flag off">removed</i>' : '') + '</span>' +
        '<span class="rr-price">' + money(r.mo) + '/mo<i>' + money(r.build) + ' build</i></span>' +
        '<span class="rr-why">' + esc(r.why) + '</span></div>');
      row.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleRoom(k);
        toast(r.label + (activeRooms().indexOf(k) >= 0 ? " added — " : " removed — ") + priceLabel(), "ok");
        setTimeout(function () { location.reload(); }, 500);
      });
      list.appendChild(row);
    });
    menu.appendChild(list);

    var totalRow = '<div class="tm-total">' +
      '<div class="tt-line"><span>' + esc(p.tier.name) + ' package</span><b>' + money(p.tier.mo) + '/mo</b></div>' +
      (p.adds.length ? '<div class="tt-line add"><span>+ ' + p.adds.length + ' department' + (p.adds.length>1?"s":"") + ' added</span><b>+' + money(p.addMo) + '/mo</b></div>' : '') +
      (p.offs.length ? '<div class="tt-line off"><span>− ' + p.offs.length + ' department' + (p.offs.length>1?"s":"") + ' removed</span><b>−' + money(p.offMo) + '/mo</b></div>' : '') +
      '<div class="tt-line grand"><span>Configured</span><b>' + money(p.mo) + '/mo · ' + money(p.build) + ' build</b></div>' +
      '<div class="tt-save">' + p.rooms.length + ' department' + (p.rooms.length === 1 ? "" : "s") +
        ' at ' + money(p.alaMo) + '/mo à la carte' +
        (p.savingMo > 0 ? ' — the package saves ' + money(p.savingMo) + '/mo' : '') + '.</div>' +
      '<div class="tt-draft">Draft pricing — Accelerated Experiences LLC sets every live price.</div>' +
      '</div>';
    menu.appendChild(el(totalRow));
    menu.addEventListener("click", function (e) { e.stopPropagation(); });

    setTimeout(function () {
      var pill = document.getElementById("tierPill");
      if (pill) pill.addEventListener("click", function (e) { e.stopPropagation(); menu.classList.toggle("open"); });
      document.addEventListener("click", function () { menu.classList.remove("open"); });
    }, 0);
    var frag = document.createDocumentFragment(); frag.appendChild(bar); frag.appendChild(menu);
    return frag;
  }

  function ribbon() {
    return el('<div class="ribbon"><span class="live">LIVE SHOWROOM</span>' +
      ' — this is the real hub, not a slideshow. Everything you type stays in your browser and resets when you leave. ' +
      'Nothing here sends, spends, publishes or moves money. ' +
      '<a href="javascript:void(0)" id="resetFloor">Reset the floor</a></div>');
  }
  function footer() {
    return el('<div class="ae-credit">Powered by <b>Accelerated Experiences LLC</b> · Abode OS is a white-label build. ' +
      'Demo data is a fictional brokerage; benchmark figures are sourced or shown blank.</div>');
  }

  function mount(opts) {
    opts = opts || {};
    db();
    var app = document.createElement("div"); app.className = "app";
    var side = renderShell(opts.active);
    var backdrop = el('<div class="nav-backdrop" id="navBackdrop"></div>');
    var main = document.createElement("div"); main.className = "main";
    main.appendChild(ribbon());
    main.appendChild(renderTopbar(opts.crumb || "Command Center"));
    var content = document.createElement("div"); content.className = "content"; content.id = "content";
    main.appendChild(content);
    main.appendChild(footer());
    app.appendChild(side); app.appendChild(main);
    document.body.innerHTML = "";
    document.body.appendChild(app);
    document.body.appendChild(backdrop);
    document.body.appendChild(renderMobileBar(opts.active));
    document.body.appendChild(el('<div id="toast-wrap"></div>'));

    setTimeout(function () {
      var r = document.getElementById("resetFloor");
      if (r) r.addEventListener("click", function () {
        resetFloor(); toast("Showroom reset to a fresh floor.", "ok");
        setTimeout(function () { location.reload(); }, 450);
      });
      function openNav(){ side.classList.add("open"); backdrop.classList.add("show"); }
      function closeNav(){ side.classList.remove("open"); backdrop.classList.remove("show"); }
      var ham = document.getElementById("hamburger");
      var mb = document.getElementById("mbMenu");
      if (ham) ham.addEventListener("click", openNav);
      if (mb) mb.addEventListener("click", openNav);
      backdrop.addEventListener("click", closeNav);
      Array.prototype.forEach.call(side.querySelectorAll("a.navlink"), function (a) {
        a.addEventListener("click", function () { closeNav(); });
      });
    }, 0);
    return content;
  }

  function toast(msg, kind) {
    var w = document.getElementById("toast-wrap"); if (!w) return;
    var t = el('<div class="toast ' + (kind || "") + '">' + esc(msg) + '</div>');
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 250); }, 2600);
  }

  /* Small shared view helpers so every page looks like one product. */
  function page(title, sub, actionsHTML) {
    return el('<div class="pagehead"><div><h1>' + esc(title) + '</h1>' +
      (sub ? '<p class="sub">' + sub + '</p>' : "") + '</div>' +
      '<div class="pagehead-actions">' + (actionsHTML || "") + '</div></div>');
  }
  function card(inner, cls) {
    return el('<section class="card ' + (cls || "") + '">' + inner + '</section>');
  }
  function stat(label, value, note, band) {
    return '<div class="stat ' + (band || "") + '"><div class="s-l">' + esc(label) + '</div>' +
      '<div class="s-v">' + value + '</div>' +
      (note ? '<div class="s-n">' + note + '</div>' : "") + '</div>';
  }
  function tag(text, kind) { return '<span class="tag ' + (kind || "") + '">' + esc(text) + '</span>'; }
  function srcNote(text) { return '<div class="srcnote">Source: ' + esc(text) + '</div>'; }
  function bar(p, cls) {
    var w = Math.max(0, Math.min(100, p));
    return '<div class="bar" style="margin-top:6px"><i style="width:' + w.toFixed(0) + '%' +
      (cls ? ";background:var(--" + cls + ")" : "") + '"></i></div>';
  }

  document.addEventListener("visibilitychange", function () { if (!document.hidden) db(); });

  /* -------------------------------------------------------------- public API */
  global.Abode = {
    /* store */
    db:db, save:save, resetFloor:resetFloor, fresh:fresh, SEED:SEED,
    /* industry canon */
    MILESTONES:MILESTONES, DOC_TYPES:DOC_TYPES, DOC_STATUS:DOC_STATUS,
    LISTING_STATUS:LISTING_STATUS, ROUTING:ROUTING, BENCH:BENCH, CONTEXT:CONTEXT, REPLACES:REPLACES,
    /* tiers, the price book, the configurator + org */
    TIERS:TIERS, ROOMS:ROOMS, DEPTS:DEPTS, SEATS:SEATS, BRAIN:BRAIN,
    tier:tier, tierRank:tierRank, setTier:setTier, tierByRank:tierByRank,
    activeRooms:activeRooms, hasRoom:hasRoom, toggleRoom:toggleRoom,
    priceNow:priceNow, priceLabel:priceLabel,
    consult:consult, askHarper:askHarper, routeDept:routeDept,
    /* money + metrics */
    gci:gci, commissionRun:commissionRun, commissionTotals:commissionTotals, dealBreakdown:dealBreakdown,
    closedVolume:closedVolume, pendingVolume:pendingVolume, unitsClosed:unitsClosed, unitsPending:unitsPending,
    avgSalePrice:avgSalePrice, deskFeeAR:deskFeeAR, capProgress:capProgress, production:production,
    docsFor:docsFor, dealCleared:dealCleared, complianceBlocks:complianceBlocks, milestonesFor:milestonesFor,
    kpis:kpis,
    /* approvals */
    approvals:approvals, stage:stage, decideApproval:decideApproval,
    /* ui */
    mount:mount, toast:toast, el:el, esc:esc, money:money, pct:pct,
    page:page, card:card, stat:stat, tag:tag, srcNote:srcNote, bar:bar, brandMark:brandMark
  };
})(window);

/* ============================================================================
   AE mobile drawer enhancer (Jul 27 2026) — progressive enhancement.
   Injects a hamburger + scrim + toggle so any shell with .app/.sidebar/.topbar
   gets a proper off-canvas drawer on phones instead of a stacked-on-top nav.
   Self-contained; safe to append to any engine. ============================ */
(function(){
  function init(){
    var app=document.querySelector('.app'),
        side=document.querySelector('.sidebar'),
        bar=document.querySelector('.topbar');
    if(!app||!side||!bar) return;
    if(document.getElementById('aeNavToggle')) return;
    var scrim=document.querySelector('.navscrim');
    if(!scrim){ scrim=document.createElement('div'); scrim.className='navscrim'; app.appendChild(scrim); }
    var btn=document.createElement('button');
    btn.id='aeNavToggle'; btn.className='ae-navtoggle'; btn.setAttribute('aria-label','Menu');
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    bar.insertBefore(btn, bar.firstChild);
    btn.addEventListener('click', function(e){ e.stopPropagation(); app.classList.toggle('nav-open'); });
    scrim.addEventListener('click', function(){ app.classList.remove('nav-open'); });
    side.addEventListener('click', function(e){ if(e.target.closest('a')) app.classList.remove('nav-open'); });
  }
  function boot(){ init(); setTimeout(init,150); setTimeout(init,500); setTimeout(init,1200); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();

/* ============================================================================
   AE in-flow COO assistant (Jul 28 2026) — "Ask the COO" on every page.
   Self-contained. Auto-detects the OS engine and drops a floating assistant
   into every room. Two jobs:
     1) CONCIERGE — explains the agent organization, how the system works,
        customization/white-label, and live pricing (pulled from the OS's own
        TIERS/ROOMS/SEATS).
     2) OPERATOR — business/operational questions route through the real agent
        org (routeDept -> consult -> gated verdict), same as the Org page.
   Ghost Mode: it answers, it never acts.
   ============================================================================ */
(function(){
  function findENG(){
    var names=['FB','Amph','EightMM','Truss','Abode','LilNinja','Buttress','Musical','Showroom'];
    for(var i=0;i<names.length;i++){ var g=window[names[i]]; if(g&&g.routeDept&&g.consult&&g.SEATS&&g.SEATS.coo&&g.SEATS.depts) return g; }
    return null;
  }
  function init(){
    if(document.getElementById('aeCooFab')) return;
    if(!document.querySelector('.app')) return;           // inside the OS only, not the gate
    var ENG=findENG(); if(!ENG) return;
    var isTg=(window.Showroom&&ENG===window.Showroom);
    var esc=ENG.esc||function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
    var money=ENG.money||function(n){return '$'+(Math.round(n||0)).toLocaleString();};
    var coo=ENG.SEATS.coo, nd=ENG.SEATS.depts.length;
    var v=isTg
      ?{surface:'var(--panel,#181E2A)',surf2:'var(--panel-2,#1F2634)',text:'var(--text,#EAEDF4)',mut:'var(--muted,#8B95A9)',line:'var(--line,#2C3547)',prim:'var(--brand,#FF6A2C)',onprim:'#160a04',good:'var(--ok,#4ADE80)',warn:'var(--warn,#FBBF24)'}
      :{surface:'var(--card,#fff)',surf2:'var(--sunk,#efe9df)',text:'var(--ink,#1a1a1a)',mut:'var(--mut,#888)',line:'var(--line,#ddd)',prim:'var(--mag,#c8501e)',onprim:'#fff',good:'var(--good,#4a8a5a)',warn:'var(--watch,#d19a2b)'};
    var st=document.createElement('style'); st.id='aeCooStyle';
    st.textContent=
      '#aeCooFab{position:fixed;right:18px;bottom:18px;z-index:95;width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;background:'+v.prim+';color:'+v.onprim+';box-shadow:0 12px 30px -8px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;transition:transform .15s}'+
      '#aeCooFab:hover{transform:translateY(-2px)}'+
      '#aeCooFab .lbl{position:absolute;right:62px;white-space:nowrap;background:'+v.surface+';color:'+v.text+';border:1px solid '+v.line+';border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:700;box-shadow:0 8px 22px -12px rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .15s}'+
      '#aeCooFab:hover .lbl{opacity:1}'+
      '#aeCooPanel{position:fixed;right:18px;bottom:82px;z-index:130;width:346px;max-width:calc(100vw - 30px);height:486px;max-height:calc(100dvh - 120px);border-radius:16px;background:'+v.surface+';border:1px solid '+v.line+';box-shadow:0 26px 64px -20px rgba(0,0,0,.6);display:none;flex-direction:column;overflow:hidden}'+
      '#aeCooPanel.open{display:flex}'+
      '.aecoo-head{padding:12px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid '+v.line+'}'+
      '.aecoo-head .av{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:13px;background:'+v.prim+';color:'+v.onprim+'}'+
      '.aecoo-head b{font-size:13.5px;color:'+v.text+'} .aecoo-head .r{font-size:10.5px;color:'+v.mut+'}'+
      '.aecoo-x{margin-left:auto;background:transparent;border:none;color:'+v.mut+';cursor:pointer;font-size:19px;line-height:1}'+
      '.aecoo-msgs{flex:1;overflow-y:auto;padding:13px;display:flex;flex-direction:column;gap:11px}'+
      '.aecoo-b{max-width:88%;padding:9px 12px;border-radius:13px;font-size:12.6px;line-height:1.5;white-space:pre-wrap}'+
      '.aecoo-b.you{align-self:flex-end;background:'+v.prim+';color:'+v.onprim+';border-bottom-right-radius:4px}'+
      '.aecoo-b.coo{align-self:flex-start;background:'+v.surf2+';color:'+v.text+';border-bottom-left-radius:4px}'+
      '.aecoo-b.coo.held{border:1px solid '+v.warn+'}'+
      '.aecoo-meta{font-size:10px;font-family:monospace;margin-top:7px;color:'+v.mut+'}'+
      '.aecoo-reasons{margin:8px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px}'+
      '.aecoo-reasons li{font-size:11px;line-height:1.45;display:flex;gap:6px;color:'+v.text+'}'+
      '.aecoo-rtag{font-family:monospace;font-size:8px;letter-spacing:.04em;padding:1px 4px;border-radius:3px;height:fit-content;margin-top:2px;font-weight:700;flex:none}'+
      '.aecoo-rtag.data{background:'+v.good+';color:#fff} .aecoo-rtag.assumption{background:'+v.warn+';color:#2a2000}'+
      '.aecoo-foot{padding:10px 12px;border-top:1px solid '+v.line+'}'+
      '.aecoo-samples{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}'+
      '.aecoo-chip{font-size:10.5px;padding:4px 9px;border-radius:999px;cursor:pointer;border:1px solid '+v.line+';background:'+v.surf2+';color:'+v.text+'}'+
      '.aecoo-inrow{display:flex;gap:7px}'+
      '.aecoo-in{flex:1;border-radius:9px;padding:9px 10px;font-size:12.5px;border:1px solid '+v.line+';background:'+v.surface+';color:'+v.text+'}'+
      '.aecoo-in:focus{outline:none;border-color:'+v.prim+'}'+
      '.aecoo-send{border:none;border-radius:9px;padding:0 14px;font-weight:800;cursor:pointer;background:'+v.prim+';color:'+v.onprim+'}';
    document.head.appendChild(st);

    /* ---------- concierge knowledge (about the system itself) ---------- */
    function kb(q){
      q=(q||'').toLowerCase();
      function m(){for(var i=0;i<arguments.length;i++){if(q.indexOf(arguments[i])>=0)return true;}return false;}
      if(m('agent org','organization','who runs','who is','the seats','how the org','the org','deliberat','confidence bar','ghost mode','deepseek','ai org','how does the ai','the departments do'))
        return 'This OS runs on a '+nd+'-department AI agent organization, and I’m '+coo.name+', the COO. You ask; I route it to exactly one department, let its five-seat chain — a head, an admin exec, a pacemaker, and two opposing lenses that never confer — work it under its own confidence bar, then bring you one clean answer with its reasons. Money and compliance calls hold a higher 85% bar and come to you if they aren’t certain. Nothing here acts on its own — that’s Ghost Mode; anything that would send, spend or sign is staged on the Approval Desk. The real engine runs server-side on DeepSeek; this showroom is a faithful local stand-in.';
      if(m('price','pricing','cost','how much','what do you charge','tier','plan','package','per month','/mo','subscription','quote','expensive')){
        var ts=Object.keys(ENG.TIERS).map(function(k){return ENG.TIERS[k];}).sort(function(a,b){return (a.mo||0)-(b.mo||0);});
        var lines=ts.map(function(t){return '• '+t.name+' — '+money(t.mo)+'/mo + '+money(t.build)+' one-time build'+(t.desc?': '+t.desc:'');}).join('\n');
        return 'Here are the packages:\n\n'+lines+'\n\nEvery department is also priced on its own, so you can add or drop any one and the price moves with it — tap the tier chip at the top to configure it live. Draft pricing; Accelerated Experiences LLC sets the final number.';
      }
      if(m('custom','white label','white-label','brand','skin','tailor','our own','add a department','add department','remove a','turn off','turn on','configure','make it fit','our data')){
        var rs=Object.keys(ENG.ROOMS).slice(0,4).map(function(k){return ENG.ROOMS[k].label;}).join(', ');
        return 'It’s fully white-label: your brand, your colors, your departments, and your own data seeded in. Start from a package, then add or take off any department — like '+rs+' — so the build fits your business instead of the other way around. Tap the tier chip at the top to switch departments on and off and watch the price move in real time.';
      }
      if(m('what is this','what does it do','what can you do','what can it do','how does it work','is this real','is it real','showroom','slideshow','a demo','real app'))
        return 'This is the real OS, running right here in your browser — not a slideshow. Everything you type stays in this tab and resets when you leave. It’s your whole operation as one system, with a '+nd+'-department AI org underneath it. In the live product it runs on a server with your real data; nothing in this showroom sends, spends or signs — anything that would is staged on the Approval Desk for you. Ask me about the org, pricing, or how to customize it — or ask an operational question and I’ll route it to the right department.';
      if(m('who are you','your name','what are you'))
        return 'I’m '+coo.name+' — the Chief Operating Officer of this OS. I’m the one seat between you and a '+nd+'-department AI org: I take your question, route it, and bring back a clean answer. Ask me how the system works, what it costs, how to customize it, or anything operational.';
      return null;
    }

    var fab=document.createElement('button'); fab.id='aeCooFab'; fab.setAttribute('aria-label','Ask '+coo.name);
    fab.innerHTML='<span class="lbl">Ask '+esc(coo.name)+'</span>◎';
    document.body.appendChild(fab);

    var samples=['What’s the agent org?','How much does it cost?','Can I customize it?','What needs my attention?'];
    var panel=document.createElement('div'); panel.id='aeCooPanel';
    panel.innerHTML=
      '<div class="aecoo-head"><div class="av">'+esc(coo.name.charAt(0))+'</div><div><b>'+esc(coo.name)+'</b><div class="r">'+esc(coo.role)+' · agent org + concierge</div></div><button class="aecoo-x" aria-label="Close">×</button></div>'+
      '<div class="aecoo-msgs" id="aeCooMsgs"></div>'+
      '<div class="aecoo-foot"><div class="aecoo-samples">'+samples.map(function(s){return '<span class="aecoo-chip">'+esc(s)+'</span>';}).join('')+'</div>'+
      '<div class="aecoo-inrow"><input class="aecoo-in" id="aeCooIn" placeholder="Ask '+esc(coo.name)+' anything…"><button class="aecoo-send" id="aeCooSend">Ask</button></div></div>';
    document.body.appendChild(panel);

    var msgs=panel.querySelector('#aeCooMsgs'), input=panel.querySelector('#aeCooIn');
    function bubble(cls,html){ var b=document.createElement('div'); b.className='aecoo-b '+cls; b.innerHTML=html; msgs.appendChild(b); msgs.scrollTop=msgs.scrollHeight; return b; }
    bubble('coo','Hi — I’m '+esc(coo.name)+', your COO. I can explain the agent org, what the system does, how to customize it and what it costs — or take an operational question and route it to the right department. What do you need?');
    function ask(q){
      q=(q||'').trim(); if(!q){ input.focus(); return; }
      bubble('you',esc(q)); input.value='';
      var k=kb(q);
      if(k){ bubble('coo', esc(k).replace(/\n/g,'<br>')); return; }        // concierge answer
      var dk=ENG.routeDept(q), r=ENG.consult(dk,q);                         // else route to the org
      if(!r){ bubble('coo','I couldn’t route that one — try rephrasing, or ask me about the org, pricing or customization.'); return; }
      var dept=ENG.SEATS.depts.filter(function(x){return x.key===dk;})[0]||{name:dk,gate:80};
      var vd=r.verdict, passed=r.passed;
      var reasons=(vd.reasons||[]).map(function(x){return '<li><span class="aecoo-rtag '+esc(x.t)+'">'+esc((x.t||'').toUpperCase())+'</span><span>'+esc(x.s)+'</span></li>';}).join('');
      var head=passed?esc(vd.stance):(esc(coo.name)+': Holding this for you — '+esc(dept.name)+' came in at '+vd.conf+'%, under its '+dept.gate+'% bar, so it needs a human. '+esc(vd.stance));
      bubble('coo'+(passed?'':' held'), head+
        '<ul class="aecoo-reasons">'+reasons+'</ul>'+
        '<div class="aecoo-meta">'+esc(dept.name)+' · '+vd.conf+'% vs '+dept.gate+'% bar · '+(passed?'released':'held — needs you')+'</div>');
    }
    fab.onclick=function(){ panel.classList.toggle('open'); if(panel.classList.contains('open')) setTimeout(function(){input.focus();},50); };
    panel.querySelector('.aecoo-x').onclick=function(){ panel.classList.remove('open'); };
    panel.querySelector('#aeCooSend').onclick=function(){ ask(input.value); };
    input.addEventListener('keydown',function(e){ if(e.key==='Enter') ask(input.value); });
    Array.prototype.forEach.call(panel.querySelectorAll('.aecoo-chip'),function(c){ c.onclick=function(){ ask(c.textContent); }; });
  }
  function boot(){ init(); setTimeout(init,200); setTimeout(init,600); setTimeout(init,1400); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


/* ── AE Connect — hub-wide incoming-call watcher (ae-connect-watcher) ── */
(function(){
  if (typeof document==='undefined') return;
  var API=(window.ABODE_API||'https://ae-connect-api.vercel.app')+'/api/connect', NS='abode';
  function me(){ try{ return JSON.parse(sessionStorage.getItem('abode_connect_me')); }catch(e){ return null; } }
  function post(p){ return fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({ns:NS},p))}).then(function(r){return r.json();}).catch(function(){return {ok:false};}); }
  var showing=false;
  function card(r){
    if(showing)return; showing=true;
    var d=document.createElement('div');
    d.style.cssText='position:fixed;right:18px;top:74px;z-index:9600;background:#161d24;color:#eaf1f6;border-radius:14px;padding:16px 18px;box-shadow:0 20px 60px rgba(0,0,0,.45);max-width:300px;font-family:system-ui,sans-serif;border-left:4px solid #e8a33d';
    d.innerHTML='<div style="font-weight:700;font-size:15px">\ud83d\udcf9 '+(r.name||'Someone')+' is calling</div>'+
      '<div style="font-size:12px;opacity:.7;margin:3px 0 12px">'+(r.subject||'Incoming video call')+'</div>'+
      '<button id="aeJoin" style="font:inherit;font-weight:700;background:#e8a33d;color:#241a08;border:none;border-radius:9px;padding:10px 16px;cursor:pointer">Join</button> '+
      '<button id="aeDis" style="font:inherit;background:none;border:1px solid #3f5468;color:#9fb2c2;border-radius:9px;padding:10px 14px;cursor:pointer">Dismiss</button>';
    document.body.appendChild(d);
    function done(){ try{document.body.removeChild(d);}catch(e){} showing=false; }
    d.querySelector('#aeDis').onclick=done;
    d.querySelector('#aeJoin').onclick=function(){ done(); var m=me();
      function go(){ window.AbodeMeet.open({room:r.room,displayName:m?m.name:'Guest',subject:r.subject||''}); }
      if(window.AbodeMeet) go(); else { var sc=document.createElement('script'); sc.src='abode-rtc.js'; sc.onload=go; document.head.appendChild(sc); } };
  }
  function tick(){ var m=me(); if(!m) return;
    post({do:'poll',me:m.slug}).then(function(r){
      if(r&&r.ok&&r.ring&&r.ring.room) card(r.ring);
      if(r&&r.ok&&typeof r.unread==='number'){
        var a=document.querySelector('a[href="connect.html"]');
        if(a){ var b=a.querySelector('.ae-ub');
          if(r.unread>0){ if(!b){ b=document.createElement('span'); b.className='ae-ub';
            b.style.cssText='display:inline-block;min-width:17px;text-align:center;background:#e8a33d;color:#241a08;border-radius:999px;font-size:10.5px;font-weight:700;padding:1px 5px;margin-left:7px'; a.appendChild(b); }
            b.textContent=r.unread; } else if(b){ b.remove(); } } }
    }); }
  setInterval(tick,6000); setTimeout(tick,1500);
})();

/* ── AE Command Center charts (ae-charts) ─────────────────────────────────
   Adaptive: reads whatever this OS actually stores, finds the money series,
   and draws it. Appended to the engine so no dashboard edits are needed.
   Fails silent — if there's nothing numeric to draw, nothing renders.      */
(function(){
  if (typeof document==='undefined') return;
  if (!/dashboard/.test(location.pathname)) return;
  var NAMES=['FB','Fourbarrel','Amph','EightMM','Truss','Abode','LilNinja','Buttress','Musical','MusicalCore','Showroom'];
  function eng(){ for(var i=0;i<NAMES.length;i++){ var g=window[NAMES[i]]; if(g&&typeof g.db==='function') return g; } return null; }
  function cvar(list,fb){ try{ var cs=getComputedStyle(document.documentElement);
    for(var i=0;i<list.length;i++){ var v=(cs.getPropertyValue(list[i])||'').trim(); if(v) return v; } }catch(e){} return fb; }
  var MONEYRE=/fee|price|amount|total|revenue|cost|value|gross|net|tuition|billed|budget|earned|paid|guarantee|sale|msrp|acq/i;
  var LABELRE=/^(name|title|project|show|production|unit|family|account|client|customer|patron|vehicle|item|label|company|program|artist|address|make)$/i;
  var CATRE=/^(phase|status|stage|type|category|kind|dept|department|state|tier|track|discipline|genre)$/i;
  var BAD=/^(id|key|uid|number|vin|stock)$/i;
  function pick(r,f){ return f.indexOf('.')>0 ? ((r[f.split('.')[0]]||{})[f.split('.')[1]]) : r[f]; }

  function discover(d){
    var best=null;
    Object.keys(d||{}).forEach(function(k){
      var a=d[k];
      if(!Array.isArray(a)||a.length<2||typeof a[0]!=='object'||!a[0]) return;
      var fields=[];
      Object.keys(a[0]).forEach(function(f){ var v=a[0][f];
        if(v&&typeof v==='object'&&!Array.isArray(v)){ Object.keys(v).forEach(function(s){ if(typeof v[s]==='number') fields.push(f+'.'+s); }); }
        else fields.push(f); });
      fields.forEach(function(f){
        var vals=a.map(function(r){ return Number(pick(r,f)); }).filter(function(n){ return isFinite(n); });
        if(vals.length<Math.max(2,Math.floor(a.length*0.6))) return;
        var sum=vals.reduce(function(x,y){return x+y;},0); if(!(sum>0)) return;
        var money=MONEYRE.test(f.split('.').pop())||MONEYRE.test(f);
        var score=sum*(money?1000:1);
        if(!best||score>best.score) best={coll:k,rows:a,field:f,sum:sum,money:money,score:score};
      });
    });
    if(!best) return null;
    var k0=Object.keys(best.rows[0]||{});
    best.label=k0.filter(function(f){ return LABELRE.test(f)&&typeof best.rows[0][f]==='string'; })[0]
            || k0.filter(function(f){ return !BAD.test(f)&&typeof best.rows[0][f]==='string'&&String(best.rows[0][f]).length>2; })[0]
            || k0.filter(function(f){ return typeof best.rows[0][f]==='string'; })[0] || null;
    best.cat=k0.filter(function(f){ if(!CATRE.test(f)) return false;
      var set={}; best.rows.forEach(function(r){ if(typeof r[f]==='string') set[r[f]]=1; });
      var n=Object.keys(set).length; return n>=2&&n<=6; })[0]||null;
    return best;
  }

  function build(){
    var E=eng(); if(!E) return;
    var content=document.getElementById('content'); if(!content) return;
    if(document.getElementById('aeChartCard')) return;
    var d; try{ d=E.db(); }catch(e){ return; }
    var S=discover(d); if(!S) return;

    var ACC =cvar(['--blue','--accent','--primary','--brand','--a-money','--a-projects','--teal'],'#4a7fa5');
    var ACC2=cvar(['--blue-2','--brand-2','--a-books','--a-field'],ACC);
    var HI  =cvar(['--amber','--gold','--amber-3','--brand-glow'],'#c9871f');
    var TRK =cvar(['--sunk','--line-2','--line'],'rgba(128,128,128,.18)');
    var INK =cvar(['--ink'],'#1b1f22'), MUT=cvar(['--mut','--ink-2'],'#7b8288');

    function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
    function fmt(n){ n=Number(n)||0;
      if(!S.money) return String(Math.round(n));
      if(n>=1000000) return '$'+(n/1000000).toFixed(2).replace(/\.?0+$/,'')+'M';
      if(n>=1000) return '$'+Math.round(n/1000)+'k';
      return '$'+Math.round(n); }
    function words(s){ s=String(s==null?'':s); return s.length>26?s.slice(0,25)+'…':s; }
    function title(s){ return String(s).replace(/[._-]/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}); }

    /* --- bars: top rows by value --- */
    var rows=S.rows.slice().map(function(r){ return {l:S.label?r[S.label]:'—', v:Number(pick(r,S.field))||0}; })
                   .filter(function(r){ return r.v>0; })
                   .sort(function(a,b){ return b.v-a.v; }).slice(0,6);
    var max=Math.max.apply(null,rows.map(function(r){return r.v;}).concat([1]));
    var W=760,labW=190,valW=76,barW=W-labW-valW,rowH=32,H=rows.length*rowH+6,g1='';
    rows.forEach(function(r,i){
      var y=i*rowH+4, w=Math.max(2,(r.v/max)*barW);
      g1+='<text x="0" y="'+(y+15)+'" font-size="11.5" fill="'+MUT+'" font-family="system-ui,sans-serif">'+esc(words(r.l))+'</text>'
        +'<rect x="'+labW+'" y="'+(y+4)+'" width="'+barW+'" height="14" rx="4" fill="'+TRK+'"/>'
        +'<rect x="'+labW+'" y="'+(y+4)+'" width="'+w+'" height="14" rx="4" fill="'+(i===0?HI:ACC)+'"/>'
        +'<text x="'+W+'" y="'+(y+15)+'" text-anchor="end" font-size="11" font-weight="600" fill="'+INK+'" font-family="ui-monospace,Menlo,monospace">'+fmt(r.v)+'</text>';
    });

    /* --- donut by category --- */
    var g2='',leg='';
    if(S.cat){
      var by={},tot=0;
      S.rows.forEach(function(r){ var c=r[S.cat]; if(typeof c!=='string')return;
        var v=Number(pick(r,S.field))||0; if(!(v>0))return; by[c]=(by[c]||0)+v; tot+=v; });
      var keys=Object.keys(by).sort(function(a,b){return by[b]-by[a];});
      var PAL=[ACC,HI,ACC2,'#6a8f7a','#8a7fa8','#a8865f'];
      var R=52,CX=68,CY=68,C=2*Math.PI*R,off=0;
      keys.forEach(function(k,i){ var fr=tot?by[k]/tot:0; if(fr<=0)return;
        g2+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R+'" fill="none" stroke="'+PAL[i%PAL.length]+'" stroke-width="19" stroke-dasharray="'+(fr*C)+' '+C+'" stroke-dashoffset="'+(-off*C)+'" transform="rotate(-90 '+CX+' '+CY+')"/>';
        leg+='<span style="display:inline-flex;align-items:center;gap:6px;margin:0 12px 7px 0;font-size:12px;color:'+MUT+'"><i style="width:10px;height:10px;border-radius:3px;background:'+PAL[i%PAL.length]+';display:inline-block"></i>'+esc(k)+' · '+fmt(by[k])+'</span>';
        off+=fr; });
      g2+='<text x="'+CX+'" y="'+(CY-1)+'" text-anchor="middle" font-size="14" font-weight="700" fill="'+INK+'" font-family="system-ui,sans-serif">'+fmt(tot)+'</text>'
        +'<text x="'+CX+'" y="'+(CY+13)+'" text-anchor="middle" font-size="8.5" fill="'+MUT+'" font-family="ui-monospace,Menlo,monospace">TOTAL</text>';
    }

    /* --- KPI bullets vs target bands (only if this engine publishes them) --- */
    var g3='';
    try{
      if(typeof E.kpis==='function'){
        var ks=E.kpis().filter(function(k){ return k.bench&&k.bench.target&&typeof k.value==='number'; }).slice(0,3);
        ks.forEach(function(k,i){
          var lo=k.bench.target[0],hi=k.bench.target[1],mx=Math.max(hi*1.35,k.value*1.1),bw=400,x0=132,y0=i*34+12;
          var vx=Math.min(bw,(k.value/mx)*bw),lx=(lo/mx)*bw,hx=(hi/mx)*bw,inb=k.value>=lo&&k.value<=hi;
          var val=(k.fmt==='pct')?Math.round(k.value)+'%':(k.fmt==='x')?k.value.toFixed(2)+'x':Math.round(k.value);
          g3+='<text x="0" y="'+(y0+11)+'" font-size="11.5" fill="'+MUT+'" font-family="system-ui,sans-serif">'+esc(k.label||k.k)+'</text>'
            +'<rect x="'+x0+'" y="'+y0+'" width="'+bw+'" height="13" rx="4" fill="'+TRK+'"/>'
            +'<rect x="'+(x0+lx)+'" y="'+y0+'" width="'+Math.max(2,hx-lx)+'" height="13" fill="none" stroke="'+ACC+'" stroke-dasharray="3 3"/>'
            +'<rect x="'+x0+'" y="'+(y0+3)+'" width="'+vx+'" height="7" rx="3" fill="'+(inb?ACC:HI)+'"/>'
            +'<text x="'+(x0+bw+8)+'" y="'+(y0+11)+'" font-size="11" font-weight="700" fill="'+(inb?ACC:HI)+'" font-family="ui-monospace,Menlo,monospace">'+val+'</text>';
        });
      }
    }catch(e){}

    var card=document.createElement('div');
    card.className='card'; card.id='aeChartCard';
    var heading=(S.money?'The money, drawn':'The numbers, drawn');
    card.innerHTML='<h2 style="margin:0 0 4px">'+heading+'</h2>'+
      '<div class="card-sub" style="margin-bottom:14px">Same figures as the tables below, as pictures — computed live from this system\'s own data, nothing hand-entered.</div>'+
      '<div style="border:1px solid '+TRK+';border-radius:12px;padding:14px 16px 10px;margin-bottom:14px">'+
        '<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:'+MUT+';margin-bottom:8px">Top '+esc(title(S.coll))+' by '+esc(title(S.field.split('.').pop()))+'</div>'+
        '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">'+g1+'</svg></div>'+
      (g2?'<div style="display:grid;grid-template-columns:1fr 1.15fr;gap:14px">'+
        '<div style="border:1px solid '+TRK+';border-radius:12px;padding:14px 16px">'+
          '<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:'+MUT+';margin-bottom:8px">By '+esc(title(S.cat))+'</div>'+
          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><svg viewBox="0 0 136 136" style="max-width:136px;width:100%;height:auto">'+g2+'</svg>'+
          '<div style="flex:1;min-width:120px">'+leg+'</div></div></div>'+
        (g3?'<div style="border:1px solid '+TRK+';border-radius:12px;padding:14px 16px"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:'+MUT+';margin-bottom:8px">Health vs. target band</div><svg viewBox="0 0 560 '+(Math.max(1,Math.min(3,3))*34+14)+'" style="width:100%;height:auto">'+g3+'</svg></div>':'<div></div>')+
      '</div>':(g3?'<div style="border:1px solid '+TRK+';border-radius:12px;padding:14px 16px"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:'+MUT+';margin-bottom:8px">Health vs. target band</div><svg viewBox="0 0 560 116" style="width:100%;height:auto">'+g3+'</svg></div>':''));

    var first=content.querySelector('.card');
    if(first&&first.nextSibling) content.insertBefore(card,first.nextSibling);
    else content.appendChild(card);
  }
  function boot(){ build(); setTimeout(build,300); setTimeout(build,1200); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
