(function () {

    "use strict";


    async function showAd() {

        if (
            typeof window.show_11680006
            !==
            "function"
        ) {

            throw new Error(
                "Monetag SDK chưa sẵn sàng"
            );

        }


        const result =
            window.show_11680006();


        if (
            result
            &&
            typeof result.then
            ===
            "function"
        ) {

            return await result;

        }


        return result;

    }


    window.MonetagReward =
        async function (
            taskId
        ) {

            if (
                !taskId
            ) {

                throw new Error(
                    "Thiếu task ID"
                );

            }


            const response =
                await showAd();


            if (
                response === false
                ||
                response?.status
                ===
                "failed"
            ) {

                throw new Error(
                    "Quảng cáo chưa hoàn thành"
                );

            }


            return {

                taskId,

                completed:true,

                response

            };

        };

})();