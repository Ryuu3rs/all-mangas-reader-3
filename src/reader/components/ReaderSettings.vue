<template>
    <v-col cols="12" class="pa-2">
        <!-- Display mode switches -->
        <v-row no-gutters>
            <v-col cols="6">
                <v-switch
                    :model-value="book"
                    @update:model-value="$emit('update:book', $event)"
                    :label="i18n('reader_book_mode')"
                    color="primary"
                    hide-details
                    density="compact"></v-switch>
            </v-col>
            <v-col cols="6">
                <v-switch
                    :model-value="fullchapter"
                    @update:model-value="$emit('update:fullchapter', $event)"
                    :label="i18n('reader_full_chapter')"
                    color="primary"
                    hide-details
                    density="compact"></v-switch>
            </v-col>
        </v-row>
        <!-- Direction and scale switches -->
        <v-row no-gutters>
            <v-col cols="6">
                <v-switch
                    :model-value="direction === 'rtl'"
                    @update:model-value="$emit('update:direction', $event ? 'rtl' : 'ltr')"
                    :label="i18n('reader_rtl')"
                    color="primary"
                    hide-details
                    density="compact"></v-switch>
            </v-col>
            <v-col cols="6">
                <v-switch
                    :model-value="scaleUp"
                    @update:model-value="$emit('update:scaleUp', $event)"
                    :label="i18n('reader_scale_up')"
                    color="primary"
                    hide-details
                    density="compact"></v-switch>
            </v-col>
        </v-row>
        <!-- Webtoon mode -->
        <v-row no-gutters>
            <v-col cols="12">
                <v-switch
                    :model-value="webtoonMode"
                    @update:model-value="$emit('update:webtoonMode', $event)"
                    :label="i18n('reader_webtoon_mode')"
                    color="primary"
                    hide-details
                    density="compact"></v-switch>
            </v-col>
        </v-row>
        <!-- Resize mode buttons -->
        <v-row no-gutters class="mt-2">
            <v-col cols="12">
                <v-btn-toggle
                    :model-value="resize"
                    @update:model-value="$emit('update:resize', $event)"
                    mandatory
                    density="compact">
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" value="width" size="small">
                                <v-icon>{{ icons.mdiArrowExpandHorizontal }}</v-icon>
                            </v-btn>
                        </template>
                        <span>{{ i18n("reader_resize_width") }}</span>
                    </v-tooltip>
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" value="height" size="small" :disabled="fullchapter">
                                <v-icon>{{ icons.mdiArrowExpandVertical }}</v-icon>
                            </v-btn>
                        </template>
                        <span>{{ i18n("reader_resize_height") }}</span>
                    </v-tooltip>
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" value="container" size="small" :disabled="fullchapter">
                                <v-icon>{{ icons.mdiArrowExpandAll }}</v-icon>
                            </v-btn>
                        </template>
                        <span>{{ i18n("reader_resize_container") }}</span>
                    </v-tooltip>
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" value="none" size="small">
                                <v-icon>{{ icons.mdiBorderNoneVariant }}</v-icon>
                            </v-btn>
                        </template>
                        <span>{{ i18n("reader_resize_none") }}</span>
                    </v-tooltip>
                </v-btn-toggle>
            </v-col>
        </v-row>
        <!-- Zoom slider -->
        <v-row no-gutters class="mt-2" v-show="showMaxWidth && !['height', 'none'].includes(resize)">
            <v-col cols="2">
                <v-btn icon size="small" @click="$emit('zoom-out')">
                    <v-icon>{{ icons.mdiMinusCircle }}</v-icon>
                </v-btn>
            </v-col>
            <v-col cols="8">
                <v-slider
                    :model-value="maxWidthValue"
                    @update:model-value="$emit('update:maxWidthValue', $event)"
                    min="10"
                    max="100"
                    hide-details
                    density="compact"></v-slider>
            </v-col>
            <v-col cols="2">
                <v-btn icon size="small" @click="$emit('zoom-in')">
                    <v-icon>{{ icons.mdiPlusCircle }}</v-icon>
                </v-btn>
            </v-col>
        </v-row>
        <!-- Toggle zoom slider button -->
        <v-row no-gutters class="mt-1">
            <v-col cols="12" class="text-center">
                <v-btn
                    icon
                    size="small"
                    @click="$emit('toggle-max-width')"
                    :disabled="['height', 'none'].includes(resize)">
                    <v-icon>{{ icons.mdiMagnify }}</v-icon>
                </v-btn>
            </v-col>
        </v-row>
    </v-col>
</template>

<script>
import i18nmixin from "../../mixins/i18n-mixin"
import {
    mdiArrowExpandHorizontal,
    mdiArrowExpandVertical,
    mdiArrowExpandAll,
    mdiBorderNoneVariant,
    mdiPlusCircle,
    mdiMinusCircle,
    mdiMagnify
} from "@mdi/js"

export default {
    name: "ReaderSettings",
    mixins: [i18nmixin],
    props: {
        book: { type: Boolean, required: true },
        fullchapter: { type: Boolean, required: true },
        direction: { type: String, required: true },
        scaleUp: { type: Boolean, required: true },
        webtoonMode: { type: Boolean, required: true },
        resize: { type: String, required: true },
        showMaxWidth: { type: Boolean, required: true },
        maxWidthValue: { type: Number, required: true }
    },
    data: () => ({
        icons: {
            mdiArrowExpandHorizontal,
            mdiArrowExpandVertical,
            mdiArrowExpandAll,
            mdiBorderNoneVariant,
            mdiPlusCircle,
            mdiMinusCircle,
            mdiMagnify
        }
    })
}
</script>
