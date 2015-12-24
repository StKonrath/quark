/**
 * JS part of SaaS PHP framework
 *
 * @type {Quark}
 */
var Quark = Quark || {};

/**
 * Quark.Network namespace
 */
Quark.Network = {};

/**
 * @type {{
 *  host: string,
 *  port: number,
 *  socket: WebSocket,
 *  on: {
 *      message: Function,
 *      error: Function
 *  },
 *  constructor: Function,
 *  Connect: Function,
 *  Close: Function,
 *  Send: Function
 * }}
 */
Quark.Network.Socket = {
    host: '',
    port: 0,
    socket: null,
    on: {
        message: null,
        error: null
    },

    /**
     * @param {string=} host
     * @param {number=} port
     * @param {object=} [on={open,close,error}]
     *
     * @constructor
     */
    constructor: function (host, port, on) {
        this.host = host;
        this.port = port;
        this.on = on;
    },

    /**
     * API methods
     */
    Connect: function () {
        this.socket = new WebSocket('ws://' + this.host + ':' + this.port);

        this.socket.onmessage = this.on.message;
        this.socket.onopen = this.on.open;
        this.socket.onclose = this.on.close;
        this.socket.onerror = this.on.error;
    },

    /**
     * @return {boolean}
     */
    Close: function () {
        if (this.socket == null) return false;

        this.socket.close();
        this.socket = null;

        return true;
    },

    /**
     * @param {object} data
     *
     * @return {boolean}
     */
    Send: function (data) {
        if (!(this.socket instanceof WebSocket)) return false;

        this.socket.send(data);
        return true;
    }
};

/**
 * @param {string=} [host=document.location.hostname]
 * @param {number=} [port=25000]
 * @param {object=} [on={open,close,error}]
 *
 * @constructor
 */
Quark.Network.Client = function (host, port, on) {
    on = on || {};

    var that = this;

    var events = {};
    var _response = function () {};

    on.message = function (e) {
        try {
            var input = JSON.parse(e.data);

            if (input.response != undefined)
                _response(input.response, input.data, input.session);

            if (input.event != undefined) {
                input.event = input.event.toLowerCase();

                if (events[input.event] instanceof Array) {
                    var i = 0;

                    while (i < events[input.event].length) {
                        events[input.event][i](input.event, input.data, input.session);

                        i++;
                    }
                }
            }
        }
        catch (e) {
            on.error(e);
        }
    };

    /**
     * @param {string} url
     * @param {Function} listener
     *
     * @return {boolean}
     */
    that.Event = function (url, listener) {
        if (!(listener instanceof Function)) return false;

        url = url.toLowerCase();

        if (events[url] == undefined)
            events[url] = [];

        events[url].push(listener);

        return true;
    };

    /**
     * @param {Function=} [response]
     *
     * @return {Function}
     */
    that.Response = function (response) {
        if (response instanceof Function)
            _response = response;

        return _response;
    };

    /**
     * @param {string} url
     * @param {object=} [data]
     * @param {object=} [session]
     */
    that.Service = function (url, data, session) {
        try {
            var out = {
                url: url,
                data: data
            };

            if (session != undefined)
                out.session = session;

            that.Send(JSON.stringify(out));
        }
        catch (e) {
            on.error(e);
        }
    };

    that.constructor(host || document.location.hostname, port || 25000, on);
};

Quark.Network.Client.prototype = Quark.Network.Socket;

/**
 * Get a connection from cluster controller, specified by host and port, to the most suitable cluster node
 *
 * @param {string=} [host=document.location.hostname]
 * @param {number=} [port=25900]
 * @param {Function} available
 * @param {Function} error
 */
Quark.Network.Client.From = function (host, port, available, error) {
    var terminal = new Quark.Network.Terminal(host || document.location.hostname, port || 25900);

    terminal.Command('endpoint', function (cmd, endpoint) {
        if (!endpoint) error();
        else available(endpoint);
    });
};

/**
 * @param {string=} [host=document.location.hostname]
 * @param {number=} [port=25900]
 * @param {object=} [on={close,error}]
 *
 * @constructor
 */
Quark.Network.Terminal = function (host, port, on) {
    on = on || {};

    var that = this;

    var commands = {};

    var _signature = '';
    var _infrastructure = function () {};

    on.open = function () {
        that.Send(JSON.stringify({
            cmd: 'authorize',
            data: {},
            signature: _signature
        }));
    };

    on.message = function (e) {
        try {
            var input = JSON.parse(e.data);

            if (input.cmd == undefined) return;

            input.cmd = input.cmd.toLowerCase();

            if (input.cmd == 'infrastructure' && _infrastructure instanceof Function)
                _infrastructure(input.data);

            if (commands[input.cmd] instanceof Array) {
                var i = 0;

                while (i < commands[input.cmd].length) {
                    commands[input.cmd][i](input.cmd, input.data);

                    i++;
                }
            }
        }
        catch (e) {
            on.error(e);
        }
    };

    /**
     * @param {string=} [signature]
     *
     * @return {string}
     */
    that.Signature = function (signature) {
        if (signature != undefined)
            _signature = signature;

        return _signature;
    };

    /**
     * @param {Function=} [infrastructure]
     *
     * @return {Function}
     */
    that.Infrastructure = function (infrastructure) {
        if (infrastructure instanceof Function)
            _infrastructure = infrastructure;

        return _infrastructure;
    };

    /**
     * @param {string} cmd
     * @param {Function} listener
     *
     * @return {boolean}
     */
    that.Command = function (cmd, listener) {
        if (!(listener instanceof Function)) return false;

        cmd = cmd.toLowerCase();

        if (commands[cmd] == undefined)
            commands[cmd] = [];

        commands[cmd].push(listener);

        return true;
    };

    that.constructor(host || document.location.hostname, port || 25900, on);
};

Quark.Network.Terminal.prototype = Quark.Network.Socket;