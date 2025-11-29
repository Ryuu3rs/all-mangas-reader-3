import browser from "webextension-polyfill"
import i18n from "./i18n"
import { AppManga, AppStore, NotificationCreate } from "../types/common"
import { findNextChapter } from "../shared/utils"

/**
 * Manage browser notifications
 */
export class NotificationManager {
    // store current opened notifications
    private notifications = {}
    // last id of notification
    private currentId = 0

    constructor(private readonly store: AppStore) {}

    notificationClickCallback = (id: string | undefined) => {
        console.debug(`[Notification] Click callback triggered for ID: ${id}`)
        console.debug(`[Notification] Known notifications:`, Object.keys(this.notifications))

        if (this.notifications[id] !== undefined) {
            const url = this.notifications[id]
            console.debug(`[Notification] Opening URL: ${url}`)

            if (url) {
                browser.tabs.create({ url }).catch(e => {
                    console.error(`[Notification] Failed to open URL: ${url}`, e)
                })
            } else {
                console.warn(`[Notification] No URL stored for notification ${id}`)
            }

            // It deletes the used URL to avoid unbounded object growing.
            // Well, if the notification isn't clicked the said growing is not avoided.
            // If this proves to be a issue a close callback should be added too.
            delete this.notifications[id]
        } else {
            console.warn(`[Notification] Unknown notification ID: ${id}`)
        }
    }

    notificationCloseCallback = (id: string | undefined) => {
        if (this.notifications[id] !== undefined) {
            delete this.notifications[id]
        }
    }

    public async triggerNotification(notification: NotificationCreate): Promise<string | undefined> {
        return browser.notifications
            .create({
                type: "basic",
                title: notification.title,
                message: notification.message,
                contextMessage: notification.contextMessage,
                iconUrl: browser.runtime.getURL("/icons/icon_32.png"),
                isClickable: notification.isClickable
            })
            .catch(e => {
                console.error(new Error(`Failed to create notification`, { cause: e }))
                return undefined
            })
    }

    /**
     * Create a notification when a new chapter is released on a manga
     * @param {} mg manga to notify for
     */
    notifyNewChapter(mg: AppManga) {
        if (!browser.notifications) {
            console.error("Browser does not support notifications")
            return
        }

        if (mg.read !== 0 || this.store.state.options.shownotifications !== 1) {
            return // Skipping
        }

        const chapter = findNextChapter(mg)

        // Determine the best URL to open when notification is clicked:
        // 1. Try the next chapter URL
        // 2. Fall back to manga page URL
        const clickUrl = chapter?.url || mg.url

        const mangaData = {
            name: mg.displayName ? mg.displayName : mg.name,
            mirror: mg.mirror,
            url: clickUrl
        }

        // Debug logging
        console.debug(`[Notification] Creating notification for: ${mangaData.name}`)
        console.debug(`[Notification] Chapter found: ${!!chapter}, URL: ${clickUrl}`)

        // The URL must be saved under a global object, mapped by ID.
        // (no one would like to click a manga notification and ending up opening another manga)
        const curId = this.currentId++
        this.notifications["amr_" + curId] = mangaData.url

        // opens the notification.
        browser.notifications
            .create("amr_" + curId, {
                type: "basic",
                title: mangaData.name,
                message: i18n("notif_message", mangaData.mirror),
                contextMessage: i18n("notif_message_chapter", chapter?.name ?? "— ⚠️"),
                iconUrl: browser.runtime.getURL("/icons/icon_32.png"),
                isClickable: true // Always clickable - opens manga page if no chapter URL
            })
            .catch(e => {
                console.error(
                    new Error(`Failed to create ${mangaData.name} notification for ${mangaData.mirror}`, { cause: e })
                )
            })

        //Auto close notification if required
        if (this.store.state.options.notificationtimer > 0) {
            setTimeout(function () {
                browser.notifications.clear("amr_" + curId)
            }, this.store.state.options.notificationtimer)
        }
    }
}

let instance: NotificationManager
export const getNotificationManager = (store: AppStore) => {
    if (!instance) {
        instance = new NotificationManager(store)
    }
    return instance
}
