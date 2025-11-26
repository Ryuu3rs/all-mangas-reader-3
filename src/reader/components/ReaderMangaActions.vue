<template>
    <v-col class="text-center pa-2" cols="12">
        <v-menu location="bottom">
            <!-- Bookmarks button -->
            <template v-slot:activator="{ props: menuProps }">
                <v-tooltip location="bottom" class="ml-1">
                    <template v-slot:activator="{ props: tooltipProps }">
                        <v-btn
                            v-bind="{ ...tooltipProps, ...menuProps }"
                            icon
                            :color="bookstate.booked ? 'yellow' : 'yellow-lighten-4'">
                            <v-icon>{{ icons.mdiStar }}</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ i18n("content_nav_click_bm") }}</span>
                </v-tooltip>
            </template>
            <!-- Menu displayed when bookmarks button activate -->
            <v-card>
                <v-card-title v-if="bookstate.note">
                    {{ i18n("reader_bookmarked_note", bookstate.note) }}
                </v-card-title>
                <v-card-actions>
                    <v-btn
                        @click="$emit('bookmark-chapter')"
                        :color="
                            !darkreader
                                ? bookstate.booked
                                    ? 'yellow'
                                    : 'yellow'
                                : bookstate.booked
                                ? 'yellow'
                                : 'grey'
                        "
                        :class="
                            !darkreader
                                ? bookstate.booked
                                    ? 'text-grey-darken-3'
                                    : 'text-grey'
                                : bookstate.booked
                                ? 'text-grey-darken-3'
                                : 'text-grey-lighten-3'
                        ">
                        {{ bookstate.booked ? i18n("reader_update_bookmark") : i18n("reader_add_bookmark") }}
                    </v-btn>
                    <v-btn @click="$emit('open-bookmarks-tab')">
                        <v-icon>{{ icons.mdiOpenInNew }}</v-icon>
                        {{ i18n("reader_open_bookmarks") }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-menu>
        <!-- Mark as latest read button -->
        <v-tooltip location="bottom" v-if="showLatestRead">
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon color="blue" @click="$emit('mark-as-latest')">
                    <v-icon>{{ icons.mdiPageLast }}</v-icon>
                </v-btn>
            </template>
            <span>{{ i18n("content_nav_mark_read") }}</span>
        </v-tooltip>
        <!-- Delete manga button -->
        <v-tooltip location="bottom" v-if="mangaExists">
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon color="red" @click="$emit('delete-manga')">
                    <v-icon>{{ icons.mdiDelete }}</v-icon>
                </v-btn>
            </template>
            <span>{{ i18n("list_mg_act_delete") }}</span>
        </v-tooltip>
        <!-- Pause/Play updates button -->
        <v-tooltip location="bottom" v-if="mangaExists && mangaInfos">
            <template v-slot:activator="{ props }">
                <v-btn
                    v-bind="props"
                    icon
                    :color="mangaInfos.read === 1 ? 'orange' : 'green'"
                    @click="$emit('toggle-read-top')">
                    <v-icon>{{ mangaInfos.read === 1 ? icons.mdiPause : icons.mdiPlay }}</v-icon>
                </v-btn>
            </template>
            <span>{{ mangaInfos.read === 1 ? i18n("list_mg_act_resume") : i18n("list_mg_act_stop") }}</span>
        </v-tooltip>
        <!-- Reload errors button -->
        <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon color="blue" @click="$emit('reload-errors')">
                    <v-icon>{{ icons.mdiReplay }}</v-icon>
                </v-btn>
            </template>
            <span>{{ i18n("reader_reload_errors") }}</span>
        </v-tooltip>
        <!-- Download chapter button -->
        <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon color="blue" :loading="zip" @click="$emit('download-chapter')">
                    <v-icon>{{ icons.mdiDownloadOutline }}</v-icon>
                </v-btn>
            </template>
            <span>{{ i18n("reader_download_chapter") }}</span>
        </v-tooltip>
    </v-col>
</template>

<script>
import i18nmixin from "../../mixins/i18n-mixin"
import {
    mdiStar,
    mdiOpenInNew,
    mdiPageLast,
    mdiDelete,
    mdiPause,
    mdiPlay,
    mdiReplay,
    mdiDownloadOutline
} from "@mdi/js"

export default {
    name: "ReaderMangaActions",
    mixins: [i18nmixin],
    props: {
        bookstate: { type: Object, required: true },
        darkreader: { type: Boolean, required: true },
        showLatestRead: { type: Boolean, required: true },
        mangaExists: { type: Boolean, default: null },
        mangaInfos: { type: Object, default: null },
        zip: { type: Boolean, default: false }
    },
    data: () => ({
        icons: {
            mdiStar,
            mdiOpenInNew,
            mdiPageLast,
            mdiDelete,
            mdiPause,
            mdiPlay,
            mdiReplay,
            mdiDownloadOutline
        }
    })
}
</script>
