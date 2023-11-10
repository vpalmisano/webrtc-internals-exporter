import { createApp } from "vue";

// Vuetify
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { md3 } from "vuetify/blueprints";
import { VDataTable } from "vuetify/labs/VDataTable";

export function buildApp(App) {
  const vuetify = createVuetify({
    components: { ...components, VDataTable },
    directives,
    blueprint: md3,
    theme: {
      defaultTheme: "dark",
    },
  });

  createApp(App, {}).use(vuetify).mount(document.querySelector("#app"));
}
