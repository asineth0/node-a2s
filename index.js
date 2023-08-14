const { Buffer } = require("node:buffer");
const dgram = require("node:dgram");

const readString = (b) => {
  let str = "";
  for (let i = 0; i < b.length; ++i) {
    if (b[i] == 0) {
      break;
    }
    str += String.fromCharCode(b[i]);
  }
  return str;
};

// const ip = "horizonrp.life:28015";
const ip = "199.60.101.210:27015";
const ipArgs = [+ip.split(":")[1], ip.split(":")[0]];
const socket = dgram.createSocket("udp4");
const query = Buffer.from("\xff\xff\xff\xffTSource Engine Query\0", "binary");

socket.on("message", (msg) => {
  console.log(msg.toString("hex"));

  if (msg[4] == 0x41) {
    socket.send(Buffer.concat([query, msg.subarray(5)]), ...ipArgs);
  }

  if (msg[4] == 0x49) {
    let offset = 5;
    const protocol = msg[offset];
    offset++;
    const name = readString(msg.subarray(offset));
    offset += name.length + 1;
    const map = readString(msg.subarray(offset));
    offset += map.length + 1;
    const folder = readString(msg.subarray(offset));
    offset += folder.length + 1;
    const game = readString(msg.subarray(offset));
    offset += game.length + 1;
    const id = msg.readInt16LE(offset);
    offset += 2;
    const players = msg[offset];
    offset++;
    const maxPlayers = msg[offset];
    offset++;
    const bots = msg[offset];
    offset++;
    const type = msg[offset];
    offset++;
    const environment = msg[offset];
    offset++;
    const visibility = msg[offset];
    offset++;
    const vac = msg[offset];
    offset++;
    const version = readString(msg.subarray(offset));
    offset += version.length + 1;
    const extra = msg[offset];
    offset++;
    console.log({
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
    });
    socket.send(Buffer.from("\xff\xff\xff\xffV", "binary"), ...ipArgs);
  }
});

socket.send(query, ...ipArgs);
