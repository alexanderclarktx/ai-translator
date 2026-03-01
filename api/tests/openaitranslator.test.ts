import { describe, expect, test } from "bun:test"
import { OpenAiTranslator } from "../src/translate/OpenAiTranslator"

const integrationTest = process.env.OPENAI_API_KEY ? test : test.skip

describe("OpenAiTranslator.getAudio", () => {
  integrationTest("returns an audio blob from the realtime websocket", async () => {
    const translator = OpenAiTranslator()
    const audio = await translator.getAudio("hello")

    expect(audio).toBeInstanceOf(Blob)
    expect(audio.type).toBe("audio/wav")
    expect(audio.size).toBeGreaterThan(0)
  })
})
