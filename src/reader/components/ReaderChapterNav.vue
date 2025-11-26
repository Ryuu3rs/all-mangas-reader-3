<template>
    <v-row no-gutters>
        <v-col cols="12">
            <v-toolbar class="pa-0 amr-chapters-toolbar">
                <div class="d-flex align-center py-1">
                    <!-- Previous chapter button -->
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                class="select-btn"
                                v-bind="props"
                                variant="text"
                                size="small"
                                tile
                                v-show="shouldInvertKeys ? !lastChapter : !firstChapter"
                                @click.stop="onPrevClick">
                                <v-icon>{{ icons.mdiChevronLeft }}</v-icon>
                            </v-btn>
                        </template>
                        <span>{{ prevTooltip }}</span>
                    </v-tooltip>
                    <!-- List of chapters -->
                    <v-select
                        :model-value="selchap"
                        :items="chapters"
                        item-title="title"
                        item-value="url"
                        variant="solo"
                        density="compact"
                        single-line
                        hide-details
                        class="amr-chapter-select truncate"
                        :loading="chapters.length === 0 ? 'primary' : false"
                        @update:model-value="$emit('go-to-chapter', $event)"></v-select>
                    <v-spacer></v-spacer>
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <!-- Next chapter button -->
                            <v-btn
                                class="select-btn"
                                v-bind="props"
                                variant="text"
                                size="small"
                                tile
                                v-show="shouldInvertKeys ? !firstChapter : !lastChapter"
                                @click.stop="onNextClick">
                                <v-icon>{{ icons.mdiChevronRight }}</v-icon>
                            </v-btn>
                        </template>
                        <span>{{ nextTooltip }}</span>
                    </v-tooltip>
                </div>
            </v-toolbar>
        </v-col>
        <!-- Next chapter preloading progression bar -->
        <v-col cols="12" class="amr-chapter-progress-cont">
            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-progress-linear
                        v-show="nextchapLoading"
                        v-bind="props"
                        class="amr-floting-progress"
                        :height="3"
                        :model-value="nextchapProgress"
                        color="red-darken-2"></v-progress-linear>
                </template>
                <span>{{ i18n("reader_loading", Math.floor(nextchapProgress)) }}</span>
            </v-tooltip>
        </v-col>
    </v-row>
</template>

<script>
import i18nmixin from "../../mixins/i18n-mixin"
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js"

export default {
    name: "ReaderChapterNav",
    mixins: [i18nmixin],
    props: {
        chapters: { type: Array, required: true },
        selchap: { type: String, default: null },
        firstChapter: { type: Boolean, required: true },
        lastChapter: { type: Boolean, required: true },
        shouldInvertKeys: { type: Boolean, required: true },
        nextchapLoading: { type: Boolean, required: true },
        nextchapProgress: { type: Number, required: true }
    },
    data: () => ({
        icons: { mdiChevronLeft, mdiChevronRight }
    }),
    computed: {
        prevTooltip() {
            if (this.shouldInvertKeys) {
                return (
                    this.i18n("list_mg_act_next") +
                    " " +
                    (this.nextchapLoading ? this.i18n("reader_loading", Math.floor(this.nextchapProgress)) : "")
                )
            }
            return this.i18n("list_mg_act_prev")
        },
        nextTooltip() {
            if (this.shouldInvertKeys) {
                return this.i18n("list_mg_act_prev")
            }
            return (
                this.i18n("list_mg_act_next") +
                " " +
                (this.nextchapLoading ? this.i18n("reader_loading", Math.floor(this.nextchapProgress)) : "")
            )
        }
    },
    methods: {
        onPrevClick() {
            if (this.shouldInvertKeys) {
                this.$emit("go-next-chapter")
            } else {
                this.$emit("go-previous-chapter")
            }
        },
        onNextClick() {
            if (this.shouldInvertKeys) {
                this.$emit("go-previous-chapter")
            } else {
                this.$emit("go-next-chapter")
            }
        }
    }
}
</script>

<style scoped>
.amr-chapters-toolbar {
    z-index: 8;
    height: auto !important;
}

.amr-chapters-toolbar .v-toolbar__content {
    height: auto !important;
}

.amr-chapter-progress-cont .v-progress-linear {
    margin: 0px;
}

.truncate {
    width: 180px;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

.select-btn::before {
    display: none !important;
}
</style>
