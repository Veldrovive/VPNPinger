const ping = require('ping');
const fs = require('fs');
const Client = require('./socket-central-server/Client');

Client.setup({
    name: "VPN Ping",
    url: "http://99.79.82.232:8000",
    onConnect: onConnect,
    onDisconnect: onDisconnect
}).then(client => {
    async function updateHostsSocket(broadcast = true) {
        try {
            const hosts = await pingHosts()
            if (broadcast) broadcastHostsSocket();
            return hosts;
        } catch(err) {
            return hostsStatus;
        }
    }
    
    function getHostsSocket(broadcast = true) {
        if (broadcast) broadcastHostsSocket();
        return hostsStatus;
    }
    
    function broadcastHostsSocket() {
        client.send("UpdatedVpnConnections", hostsStatus);
    }

    updateHostsSocket(true);
    let interval = 0
    function startInterval(interval=60000) {
        console.log("Starting update interval at: ", interval);
        clearInterval(interval);
        interval = setInterval(() => updateHostsSocket(true), interval);
    }
    startInterval(30000);

    client.on("UpdateActiveVpnConnections", updateHostsSocket);
    client.on("GetActiveVpnConnections", getHostsSocket);
    client.on("BroadcastActiveVpnConnections", broadcastHostsSocket);
    client.on("SetVpnPingInterval", startInterval);
});

function onConnect() {
    console.log("Connected to socket");
}

function onDisconnect() {
    console.log("Disconnected from socket");
}

const hostsData = fs.readFileSync("./hosts.json");
const hosts = JSON.parse(hostsData);
const hostsStatus = {}
function initHosts() {
    for (const host of hosts) {
        hostsStatus[host.name] = {"online": false, "status": "Offline", "last_online": -1, "ping_time": -1, "ip": host.ip};
    }
}

activePings = 0;
function pingHosts() {
    return new Promise((resolve, reject) => {
        if (activePings > 0) {
            reject("Last ping not complete");
        }
        activePings = 0
        for(const host of hosts) {
            activePings++;
            ping.promise.probe(host.ip)
                .then(function (res) {
                    status = hostsStatus[host.name];
                    status.online = res.alive;
                    status.status = res.alive ? "Online" : "Offline";
                    status.ping_time = res.alive ? res.time : -1;
                    if (res.alive) status.last_online = new Date().getTime();
                    activePings--;
                    if (activePings == 0) {
                        console.log("Updated pings")
                        resolve(hostsStatus);
                    }
                });
        }
    })
}

initHosts();