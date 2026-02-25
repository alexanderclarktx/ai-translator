import {
  formatUptime, TranslateWsClientMessage, TranslateWsServerMessage
} from "@template/core"
import { AnthropicTranslator } from "./AnthropicTranslator"

type TranslateRequestBody = {
  text: string
  targetLanguage: string
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
}

const createJsonResponse = (data: unknown, status = 200) => {
  return Response.json(data, {
    status,
    headers: corsHeaders
  })
}

const createTextResponse = (text: string, status = 200) => {
  return new Response(text, {
    status,
    headers: corsHeaders
  })
}

const sendWsMessage = (
  ws: Bun.ServerWebSocket<undefined>,
  message: TranslateWsServerMessage
) => {
  ws.send(JSON.stringify(message))
}

const logServerError = (context: string, error: unknown) => {
  if (error instanceof Error) {
    console.error(`[api] ${context}: ${error.message}`)

    if (error.stack) {
      console.error(error.stack)
    }

    return
  }

  console.error(`[api] ${context}:`, error)
}

const parseTranslateRequest = async (request: Request) => {
  const body = (await request.json()) as Partial<TranslateRequestBody>
  const text = typeof body.text === "string" ? body.text.trim() : ""
  const targetLanguage =
    typeof body.targetLanguage === "string" ? body.targetLanguage.trim() : ""

  return {
    text,
    targetLanguage
  }
}

const normalizeTranslateInput = (
  text: unknown,
  targetLanguage: unknown
) => {
  const normalizedText = typeof text === "string" ? text.trim() : ""
  const normalizedTargetLanguage =
    typeof targetLanguage === "string" ? targetLanguage.trim() : ""

  return {
    text: normalizedText,
    targetLanguage: normalizedTargetLanguage
  }
}

const parseTranslateWsMessage = (
  rawMessage: unknown
):
  | {
      error: string
    }
  | {
      requestId: string
      text: string
      targetLanguage: string
    } => {
  if (!rawMessage || typeof rawMessage !== "object") {
    return {
      error: "Invalid websocket message"
    }
  }

  const message = rawMessage as Partial<TranslateWsClientMessage>

  if (message.type !== "translate.request") {
    return {
      error: "Unsupported websocket message type"
    }
  }

  if (typeof message.requestId !== "string" || !message.requestId.trim()) {
    return {
      error: "Websocket message must include a non-empty 'requestId' string"
    }
  }

  const { text, targetLanguage } = normalizeTranslateInput(
    message.text,
    message.targetLanguage
  )

  if (!text) {
    return {
      error: "Websocket message must include a non-empty 'text' string"
    }
  }

  if (!targetLanguage) {
    return {
      error: "Websocket message must include a non-empty 'targetLanguage' string"
    }
  }

  return {
    requestId: message.requestId.trim(),
    text,
    targetLanguage
  }
}

const parseWsJsonMessage = (message: string | Uint8Array | Buffer) => {
  const rawText =
    typeof message === "string" ? message : Buffer.from(message).toString("utf8")

  return JSON.parse(rawText)
}

export const createApiServer = () => {
  const anthropicTranslator = AnthropicTranslator()
  const server = Bun.serve({
    port: 5001,
    async fetch(request, serverInstance) {
      const url = new URL(request.url)

      if (request.method === "OPTIONS") {
        return createTextResponse("", 204)
      }

      if (url.pathname === "/api") {
        return createJsonResponse({
          status: "ok",
          uptime: formatUptime(process.uptime())
        })
      }

      if (url.pathname === "/api/ws") {
        const upgraded = serverInstance.upgrade(request)

        if (upgraded) {
          return
        }

        return createTextResponse("WebSocket upgrade failed", 400)
      }

      if (url.pathname === "/api/translate" && request.method === "POST") {
        try {
          const { text, targetLanguage } = await parseTranslateRequest(request)

          if (!text) {
            return createJsonResponse(
              {
                error: "Request body must include a non-empty 'text' string"
              },
              400
            )
          }

          if (!targetLanguage) {
            return createJsonResponse(
              {
                error:
                  "Request body must include a non-empty 'targetLanguage' string"
              },
              400
            )
          }

          const translatedText = await anthropicTranslator.translate(
            text,
            targetLanguage
          )

          return createJsonResponse({
            text: translatedText
          })
        } catch (error) {
          logServerError(`${request.method} ${url.pathname}`, error)

          const message =
            error instanceof Error ? error.message : "Translation failed"

          return createJsonResponse(
            {
              error: message
            },
            500
          )
        }
      }

      return createTextResponse("Not Found", 404)
    },
    websocket: {
      open(ws) {
        sendWsMessage(ws, {
          type: "ready"
        })
      },
      async message(ws, message) {
        let parsedJson: unknown

        try {
          parsedJson = parseWsJsonMessage(message)
        } catch (error) {
          logServerError("WS parse", error)
          sendWsMessage(ws, {
            type: "translate.error",
            error: "Invalid JSON message"
          })
          return
        }

        const parsedMessage = parseTranslateWsMessage(parsedJson)

        if ("error" in parsedMessage) {
          sendWsMessage(ws, {
            type: "translate.error",
            error: parsedMessage.error
          })
          return
        }

        try {
          const translatedText = await anthropicTranslator.translate(
            parsedMessage.text,
            parsedMessage.targetLanguage
          )

          sendWsMessage(ws, {
            type: "translate.success",
            requestId: parsedMessage.requestId,
            text: translatedText
          })
        } catch (error) {
          logServerError(`WS translate ${parsedMessage.requestId}`, error)

          const messageText =
            error instanceof Error ? error.message : "Translation failed"

          sendWsMessage(ws, {
            type: "translate.error",
            requestId: parsedMessage.requestId,
            error: messageText
          })
        }
      }
    }
  })

  console.log(`API server running at ${server.hostname}:${server.port}`)

  return server
}

createApiServer()
