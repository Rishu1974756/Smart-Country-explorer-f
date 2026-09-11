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

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        message: 'Groq API key is missing on the server',
      })
    }

    const prompt = `Create a practical travel itinerary in JSON for a trip to ${cleanDestination}.

Trip details:
- Days: ${numberOfDays}
- Budget: ${cleanBudget}
- Travellers: ${numberOfTravellers}
- Travel type: ${String(travelType).trim()}
- Interests: ${cleanInterests || 'general sightseeing'}

Return only JSON with this exact structure:

{
  "destination": "string",
  "summary": "short string",
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
Keep activities realistic, concise and suitable for the destination.
Do not include prices unless they are clearly estimates.`

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
                'You are a travel planning assistant. Return valid JSON only.',
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

    const plan = JSON.parse(content)

    if (
      !plan ||
      typeof plan !== 'object' ||
      !Array.isArray(plan.days) ||
      !plan.days.length
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
