/* shellUtils.js
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

const ORIENTATION_LOCK_SCHEMA = 'org.gnome.settings-daemon.peripherals.touchscreen'
const ORIENTATION_LOCK_KEY = 'orientation-lock'

const { Gio } = imports.gi;

function get_settings_value(schema, key) {
    let settings = Gio.Settings.new(schema);
    return settings.get_value(key);
}

function set_settings_value(schema, key, val) {
    let settings = Gio.Settings.new(schema);
    let type = typeof val;
    if (type === 'string') {
        settings.set_string(key, val);
    } else if (type === 'boolean') {
        settings.set_boolean(key, val);
    } else {
        throw new Error(`Unsupported value type: ${type}`);
    }
}

function get_orientation_lock() {
    return get_settings_value(ORIENTATION_LOCK_SCHEMA, ORIENTATION_LOCK_KEY).get_boolean();
}

function set_orientation_lock(val) {
    return set_settings_value(ORIENTATION_LOCK_SCHEMA, ORIENTATION_LOCK_KEY, val);
}
