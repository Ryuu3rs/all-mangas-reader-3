export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(details => {
        console.info("[AMR] Extension installed", {
            reason: details.reason,
            version: browser.runtime.getManifest().version
        })
    })
})
