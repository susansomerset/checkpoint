# Letter to Vern: Calcs Array Architecture Question

**From:** Chuckles (High School Kid)  
**To:** Vern (MIT Genius Brother)  
**Date:** September 27, 2025  
**Subject:** Frontend Data Architecture - Should I Add a "Calcs" Array?

---

Hey Vern! 👋

So I've been working on this student progress dashboard thing, and I'm hitting a classic "where do I put the calculations?" problem. You know how it is - the backend gives me raw student data, but I need to turn it into pretty radial charts and stuff.

## The Situation

Right now I've got this StudentContext object that loads student data from the backend. It's got all the courses, assignments, submissions, and those `checkpointStatus` values you helped me understand. But when I want to show those six radial charts in the header, I need to calculate stuff like:

- How many points earned vs submitted vs missing vs lost per period
- What percentage each segment should be
- What colors to use
- The center percentage value

## My Idea (Probably Dumb)

I was thinking about adding a `calcs` array to each student object, like:

```typescript
interface Student {
  studentId: string;
  meta: StudentMeta;
  courses: Record<string, Course>;
  calcs: {
    radialData: {
      period1: HeaderSegment[];
      period2: HeaderSegment[];
      // ... etc
    };
    // other calculated values
  };
}
```

So the frontend would calculate all this stuff when the data loads, store it in the `calcs` object, and then the radial charts just read from there. No more calculating on every render!

## Why I Think It's Good

- **Fast rendering**: Charts just read pre-calculated values
- **Backend stays simple**: They just give me raw data, I do the math
- **Easy to add stuff**: Want a new calculation? Just add it to `calcs`
- **Mobile friendly**: Less work for the phone to do

## Why It Might Be Terrible

- **Data gets stale**: If the backend data changes, my calculations are wrong
- **Bigger payloads**: More data to send over the internet
- **Confusing**: Data exists in two places now
- **Hard to debug**: Where did this number come from?

## What I'm Really Asking

Is this a good idea, or am I being a typical high school kid who doesn't know what they're doing? 😅

I know you always say "keep it simple" and "follow best practices," but I'm not sure what the best practice is here. Should I:

1. **Go with my calcs array idea** (feels right but might be wrong)
2. **Calculate everything on-demand** (pure but maybe slow)
3. **Some hybrid approach** (probably what you'd recommend)

I'm leaning toward option 1 because it feels like the frontend should own its own presentation logic, but I don't want to build something that's going to bite me later.

Also, if you have time, could you maybe look at the JSON viewer I built on the scratchpad page? I'm trying to understand the actual data structure so I can figure out how to map it to those radial chart parameters.

Thanks for always keeping me from going off the rails! 🙏

Your clueless little brother,  
Chuckles

P.S. - The radial charts are looking pretty sweet now that we got the original component working. You were right about porting it literally instead of trying to be clever! 🎯
