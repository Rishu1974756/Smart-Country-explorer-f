export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      destination,
      days,
      budget,
      travellers,
      travelType,
      interests,
    } = req.body || {}

    const cleanDestination = String(destination || '').trim()
    const cleanInterests = String(interests || '').trim()
    const numberOfDays = Number(days)
    const numberOfTravellers = Number(travellers)
    const cleanBudget = String(budget || '').trim()
    const budgetAmount = Number(cleanBudget.replace(/[₹,\s]/g, ''))

    if (
      !cleanDestination ||
      !numberOfDays ||
      !cleanBudget ||
      !numberOfTravellers ||
      !String(travelType || '').trim()
    ) {
      return res.status(400).json({
        message: 'Please fill all trip details',
      })
    }

    if (cleanDestination.length > 100 || cleanInterests.length > 200) {
      return res.status(400).json({
        message: 'Invalid trip details',
      })
    }

    if (numberOfDays < 1 || numberOfDays > 14) {
      return res.status(400).json({
        message: 'Days must be between 1 and 14',
      })
    }

    if (numberOfTravellers < 1 || numberOfTravellers > 20) {
      return res.status(400).json({
        message: 'Travellers must be between 1 and 20',
      })
    }

    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      return res.status(400).json({
        message: 'Budget must be a valid amount greater than 0',
      })
    }

    if (budgetAmount > 10000000) {
      return res.status(400).json({
        message: 'Budget is too high',
      })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        message: 'Groq API key is missing on the server',
      })
    }

    const budgetPerDay = Math.floor(budgetAmount / numberOfDays)
    const budgetPerTraveller = Math.floor(
      budgetAmount / numberOfTravellers
    )

    const prompt = `Create a practical, realistic and budget-aware travel itinerary in JSON for a trip to ${cleanDestination}.

Trip details:
- Destination: ${cleanDestination}
- Number of days: ${numberOfDays}
- Total trip budget: ₹${budgetAmount}
- Number of travellers: ${numberOfTravellers}
- Approximate total budget per day: ₹${budgetPerDay}
- Approximate budget per traveller: ₹${budgetPerTraveller}
- Travel type: ${String(travelType).trim()}
- Interests: ${cleanInterests || 'general sightseeing'}

IMPORTANT BUDGET RULES:

1. The user's ₹${budgetAmount} budget is the TOTAL budget for the entire trip for all ${numberOfTravellers} traveller(s), not a daily budget.

2. The itinerary must be planned according to this budget.

3. Consider the major travel expenses:
   - Accommodation
   - Food
   - Local transportation
   - Activities and attractions

4. Do not recommend expensive hotels, restaurants, transportation or activities when they clearly do not fit the available budget.

5. For a low budget, prioritize:
   - Free attractions
   - Free sightseeing
   - Walking
   - Public transportation
   - Affordable local food
   - Low-cost activities

6. For a higher budget, recommendations can become more comfortable and include better accommodation, transportation, restaurants and paid activities when appropriate.

7. Consider the number of travellers when estimating expenses.

8. The estimated costs across the trip should stay within ₹${budgetAmount} whenever realistically possible.

9. Never pretend that an unrealistic budget is enough for a complete trip.

10. If the budget is extremely low, such as ₹1, clearly state in the summary that the budget is insufficient for a complete trip. In that case, only suggest genuinely free or nearly free activities and do not pretend that accommodation, transportation or paid attractions can be covered.

11. Do not invent free admission for attractions that normally require payment.

12. Do not recommend an activity simply because it is popular if it does not fit the user's budget.

13. The quality and type of itinerary must change according to the available budget.

14. Make the plan practical for the destination and the selected travel type.

Return only valid JSON with this exact structure:

{
  "destination": "string",
  "summary": "short string explaining the trip and budget suitability",
  "days": [
    {
      "day": 1,
      "title": "string",
      "activities": [
        "string",
        "string",
        "string"
      ]
    }
  ]
}

Create exactly ${numberOfDays} day entries.

Each activity should be concise and practical.

Include approximate costs in activities when useful, especially for:
- Transportation
- Food
- Accommodation
- Paid attractions
- Activities

When the budget is insufficient, clearly communicate that in the summary rather than creating unrealistic expenses.

Return JSON only. Do not include markdown, explanations outside JSON, or code fences.`

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          temperature: 0.4,
          response_format: {
            type: 'json_object',
          },
          messages: [
            {
              role: 'system',
              content:
                'You are a realistic, budget-aware travel planning assistant. Return valid JSON only. Always respect the user provided total budget and number of travellers.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Groq error:', data)

      return res.status(502).json({
        message: 'Unable to generate the trip plan',
      })
    }

    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      return res.status(502).json({
        message: 'The AI returned an empty response',
      })
    }

    let plan

    try {
      plan = JSON.parse(content)
    } catch (error) {
      console.error('Invalid AI JSON:', content)

      return res.status(502).json({
        message: 'The AI returned an invalid trip plan',
      })
    }

    if (
      !plan ||
      typeof plan !== 'object' ||
      !Array.isArray(plan.days) ||
      plan.days.length !== numberOfDays
    ) {
      return res.status(502).json({
        message: 'The AI returned an invalid trip plan',
      })
    }

    return res.status(200).json({ plan })
  } catch (error) {
    console.error('Plan error:', error)

    return res.status(500).json({
      message: 'Unable to generate the trip plan',
    })
  }
}