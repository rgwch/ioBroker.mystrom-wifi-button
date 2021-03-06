"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ioBroker.mystrom-wifi-button: Connect Dingz (http://www.dingz.ch) with ioBroker
 * Copyright (c) 2020 by G. Weirich
 * License: See LICENSE
 *
 * Adapter templated created with @iobroker/create-adapter v1.24.2
 */
const utils = require("@iobroker/adapter-core");
const node_fetch_1 = require("node-fetch");
const API = "/api/v1/";
class MystromWifiButton extends utils.Adapter {
    constructor(options = {}) {
        super(Object.assign(Object.assign({}, options), { name: "mystrom-wifi-button" }));
        this.on("ready", this.onReady.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("stateChange", this.onStateChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        // this.on("unload", this.onUnload.bind(this));
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    onReady() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setState("info.connection", false, true);
            try {
                const response = yield node_fetch_1.default(this.config.url + API + "device");
                if (response.status != 200) {
                    this.log.error("could not connect to device " + response.status + ", " + response.statusText);
                }
                else {
                    const di = yield response.json();
                    const keys = Object.keys(di);
                    const mac = keys[0];
                    this.setState("info.deviceInfo.mac", mac, true);
                    this.setState("info.deviceInfo.details", di[mac], true);
                    this.log.info("Wifi Button Info: " + JSON.stringify(di[mac]));
                    this.setState("info.connection", true, true);
                    yield this.createObject("single");
                    yield this.createObject("double");
                    yield this.createObject("long");
                    yield this.createObject("touch");
                    yield this.createObject("generic");
                }
            }
            catch (err) {
                this.log.error("Exception in initializer " + err);
            }
        });
    }
    createObject(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setObjectAsync(name, {
                type: "state",
                common: {
                    name: name,
                    type: "boolean",
                    role: "state",
                    read: true,
                    write: true,
                },
                native: {},
            });
            const url = this.config.url + API + "action/" + name;
            const command = `get://${this.config.hostip.substr("http://".length)}/set/${this.name}.${this.instance}.${name}?value=true`;
            node_fetch_1.default(url, {
                method: "POST",
                body: command,
                redirect: "follow"
            }).then(response => {
                if (response.status !== 200) {
                    this.log.error("could not send command to url");
                }
                else {
                    this.log.info("Posted successfully " + command);
                }
            }).catch(err => {
                this.log.error(err);
            });
        });
    }
}
if (module.parent) {
    // Export the constructor in compact mode
    module.exports = (options) => new MystromWifiButton(options);
}
else {
    // otherwise start the instance directly
    (() => new MystromWifiButton())();
}
