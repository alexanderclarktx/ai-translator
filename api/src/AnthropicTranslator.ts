type AnthropicMessageContentBlock = {
  type: string
  text?: string
}

type AnthropicMessageResponse = {
  content?: AnthropicMessageContentBlock[]
  error?: {
    message?: string
  }
}

type TranslationStructuredOutput = {
  translation: string
}

export type AnthropicTranslator = {
  translate: (text: string, targetLanguage: string) => Promise<string>
}

const translationOutputSchema = {
  type: "object",
  properties: {
    translation: {
      type: "string",
      description: "The translated text only, with no explanation"
    }
  },
  required: ["translation"],
  additionalProperties: false
} as const

const parseStructuredTranslation = (content?: AnthropicMessageContentBlock[]) => {
  const rawJson = content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text || "")
    .join("")
    .trim()

  if (!rawJson) {
    throw new Error("Anthropic returned an empty structured response")
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(rawJson)
  } catch {
    throw new Error("Anthropic returned invalid structured JSON")
  }

  const translation =
    parsed &&
    typeof parsed === "object" &&
    "translation" in parsed &&
    typeof parsed.translation === "string"
      ? parsed.translation.trim()
      : ""

  if (!translation) {
    throw new Error("Anthropic structured response missing 'translation'")
  }

  return {
    translation
  } satisfies TranslationStructuredOutput
}

const createTranslate =
  (): AnthropicTranslator["translate"] => async (text, targetLanguage) => {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY")
    }

    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6"
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 64,
        system:
          "You are a translation engine. Translate accurately and preserve meaning, tone, and formatting where possible.",
        messages: [
          {
            role: "user",
            content: `Translate the following text to ${targetLanguage}:\n\n${text}`
          }
        ],
        output_config: {
          format: {
            type: "json_schema",
            schema: translationOutputSchema
          }
        }
      })
    })

    const data = (await response.json()) as AnthropicMessageResponse

    if (!response.ok) {
      throw new Error(data.error?.message || "Anthropic request failed")
    }

    const translatedText = parseStructuredTranslation(data.content).translation

    if (!translatedText) {
      throw new Error("Anthropic returned an empty translation")
    }

    return translatedText
  }

export const AnthropicTranslator = (): AnthropicTranslator => {
  return {
    translate: createTranslate()
  }
}
