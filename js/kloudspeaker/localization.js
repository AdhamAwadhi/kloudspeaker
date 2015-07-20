define(['kloudspeaker/resources', 'kloudspeaker/events'], function(resources, events) {
    //TODO rewrite error views

    var tt = {};
    var plugins = null;
    var app = null; //remove
    var session = null; //remove

    tt.locale = null;
    tt._dict = {};
    tt._pluginTextsLoaded = [];

    tt.setup = function() {
        plugins = require('kloudspeaker/plugins');
        app = require('kloudspeaker/instance');
        session = require('kloudspeaker/session');
    };

    tt.initialize = function(lang) {
        var df = $.Deferred();
        if (tt.locale && tt.locale == lang) return df.resolve();

        if (tt.locale) {
            app.getElement().removeClass("lang-" + tt.locale);
            tt.clear();
        }

        tt.locale = lang;
        var list = [];
        list.push(tt._load("localization/texts_" + lang + ".json", $.Deferred()).done(function() {
            $("html").attr("lang", lang); //TODO move to UI?
            app.getElement().addClass("lang-" + lang);
        }));
        /*list.push(tt.load(lang).done(function() {
            $("html").attr("lang", lang); //TODO move to UI?
            app.getElement().addClass("lang-" + lang);
        }));*/

        var pluginTextsLoaded = tt._pluginTextsLoaded;
        if (pluginTextsLoaded) {
            $.each(pluginTextsLoaded, function(i, id) {
                list.push(tt.loadPlugin(id, true));
            });
        }
        $.when.apply($, list).done(function() {
            events.dispatch('localization/init', lang);
            df.resolve();
        }).fail(df.reject);
        return df;
    };

    /*tt.load = function(id) {
        var df = $.Deferred();
        //if (tt.locale) {
        //    return df.resolve();
        //}

        return tt._load("localization/texts_" + (id || 'en') + ".json", df);
    };*/

    tt.clear = function() {
        tt.locale = null;
        tt._dict = {};
        tt._pluginTextsLoaded = [];
    };

    tt.loadPlugin = function(pluginId, init) {
        if (!init && tt._pluginTextsLoaded.indexOf(pluginId) >= 0) return $.Deferred().resolve();

        if (!init && !tt.locale) {
            tt._pluginTextsLoaded.push(pluginId);
            return $.Deferred().resolve();
        }
        return tt._load(plugins.getLocalizationUrl(pluginId), $.Deferred()).done(function() {
            tt._pluginTextsLoaded.push(pluginId);
        });
    };

    tt._load = function(u, df) {
        var url = resources.url(u);
        if (!url) return df.resolve();

        $.ajax({
            type: "GET",
            dataType: 'text',
            url: url
        }).done(function(r) {
            if (!r || (typeof(r) != "string")) {
                df.reject();
                return;
            }
            var t = false;
            try {
                t = JSON.parse(r);
            } catch (e) {
                //TODO rewrite
                new kloudspeaker.ui.FullErrorView('<b>Localization file syntax error</b> (<code>' + url + '</code>)', '<code>' + e.message + '</code>').show();
                return;
            }
            if (!tt.locale)
                tt.locale = t.locale;
            else
            if (tt.locale != t.locale) {
                df.reject();
                return;
            }
            tt.add(t.locale, t.texts);
            df.resolve(t.locale);
        }).fail(function(e) {
            if (e.status == 404) {
                //TODO rewrite
                new kloudspeaker.ui.FullErrorView('Localization file missing: <code>' + url + '</code>', 'Either create the file or use <a href="https://code.google.com/p/kloudspeaker/wiki/ClientResourceMap">client resource map</a> to load it from different location, or to ignore it').show();
                return;
            }
            df.reject();
        });
        return df;
    };

    tt.add = function(locale, t) {
        if (!locale || !t) return;

        if (!tt.locale) tt.locale = locale;
        else if (locale != tt.locale) return;

        for (var id in t) tt._dict[id] = t[id];
    };

    tt.get = function(id, p) {
        if (!id) return "";
        var t = tt._dict[id];
        if (!t) return "!" + tt.locale + ":" + id;
        if (p !== undefined) {
            if (!window.isArray(p)) p = [p];
            for (var i = 0, j = p.length; i < j; i++)
                t = t.replace("{" + i + "}", p[i]);
        }
        return t;
    };

    tt.has = function(id) {
        return !!tt._dict[id];
    };

    tt.registerPluginResource = function(pluginId) {
        //TODO use require.js to load resources, can be optimized
        //into package
        tt.loadPlugin(pluginId);
    };

    return tt;
});
