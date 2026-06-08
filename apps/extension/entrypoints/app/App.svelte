<script lang="ts">
    const sections = ["Home", "Library", "Search", "Updates", "Achievements", "Sources", "Settings"]
    let activeSection = "Home"
</script>

<div class="shell">
    <aside>
        <div class="brand">
            <img src="/icons/icon_48.png" alt="" />
            <strong>AMR</strong>
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
        <p class="eyebrow">Extension rewrite</p>
        <h1>{activeSection}</h1>
        <p>The clean WXT workspace is active. Product features will be implemented from the roadmap.</p>
    </main>
</div>
