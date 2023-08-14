import dgram from "node:dgram";
import { Buffer } from "node:buffer";

export interface A2SQueryResponse {
  protocol: number;
  name: string;
  map: string;
  folder: string;
  game: string;
  id: number;
  players: number;
  maxPlayers: number;
  bots: number;
  type: number;
  environment: number;
  visibility: number;
  vac: number;
  version: string;
  extra: number;
}

export type A2SRulesResponse = Record<string, string>;

export type A2SPlayersResponse = A2SPlayerResponsePlayer[];

export interface A2SPlayerResponsePlayer {
  index: number;
  name: string;
  score: number;
  duration: number;
}

const getData = (ip: string, type: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    const send = (b: Buffer) => {
      socket.send(b, +ip.split(":")[1], ip.split(":")[0]);
    };
    const timeout = setTimeout(() => {
      socket.close();
      reject("timed out");
    }, 5000);
    socket.on("message", (msg) => {
      if (msg[4] === 0x41 && type === "T") {
        send(
          Buffer.concat([
            Buffer.from(
              `\xff\xff\xff\xff${type}Source Engine Query\0`,
              "binary"
            ),
            msg.subarray(5),
          ])
        );
      }

      if (msg[4] === 0x41 && type === "V") {
        send(
          Buffer.concat([
            Buffer.from(`\xff\xff\xff\xffV`, "binary"),
            msg.subarray(5),
          ])
        );
      }

      if (msg[4] === 0x41 && type === "U") {
        send(
          Buffer.concat([
            Buffer.from(`\xff\xff\xff\xffU`, "binary"),
            msg.subarray(5),
          ])
        );
      }

      if (msg[4] === 0x49 || msg[4] === 0x45 || msg[4] == 0x44) {
        resolve(msg.subarray(5));
        clearTimeout(timeout);
      }
    });

    if (type === "T") {
      send(Buffer.from(`\xff\xff\xff\xffTSource Engine Query\0`, "binary"));
    }

    if (type === "V") {
      send(Buffer.from(`\xff\xff\xff\xffV\xff\xff\xff\xff`, "binary"));
    }

    if (type === "U") {
      send(Buffer.from(`\xff\xff\xff\xffU\xff\xff\xff\xff`, "binary"));
    }
  });
};

const readString = (b: Buffer) => {
  let str = "";
  for (let i = 0; i < b.length; ++i) {
    if (b[i] === 0) {
      break;
    }
    str += String.fromCharCode(b[i]);
  }
  return str;
};

export default {
  async info(ip: string): Promise<A2SQueryResponse> {
    const data = await getData(ip, "T");
    let offset = 0;
    const protocol = data[offset];
    offset++;
    const name = readString(data.subarray(offset));
    offset += name.length + 1;
    const map = readString(data.subarray(offset));
    offset += map.length + 1;
    const folder = readString(data.subarray(offset));
    offset += folder.length + 1;
    const game = readString(data.subarray(offset));
    offset += game.length + 1;
    const id = data.readInt16LE(offset);
    offset += 2;
    const players = data[offset];
    offset++;
    const maxPlayers = data[offset];
    offset++;
    const bots = data[offset];
    offset++;
    const type = data[offset];
    offset++;
    const environment = data[offset];
    offset++;
    const visibility = data[offset];
    offset++;
    const vac = data[offset];
    offset++;
    const version = readString(data.subarray(offset));
    offset += version.length + 1;
    const extra = data[offset];
    offset++;
    return {
      protocol,
      name,
      map,
      folder,
      game,
      id,
      players,
      maxPlayers,
      bots,
      type,
      environment,
      visibility,
      vac,
      version,
      extra,
    };
  },
  async rules(ip: string): Promise<A2SRulesResponse> {
    const data = await getData(ip, "V");
    let offset = 0;
    const count = data.readInt16LE(offset);
    offset += 2;
    const response: A2SRulesResponse = {};
    for (let i = 0; i < count; ++i) {
      const k = readString(data.subarray(offset));
      offset += k.length + 1;
      const v = readString(data.subarray(offset));
      offset += v.length + 1;
      response[k] = v;
    }
    return response;
  },
  async players(ip: string) {
    const data = await getData(ip, "U");
    let offset = 0;
    const count = data.readInt16LE(offset);
    offset += 2;
    const response: A2SPlayersResponse = [];
    for (let i = 0; i < count; ++i) {
      const index = data[offset];
      offset++;
      const name = readString(data.subarray(offset));
      offset += name.length + 1;
      const score = data.readInt32LE(offset);
      offset += 4;
      const duration = data.readFloatLE(offset);
      offset += 4;
      response.push({
        index,
        name,
        score,
        duration,
      });
    }
    return response;
  },
};
