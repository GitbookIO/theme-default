var $ = require('jquery');

var storage = require('./core').storage;
var events  = require('./core').events;
var state   = require('./core').state;

var theme = require('./theme');

function start(config) {
    theme.init();
    events.trigger('start', config);
    theme.navigation.notify();
}

// Export APIs for plugins
var gitbook = {
    start:  start,
    events: events,
    state:  state,

    // Read/Write the localstorage
    storage: storage,

    // UI sections
    toolbar: theme.toolbar,
    sidebar: theme.sidebar,

    // Create keyboard shortcuts
    keyboard: theme.keyboard
};


// Modules mapping for plugins
var MODULES = {
    'gitbook': gitbook,
    'jquery':  $
};

window.gitbook = gitbook;
window.$ = $;
window.jQuery = $;
window.require = function(mods, fn) {
    mods = mods.map(function(mod) {
        mod = mod.toLowerCase();
        if (!MODULES[mod]) {
            throw new Error('GitBook module '+mod+' doesn\'t exist');
        }

        return MODULES[mod];
    });

    fn.apply(null, mods);
};

module.exports = {};

