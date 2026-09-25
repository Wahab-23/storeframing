import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer, type AddressInfo, type Socket } from "node:net";
import { createPostgresAdapter } from "../lib/postgres-adapter";

test("PostgreSQL adapter sends a valid startup packet without serializing Pool internals", { timeout: 5000 }, async (t) => {
    const sockets = new Set<Socket>();
    const packets: Buffer[] = [];
    const server = createServer((socket) => {
        sockets.add(socket);
        socket.once("data", (packet) => {
            packets.push(packet);
            // Stop after the startup handshake: this test needs no database.
            socket.end();
        });
    });
    t.after(async () => {
        for (const socket of sockets) socket.destroy();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    });
    server.listen(0, "localhost");
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const adapter = await createPostgresAdapter(
        `postgresql://adapter_test:password@localhost:${port}/adapter_test`
    ).connect();
    t.after(() => adapter.dispose());

    await assert.rejects(adapter.queryRaw({
        sql: "SELECT 1",
        args: [],
        argTypes: [],
    }));

    assert.equal(packets.length, 1, "the connection must reach PostgreSQL startup");
    const packet = packets[0];
    assert.equal(packet.readInt32BE(0), packet.length);
    assert.equal(packet.readInt32BE(4), 196608, "PostgreSQL protocol 3.0");
    const parameters = packet.subarray(8).toString("utf8").split("\0");
    assert.ok(parameters.includes("adapter_test"));
    assert.ok(!parameters.includes("[object Object]"));
    assert.ok(!parameters.includes("options"), "Pool.options must not become startup options");
});
