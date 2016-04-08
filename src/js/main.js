var $ = require('jquery');

var events  = require('./core').events;
var Search  = require('./core').search;
var state   = require('./core').state;
var storage = require('./core').storage;

var theme = require('./theme');

var research;

function start(config) {
    // Init theme
    theme.init();

    // Init research
    research = new Search(config);
    console.log('research:');
    console.log(research);

    events.trigger('start', config);
    theme.navigation.notify();
}

// Export APIs for plugins
var gitbook = {
    start:    start,
    events:   events,
    state:    state,
    research: research,

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

