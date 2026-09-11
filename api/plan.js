const ALLOWED_INTERESTS = [
  'beaches',
  'food',
  'history',
  'culture',
  'nature',
  'adventure',
  'shopping',
  'nightlife',
  'museums',
  'temples',
  'wildlife',
  'photography',
  'architecture',
  'spiritual',
  'hiking',
  'water sports',
  'local experiences',
  'markets',
  'art',
  'relaxation',
]

function parseInterests(value) {
  const interests = String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  if (!interests.length) {
    return {
      valid: true,
      values: ['general sightseeing'],
    }
  }

  const invalid = interests.filter(
    (interest) =>
      !ALLOWED_INTERESTS.some(
        (allowed) =>
          allowed === interest ||
          allowed.includes(interest) ||
          interest.includes(allowed)
      )
  )

  if (invalid.length) {
    return {
      valid: false,
      invalid,
    }
  }

  return {
    valid: true,
    values: interests,
  }
}

async function validateDestination(destination) {
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: destination,
      format: 'json',
      addressdetails: '1',
      limit: '5',
    })

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Smart-Country-Explorer/1.0',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Location validation service is unavailable')
  }

  const results = await response.json()

  if (!Array.isArray(results) || !results.length) {
    return null
  }

  const validResult = results.find((result) => {
    const type = String(result.type || '').toLowerCase()

    return [
      'country',
      'state',
      'city',
      'town',
      'village',
      'municipality',
      'administrative',
      'county',
      'suburb',
      'district',
    ].includes(type)
  })

  return validResult || results[0]
}

function buildPrompt({
  destination,
  location,
  numberOfDays,
  budgetAmount,
  numberOfTravellers,
  travelType,
  interests,
}) {
  const budgetPerDay = Math.floor(budgetAmount / numberOfDays)
  const budgetPerTraveller = Math.floor(
    budgetAmount / numberOfTravellers
  )

  return `Create a practical, realistic and budget-aware travel itinerary.

VERIFIED DESTINATION:
- User entered: ${destination}
- Verified location: ${location}

TRIP DETAILS:
- Days: ${numberOfDays}
- TOTAL budget: ₹${budgetAmount}
- Travellers: ${numberOfTravellers}
- Approximate total budget per day: ₹${budgetPerDay}
- Approximate budget per traveller: ₹${budgetPerTraveller}
- Travel type: ${travelType}
- Interests: ${interests.join(', ')}

STRICT RULES:

1. ₹${budgetAmount} is the TOTAL budget for ALL ${numberOfTravellers} travellers for the complete trip.
2. Never treat the budget as a daily budget.
3. Plan the trip according to the actual available budget.
4. Consider accommodation, food, local transportation and activities.
5. Low budget means free or inexpensive activities.
6. Higher budget can allow better accommodation, food, transportation and paid activities.
7. Consider the number of travellers when estimating costs.
8. Keep estimated spending within ₹${budgetAmount} whenever realistically possible.
9. Never pretend an unrealistic budget is sufficient.
10. If the budget is extremely low, such as ₹1, clearly state that the budget is insufficient for a complete trip and recommend only genuinely free activities.
11. Do not invent free admission.
12. Do not invent attractions or places.
13. Use the selected interests when they are suitable for the destination.
14. If an interest is not suitable for the destination, clearly mention this and suggest a suitable alternative.
15. Do not recommend activities that clearly exceed the total budget.
16. Recommendations must be appropriate for the verified destination.
17. The itinerary quality must change according to the available budget.

Return ONLY valid JSON.

Use exactly this structure:

{
  "destination": "string",
  "summary": "string",
  "budget": {
    "total": ${budgetAmount},
    "estimated_spending": 0,
    "currency": "INR",
    "budget_status": "within_budget"
  },
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

Possible budget_status values:
- "within_budget"
- "tight_budget"
- "insufficient_budget"

Include approximate costs in activities when useful.

Return JSON only.`
}

async function callGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing')
  }

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:
          process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        temperature: 0.2,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'system',
            content:
              'You are a realistic and budget-aware travel planning assistant. Return valid JSON only. Never invent locations. Respect the verified destination, budget and number of travellers.',
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
    throw new Error('Groq request failed')
  }

  const content =
    data?.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Groq returned an empty response')
  }

  return JSON.parse(content)
}

async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing')
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              destination: {
                type: 'STRING',
              },
              summary: {
                type: 'STRING',
              },
              budget: {
                type: 'OBJECT',
                properties: {
                  total: {
                    type: 'NUMBER',
                  },
                  estimated_spending: {
                    type: 'NUMBER',
                  },
                  currency: {
                    type: 'STRING',
                  },
                  budget_status: {
                    type: 'STRING',
                  },
                },
                required: [
                  'total',
                  'estimated_spending',
                  'currency',
                  'budget_status',
                ],
              },
              days: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    day: {
                      type: 'INTEGER',
                    },
                    title: {
                      type: 'STRING',
                    },
                    activities: {
                      type: 'ARRAY',
                      items: {
                        type: 'STRING',
                      },
                    },
                  },
                  required: [
                    'day',
                    'title',
                    'activities',
                  ],
                },
              },
            },
            required: [
              'destination',
              'summary',
              'budget',
              'days',
            ],
          },
        },
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    console.error('Gemini error:', data)
    throw new Error('Gemini request failed')
  }

  const content =
    data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('Gemini returned an empty response')
  }

  return JSON.parse(content)
}

