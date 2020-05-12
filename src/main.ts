/**
 * ioBroker.mystrom-wifi-button: Connect Dingz (http://www.dingz.ch) with ioBroker
 * Copyright (c) 2020 by G. Weirich
 * License: See LICENSE
 *
 * Adapter templated created with @iobroker/create-adapter v1.24.2
 */
import * as utils from "@iobroker/adapter-core";
import fetch from "node-fetch"

type DeviceInfo = {
  type: string;
  battery: boolean;
  reachable: boolean;
  meshroot: boolean;
  charge: boolean;
  voltage: number;
  fw_version: string;
  single: string;
  double: string;
  long: string;
  touch: string;
  generic: string;
}

const API = "/api/v1/"
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ioBroker {
    interface AdapterConfig {
      url: string;
      hostip: string;
    }
  }
}

class MystromWifiButton extends utils.Adapter {

  public constructor(options: Partial<utils.AdapterOptions> = {}) {
    super({
      ...options,
      name: "mystrom-wifi-button",
    });
    this.on("ready", this.onReady.bind(this));
    // this.on("objectChange", this.onObjectChange.bind(this));
    // this.on("stateChange", this.onStateChange.bind(this));
    // this.on("message", this.onMessage.bind(this));
    // this.on("unload", this.onUnload.bind(this));
  }

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  private async onReady(): Promise<void> {

    this.setState("info.connection", false, true);
    try {
      const response = await fetch(this.config.url + API + "device")
      if (response.status != 200) {
        this.log.error("could not connect to device " + response.status + ", " + response.statusText)
      } else {
        const di = await response.json()
        const keys = Object.keys(di)
        const mac = keys[0]
        this.setState("info.deviceInfo.mac", mac, true)
        this.setState("info.deviceInfo.details", di[mac], true)
        this.log.info("Wifi Button Info: " + JSON.stringify(di[mac]))
        this.setState("info.connection", true, true);
        await this.createObject("single")
        await this.createObject("double")
        await this.createObject("long")
        await this.createObject("touch")
        await this.createObject("generic")
      }
    } catch (err) {
      this.log.error("Exception in initializer " + err)
    }

  }

  async createObject(name: string): Promise<void> {
    await this.setObjectAsync(name, {
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

    const url = this.config.url + API + "action/" + name
    const command = `get://${this.config.hostip.substr("http://".length)}/set/${this.name}.${this.instance}.${name}?value=true`
    fetch(url, {
      method: "POST",
      body: command,
      redirect: "follow"
    }).then(response => {
      if (response.status !== 200) {
        this.log.error("could not send command to url")
      } else {
        this.log.info("Posted successfully " + command)
      }
    }).catch(err => {
      this.log.error(err)
    })
  }

  // /**
  //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
  //  * Using this method requires "common.message" property to be set to true in io-package.json
  //  */
  // private onMessage(obj: ioBroker.Message): void {
  // 	if (typeof obj === "object" && obj.message) {
  // 		if (obj.command === "send") {
  // 			// e.g. send email or pushover or whatever
  // 			this.log.info("send command");

  // 			// Send response in callback if required
  // 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
  // 		}
  // 	}
  // }

}

if (module.parent) {
  // Export the constructor in compact mode
  module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new MystromWifiButton(options);
} else {
  // otherwise start the instance directly
  (() => new MystromWifiButton())();
}