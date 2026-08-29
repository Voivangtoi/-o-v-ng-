
async function MonetagReward(requestVar = "reward") {
    const sdk = window.show_11680006;

    if (typeof sdk !== "function") {
        throw new Error("Monetag SDK chưa tải xong hoặc không khả dụng.");
    }

    const telegramId =
        window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    try {
        return await sdk({
            type: "end",
            ymid: telegramId ? String(telegramId) : undefined,
            requestVar: String(requestVar),
            catchIfNoFeed: true
        });
    } catch (error) {
        console.error("MonetagReward error:", error);
        throw error;
    }
}

window.MonetagReward = MonetagReward;
