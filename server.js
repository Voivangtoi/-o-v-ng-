require("dotenv").config();


const express =
    require("express");


const cors =
    require("cors");


const TelegramBot =
    require(
        "node-telegram-bot-api"
    );


const app =
    express();


app.use(
    express.json()
);


/*
Cho phép GitHub Pages gọi API.

Nếu muốn bảo mật hơn,
thay bằng domain GitHub Pages của bạn.
*/

app.use(
    cors({
        origin:true
    })
);


const PORT =
    process.env.PORT
    ||
    3000;


const BOT_TOKEN =
    process.env.TELEGRAM_BOT_TOKEN;


const WEB_APP_URL =
    process.env.WEB_APP_URL;


const LINK4M_API_KEY =
    process.env.LINK4M_API_KEY;


/* =========================
   KIỂM TRA TOKEN
========================= */

if (
    !BOT_TOKEN
) {

    console.error(
        "Thiếu TELEGRAM_BOT_TOKEN"
    );

}


/* =========================
   BOT
========================= */

const bot =
    new TelegramBot(

        BOT_TOKEN,

        {
            polling:true
        }

    );


console.log(
    "Telegram Bot đang chạy..."
);


/* =========================
   /START
========================= */

bot.onText(

    /^\/start(?:\s+(.+))?$/,

    async (
        msg,
        match
    ) => {

        try {

            const chatId =
                msg.chat.id;


            const startParam =
                match?.[1]
                ||
                null;


            await bot.sendMessage(

                chatId,

                `👋 Chào mừng bạn!

⛏️ Đào vàng
🎁 Làm nhiệm vụ
👥 Mời bạn bè
💰 Nhận thưởng

Nhấn nút bên dưới để mở game.`,

                {

                    reply_markup:{

                        inline_keyboard:[

                            [

                                {

                                    text:
                                        "🎮 MỞ GAME",

                                    web_app:{

                                        url:
                                            WEB_APP_URL

                                    }

                                }

                            ]

                        ]

                    }

                }

            );


            if (
                startParam
            ) {

                console.log(
                    "Referral:",
                    startParam
                );

            }

        }

        catch(error){

            console.error(
                "/start error:",
                error
            );

        }

    }

);


/* =========================
   /GAME
========================= */

bot.onText(

    /^\/game$/,

    async msg => {

        await bot.sendMessage(

            msg.chat.id,

            "🎮 Mở game:",

            {

                reply_markup:{

                    inline_keyboard:[

                        [

                            {

                                text:
                                    "🎮 MỞ GAME",

                                web_app:{

                                    url:
                                        WEB_APP_URL

                                }

                            }

                        ]

                    ]

                }

            }

        );

    }

);


/* =========================
   LẤY USERNAME NHÓM
========================= */

function extractChatUsername(
    taskLink
){

    if (
        typeof taskLink
        !==
        "string"
    ) {

        return null;

    }


    try {

        const url =
            new URL(
                taskLink
            );


        if (

            url.hostname
            !==
            "t.me"

            &&

            url.hostname
            !==
            "telegram.me"

        ) {

            return null;

        }


        const path =
            url.pathname
            .replace(
                /^\/+|\/+$/g,
                ""
            );


        if (

            !path

            ||

            path.startsWith(
                "+"
            )

        ) {

            return null;

        }


        return (
            "@"
            +
            path
            .split("/")
            [0]
        );

    }

    catch(error){

        return null;

    }

}


/* =========================
   KIỂM TRA THÀNH VIÊN
========================= */

function isMemberStatus(
    status
){

    return [

        "creator",

        "administrator",

        "member",

        "restricted"

    ].includes(
        status
    );

}


/* =========================
   API TASK VERIFY
========================= */

app.post(

    "/api/task-verify",

    async (
        req,
        res
    ) => {

        try {

            const {

                telegramId,

                taskLink

            } =
                req.body
                ||
                {};


            const userId =
                Number(
                    telegramId
                );


            const chatId =
                extractChatUsername(
                    taskLink
                );


            if (

                !Number.isFinite(
                    userId
                )

                ||

                userId <= 0

                ||

                !chatId

            ) {

                return res
                .status(400)
                .json({

                    verified:false,

                    message:
                        "Dữ liệu không hợp lệ."

                });

            }


            const member =
                await bot.getChatMember(

                    chatId,

                    userId

                );


            const status =
                member?.status;


            const verified =
                isMemberStatus(
                    status
                );


            return res.json({

                verified,

                status:
                    status
                    ||
                    null,

                message:

                    verified

                    ?

                    "Đã hoàn thành nhiệm vụ."

                    :

                    "Chưa hoàn thành nhiệm vụ."

            });

        }

        catch(error){

            console.error(
                "task verify error:",
                error.message
            );


            return res.json({

                verified:false,

                message:
                    "Chưa hoàn thành nhiệm vụ."

            });

        }

    }

);


/* =========================
   API LINK4M
========================= */

app.post(

    "/api/create-link",

    async (
        req,
        res
    ) => {

        try {

            if (

                !LINK4M_API_KEY

            ) {

                return res
                .status(500)
                .json({

                    success:false,

                    message:
                        "Chưa cấu hình LINK4M_API_KEY"

                });

            }


            const {

                destinationUrl

            } =
                req.body
                ||
                {};


            if (

                !destinationUrl

            ) {

                return res
                .status(400)
                .json({

                    success:false,

                    message:
                        "Thiếu link đích."

                });

            }


            const apiUrl =

                "https://link4m.co/api-shorten/v2"

                +

                "?api="

                +

                encodeURIComponent(
                    LINK4M_API_KEY
                )

                +

                "&url="

                +

                encodeURIComponent(
                    destinationUrl
                );


            const response =
                await fetch(
                    apiUrl
                );


            const data =
                await response.json();


            /*
            Link4m có thể trả dữ liệu
            khác nhau theo API.
            */

            const shortenedUrl =

                data?.shortenedUrl

                ||

                data?.short_url

                ||

                data?.url

                ||

                data?.data?.shortenedUrl

                ||

                data?.data?.short_url

                ||

                data?.data?.url;


            if (

                !shortenedUrl

            ) {

                console.log(
                    "Link4m response:",
                    data
                );


                return res
                .status(500)
                .json({

                    success:false,

                    message:
                        "Không nhận được link rút gọn."

                });

            }


            return res.json({

                success:true,

                shortenedUrl

            });

        }

        catch(error){

            console.error(
                "Link4m error:",
                error
            );


            return res
            .status(500)
            .json({

                success:false,

                message:
                    "Lỗi Link4m."

            });

        }

    }

);


/* =========================
   TEST SERVER
========================= */

app.get(

    "/",

    (
        req,
        res
    ) => {

        res.send(
            "Server và Bot Telegram đang hoạt động."
        );

    }

);


/* =========================
   CHẠY SERVER
========================= */

app.listen(

    PORT,

    "0.0.0.0",

    () => {

        console.log(

            "Server chạy cổng: "

            +

            PORT

        );

    }

);