# Experimentation: Testing What Works

**Core Insight:** Marketing improvement comes from systematic testing, not guessing. But bad testing wastes resources on insignificant results. Focus on high-impact tests with clear hypotheses and statistical validity.


## Objective

To provide a framework for running marketing experiments that produce reliable, actionable results.

## 1. The Testing Mindset

### Why Test?
- **Assumptions are often wrong:** Even experts are right only 50-70% of the time
- **Context matters:** What works elsewhere may not work here
- **Continuous improvement:** Small gains compound over time
- **Risk reduction:** Test before scaling

### The Testing Loop
```
Hypothesis → Test Design → Run Test → Analyze → Implement or Iterate
```

---

## 2. What to Test (Prioritization)

### The ICE Framework
Prioritize tests by:

| Factor | Question | Score (1-10) |
|--------|----------|--------------|
| **Impact** | How much will this move the needle? | |
| **Confidence** | How sure are we it will work? | |
| **Ease** | How easy is it to implement and measure? | |

**Score = Impact × Confidence × Ease**

Test highest scores first.

### High-Impact Test Areas

| Area | What to Test | Typical Impact |
|------|--------------|----------------|
| **Headlines** | Different hooks, angles, promises | 10-50% lift |
| **Offers** | Price, bonuses, guarantees | 20-100% lift |
| **CTAs** | Button text, placement, design | 5-20% lift |
| **Lead Magnets** | Topic, format, delivery | 20-50% lift |
| **Email Subject Lines** | Hook types, personalization | 10-30% lift |
| **Landing Page Structure** | Above fold content, social proof | 10-40% lift |

### Low-Priority (Usually)
- Button colors (unless egregiously bad)
- Minor copy tweaks
- Image swaps (unless radically different)
- Font changes

---

## 3. Hypothesis Formation

### Structure
```
If we [change X], then [metric Y] will [increase/decrease] by [estimated amount]
because [reasoning based on psychology or data].
```

### Examples
- "If we add urgency to the headline, conversion rate will increase by 15% because scarcity creates action."
- "If we shorten the opt-in form to email only, opt-in rate will increase by 20% because we're reducing friction."
- "If we add a video testimonial above the fold, sales page conversion will increase by 10% because social proof builds trust."

### Good Hypothesis Criteria
- [ ] Specific and testable
- [ ] Based on data or psychology, not gut
- [ ] Measurable outcome defined
- [ ] Timeframe realistic

---

## 4. Test Design

### A/B Testing Basics
- **Control (A):** Current version
- **Variant (B):** Changed version
- **Random Assignment:** Visitors randomly see A or B
- **Single Variable:** Change only one thing per test

### Sample Size
Minimum sample needed depends on:
- Current conversion rate
- Minimum detectable effect (how small a change matters)
- Statistical confidence level (typically 95%)

**Rule of Thumb:** 
```
For a 10% lift detection at 95% confidence:
~1,000 conversions per variant (for ~10% conversion rate)
~400 conversions per variant (for ~25% conversion rate)
```

Use a sample size calculator for precision.

### Test Duration
- Run until sample size is reached
- Minimum 7 days (captures weekly patterns)
- Maximum 4-6 weeks (avoid data decay)
- Don't peek and stop early (leads to false positives)

---

## 5. Statistical Validity

### Key Concepts

**Statistical Significance**
The probability that the result is not due to chance.
- 95% confidence = 5% chance it's random
- 99% confidence = 1% chance it's random

**P-Value**
Probability of seeing this result if there was no real difference.
- p < 0.05 = statistically significant at 95%

**Confidence Interval**
Range where the true effect likely falls.
- "Conversion increased 15% ± 5%" = likely between 10-20%

### Common Mistakes
1. **Stopping early:** Checking daily and stopping at first significance
2. **Too small sample:** Results are noise, not signal
3. **Multiple comparisons:** Testing many things inflates false positive rate
4. **Ignoring segments:** Overall winner may lose in key segments

---

## 6. Test Types

### Split URL Testing
- Different URLs for control and variant
- Good for major page changes
- Easier to implement

### On-Page A/B Testing
- Same URL, dynamic content changes
- Good for element-level testing
- Requires testing tool

### Multivariate Testing
- Test multiple elements simultaneously
- Requires much larger sample
- Shows interaction effects

### Sequential Testing
- Test one thing, implement, test next
- Lower sample requirements
- Slower overall, but more reliable

---

## 7. Beyond A/B: Other Test Types

### Pre/Post Testing
Compare metrics before and after a change.
- **Pro:** No sample splitting needed
- **Con:** External factors can confuse results

### Holdout Testing
Exclude a small group from a change to measure impact.
- Useful for measuring campaign lift
- Requires longer timeframes

### Qualitative Testing
- User interviews and surveys
- Session recordings
- Heatmaps and click tracking
- Generates hypotheses for A/B tests

---

## 8. Acting on Results

### If Winner is Clear
1. Implement winning variant
2. Document the learning
3. Move to next test

### If No Winner
1. Result is still useful (learned what doesn't matter)
2. Consider testing bigger changes
3. Move to next test

### If Results Are Mixed
- Check segment-level performance
- Consider external factors
- May need to retest with larger sample

### Documentation
For every test, record:
- Hypothesis
- What was changed
- Sample size and duration
- Result with confidence level
- Learning and next steps

---

## 9. Testing Culture

### Principles
- **Always be testing:** One test ends, another begins
- **Big swings first:** Test transformational changes before incremental
- **Learn from losses:** Failed tests are still valuable data
- **Share learnings:** Document and distribute what you learn
- **Don't over-optimize:** Diminishing returns are real

### Testing Velocity
| Maturity | Tests per Month |
|----------|-----------------|
| Starting | 1-2 |
| Growing | 4-8 |
| Mature | 8-20+ |

---

## Quality Checks for Experiments

Before running:

- [ ] Clear hypothesis with expected outcome
- [ ] Single variable being tested
- [ ] Sample size calculated
- [ ] Duration planned (no peeking)
- [ ] Success metric defined
- [ ] Segments identified

After completing:

- [ ] Statistical significance confirmed
- [ ] Result documented
- [ ] Learning captured
- [ ] Next test identified

---