function validatePlan(plan, numberOfDays, budgetAmount) {
  if (
    !plan ||
    typeof plan !== 'object' ||
    !Array.isArray(plan.days) ||
    plan.days.length !== numberOfDays
  ) {
    return false
  }

  if (!plan.destination || !plan.summary) {
    return false
  }

  if (
    !plan.budget ||
    typeof plan.budget !== 'object'
  ) {
    return false
  }

  if (Number(plan.budget.total) !== budgetAmount) {
    return false
  }

  if (
    !Number.isFinite(
      Number(plan.budget.estimated_spending)
    )
  ) {
    return false
  }

  for (const day of plan.days) {
    if (
      !day ||
      typeof day.day !== 'number' ||
      !day.title ||
      !Array.isArray(day.activities) ||
      !day.activities.length
    ) {
      return false
    }
  }

  return true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    })
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

    const cleanDestination =
      String(destination || '').trim()

    const cleanInterests =
      String(interests || '').trim()

    const cleanTravelType =
      String(travelType || '').trim()

    const numberOfDays = Number(days)
    const numberOfTravellers = Number(travellers)

    const cleanBudget =
      String(budget || '').trim()

    const budgetAmount = Number(
      cleanBudget.replace(/[₹,\s]/g, '')
    )

    if (
      !cleanDestination ||
      !days ||
      !budget ||
      !travellers ||
      !cleanTravelType
    ) {
      return res.status(400).json({
        message:
          'Please fill all required trip details',
      })
    }

    if (
      cleanDestination.length > 100 ||
      cleanInterests.length > 200
    ) {
      return res.status(400).json({
        message: 'Invalid trip details',
      })
    }

    if (
      !Number.isInteger(numberOfDays) ||
      numberOfDays < 1 ||
      numberOfDays > 14
    ) {
      return res.status(400).json({
        message: 'Days must be between 1 and 14',
      })
    }

    if (
      !Number.isInteger(numberOfTravellers) ||
      numberOfTravellers < 1 ||
      numberOfTravellers > 20
    ) {
      return res.status(400).json({
        message:
          'Travellers must be between 1 and 20',
      })
    }

    if (
      !Number.isFinite(budgetAmount) ||
      budgetAmount <= 0
    ) {
      return res.status(400).json({
        message:
          'Budget must be a valid amount greater than 0',
      })
    }

    if (budgetAmount > 10000000) {
      return res.status(400).json({
        message:
          'Budget cannot be more than ₹1 crore',
      })
    }

    const interestResult =
      parseInterests(cleanInterests)

    if (!interestResult.valid) {
      return res.status(400).json({
        message:
          `Unsupported interest: ${interestResult.invalid.join(
            ', '
          )}. Try beaches, food, history, culture, nature, adventure, shopping, nightlife, museums, wildlife or photography.`,
      })
    }

    let location

    try {
      location =
        await validateDestination(
          cleanDestination
        )
    } catch (error) {
      console.error(
        'Location validation error:',
        error
      )

      return res.status(503).json({
        message:
          'Unable to verify the destination right now. Please try again.',
      })
    }

    if (!location) {
      return res.status(400).json({
        message:
          `"${cleanDestination}" could not be verified as a real country, state, city or place. Please enter a valid destination.`,
      })
    }

    const verifiedLocation =
      location.display_name ||
      cleanDestination

    const prompt = buildPrompt({
      destination: cleanDestination,
      location: verifiedLocation,
      numberOfDays,
      budgetAmount,
      numberOfTravellers,
      travelType: cleanTravelType,
      interests: interestResult.values,
    })

    let plan
    let provider = 'groq'

    try {
      plan = await callGroq(prompt)

      if (
        !validatePlan(
          plan,
          numberOfDays,
          budgetAmount
        )
      ) {
        throw new Error(
          'Groq returned an invalid plan'
        )
      }
    } catch (groqError) {
      console.error(
        'Groq failed. Falling back to Gemini:',
        groqError
      )

      provider = 'gemini'

      try {
        plan = await callGemini(prompt)

        if (
          !validatePlan(
            plan,
            numberOfDays,
            budgetAmount
          )
        ) {
          throw new Error(
            'Gemini returned an invalid plan'
          )
        }
      } catch (geminiError) {
        console.error(
          'Gemini fallback failed:',
          geminiError
        )

        return res.status(502).json({
          message:
            'Trip planning service is temporarily unavailable. Please try again.',
        })
      }
    }

    return res.status(200).json({
      plan,
      provider,
      verifiedLocation,
    })
  } catch (error) {
    console.error(
      'Plan error:',
      error
    )

    return res.status(500).json({
      message:
        'Unable to generate the trip plan',
    })
  }
}