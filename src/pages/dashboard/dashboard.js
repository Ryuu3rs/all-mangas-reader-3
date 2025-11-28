import "../popup/popup.css"

import { createApp } from "vue"
import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"
import mitt from "mitt"
import Dashboard from "../components/Dashboard.vue"
import store from "../../store"
import { OptionStorage } from "../../shared/OptionStorage"
import "vuetify/styles"

const init = async () => {
    // Load options in store before everything
    const optionStore = new OptionStorage()
    const options = await optionStore.getVueOptions()

    store.commit("extendOptions", options)

    document.documentElement.style["overflow-y"] = "auto"
    document.documentElement.style.fontSize = "16px"

    // Create mitt-based event bus with Vue-compatible API
    const emitter = mitt()
    const eventBus = {
        $on: (event, handler) => emitter.on(event, handler),
        $off: (event, handler) => emitter.off(event, handler),
        $emit: (event, ...args) => emitter.emit(event, args.length === 1 ? args[0] : args)
    }

    // Create Vuetify instance
    const vuetify = createVuetify({
        components,
        directives,
        theme: {
            defaultTheme: store.state.options.dark === 1 ? "dark" : "light"
        }
    })

    // Create Vue app
    const app = createApp(Dashboard)

    // Provide global properties
    app.config.globalProperties.$isPopup = false
    app.config.globalProperties.$eventBus = eventBus
    app.config.globalProperties.$store = store

    app.use(store)
    app.use(vuetify)
    app.mount("#app")
}
init()
