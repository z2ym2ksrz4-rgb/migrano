import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { appVersion } from "@/core/release";
import { getDb, persist } from "@/core/db";
import { usePurchases } from "@/core/purchases";
/** Internal only. Compiled out of release builds via __RELEASE__ (see vite.config.ts). */
export function TestMenu() {
    const isPro = usePurchases((s) => s.isPro);
    const wipe = async () => {
        const tables = (await getDb().query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('meta','sqlite_sequence')`)).values ?? [];
        for (const t of tables)
            await getDb().execute(`DELETE FROM ${t.name}`);
        try {
            localStorage.removeItem("mock_pro");
        }
        catch { /* ignore */ }
        await persist();
        location.reload();
    };
    const togglePro = () => { try {
        localStorage.setItem("mock_pro", isPro ? "0" : "1");
    }
    catch { /* ignore */ } location.reload(); };
    return (_jsxs("div", { className: "testmenu", children: [_jsxs("span", { children: ["DEV v", appVersion, " ", isPro ? "PRO" : "FREE"] }), _jsx("button", { onClick: togglePro, children: "Toggle pro" }), _jsx("button", { onClick: wipe, children: "Wipe" })] }));
}
