# Attribution: Understanding What Drove Results

**Core Insight:** Customers don't convert from a single touchpoint. Attribution helps you understand which channels and content contribute to conversion so you can invest wisely. But no model is perfect; use attribution to inform, not dictate.


## Objective

To provide a practical framework for understanding which marketing efforts drive results, enabling better resource allocation.

## 1. The Attribution Challenge

### Why Attribution Is Hard
- Customers interact across multiple channels
- Touchpoints happen over days, weeks, months
- Some touchpoints are invisible (word-of-mouth, dark social)
- Each model tells a different story

### The Goal
Not perfect accuracy, but directionally useful insights:
- Which channels are working?
- Where should we invest more?
- What's the customer journey?
- What's the true ROI of each effort?

---

## 2. Attribution Models

### Single-Touch Models

**First-Touch Attribution**
Credit goes to first interaction.

```
[Ad Click] → Email → Webinar → Purchase
    100%        0%       0%
```

**Best For:** Understanding what initiates awareness
**Weakness:** Ignores nurture that closed the deal

**Last-Touch Attribution**
Credit goes to final interaction before conversion.

```
[Ad Click] → Email → Webinar → Purchase
    0%         0%      100%
```

**Best For:** Understanding what closes deals
**Weakness:** Ignores what created the opportunity

### Multi-Touch Models

**Linear Attribution**
Equal credit to all touchpoints.

```
[Ad Click] → Email → Webinar → Purchase
   33%        33%      33%
```

**Best For:** Simple, balanced view
**Weakness:** May overvalue low-impact touches

**Time Decay Attribution**
More credit to touchpoints closer to conversion.

```
[Ad Click] → Email → Webinar → Purchase
   10%        30%      60%
```

**Best For:** Long sales cycles where recent touchpoints matter more
**Weakness:** May undervalue awareness-building

**Position-Based (U-Shaped)**
40% to first, 40% to last, 20% split among middle.

```
[Ad Click] → Email → Webinar → Purchase
   40%        10%      10%      40%
```

**Best For:** Valuing both discovery and conversion
**Weakness:** Arbitrary position weighting

**Data-Driven / Algorithmic**
Machine learning assigns credit based on patterns.

**Best For:** Large data sets, complex journeys
**Weakness:** Requires significant volume, can be black box

---

## 3. Choosing a Model

### By Business Type

| Business | Recommended | Why |
|----------|-------------|-----|
| **E-commerce, impulse** | Last-touch | Short cycle, close matters |
| **SaaS, long cycle** | Time decay or position-based | Multiple touchpoints matter |
| **Services, high-touch** | Position-based | Awareness and close both critical |
| **Creator, community** | First-touch for awareness, last for conversion | Measure both |

### By Maturity

| Stage | Approach |
|-------|----------|
| **Starting** | Last-touch (simple, actionable) |
| **Growing** | Linear or position-based (balance) |
| **Mature** | Data-driven or custom model |

**Principle:** Start simple. Add complexity when you have data to support it.

---

## 4. Tracking Implementation

### Essential Tracking

| Element | Purpose |
|---------|---------|
| **UTM Parameters** | Tag traffic sources (source, medium, campaign) |
| **Pixels/Tags** | Track conversions back to ads |
| **CRM Integration** | Connect marketing touches to sales |
| **Email Tracking** | Opens, clicks, conversion attribution |
| **Event Tracking** | Key actions (video watched, page scrolled) |

### UTM Structure
```
?utm_source=[platform]
&utm_medium=[channel type]
&utm_campaign=[campaign name]
&utm_content=[specific creative]
```

**Example:**
```
?utm_source=facebook
&utm_medium=paid
&utm_campaign=webinar-launch-jan
&utm_content=testimonial-video
```

### Attribution Windows
How long after a touchpoint can it get credit?

| Type | Typical Window |
|------|----------------|
| **Click** | 7-30 days |
| **View** | 1-7 days |
| **Email** | 7-14 days |

Longer windows capture more, but risk over-attribution.

---

## 5. Beyond Digital Attribution

### Dark Social and Word-of-Mouth
Much attribution happens invisibly:
- Private messages and DMs
- Conversations and referrals
- Podcast and video mentions

### Measuring the Unmeasurable

**"How did you hear about us?" Survey**
- Ask at checkout or signup
- Simple dropdown or open text
- Captures offline and dark social

**Branded Search Lift**
- Increase in brand name searches after campaigns
- Indicates awareness even without direct tracking

**Post-Purchase Surveys**
- Deeper attribution questions
- "What finally convinced you to buy?"

**Promo Codes by Channel**
- Unique codes for podcast, influencer, etc.
- Direct attribution regardless of tracking

---

## 6. Multi-Touch Journey Analysis

### Mapping the Journey
Common paths to conversion:

```
Content → Lead Magnet → Email 1-5 → Webinar → Cart Email → Purchase
```

### Journey Insights
- **Average touchpoints to conversion:** How many interactions before purchase?
- **Time to conversion:** Days from first touch to purchase
- **Common entry points:** Where do buyers first engage?
- **Drop-off points:** Where do prospects disappear?

### Cohort Journey Analysis
Compare journeys of different segments:
- High-value customers vs. average
- Fast converters vs. slow
- Organic vs. paid acquisition

---

## 7. Reporting and Action

### Attribution Report Elements
- Conversion by channel (with model specified)
- Cost per acquisition by channel
- Journey visualization
- Model comparison (how does attribution differ by model?)

### Using Attribution Data

**For Budget Allocation:**
- Invest more in channels that assist AND convert
- Don't cut channels that assist even if they don't close
- Test reducing spend on low-attribution channels

**For Content Strategy:**
- What content appears in winning journeys?
- What entry content leads to best customers?
- Where are the gaps?

**For Optimization:**
- Which touchpoints have highest drop-off?
- Where can we add more touches?
- What's the optimal sequence?

---

## 8. Attribution Limitations

### What Attribution Can't Tell You
- **Counterfactual:** Would they have bought anyway?
- **Incrementality:** How many sales did this add (not just take credit for)?
- **Long-term brand:** Brand building is hard to attribute

### Incrementality Testing
To understand true impact, run holdout tests:
- Exclude a group from a channel
- Compare conversion rates
- Measures true lift, not just attribution

### Avoiding Common Mistakes
1. **Over-relying on one model:** Compare multiple models
2. **Ignoring assisted conversions:** Last-touch misses the journey
3. **Attributing too long:** Stretched windows over-attribute
4. **Ignoring dark social:** Self-reported data matters
5. **Perfect accuracy trap:** Directionally useful beats precisely wrong

---

## Quality Checks for Attribution

Before making decisions:

- [ ] Attribution model explicitly stated
- [ ] Tracking properly implemented
- [ ] Dark social captured (surveys)
- [ ] Multiple models compared
- [ ] Assist conversions included
- [ ] Windows appropriate for sales cycle

---

