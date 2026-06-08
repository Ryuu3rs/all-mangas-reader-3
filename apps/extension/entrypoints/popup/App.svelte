<script lang="ts">
    function openApp() {
        void browser.tabs.create({
            url: browser.runtime.getURL("/app.html")
        })
    }
</script>

<main>
    <header>
        <img src="/icons/icon_48.png" alt="" />
        <div>
            <h1>All Mangas Reader</h1>
            <p>Rewrite workspace is ready.</p>
        </div>
    </header>

    <button type="button" onclick={openApp}>Open AMR</button>
</main>
