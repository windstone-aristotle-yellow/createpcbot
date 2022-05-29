import {Message, MessageAttachment, TextChannel} from "discord.js";
import {createCanvas, loadImage, registerFont} from "canvas"
import {Event} from "../../../handler";

registerFont("./fonts/GoogleSans-Regular.ttf", {family: "Google Sans Regular"})
registerFont("./fonts/GoogleSans-Italic.ttf", {family: "Google Sans Italic"})

import prisma from "../../../lib/prisma";

export default class CitEvent extends Event {
    constructor() {
        super('messageCreate', 'quotes');
    }

    /**
     * @param client
     * @param {Message} message
     * @returns {Promise<*>}
     */
    async run(client, message: Message) {
        console.log(`[MESSAGE] ${message.guild.name} (${message.guild.id}) ${message.author.username}: ${message.content}`)
        const guildSettings = await prisma.guild.findUnique({
            where: {
                id: message.guildId
            }
        })
        if ((process.env.DEV && message.content === "/" ) || message.content === guildSettings.quotes_prefix) {
            const ref = await message.fetchReference().catch(e => {})
            if (!ref) return message.channel.send("Лэээ, кого цитировать то")
            if (ref.content.length < 1) return message.channel.send("Лэээ, текст дай")
            const textCanvas = createCanvas(1000, 500)
            const textCtx = textCanvas.getContext('2d')
            const member = await message.guild.members.fetch(ref.author.id).catch(_ => {
            })
            const name = member ? member.displayName : ref.author.username

            let content = ref.content.trim()
            for (let [id, user] of ref.mentions.users) {
                const member = ref.guild.members.cache.get(id)
                const toReplace = member ? `@${member.displayName}` : `@${user.username}`
                content = content.replaceAll(`<@${id}>`, toReplace).replaceAll(`<@!${id}>`, toReplace)
            }

            const text = "«" + content + "»."
            const lines = text.split("\n").map(row => this.getLines(textCtx, row, 880, '52px "Google Sans Italic"')).flat()
            const width = 1000
            const height = 35 + 66 + 54 + this.calcHeight(lines) + 60 + 150 + 60

            const canvas = createCanvas(width, height)
            const ctx = canvas.getContext('2d')

            // Фон
            ctx.textBaseline = "top"

            if (message.attachments.size > 0) {
                const image = await loadImage(message.attachments.first().attachment as Buffer)
                ctx.globalAlpha = 0.65;
                ctx.drawImage(image, 0, 0, width, height)
                ctx.globalAlpha = 1
            } else {
                ctx.fillStyle = `rgb(0, 0, 0)`
                ctx.fillRect(0, 0, width, height)
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = '52px "Google Sans Regular"';
            ctx.fillText("Цитаты великих людей", 215, 35);

            ctx.font = '52px "Google Sans Italic"'
            for (let i = 0; i < lines.length; i++) {
                const y = 155 + i * 52 + i * 23
                ctx.fillText(lines[i], 60, y)
            }

            ctx.font = '42px "Google Sans Regular"';
            ctx.fillText("©", 250, height - 180);
            ctx.font = this.applyText(canvas, name);
            ctx.fillText(name, 280, height - 180)

            const avatar = await loadImage(ref.author.displayAvatarURL({format: 'jpg'}));
            const radius = 75
            const avatarY = height - 210
            ctx.beginPath();
            ctx.arc(135, avatarY + radius, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 60, avatarY, 150, 150)
            const attachment = new MessageAttachment(canvas.toBuffer(), 'quote.png');
            if (guildSettings.quotes_channel) {
                const quotes = <TextChannel>(await message.guild.channels.fetch(guildSettings.quotes_channel))
                quotes.send({
                    files: [
                        attachment
                    ]
                }).catch(e => {})
            }
            await message.channel.send({
                files: [
                    attachment
                ]
            }).then(() => {
                console.log(`[LOG] ${message.author.tag} использовал цитату на сообщение ${ref.content} пользователя ${name}`)
            });
        }
    }

    applyText(canvas, text, font = '"Google Sans Regular"', fontSize = 50) {
        const ctx = canvas.getContext('2d');

        do {
            // Assign the font to the context and decrement it, so it can be measured again
            ctx.font = `${fontSize -= 2}px ${font}`;
            // Compare pixel width of the text to the canvas minus the approximate avatar size
        } while (ctx.measureText(text).width > canvas.width - 300);

        // Return the result to use in the actual canvas
        return ctx.font;
    }

    /**
     * @param {String} text
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} maxWidth
     * @param {String} font
     * @returns Array<String>
     * */
    getLines(ctx, text, maxWidth, font) {
        const words = text.split(" ");
        const lines = [];
        let currentLine = words[0];

        const tempFont = ctx.font
        ctx.font = font

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        ctx.font = tempFont
        return lines;
    }

    calcHeight(lines) {
        return lines.length * 52 + lines.length * 23
    }
};
