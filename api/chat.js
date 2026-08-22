/* =========================================================
   SHAHEEN AI
   GEMINI SERVERLESS API
   api/chat.js
========================================================= */


export default async function handler(req, res) {

    /*
       السماح فقط بطلبات POST
    */

    if (req.method !== "POST") {

        return res.status(405).json({

            error:
                "Method not allowed"

        });

    }


    try {

        /*
           قراءة البيانات القادمة من الموقع
        */

        const {

            message,

            conversation = []

        } = req.body || {};


        /*
           التحقق من الرسالة
        */

        if (
            !message ||
            typeof message !== "string"
        ) {

            return res.status(400).json({

                error:
                    "Message is required"

            });

        }


        /*
           API KEY

           لا تضع المفتاح هنا مباشرة.

           سيتم قراءته من:
           GEMINI_API_KEY
        */

        const apiKey =
            process.env.GEMINI_API_KEY;


        if (!apiKey) {

            console.error(
                "GEMINI_API_KEY is missing"
            );


            return res.status(500).json({

                error:
                    "Gemini API key is not configured."

            });

        }


        /*
           النموذج.

           اجعله في متغير مستقل حتى نستطيع
           تغييره بسهولة لاحقًا.
        */

        const model =
            process.env.GEMINI_MODEL ||
            "gemini-2.5-flash";


        /*
           تعليمات شخصية Shaheen AI
        */

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


        /*
           تحويل المحادثة إلى صيغة Gemini.
        */

        const contents = [];


        /*
           نضيف المحادثة السابقة
        */

        if (
            Array.isArray(conversation)
        ) {

            for (
                const item of conversation
            ) {

                if (
                    !item ||
                    !item.content
                ) {

                    continue;

                }


                /*
                   Gemini يستخدم:
                   user
                   model
                */

                const role =
                    item.role === "ai"
                        ? "model"
                        : "user";


                contents.push({

                    role: role,

                    parts: [

                        {
                            text:
                                String(
                                    item.content
                                )
                        }

                    ]

                });

            }

        }


        /*
           نضيف الرسالة الحالية.
        */

        contents.push({

            role: "user",

            parts: [

                {
                    text:
                        message
                }

            ]

        });


        /*
           استدعاء Gemini REST API
        */

        const geminiResponse =
            await fetch(

                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        systemInstruction: {

                            parts: [

                                {
                                    text:
                                        systemInstruction
                                }

                            ]

                        },

                        contents: contents,

                        generationConfig: {

                            maxOutputTokens:
                                4096

                        }

                    })

                }

            );


        /*
           قراءة رد Gemini
        */

        const geminiData =
            await geminiResponse.json();


        /*
           معالجة أخطاء Gemini
        */

        if (!geminiResponse.ok) {

            console.error(
                "Gemini API Error:",
                geminiData
            );


            return res.status(
                geminiResponse.status
            ).json({

                error:
                    geminiData?.error?.message ||
                    "Gemini API request failed."

            });

        }


        /*
           استخراج النص
        */

        const reply =
            geminiData
                ?.candidates?.[0]
                ?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();


        /*
           التأكد من وجود رد
        */

        if (!reply) {

            return res.status(502).json({

                error:
                    "Gemini returned an empty response."

            });

        }


        /*
           إرسال الرد إلى الواجهة
        */

        return res.status(200).json({

            reply: reply,

            model: model

        });


    } catch (error) {

        console.error(
            "Shaheen Server Error:",
            error
        );


        return res.status(500).json({

            error:
                "حدث خطأ داخلي في Shaheen AI."

        });

    }

}