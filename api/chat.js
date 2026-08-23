export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { message, conversation = [] } = req.body || {};

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing");

            return res.status(500).json({
                error: "GEMINI_API_KEY is not configured in Vercel."
            });
        }

        const model = "gemini-3.6-flash";

        const systemInstruction = `
أنت Shaheen AI، مساعد ذكاء اصطناعي حديث واحترافي.

اسمك Shaheen AI.

أسلوبك:
- ذكي
- واضح
- سريع
- احترافي
- ودود
- لا تكرر نفسك
- افهم سياق المحادثة
- أجب باللغة التي يستخدمها المستخدم
- إذا كان المستخدم يتحدث بالعربية فأجب بالعربية
- إذا طلب المستخدم كودًا، قدم كودًا منظمًا وقابلًا للاستخدام
- لا تدّعي أنك نفذت شيئًا لم تنفذه
- لا تخترع معلومات عندما لا تعرف الإجابة

اجعل إجاباتك مفيدة ومباشرة.
`;

        const contents = [];

        if (Array.isArray(conversation)) {
            for (const item of conversation) {
                if (!item || !item.content) continue;

                contents.push({
                    role: item.role === "ai" ? "model" : "user",
                    parts: [
                        {
                            text: String(item.content)
                        }
                    ]
                });
            }
        }

        contents.push({
            role: "user",
            parts: [
                {
                    text: message
                }
            ]
        });

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        console.log("Calling Gemini model:", model);

        const geminiResponse = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: systemInstruction
                        }
                    ]
                },

                contents,

                generationConfig: {
                    maxOutputTokens: 4096
                }
            })
        });

        const responseText = await geminiResponse.text();

        let geminiData;

        try {
            geminiData = JSON.parse(responseText);
        } catch {
            geminiData = {
                raw: responseText
            };
        }

        if (!geminiResponse.ok) {
            console.error(
                "Gemini HTTP Error:",
                geminiResponse.status,
                geminiData
            );

            return res.status(500).json({
                error:
                    geminiData?.error?.message ||
                    `Gemini API returned HTTP ${geminiResponse.status}`
            });
        }

        const reply = geminiData
            ?.candidates?.[0]
            ?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!reply) {
            console.error(
                "Gemini empty response:",
                geminiData
            );

            return res.status(502).json({
                error: "Gemini returned an empty response."
            });
        }

        return res.status(200).json({
            reply,
            model
        });

    } catch (error) {
        console.error(
            "Shaheen Server Error:",
            error
        );

        return res.status(500).json({
            error: error?.message ||
                "حدث خطأ داخلي في Shaheen AI."
        });
    }
}
