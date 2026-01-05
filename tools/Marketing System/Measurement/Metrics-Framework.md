# Metrics Framework: What to Measure

**Core Insight:** You can't improve what you don't measure, but measuring everything creates noise. Focus on metrics that drive decisions, not dashboards. The right metric depends on your business model, growth stage, and current constraint.


## Objective

To provide a metrics framework that helps identify, track, and act on the right marketing metrics for your specific business model and stage.

## 1. The Metrics Hierarchy

### North Star Metric
One metric that best captures the core value your product delivers to customers.

| Business Model | Example North Star |
|----------------|-------------------|
| **Info-Products** | Active students completing modules |
| **SaaS** | Weekly active users |
| **Services** | Client satisfaction score |
| **Creator** | Engaged subscribers |
| **Memberships** | Monthly active members |

**Principle:** Everything else ladders up to this. If the North Star is healthy, the business is healthy.

### Primary Metrics
3-5 metrics that directly drive the North Star:

- **Acquisition:** How many people are entering the funnel?
- **Activation:** How many are experiencing core value?
- **Revenue:** How much are we earning?
- **Retention:** How many are staying?
- **Referral:** How many are bringing others?

### Secondary Metrics
Diagnostic metrics that explain the primary metrics:
- Conversion rates at each funnel stage
- Engagement rates on content
- Email open and click rates
- Traffic by source

---

## 2. Metrics by Business Model

### Info-Products Metrics

| Stage | Metric | Benchmark |
|-------|--------|-----------|
| **Awareness** | Traffic, impressions, reach | Varies by channel |
| **Lead** | Opt-in rate | 20-40% (warm), 2-5% (cold) |
| **Nurture** | Email open rate | 25-40% |
| **Conversion** | Sales page conversion | 2-10% (varies by price) |
| **Delivery** | Course completion rate | 15% (self-paced), 80%+ (cohort) |
| **Retention** | Refund rate | <5% |
| **Expansion** | Tier-up rate | 5-15% |

### SaaS Metrics

| Stage | Metric | Benchmark |
|-------|--------|-----------|
| **Awareness** | Traffic, MQLs | Varies |
| **Trial** | Trial starts | Track conversion from traffic |
| **Activation** | Time to first value | As short as possible |
| **Conversion** | Trial-to-paid rate | 15-25% (freemium), 40-60% (trial) |
| **Revenue** | MRR/ARR, ARPU | Model-specific |
| **Retention** | Monthly churn rate | <5% for SMB, <2% for enterprise |
| **Expansion** | Net revenue retention | 100%+ (expansion > churn) |

### Services Metrics

| Stage | Metric | Benchmark |
|-------|--------|-----------|
| **Pipeline** | Leads per month | Capacity-based |
| **Qualification** | Qualified rate | 20-40% |
| **Proposal** | Proposals sent rate | 50-70% of qualified |
| **Close** | Close rate | 25-50% |
| **Delivery** | Client satisfaction | NPS 50+ |
| **Retention** | Repeat/retainer rate | 40-60% |
| **Referral** | Referral rate | Track |

### Creator Metrics

| Stage | Metric | Benchmark |
|-------|--------|-----------|
| **Reach** | Followers, subscribers | Platform-specific |
| **Engagement** | Engagement rate | 2-5%+ |
| **Capture** | Email conversion | 2-5% of audience |
| **Revenue** | Revenue per subscriber | $1-5+/month target |
| **Retention** | Audience churn | Platform-specific |
| **Monetization** | Revenue mix | Track by stream |

---

## 3. Funnel Stage Metrics

### Top of Funnel (TOFU)
**Question:** Are we attracting the right people?

| Metric | What It Tells You |
|--------|-------------------|
| **Traffic** | Volume of potential prospects |
| **Traffic Source** | Which channels are working |
| **Bounce Rate** | Is content relevant to visitors? |
| **Engagement** | Are they paying attention? |
| **Cost Per Click** | Efficiency of paid acquisition |

### Middle of Funnel (MOFU)
**Question:** Are we building trust and shifting beliefs?

| Metric | What It Tells You |
|--------|-------------------|
| **Opt-in Rate** | Is lead magnet compelling? |
| **Email Open Rate** | Is subject line + relationship working? |
| **Email Click Rate** | Is content driving action? |
| **Content Consumption** | Are they engaging deeply? |
| **Webinar Show Rate** | Did we build enough anticipation? |

