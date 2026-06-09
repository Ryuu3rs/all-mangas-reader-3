<script lang="ts">
    import type { LibraryManga } from "../../src/database"
    import type { AppSettings } from "../../src/settings"
    import { onMount } from "svelte"
    import { sendRuntimeMessage } from "../../src/runtime"

    const sections = ["Home", "Library", "Sources", "Settings"] as const
    let activeSection = $state<(typeof sections)[number]>("Home")
    let library = $state<LibraryManga[]>([])
    let settings = $state<AppSettings | undefined>()
    let loading = $state(true)
    let query = $state("")
    let addUrl = $state("")
    let addMessage = $state("")
    let adding = $state(false)

    onMount(load)

    async function load() {
        loading = true
        try {
            ;[library, settings] = await Promise.all([
                sendRuntimeMessage<LibraryManga[]>({ type: "library:list" }),
                sendRuntimeMessage<AppSettings>({ type: "settings:get" })
            ])
        } finally {
            loading = false
        }
    }

    function read(manga: LibraryManga) {
        void browser.tabs.create({
            url: browser.runtime.getURL(`/reader.html?url=${encodeURIComponent(manga.sourceUrl)}`)
        })
    }

    async function remove(mangaId: string) {
        await sendRuntimeMessage({ type: "library:remove", mangaId })
        library = library.filter(manga => manga.id !== mangaId)
    }

    async function changeAutoAdd(enabled: boolean) {
        settings = await sendRuntimeMessage<AppSettings>({
            type: "settings:update",
            settings: { autoAdd: enabled }
        })
    }

    async function addByUrl() {
        adding = true
        addMessage = ""
        try {
            const parsed = new URL(addUrl)
            const granted = await browser.permissions.request({
                origins: ["https://mangadex.org/*", "https://api.mangadex.org/*", "https://uploads.mangadex.org/*"]
            })
            if (!granted) {
                addMessage = "Site access was not granted."
                return
            }
            const result = await sendRuntimeMessage<{ supported: boolean; added?: boolean }>({
                type: "page:capture",
                url: parsed.toString()
            })
            if (!result.supported) {
                addMessage = "This URL is not a supported chapter."
                return
            }
            addMessage = result.added ? "Added to your library." : "Automatic adding is disabled."
            addUrl = ""
            await load()
        } catch (cause) {
            addMessage = cause instanceof Error ? cause.message : "The URL could not be added."
        } finally {
            adding = false
        }
    }

    const visibleLibrary = $derived(
        library.filter(manga => manga.title.toLowerCase().includes(query.trim().toLowerCase()))
    )
</script>

<div class="shell">
    <aside>
        <div class="brand">
            <img src="/icons/icon_48.png" alt="" />
            <div><strong>AMR</strong><span>Local reader</span></div>
        </div>

        <nav aria-label="Main navigation">
            {#each sections as section}
                <button
                    type="button"
                    class:active={activeSection === section}
                    onclick={() => (activeSection = section)}>
                    {section}
                </button>
            {/each}
        </nav>
    </aside>

    <main>
        {#if activeSection === "Home"}
            <p class="eyebrow">Your reading shelf</p>
            <h1>Home</h1>
            {#if loading}
                <p>Loading your library...</p>
            {:else if library.length === 0}
                <section class="empty">
                    <h2>Your reading shelf is empty</h2>
                    <p>Open a MangaDex chapter and choose Read in AMR to begin.</p>
                </section>
            {:else}
                <section class="hero">
                    <div>
                        <span>Continue reading</span>
                        <h2>{library[0]?.title}</h2>
                    </div>
                    <button type="button" onclick={() => library[0] && read(library[0])}>Continue</button>
                </section>
            {/if}
            <section class="add-url">
                <div>
                    <h2>Add by URL</h2>
                    <p>Paste a supported chapter URL to resolve and save it locally.</p>
                </div>
                <form
                    onsubmit={event => {
                        event.preventDefault()
                        void addByUrl()
                    }}>
                    <input bind:value={addUrl} type="url" required placeholder="https://mangadex.org/chapter/..." />
                    <button type="submit" disabled={adding}>{adding ? "Detecting..." : "Add"}</button>
                </form>
                {#if addMessage}<p>{addMessage}</p>{/if}
            </section>
        {:else if activeSection === "Library"}
            <p class="eyebrow">Saved locally</p>
            <div class="title-row">
                <h1>Library</h1>
                <input bind:value={query} aria-label="Search library" placeholder="Search title" />
            </div>
            <section class="library">
                {#each visibleLibrary as manga}
                    <article>
                        <div class="cover">
                            {#if manga.coverUrl}<img src={manga.coverUrl} alt="" />{:else}<span>AMR</span>{/if}
                        </div>
                        <div>
                            <h2>{manga.title}</h2>
                            <p>{manga.sourceId}</p>
                        </div>
                        <button type="button" onclick={() => read(manga)}>Continue</button>
                        <button class="quiet" type="button" onclick={() => remove(manga.id)}>Remove</button>
                    </article>
                {:else}
                    <p>No titles match this search.</p>
                {/each}
            </section>
        {:else if activeSection === "Sources"}
            <p class="eyebrow">Site access</p>
            <h1>Sources</h1>
            <section class="panel">
                <h2>MangaDex</h2>
                <p>API source for manga metadata, chapters, and reader pages.</p>
                <span class="status">Available</span>
            </section>
        {:else}
            <p class="eyebrow">Preferences</p>
            <h1>Settings</h1>
            <section class="panel setting">
                <div>
                    <h2>Automatically add manga</h2>
                    <p>Add a title to the local library when a supported chapter is opened.</p>
                </div>
                <input
                    type="checkbox"
                    aria-label="Automatically add manga"
                    checked={settings?.autoAdd ?? true}
                    onchange={event => changeAutoAdd(event.currentTarget.checked)} />
            </section>
        {/if}
    </main>
</div>
