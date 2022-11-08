/* prefs.js
* Copyright (C) 2022  kosmospredanie, shyzus, Shinigaminai
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function getSettings () {
  let GioSSS = Gio.SettingsSchemaSource;
  let schemaSource = GioSSS.new_from_directory(
    Me.dir.get_child("schemas").get_path(),
    GioSSS.get_default(),
    false
  );
  let schemaObj = schemaSource.lookup(
    'org.gnome.shell.extensions.screen-rotate', true);
  if (!schemaObj) {
    throw new Error('cannot find schemas');
  }
  return new Gio.Settings({ settings_schema : schemaObj });
}

function init () {}

function buildPrefsWidget () {
  this.settings = getSettings();

    // Create a parent widget that we'll return from this function
  const prefsWidget = new Gtk.Grid({
    margin_top: 10,
    margin_bottom: 10,
    margin_start: 10,
    margin_end: 10,
    column_spacing: 12,
    row_spacing: 12,
    visible: true,
  });

  // Add a simple title and add it to the prefsWidget
  const title = new Gtk.Label({
    label: `<b>${Me.metadata.name} Preferences</b>`,
    halign: Gtk.Align.START,
    use_markup: true,
    visible: true,
  });
  prefsWidget.attach(title, 0, 0, 2, 1);

  // Create a label & switch for `flip-rotation-direction`
  const flipRotationLabel = new Gtk.Label({
    label: 'Flip orientation rotation direction:',
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(flipRotationLabel, 0, 1, 1, 1);

  this.flipRotationSwitch = new Gtk.Switch({
    halign: Gtk.Align.END,
    visible: true,
  });
  prefsWidget.attach(this.flipRotationSwitch, 1, 1, 1, 1);

  // Bind the switch to the `flip-rotation-direction` key
  this.settings.bind('flip-rotation-direction', this.flipRotationSwitch,
    'active', Gio.SettingsBindFlags.DEFAULT,
  );
  // this.flipRotationSwitch.connect("notify::active", function (w) {
  //     log(w.get_active());
  //     //settings.set_boolean(w.get_active())
  // });

  // Return our widget which will be added to the window
  return prefsWidget;
}
