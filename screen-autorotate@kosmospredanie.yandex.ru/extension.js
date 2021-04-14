/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

'use strict';

const GETTEXT_DOMAIN = 'gnome-shell-extension-screen-autorotate';
const INDICATOR_ENABLED_ICON = 'rotation-allowed-symbolic';
const INDICATOR_DISABLED_ICON = 'rotation-locked-symbolic';

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const { GObject, GLib, Gio, St, Clutter } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ShellUtils = Me.imports.shellUtils;

const Orientation = Object.freeze({
    'normal': 0,
    'left-up': 1,
    'bottom-up': 2,
    'right-up': 3
});

class SensorProxy {
    constructor(rotate_cb) {
        this._rotate_cb = rotate_cb;
        this._proxy = null;
        this._enabled = true;
        this._watcher_id = Gio.bus_watch_name(
            Gio.BusType.SYSTEM,
            'net.hadess.SensorProxy',
            Gio.BusNameWatcherFlags.NONE,
            this.appeared.bind(this),
            this.vanished.bind(this)
        );
    }

    destroy() {
        Gio.bus_unwatch_name(this._watcher_id);
        this._enabled = false;
        this._proxy = null;
    }

    enable() {
        this._enabled = true;
        if (this._proxy === null) return;
        this._proxy.call_sync('ClaimAccelerometer', null, Gio.DBusCallFlags.NONE, -1, null);
    }

    disable() {
        this._enabled = false;
        if (this._proxy === null) return;
        this._proxy.call_sync('ReleaseAccelerometer', null, Gio.DBusCallFlags.NONE, -1, null);
    }

    appeared(connection, name, name_owner) {
        log('Sensor proxy appeared');
        this._proxy = Gio.DBusProxy.new_for_bus_sync(
            Gio.BusType.SYSTEM, Gio.DBusProxyFlags.NONE, null,
            'net.hadess.SensorProxy', '/net/hadess/SensorProxy', 'net.hadess.SensorProxy',
            null);
        this._proxy.connect('g-properties-changed', this.properties_changed.bind(this));
        if (this._enabled) {
            this._proxy.call_sync('ClaimAccelerometer', null, Gio.DBusCallFlags.NONE, -1, null);
        }
    }

    vanished(connection, name) {
        log('Sensor proxy vanished');
        this._proxy = null;
    }

    properties_changed(proxy, changed, invalidated) {
        let properties = changed.deep_unpack();
        for (let [name, value] of Object.entries(properties)) {
            if (name != 'AccelerometerOrientation') continue;
            let target = value.unpack();
            this._rotate_cb(target);
        }
    }
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Screen Autorotate'));
        this._state = true;
        ShellUtils.set_orientation_lock(false);

        this._icon = new St.Icon({
            icon_name: INDICATOR_ENABLED_ICON,
            style_class: 'system-status-icon'
        });
        this.add_child(this._icon);
        this.connect('button-press-event', this.toggle.bind(this));
        this.connect('touch-event', (widget, event) => {
            if (event.type() != Clutter.EventType.TOUCH_BEGIN) return;
            this.toggle();
        });

        this._sensor_proxy = new SensorProxy( this.rotate_to.bind(this) );
    }

    destroy() {
        this._sensor_proxy.destroy();
        super.destroy();
    }

    toggle() {
        if (this._state) {
            Main.notify(_('Screen auto-rotation disabled'));
            this.disable();
        } else {
            Main.notify(_('Screen auto-rotation enabled'));
            this.enable();
        }
    }

    enable() {
        log('Enable screen auto-rotation');
        this._sensor_proxy.enable();
        this._state = true;
        this._icon.icon_name = INDICATOR_ENABLED_ICON;
        ShellUtils.set_orientation_lock(false);
    }

    disable() {
        log('Disable screen auto-rotation');
        this._sensor_proxy.disable();
        this._state = false;
        this._icon.icon_name = INDICATOR_DISABLED_ICON;
        ShellUtils.set_orientation_lock(false);
    }

    rotate_to(orientation) {
        log('Rotate screen to ' + orientation);
        let target = Orientation[orientation];
        try {
            GLib.spawn_async(
                Me.path,
                ['gjs', `${Me.path}/rotator.js`, `${target}`],
                null,
                GLib.SpawnFlags.SEARCH_PATH,
                null);
        } catch (err) {
            logError(err);
        }
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
