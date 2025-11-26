<template>
    <v-hover v-slot="{ isHovering }">
        <div class="d-flex flex-column fab-container">
            <!-- Button to open side drawer -->
            <v-btn
                :class="`elevation-${isHovering ? 12 : 2} opacity-${isHovering || drawer ? 'full' : 'transparent'}`"
                color="red-darken-2"
                size="small"
                icon
                @click="$emit('toggle-drawer')">
                <v-icon>{{ icons.mdiMenu }}</v-icon>
            </v-btn>
            <!-- Quick button to go to next chapter -->
            <v-tooltip location="start">
                <template v-slot:activator="{ props }">
                    <v-progress-circular
                        v-bind="props"
                        class="mt-2 amr-floting-progress"
                        :rotate="90"
                        :size="42"
                        :width="3"
                        :model-value="nextchapProgress"
                        color="green-lighten-2"
                        v-show="!lastChapter && nextchapLoading && !drawer && isHovering">
                        <v-btn size="small" icon @click.stop="$emit('go-next-chapter')" class="text-green">
                            <v-icon>{{ shouldInvertKeys ? icons.mdiChevronLeft : icons.mdiChevronRight }}</v-icon>
                        </v-btn>
                    </v-progress-circular>
                    <v-progress-circular
                        v-bind="props"
                        class="mt-2 amr-floting-progress"
                        :rotate="90"
                        :size="42"
                        :width="3"
                        :model-value="nextchapProgress"
                        indeterminate
                        color="red-darken-2"
                        v-show="!lastChapter && !nextchapLoading && !drawer && isHovering">
                        <v-btn size="small" icon @click.stop="$emit('go-next-chapter')" class="text-red">
                            <v-icon>{{ shouldInvertKeys ? icons.mdiChevronLeft : icons.mdiChevronRight }}</v-icon>
                        </v-btn>
                    </v-progress-circular>
                </template>
                <span
                    >{{ i18n("list_mg_act_next") }}
                    {{ nextchapLoading ? i18n("reader_loading", Math.floor(nextchapProgress)) : "" }}</span
                >
            </v-tooltip>
            <v-tooltip location="start">
                <template v-slot:activator="{ props }">
                    <v-btn
                        v-bind="props"
                        size="small"
                        class="mt-2"
                        icon
                        v-show="isHovering && !drawer && lastChapter"
                        color="orange">
                        <v-icon>{{ icons.mdiAlert }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ i18n("content_nav_last_chap") }}</span>
            </v-tooltip>
            <!-- Quick button to add a manga to reading list -->
            <v-tooltip location="start">
                <template v-slot:activator="{ props }">
                    <v-btn
                        v-bind="props"
                        size="small"
                        class="mt-2"
                        icon
                        v-show="!mangaExists && addauto === 0 && isHovering && !drawer"
                        color="green"
                        @click.stop="$emit('add-manga')">
                        <v-icon>{{ icons.mdiPlus }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ i18n("content_nav_add_list") }}</span>
            </v-tooltip>
        </div>
    </v-hover>
</template>

<script>
import i18nmixin from "../../mixins/i18n-mixin"
import { mdiMenu, mdiChevronRight, mdiChevronLeft, mdiAlert, mdiPlus } from "@mdi/js"

export default {
    name: "ReaderFloatingButtons",
    mixins: [i18nmixin],
    props: {
        drawer: { type: Boolean, required: true },
        lastChapter: { type: Boolean, required: true },
        nextchapLoading: { type: Boolean, required: true },
        nextchapProgress: { type: Number, required: true },
        shouldInvertKeys: { type: Boolean, required: true },
        mangaExists: { type: Boolean, default: null },
        addauto: { type: Number, default: 0 }
    },
    data: () => ({
        icons: {
            mdiMenu,
            mdiChevronRight,
            mdiChevronLeft,
            mdiAlert,
            mdiPlus
        }
    })
}
</script>

<style scoped>
.fab-container {
    position: fixed;
    top: 15px;
    right: 15px;
    z-index: 10;
}

.opacity-full {
    opacity: 1;
}

.opacity-transparent {
    opacity: 0.7;
}

.amr-floting-progress .v-btn {
    width: 36px;
    height: 36px;
}
</style>
