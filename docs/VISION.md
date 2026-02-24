# bubblewaffle.com -- Vision & Strategy

> This is a living document. Every time you return to it, re-evaluate
> everything considering what changed externally: traffic data, revenue,
> market shifts, new tools, lessons learned. Challenge every assumption.

Last updated: 2026-02-23

## What we have

- **bubblewaffle.com** -- exact-match domain. 110K monthly searches for
  "bubble waffle" globally. Inherent SEO authority in the niche.
- **@bubblewaffle** Instagram -- 1-10K followers. THE handle for the niche.
- **CNN Travel** article featuring Oleg Sabsai -- high-authority backlink
  (DR90+) and industry credibility.
- **Working MVP** -- Next.js registry with map, shop profiles, agent
  pipeline (discover/verify/promote), submission form. Deployed on Vercel,
  Supabase backend.
- **Llama 3.3 70B Q8** running locally -- free content generation.
- **Deep industry knowledge** -- decades of hands-on experience.
- **Budget** -- ~$500/month for infrastructure. All revenue reinvested
  until the project reaches self-sustaining state.

## What we do NOT have yet

- Traffic (the site is empty of real data)
- Revenue (zero)
- Email list
- Content beyond the skeleton
- Reason for anyone to come back

---

## The big idea (one sentence)

bubblewaffle.com becomes the place the entire world trusts to find,
rate, and celebrate bubble waffles -- by first being genuinely useful,
then becoming the authority, then becoming irreplaceable.

## The sequence matters: Useful -> Authority -> Irreplaceable

### Stage 1: USEFUL (months 1-3)

Nobody visits a site that has nothing. Nobody cares about awards from a
site nobody visits. The first job is to make bubblewaffle.com **the most
useful bubble waffle resource on the internet.**

What "useful" looks like:
- Search "bubble waffle Miami" -- bubblewaffle.com appears with a real
  city guide listing 15 verified shops with photos, hours, maps.
- Search "best bubble waffle maker" -- bubblewaffle.com has an honest,
  detailed equipment review.
- Search "how to start bubble waffle business" -- bubblewaffle.com has
  a comprehensive guide (and sells a detailed version as digital product).
- A shop owner googles their own shop -- finds a professional profile on
  bubblewaffle.com they didn't even know existed.

This stage is about CONTENT + DATA. AI agents fill the registry. Llama
generates content. SEO brings traffic. The site earns trust by being
genuinely helpful.

Revenue in Stage 1: affiliate links on equipment pages ($6-400/sale),
digital product "Business Starter Guide" ($49-99).

### Stage 2: AUTHORITY (months 3-6)

Once the site has traffic (20K+/month) and real data (2000+ shops), we
have earned the right to be an authority. Now we can:

**Launch Bubble Waffle Awards.**

But not as a hollow badge. As something shops ACTUALLY WANT because:

1. **It brings them customers.** By month 3, bubblewaffle.com has real
   traffic. A "Best in Miami" badge on their profile means real eyeballs.
   The award page ranks in Google. Voters discover the shop.

2. **It's free marketing they can't get elsewhere.** We create a
   beautiful feature about the nominee: photos, story, what makes their
   waffle special. We post it on Instagram to our growing audience. We
   include it in city guides. This is marketing the shop would pay
   hundreds of dollars for, and we do it for free.

3. **Social proof that works offline.** A sticker "Award Winner 2026 --
   bubblewaffle.com" in the window is a quality signal for walk-in
   customers. Like a Yelp sticker or TripAdvisor certificate, but
   specifically for their niche.

4. **Competitive pride.** Shop owners are passionate about their craft.
   Being recognized as "the best" in their city matters to them
   personally, not just commercially.

How awards build weight and significance:
- Start in 5 cities where we have the most data (not 20).
- Partner with 1-2 local food bloggers per city as "judges" (costs
  nothing, gives them content, gives us credibility).
- Create genuinely excellent award pages (not AI slop -- real stories).
- Make the voting real: require email, limit to 1 vote, show live
  counts. Transparent process builds trust.
- Document everything publicly: criteria, process, who judges.
- Winners get a physical package: certificate, window sticker, QR code.
  Cost per package: ~$5. Investment of ~$50-100 for 10-20 winners that
  generates permanent physical presence.

Revenue in Stage 2: premium profiles ($29-99/month), featured
nominations, sponsored award categories from equipment suppliers.

### Stage 3: IRREPLACEABLE (months 6-12)

