
const express = require("express");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// 8936202003:AAF6wn6ScMKhAERPeKf7NDdx4ptw1bAVk-4
const BOT_TOKEN = "8936202003:AAF6wn6ScMKhAERPeKf7NDdx4ptw1bAVk-4";


function extractChatUsername(taskLink) {
    if (typeof taskLink !== "string") {
        return null;
    }

    try {
        const url = new URL(taskLink);

        if (
            url.hostname !== "t.me" &&
            url.hostname !== "telegram.me"
        ) {
            return null;
        }

        const path = url.pathname.replace(/^\/+|\/+$/g, "");

        if (
            !path ||
            path.startsWith("+") ||
            path.startsWith("joinchat/")
        ) {
            return null;
        }

        return "@" + path.split("/")[0];

    } catch {
        return null;
    }
}


function isMemberStatus(status) {
    return [
        "creator",
        "administrator",
        "member",
        "restricted"
    ].includes(status);
}


app.post("/api/task-verify", async (req, res) => {
    try {
        if (
            !BOT_TOKEN ||
            BOT_TOKEN === "8936202003:AAF6wn6ScMKhAERPeKf7NDdx4ptw1bAVk-4"
        ) {
            return res.status(500).json({
                verified: false,
                message: "Server chưa cấu hình Bot Token."
            });
        }

        const {
            taskId,
            telegramId,
            taskLink
        } = req.body || {};

        const userId = Number(telegramId);
        const chatId = extractChatUsername(taskLink);

        if (
            !taskId ||
            !Number.isFinite(userId) ||
            userId <= 0 ||
            !chatId
        ) {
            return res.status(400).json({
                verified: false,
                message: "Dữ liệu nhiệm vụ không hợp lệ."
            });
        }

        const telegramUrl =
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember` +
            `?chat_id=${encodeURIComponent(chatId)}` +
            `&user_id=${encodeURIComponent(userId)}`;

        const response = await fetch(telegramUrl);
        const data = await response.json();

        if (!data.ok) {
            return res.json({
                verified: false,
                message: "Chưa hoàn thành nhiệm vụ."
            });
        }

        const status = data.result?.status;
        const verified = isMemberStatus(status);

        return res.json({
            verified,
            status: status || null,
            message: verified
                ? "Đã hoàn thành nhiệm vụ."
                : "Chưa hoàn thành nhiệm vụ."
        });

    } catch (error) {
        console.error("task-verify error:", error);

        return res.status(500).json({
            verified: false,
            message: "Lỗi xác minh nhiệm vụ."
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});
