import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.min.js";

import { createApp } from "vue";
import App from "./App.vue";

const container = document.createElement("div");
container.setAttribute("id", "app");
document.body.append(container);
createApp(App, {}).mount(container);
