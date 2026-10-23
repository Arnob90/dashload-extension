interface RequestHeaders {
    cookies: string | null;
    user_agent: string | null;
    referrer: string | null;
}
interface ExternalDownloadRequest {
    url: string;
    filename?: string;
    filesize?: number;
    headers: RequestHeaders;
}

export default defineBackground(() => {
    browser.downloads.onCreated.addListener(async (downloadItem) => {
        // 1. Ignore downloads initiated by our own extension/data URLs
        if (downloadItem.url.startsWith("data:") || downloadItem.url.startsWith("blob:")) {
            return;
        }

        // 2. Fetch session cookies for this URL (Critical for auth-protected files!)
        let cookieString = "";
        try {
            const cookies = await browser.cookies.getAll({ url: downloadItem.url });
            cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
        } catch (e) {
            console.warn("Could not extract cookies:", e);
        }
        const headers = {
            cookies: cookieString || null,
            user_agent: navigator.userAgent || null,
            referrer: downloadItem.referrer || null
        };

        // 3. Construct clean, focused DTO payload
        const payload: ExternalDownloadRequest = {
            url: downloadItem.finalUrl || downloadItem.url,
            filename: downloadItem.filename ? downloadItem.filename.split(/[/\\]/).pop() : undefined,
            filesize: downloadItem.fileSize > 0 ? downloadItem.fileSize : undefined,
            headers
        };

        // 4. Cancel browser's native download so it doesn't double-download
        try {
            await browser.downloads.cancel(downloadItem.id);
            await browser.downloads.erase({ id: downloadItem.id });
        } catch (e) {
            console.warn("Failed to cancel browser download:", e);
        }

        // 5. Send clean payload to your Tauri desktop app
        try {
            await fetch("http://127.0.0.1:3000/download", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error("Failed to forward download to Dashload desktop app:", err);
            // Optional: If desktop app is not running, let the browser download it normally
        }
        console.log("Download request forwarded to Dashload desktop app:", payload);
    });
});