With traffic, authority, and shop participation, we launch the consumer
lock-in layer:

**Waffle Passport** -- digital collection of visited shops.
- Scan QR at award-winning shops (already in windows from Stage 2)
- Collect stamps on personal world map
- Badges: "Tried 5 countries", "Local Explorer", etc.
- Leaderboard of travelers
- Share on Instagram Stories (viral loop)

**Waffle Score** -- quality rating built from:
- Award voting data
- Passport check-in frequency
- User reviews
- Verification agent data
- Composite score 1-100 on every shop profile

At this point, the platform is **irreplaceable** because:
- Consumers don't want to lose their passport collection
- Shops don't want to lose their Score and badge
- The data (years of votes, check-ins, verifications) can't be copied
- The physical QR stickers in windows worldwide can't be replicated
- bubblewaffle.com IS the industry standard

Revenue in Stage 3: all previous + B2B API, data licensing, sponsored
content from suppliers, possibly events.

---

## Why this sequence and not another

The temptation is to build everything at once: awards, passport,
gamification, marketplace, B2B API. But each layer only works if the
previous one is solid:

```
Awards without traffic = nobody cares
Passport without shops participating = empty feature
Waffle Score without data = meaningless number
Premium listings without visitors = no value proposition
```

The sequence is:
```
DATA (fill registry) -> CONTENT (create pages) -> TRAFFIC (SEO ranks)
-> AUTHORITY (awards) -> LOCK-IN (passport/score) -> INDESTRUCTIBLE
```

Each stage takes ~3 months. Trying to skip stages wastes time on things
that can't work yet.

---

## Current focus: FILL THE REGISTRY

Everything starts with data. Without 1000+ real shops in the database,
there is nothing to build content from, nothing to show on the map,
nothing to nominate for awards, nothing to create city guides from.

**The single most important thing right now:**

Get Discovery Agent working and populate the registry with 1000+ real
bubble waffle shops from the top 30 cities worldwide.

This is the foundation. Once 1000 shops exist:
- City guides auto-generate from data
- The map becomes genuinely useful
- Shop profiles exist for owners to discover and claim
- We have raw material for Instagram content
- Awards become possible

### Target cities (first 30)

Tier 1 (highest density of bubble waffle shops):
Hong Kong, Bangkok, Taipei, Seoul, Tokyo, Singapore, Kuala Lumpur,
London, New York, Los Angeles

Tier 2:
Paris, Berlin, Sydney, Melbourne, Toronto, Vancouver, Dubai, Istanbul,
Miami, Chicago

Tier 3:
San Francisco, Seattle, Amsterdam, Barcelona, Prague, Vienna, Warsaw,
Lisbon, Manila, Jakarta

### Data sources for Discovery Agent
1. Google Places API -- search "bubble waffle" in each city
2. Instagram hashtag search -- #bubblewaffle, #eggwaffle, #bubblewaffles
3. Yelp API -- category search
4. Manual seed list from industry knowledge

### What "done" looks like for this phase
- [ ] 1000+ shops in Supabase `shops` table
- [ ] Each shop has: name, city, country, coordinates, address
- [ ] At least 500 have: Instagram URL or website
- [ ] At least 200 have: photos
- [ ] All 30 target cities have at least 10 shops
- [ ] Map page shows real global coverage

---

## Technical decisions

- **Single codebase**: everything in this Next.js project. No external
  orchestrators. Agents are API routes + Vercel cron.
- **Llama 3.3 70B locally** for content generation (blog posts, shop
  descriptions, Instagram captions, email drafts). $0 cost.
- **Claude Opus in Cursor** for code development and complex reasoning.
- **Supabase** for all persistence. RLS for security.
- **Vercel** for hosting + cron.
- **Stripe** for payments (when ready).
- **Resend** for email (when ready).
- **Meta Graph API** for Instagram posting (when ready).

---

## Metrics that matter (in order)

Stage 1: Shops in registry, indexed pages, organic impressions, first $1
Stage 2: Monthly visitors, email subscribers, first premium customer
Stage 3: Passport users, returning visitors, revenue per month

Everything else is vanity.

---

## Re-evaluation checklist

Every time you return to this document, ask:

1. What changed in the market? (new competitors, trends, tools)
2. What do the numbers say? (traffic, revenue, conversion rates)
3. Is the current stage complete? (check the "done" criteria)
4. What assumption was wrong? (update the plan)
5. What's the ONE thing to focus on next?