### Bottom of Funnel (BOFU)
**Question:** Are we converting interest to purchase?

| Metric | What It Tells You |
|--------|-------------------|
| **Sales Page Conversion** | Is the offer compelling? |
| **Cart Abandonment** | Where is friction? |
| **Close Rate** | Is sales process effective? |
| **Average Order Value** | Is value stack working? |
| **Cost Per Acquisition** | Are we acquiring profitably? |

### Post-Purchase
**Question:** Are we delivering and expanding?

| Metric | What It Tells You |
|--------|-------------------|
| **Refund Rate** | Did we over-promise? |
| **Completion Rate** | Did we deliver value? |
| **NPS/Satisfaction** | Would they recommend? |
| **Tier-Up Rate** | Are they ascending? |
| **LTV** | Total value of a customer |

---

## 4. Leading vs. Lagging Indicators

### Lagging Indicators
What happened. Historical. Hard to change in the moment.
- Revenue
- Customer count
- Churn rate
- LTV

### Leading Indicators
What will happen. Predictive. Can be influenced now.
- Traffic trends
- Engagement rates
- Pipeline size
- Activation rates

**Principle:** Manage leading indicators; report lagging indicators.

---

## 5. Unit Economics

### Key Calculations

**Customer Acquisition Cost (CAC)**
```
CAC = Total Acquisition Spend / New Customers Acquired
```

**Lifetime Value (LTV)**
```
LTV = Average Revenue per Customer × Average Lifespan
```
or
```
LTV = ARPU / Churn Rate (for subscription)
```

**LTV:CAC Ratio**
```
LTV:CAC = LTV / CAC
Target: 3:1 or higher
```

**Payback Period**
```
Payback = CAC / Monthly Revenue per Customer
Target: <12 months
```

### The Math That Matters
```
Profit = LTV - CAC - Cost of Delivery

If LTV > CAC + Delivery Cost, scale.
If LTV < CAC + Delivery Cost, fix before scaling.
```

---

## 6. Cohort Analysis

### Why Cohorts Matter
Aggregate metrics hide trends. Cohorts reveal:
- Is retention improving or degrading?
- Are new cohorts performing better than old?
- When do customers churn?

### Cohort Types
- **Time-based:** Customers who joined in January vs. February
- **Source-based:** Customers from paid vs. organic
- **Behavior-based:** Customers who completed onboarding vs. didn't

### Reading Cohort Tables
| Cohort | Month 0 | Month 1 | Month 2 | Month 3 |
|--------|---------|---------|---------|---------|
| Jan | 100% | 80% | 70% | 65% |
| Feb | 100% | 82% | 72% | 68% |
| Mar | 100% | 85% | 75% | ? |

**Insight:** Retention is improving month-over-month.

---

## 7. Dashboard Principles

### What to Include
- 1 North Star metric
- 3-5 Primary metrics
- Key leading indicators
- Period-over-period comparisons

### What to Exclude
- Vanity metrics (followers without engagement context)
- Too many metrics (more than 10 creates noise)
- Metrics you can't act on

### Review Rhythm
| Frequency | Review |
|-----------|--------|
| Daily | Leading indicators (traffic, engagement, sales) |
| Weekly | Funnel performance, conversion rates |
| Monthly | Unit economics, cohort trends |
| Quarterly | Strategic metrics, LTV:CAC, retention curves |

---

## 8. Common Metrics Mistakes

1. **Vanity Metrics:** Focusing on followers without conversion context
2. **Too Many Metrics:** Dashboard overload prevents action
3. **Lagging Only:** Only seeing results after it's too late
4. **No Segmentation:** Treating all customers the same
5. **Ignoring Cohorts:** Missing retention trends
6. **Optimizing Locally:** Improving one metric while hurting another
7. **Not Connecting to Revenue:** Metrics that don't ladder to business outcomes

---

## Quality Checks for Metrics

Before reporting or acting:

- [ ] Metric connects to business outcome
- [ ] Benchmark or comparison available
- [ ] Time period is appropriate
- [ ] Segmentation is useful (not too granular)
- [ ] Action can be taken based on result
- [ ] Leading and lagging indicators balanced

---

