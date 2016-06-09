var dropdown =   require('./dropdown');
var keyboard =   require('./keyboard');
var navigation = require('./navigation');
var sidebar =    require('./sidebar');
var toolbar =    require('./toolbar');

var gitbook = window.gitbook;

function init() {
    // Init sidebar
    sidebar.init();

    // Init keyboard
    keyboard.init();

    // Bind dropdown
    dropdown.init();

    // Init navigation
    navigation.init();

    // Add action to toggle sidebar
    toolbar.createButton({
        index: 0,
        icon: 'fa fa-align-justify',
        onClick: function(e) {
            e.preventDefault();
            sidebar.toggle();
        }
    });
    
    $("#navmenu > li > a:lt(3)").each(function() {
        var root = gitbook.state.root.slice(0, -1).split("/");
        root.splice(-1, 1, this.href, "");
        this.href = root.join("/");
    });
}

gitbook.events.on('start', init);

gitbook.keyboard = keyboard;
gitbook.navigation = navigation;
gitbook.sidebar = sidebar;
gitbook.toolbar = toolbar;
