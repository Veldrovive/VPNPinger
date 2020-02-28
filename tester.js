const Client = require('./socket-central-server/Client');

Client.setup({
    name: "VPN Ping Tester",
    url: "http://99.79.82.232:8000",
    onConnect: onConnect,
    onDisconnect: onDisconnect
}).then(res => {
    const client = res;
    console.log("Sending get active connections");

    client.on("UpdatedVpnConnections", (res) => {
        console.log("Active VPN connections: ", res);
    })

    client.send("GetActiveVpnConnections");
})
.catch(err => {
    console.log("Failed to connect to socket: ", err);
})

function onConnect() {
    console.log("Connected to socket");
}

function onDisconnect() {
    console.log("Disconnected from socket");
}