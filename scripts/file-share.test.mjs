import test from "node:test";
import assert from "node:assert/strict";
import { shareDownloadedFile } from "../lib/file-share.mjs";

for (const [name, type] of [["card.png", "image/png"], ["card.pdf", "application/pdf"], ["invite.mp4", "video/mp4"], ["invite.webm", "video/webm"]]) {
    test(`shares the original ${name} bytes and MIME type without a title or link`, async () => {
        const file = new File(["downloaded file bytes"], name, { type });
        let handedOff = false;
        const api = {
            canShare(data) { assert.deepEqual(Object.keys(data), ["files"]); assert.equal(data.files[0], file); return true; },
            share(data) { handedOff = true; assert.deepEqual(Object.keys(data), ["files"]); assert.equal(data.files[0], file); return Promise.resolve(); },
        };
        const pending = shareDownloadedFile(file, api);
        assert.equal(handedOff, true, "Native sharing must start synchronously during the click");
        await pending;
        assert.equal(await file.text(), "downloaded file bytes");
        assert.equal(file.type, type);
    });
}
test("unsupported browsers never fall back to sharing text or a URL", () => {
    const file = new File(["pdf"], "card.pdf", { type: "application/pdf" });
    assert.equal(shareDownloadedFile(file, {}), null);
    assert.equal(shareDownloadedFile(file, { share() { assert.fail("Should not share without file support"); } }), null);
    assert.equal(shareDownloadedFile(file, { canShare: () => false, share() { assert.fail("Should not share unsupported files"); } }), null);
});
test("cancellation propagates so the UI can leave it cancelled without sending anything else", async () => {
    const file = new File(["png"], "card.png", { type: "image/png" });
    const api = { canShare: () => true, share: () => Promise.reject(new DOMException("Cancelled", "AbortError")) };
    await assert.rejects(shareDownloadedFile(file, api), { name: "AbortError" });
});
