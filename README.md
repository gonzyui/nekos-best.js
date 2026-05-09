<!-- markdownlint-disable MD033 MD041 -->
<div align="center">
    <p>
        <a href="https://nekos.best/discord?ref=js">
            <img src="https://img.shields.io/discord/793810017681276960?maxAge=3600&style=flat&logo=discord&color=619cf8&logoColor=white" alt="Discord Server" />
        </a>
        <a href="https://www.npmjs.com/package/nekos-best.js">
            <img src="https://img.shields.io/npm/v/nekos-best.js.svg?maxAge=3600&style=flat&logo=npm&color=ff5540" alt="Version" />
        </a>
        <a href="https://www.npmjs.com/package/nekos-best.js">
            <img src="https://img.shields.io/npm/dt/nekos-best.js.svg?maxAge=3600&style=flat&logo=npm&color=ff5540" alt="Downloads" />
        </a>
    </p>
</div>

# [nekos-best.js](https://www.npmjs.com/package/nekos-best.js)

High quality nekos and role-playing GIFs powered by **[nekos.best](https://nekos.best)**!
This is the official API wrapper for the **[nekos.best](https://nekos.best)**'s API with built-in TypeScript typings.
**[Node LTS](https://nodejs.org/en/download/)** is recommended.

Join the official Discord server **[here](https://nekos.best/discord?ref=js)**

## Installation

`npm install nekos-best.js` | `yarn add nekos-best.js` | `pnpm install nekos-best.js` | `bun add nekos-best.js`

## Usage

```js
import { Client, fetchRandom } from "nekos-best.js";

// You can use the `fetchRandom()` function to quickly fetch a random result.
console.log(await fetchRandom("neko"));

// Alternatively, you can initialize a new client which offers more features.
const nekosBest = new Client();

// You can configure rate limit handling behavior (default: "sleep").
// "sleep" waits until the rate limit resets, "throw" rejects the promise immediately.
const nekosBestStrict = new Client({ ratelimitHandleMode: "throw" }); // "sleep" (default) | "throw"

// Use the `<Client>.fetch()` method to fetch one or more results from a category.
console.log(await nekosBest.fetch("neko", 1));
console.log(await nekosBest.fetch("hug", 10));

// Use the `<Client>.fetchFile()` method to fetch and download a single file along with its metadata.
console.log(await nekosBest.fetchFile("neko"));

// Use the `<Client>.search()` method to search for results by query.
console.log(await nekosBest.search("cat", "neko", 5));
```

## Build a simple Discord Bot with [discord.js](https://www.npmjs.com/package/discord.js)

```js
import { Client as DiscordClient } from "discord.js";
import { Client } from "nekos-best.js";

const discordClient = new DiscordClient();
const nekosBest = new Client();

discordClient.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith("!neko")) {
        message.channel.send((await nekosBest.fetch("neko", 1)).results[0].url);
    }
});

discordClient.login(
    "************************.******.***************************",
);
```

## Migration guide

Please refer to [MIGRATION.md](https://github.com/nekos-best/nekos-best.js/blob/main/MIGRATION.md).

