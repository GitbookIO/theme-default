function Search(config) {
    this.config      = config;
    this.engine      = null;
    this.initialized = false;
}

// Set a new search engine
Search.prototype.setEngine = function(engine) {
    this.initialized = false;
    this.engine      = engine;

    return this.init();
};

// Initialize search engine with config
Search.prototype.init = function() {
    var that = this;

    if (!that.engine) throw new Error('No engine set for search. Please set an engine using gitbook.research.setEngine(engine).');

    return that.engine.init(that.config)
    .then(function() {
        that.initialized = true;
    });
};

// Launch search for query q
Search.prototype.query = function(q) {
    if (!this.initialized) throw new Error('Search has not been initialized');
    return this.engine.search(q);
};

// Get stats about search
Search.prototype.stats = function() {
    return {
        config: this.config,
        engine: this.engine.name,
        initialized: this.initialized
    };
};

module.exports = Search;